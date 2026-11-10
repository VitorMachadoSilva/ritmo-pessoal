import express from "express";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { z } from "zod";
import { dateKey } from "./defaults.mjs";
import { validateImportedState } from "./state-rules.mjs";
import essentialIds from "../shared/essential-habits.json" with { type: "json" };
import backupLimits from "../shared/backup-limits.json" with { type: "json" };
import { FocusError } from "./focus.mjs";
import {
  dayKey,
  habitSchema,
  settingsSchema,
  workoutSchema,
  mealSchema,
  stateSchema,
  dayPatch,
  weekNoteSchema,
} from "./schema.mjs";
import { weekStart } from "../shared/day-rules.mjs";
import { createStore } from "./store.mjs";
import { createSessionService } from "./auth.mjs";
import { createLoginRateLimit, createRequestRateLimits } from "./rate-limit.mjs";
import { getDay, updateToday } from "./day-state.mjs";
import { registerAuthRoutes } from "./routes/auth.mjs";
import { registerGameRoutes } from "./routes/games.mjs";
import { registerFocusRoutes } from "./routes/focus.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const production = process.argv.includes("--production");
const dbPath = process.env.RITMO_DB || path.join(root, "data", "ritmo.sqlite");
const store = createStore(dbPath);
const { db, getState, save, ownerExists } = store;
const { getSession, createSession } = createSessionService(db);
const loginRateLimit = createLoginRateLimit();
const requestRateLimits = createRequestRateLimits();
const app = express();
app.disable("x-powered-by");
const isolatedTestRun = process.env.NODE_ENV === "test" &&
  process.env.RITMO_TEST_RATE_LIMITS === "off" &&
  path.resolve(dbPath).startsWith(`${path.resolve(tmpdir())}${path.sep}`);
const bypassRateLimit = (middleware) => isolatedTestRun
  ? (_req, _res, next) => next()
  : middleware;
loginRateLimit.middleware = bypassRateLimit(loginRateLimit.middleware);
requestRateLimits.api.middleware = bypassRateLimit(requestRateLimits.api.middleware);
requestRateLimits.mutations.middleware = bypassRateLimit(requestRateLimits.mutations.middleware);
requestRateLimits.import.middleware = bypassRateLimit(requestRateLimits.import.middleware);
if (process.env.RITMO_TRUST_PROXY_HOPS !== undefined) {
  const proxyHops = Number(process.env.RITMO_TRUST_PROXY_HOPS);
  if (!Number.isInteger(proxyHops) || proxyHops < 1 || proxyHops > 5)
    throw new Error("RITMO_TRUST_PROXY_HOPS deve ser um inteiro entre 1 e 5; configure apenas atrás de proxies confiáveis.");
  app.set("trust proxy", proxyHops);
}
app.use(
  helmet({
    contentSecurityPolicy: production
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
            fontSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: null,
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
    strictTransportSecurity:
      process.env.RITMO_HTTPS === "1" ? undefined : false,
  }),
);
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.get("origin");
    if (
      origin &&
      origin !==
        `${process.env.RITMO_HTTPS === "1" ? "https" : req.protocol}://${req.get("host")}`
    )
      return res.status(403).json({ error: "Origem não permitida." });
    if (!req.is("application/json"))
      return res.status(415).json({ error: "Envie os dados em JSON." });
  }
  next();
});
// Apply cheap request limits before parsing request bodies to protect CPU and memory.
app.use("/api", requestRateLimits.api.middleware);
app.use("/api", (req, res, next) =>
  ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)
    ? requestRateLimits.mutations.middleware(req, res, next)
    : next(),
);
app.use("/api", express.json({ limit: "5mb", skip: (req) => req.path === "/import" }));
const route = (fn) => (req, res, next) => {
  try {
    fn(req, res);
  } catch (error) {
    next(error);
  }
};
registerAuthRoutes(app, { db, ownerExists, save, getSession, createSession, loginRateLimit });
app.get(
  "/api/state",
  route((req, res) => res.json({ ...getState(), serverNow: Date.now() })),
);
registerGameRoutes(app, { getState, save });
app.patch(
  "/api/day/:date",
  route((req, res) => {
    const date = dayKey.parse(req.params.date);
    const state = getState();
    const today = dateKey(state.settings.timezone);
    if (date > today || date < state.settings.startDate)
      return res.status(400).json({
        error: "Escolha uma data entre o início da sua rotina e hoje.",
      });
    const input = dayPatch.parse(req.body);
    const day = getDay(state, date);
    if (input.mode !== undefined) {
      if (date !== today)
        return res.status(400).json({
          error:
            "O ritmo do dia só pode ser ajustado em hoje. O histórico permanece como foi registrado.",
        });
      if (input.mode === "essential" && !day.habits.some((h) => h.essential))
        return res.status(400).json({
          error:
            "Escolha ao menos um hábito essencial em Minha rotina antes de ativar este modo.",
        });
      day.mode = input.mode;
    }
    if (input.habitId !== undefined) {
      const habit = day.habits.find((h) => h.id === input.habitId);
      if (!habit)
        return res
          .status(400)
          .json({ error: "Este hábito não faz parte desse dia." });
      if (habit.kind === "water" || habit.kind === "sleep")
        return res
          .status(400)
          .json({ error: "Use o registro de água ou sono." });
      day.entries[habit.id] =
        habit.kind === "check"
          ? Math.min(input.value ?? 0, habit.target)
          : (input.value ?? 0);
    }
    if (input.waterDelta !== undefined)
      day.water = Math.max(0, Math.min(10000, day.water + input.waterDelta));
    for (const key of [
      "sleep",
      "weight",
      "energy",
      "mood",
      "journal",
      "win",
      "next",
      "workout",
    ])
      if (input[key] !== undefined) day[key] = input[key];
    if (input.workout !== undefined) {
      const training = day.habits.find((h) => h.id === "training");
      if (training) day.entries[training.id] = input.workout?.completed ? 1 : 0;
    }
    save(state);
    res.json(state);
  }),
);
app.put(
  "/api/settings",
  route((req, res) => {
    const state = getState();
    const input = settingsSchema.parse({
      ...req.body,
      startDate: state.settings.startDate,
    });
    state.settings = input;
    updateToday(state);
    save(state);
    res.json(state);
  }),
);
app.post(
  "/api/habits",
  route((req, res) => {
    const state = getState();
    if (state.habits.length >= 200)
      return res.status(400).json({ error: "Limite de 200 hábitos atingido." });
    const habit = habitSchema.parse({
      ...req.body,
      id: randomUUID(),
      createdDate: dateKey(state.settings.timezone),
      archived: false,
    });
    if (["water", "sleep"].includes(habit.kind))
      return res
        .status(400)
        .json({ error: "Use o hábito de água ou sono existente." });
    state.habits.push(habit);
    updateToday(state);
    save(state);
    res.status(201).json(state);
  }),
);
app.put(
  "/api/habits/:id",
  route((req, res) => {
    const state = getState();
    const i = state.habits.findIndex((h) => h.id === req.params.id);
    if (i < 0) return res.status(404).json({ error: "Hábito não encontrado." });
    const old = state.habits[i];
    state.habits[i] = habitSchema.parse({
      ...req.body,
      id: old.id,
      kind: old.kind,
      createdDate: old.createdDate,
    });
    updateToday(state);
    save(state);
    res.json(state);
  }),
);
for (const [collection, schema] of [
  ["workouts", workoutSchema],
  ["meals", mealSchema],
]) {
  app.post(
    `/api/${collection}`,
    route((req, res) => {
      const state = getState();
      if (state[collection].length >= (collection === "meals" ? 30 : 50))
        return res.status(400).json({ error: "Limite de itens atingido." });
      state[collection].push(schema.parse({ ...req.body, id: randomUUID() }));
      save(state);
      res.status(201).json(state);
    }),
  );
  app.put(
    `/api/${collection}/:id`,
    route((req, res) => {
      const state = getState();
      const i = state[collection].findIndex((v) => v.id === req.params.id);
      if (i < 0) return res.status(404).json({ error: "Item não encontrado." });
      state[collection][i] = schema.parse({ ...req.body, id: req.params.id });
      save(state);
      res.json(state);
    }),
  );
  app.delete(
    `/api/${collection}/:id`,
    route((req, res) => {
      const state = getState();
      state[collection] = state[collection].filter(
        (v) => v.id !== req.params.id,
      );
      save(state);
      res.json(state);
    }),
  );
}
registerFocusRoutes(app, { getState, save });
app.put(
  "/api/weeks/:date",
  route((req, res) => {
    const date = dayKey.parse(req.params.date),
      state = getState(),
      today = dateKey(state.settings.timezone);
    const firstWeek = weekStart(state.settings.startDate);
    if (
      new Date(`${date}T12:00:00`).getDay() !== 1 ||
      date > today ||
      date < firstWeek
    )
      return res
        .status(400)
        .json({ error: "Escolha uma semana da sua jornada, até hoje." });
    if (Object.keys(state.weeks).length >= 1000 && !state.weeks[date])
      throw new FocusError("Limite de revisões atingido.");
    state.weeks[date] = weekNoteSchema.parse(req.body);
    save(state);
    res.json(state);
  }),
);
app.get(
  "/api/export",
  route((req, res) =>
    res.attachment(`ritmo-backup-${dateKey()}.json`).json(getState()),
  ),
);
app.post(
  "/api/import",
  requestRateLimits.import.middleware,
  express.json({ limit: `${backupLimits.maxImportBytes}b` }),
  route((req, res) => {
    const state = stateSchema.parse(req.body);
    // Normalize legacy flags before semantic validation; never write a rejected import.
    for (const h of state.habits) h.essential ??= essentialIds.includes(h.id);
    for (const day of Object.values(state.days))
      for (const h of day.habits) h.essential ??= essentialIds.includes(h.id);
    try {
      validateImportedState(state);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
    save(state);
    res.json(state);
  }),
);
app.use("/api", (req, res) =>
  res.status(404).json({ error: "Caminho não encontrado." }),
);
if (production) {
  app.use(express.static(path.join(root, "dist")));
  app.get("/{*path}", (req, res) =>
    res.status(404).sendFile(path.join(root, "dist", "index.html")),
  );
} else {
  app.use((req, res, next) => {
    const virtualVitePath = req.path.startsWith("/@") || req.path.startsWith("/node_modules/");
    if (["GET", "HEAD"].includes(req.method) && req.accepts("html") && !virtualVitePath && !["/", "/index.html"].includes(req.path)) {
      const candidate = path.resolve(root, `.${req.path}`);
      const insideProject = candidate.startsWith(`${root}${path.sep}`);
      if (!insideProject || !existsSync(candidate) || !statSync(candidate).isFile())
        res.statusCode = 404;
    }
    next();
  });
  const { createServer } = await import("vite");
  const vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof FocusError)
    return res.status(error.status).json({ error: error.message });
  if (error instanceof z.ZodError)
    return res.status(400).json({
      error: error.issues[0]?.message || "Confira os dados preenchidos.",
    });
  if (error.type === "entity.too.large")
    return res
      .status(413)
      .json({
        error: `O arquivo excede o limite de ${req.path === "/api/import" ? backupLimits.maxImportLabel : "5 MB"}.`,
      });
  if (error.type === "entity.parse.failed")
    return res.status(400).json({ error: "O arquivo não contém JSON válido." });
  console.error(error);
  res
    .status(500)
    .json({ error: "Não foi possível salvar agora. Tente novamente." });
});
const port = Number(process.env.PORT || 3000);
// Acesso na rede local é opt-in por configuração, mas fica ligado para a instalação
// local do Ritmo. O login continua obrigatório; isso não publica a aplicação na internet.
const lanAccess = /^(1|true|yes|on)$/i.test(process.env.RITMO_LAN_ACCESS ?? "true");
const host = lanAccess ? "0.0.0.0" : (process.env.HOST || "127.0.0.1");
const server = app.listen(port, host, () => {
  console.log(`Ritmo disponível em http://localhost:${port}`);
  console.log(`Acesso na rede local: ${lanAccess ? "ativado" : "desativado"} (escuta em ${host})`);
});
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () =>
    server.close(() => {
      store.close();
      process.exit(0);
    }),
  );

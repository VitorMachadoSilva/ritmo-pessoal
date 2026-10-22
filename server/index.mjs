import express from "express";
import helmet from "helmet";
import { DatabaseSync } from "node:sqlite";
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { dateKey, initialState } from "./defaults.mjs";
import {
  dayKey,
  habitSchema,
  settingsSchema,
  workoutSchema,
  mealSchema,
  stateSchema,
  dayPatch,
} from "./schema.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const production = process.argv.includes("--production");
const dbPath = process.env.RITMO_DB || path.join(root, "data", "ritmo.sqlite");
mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(
  "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS owner (id INTEGER PRIMARY KEY CHECK(id=1), username TEXT NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, expires INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL);",
);
const app = express();
app.disable("x-powered-by");
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
app.use(express.json({ limit: "5mb" }));
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
const digest = (t) => createHash("sha256").update(t).digest("hex");
const getState = () =>
  JSON.parse(db.prepare("SELECT data FROM app_state WHERE id=1").get().data);
const save = (state) =>
  db
    .prepare("INSERT OR REPLACE INTO app_state(id,data) VALUES(1,?)")
    .run(JSON.stringify(state));
const ownerExists = () => !!db.prepare("SELECT id FROM owner WHERE id=1").get();
const getSession = (req) => {
  const token = req.headers.cookie
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("ritmo_session="))
    ?.slice(14);
  return (
    token &&
    db
      .prepare("SELECT hash FROM sessions WHERE hash=? AND expires>?")
      .get(digest(token), Date.now())
  );
};
const createSession = (res) => {
  const token = randomBytes(32).toString("hex");
  db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
  db.prepare("INSERT INTO sessions VALUES(?,?)").run(
    digest(token),
    Date.now() + 7 * 86400000,
  );
  res.cookie("ritmo_session", token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.RITMO_HTTPS === "1",
    maxAge: 7 * 86400000,
    path: "/",
  });
};
const authSchema = z.object({
  username: z.string().trim().min(3).max(100),
  password: z.string().min(12, "Use pelo menos 12 caracteres.").max(128),
  name: z.string().trim().min(1).max(120).optional(),
});
const failures = new Map();
const rateLimit = (req, res, next) => {
  const key = req.ip;
  const current = failures.get(key);
  if (current && current.until > Date.now() && current.count >= 10)
    return res
      .status(429)
      .json({ error: "Muitas tentativas. Aguarde 15 minutos." });
  if (!current || current.until < Date.now())
    failures.set(key, { count: 0, until: Date.now() + 15 * 60000 });
  failures.get(key).count++;
  next();
};
const route = (fn) => (req, res, next) => {
  try {
    fn(req, res);
  } catch (error) {
    next(error);
  }
};
app.get("/api/auth", (req, res) =>
  res.json({ configured: ownerExists(), authenticated: !!getSession(req) }),
);
app.post(
  "/api/setup",
  rateLimit,
  route((req, res) => {
    if (ownerExists())
      return res
        .status(403)
        .json({ error: "A conta pessoal já foi criada. Entre com seu login." });
    const input = authSchema.parse(req.body);
    const salt = randomBytes(32).toString("hex");
    const hash = scryptSync(input.password, salt, 64).toString("hex");
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare("INSERT INTO owner VALUES(1,?,?,?)").run(
        input.username.toLowerCase(),
        salt,
        hash,
      );
      save(initialState(input.name || input.username));
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    createSession(res);
    failures.delete(req.ip);
    res.status(201).json({ ok: true });
  }),
);
app.post(
  "/api/login",
  rateLimit,
  route((req, res) => {
    const { username, password } = authSchema.parse(req.body);
    const owner = db.prepare("SELECT * FROM owner WHERE id=1").get();
    const candidate = scryptSync(password, owner?.salt || "invalid-owner", 64);
    const valid =
      owner &&
      timingSafeEqual(candidate, Buffer.from(owner.hash, "hex")) &&
      owner.username === username.toLowerCase();
    if (!valid)
      return res.status(401).json({ error: "Login ou senha incorretos." });
    createSession(res);
    failures.delete(req.ip);
    res.json({ ok: true });
  }),
);
app.use("/api", (req, res, next) =>
  getSession(req)
    ? next()
    : res.status(401).json({ error: "Sua sessão terminou. Entre novamente." }),
);
app.post("/api/logout", (req, res) => {
  const session = getSession(req);
  if (session)
    db.prepare("DELETE FROM sessions WHERE hash=?").run(session.hash);
  res.clearCookie("ritmo_session", { path: "/" });
  res.json({ ok: true });
});
app.post(
  "/api/password",
  rateLimit,
  route((req, res) => {
    const input = z
      .object({
        current: z.string().max(128),
        password: z.string().min(12).max(128),
      })
      .parse(req.body);
    const owner = db.prepare("SELECT * FROM owner WHERE id=1").get();
    if (
      !timingSafeEqual(
        scryptSync(input.current, owner.salt, 64),
        Buffer.from(owner.hash, "hex"),
      )
    )
      return res.status(400).json({ error: "A senha atual não confere." });
    const salt = randomBytes(32).toString("hex");
    db.prepare("UPDATE owner SET salt=?,hash=? WHERE id=1").run(
      salt,
      scryptSync(input.password, salt, 64).toString("hex"),
    );
    db.exec("DELETE FROM sessions");
    createSession(res);
    failures.delete(req.ip);
    res.json({ ok: true });
  }),
);
app.get(
  "/api/state",
  route((req, res) => res.json(getState())),
);
function scheduled(state, date) {
  const weekday = new Date(`${date}T12:00:00`).getDay();
  return state.habits
    .filter(
      (h) => !h.archived && h.createdDate <= date && h.days.includes(weekday),
    )
    .map((h) => ({
      ...h,
      target:
        h.kind === "water"
          ? state.settings.waterGoal
          : h.kind === "sleep"
            ? state.settings.sleepGoal
            : h.target,
    }));
}
function getDay(state, date) {
  return (state.days[date] ||= {
    habits: scheduled(state, date),
    entries: {},
    water: 0,
    sleep: null,
    weight: null,
    energy: null,
    mood: null,
    journal: "",
    win: "",
    next: "",
    workout: null,
    threshold: state.settings.dailyThreshold,
  });
}
function updateToday(state) {
  const today = dateKey(state.settings.timezone);
  if (state.days[today]) {
    state.days[today].habits = scheduled(state, today);
    state.days[today].threshold = state.settings.dailyThreshold;
  }
}
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
app.get(
  "/api/export",
  route((req, res) =>
    res.attachment(`ritmo-backup-${dateKey()}.json`).json(getState()),
  ),
);
app.post(
  "/api/import",
  route((req, res) => {
    const state = stateSchema.parse(req.body);
    const ids = state.habits.map((h) => h.id);
    if (new Set(ids).size !== ids.length)
      return res
        .status(400)
        .json({ error: "O arquivo contém hábitos duplicados." });
    if (state.settings.startDate > dateKey(state.settings.timezone))
      return res
        .status(400)
        .json({ error: "A data inicial do backup é inválida." });
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
    res.sendFile(path.join(root, "dist", "index.html")),
  );
} else {
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
  if (error instanceof z.ZodError)
    return res.status(400).json({
      error: error.issues[0]?.message || "Confira os dados preenchidos.",
    });
  if (error.type === "entity.too.large")
    return res
      .status(413)
      .json({ error: "O arquivo excede o limite de 5 MB." });
  if (error.type === "entity.parse.failed")
    return res.status(400).json({ error: "O arquivo não contém JSON válido." });
  console.error(error);
  res
    .status(500)
    .json({ error: "Não foi possível salvar agora. Tente novamente." });
});
const port = Number(process.env.PORT || 3000);
const server = app.listen(port, process.env.HOST || "127.0.0.1", () =>
  console.log(`Ritmo disponível em http://localhost:${port}`),
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () =>
    server.close(() => {
      db.close();
      process.exit(0);
    }),
  );

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { authSchema } from "../auth.mjs";
import { initialState } from "../defaults.mjs";

const route = (handler) => (req, res, next) => {
  try { handler(req, res); } catch (error) { next(error); }
};

export function registerAuthRoutes(app, { db, ownerExists, save, getSession, createSession, loginRateLimit }) {
  app.get("/api/auth", (req, res) => res.json({ configured: ownerExists(), authenticated: Boolean(getSession(req)) }));
  app.post("/api/setup", loginRateLimit.middleware, route((req, res) => {
    if (ownerExists()) return res.status(403).json({ error: "A conta pessoal já foi criada. Entre com seu login." });
    const input = authSchema.parse(req.body);
    const salt = randomBytes(32).toString("hex");
    const hash = scryptSync(input.password, salt, 64).toString("hex");
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare("INSERT INTO owner VALUES(1,?,?,?)").run(input.username.toLowerCase(), salt, hash);
      save(initialState(input.name || input.username));
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    createSession(res, input.remember);
    loginRateLimit.clear(req.ip);
    res.status(201).json({ ok: true });
  }));
  app.post("/api/login", loginRateLimit.middleware, route((req, res) => {
    const { username, password, remember } = authSchema.parse(req.body);
    const owner = db.prepare("SELECT * FROM owner WHERE id=1").get();
    const candidate = scryptSync(password, owner?.salt || "invalid-owner", 64);
    const valid = owner && timingSafeEqual(candidate, Buffer.from(owner.hash, "hex")) && owner.username === username.toLowerCase();
    if (!valid) return res.status(401).json({ error: "Login ou senha incorretos." });
    createSession(res, remember);
    loginRateLimit.clear(req.ip);
    res.json({ ok: true });
  }));
  app.use("/api", (req, res, next) => getSession(req) ? next() : res.status(401).json({ error: "Sua sessão terminou. Entre novamente." }));
  app.post("/api/logout", (req, res) => {
    const session = getSession(req);
    if (session) db.prepare("DELETE FROM sessions WHERE hash=?").run(session.hash);
    res.clearCookie("ritmo_session", { path: "/" });
    res.json({ ok: true });
  });
  app.post("/api/password", loginRateLimit.middleware, route((req, res) => {
    const input = z.object({ current: z.string().max(128), password: z.string().min(12).max(128) }).parse(req.body);
    const owner = db.prepare("SELECT * FROM owner WHERE id=1").get();
    if (!timingSafeEqual(scryptSync(input.current, owner.salt, 64), Buffer.from(owner.hash, "hex")))
      return res.status(400).json({ error: "A senha atual não confere." });
    const salt = randomBytes(32).toString("hex");
    db.prepare("UPDATE owner SET salt=?,hash=? WHERE id=1").run(salt, scryptSync(input.password, salt, 64).toString("hex"));
    db.exec("DELETE FROM sessions");
    createSession(res);
    loginRateLimit.clear(req.ip);
    res.json({ ok: true });
  }));
}

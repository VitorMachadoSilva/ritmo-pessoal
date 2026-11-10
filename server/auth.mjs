import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

const digest = (token) => createHash("sha256").update(token).digest("hex");

export const authSchema = z.object({
  username: z.string().trim().min(3).max(100),
  password: z.string().min(12, "Use pelo menos 12 caracteres.").max(128),
  name: z.string().trim().min(1).max(120).optional(),
  remember: z.boolean().default(false),
});

export function createSessionService(db) {
  const getSession = (req) => {
    const token = req.headers.cookie
      ?.split(";")
      .map((value) => value.trim())
      .find((value) => value.startsWith("ritmo_session="))
      ?.slice(14);
    return token && db.prepare("SELECT hash FROM sessions WHERE hash=? AND expires>?").get(digest(token), Date.now());
  };

  const createSession = (res, remember = false) => {
    const duration = remember ? 7 * 86400000 : 12 * 3600000;
    const token = randomBytes(32).toString("hex");
    db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
    db.prepare("INSERT INTO sessions VALUES(?,?)").run(digest(token), Date.now() + duration);
    res.cookie("ritmo_session", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.RITMO_HTTPS === "1",
      ...(remember ? { maxAge: duration } : {}),
      path: "/",
    });
  };

  return { getSession, createSession };
}

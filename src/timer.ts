import type { FocusSession } from "./types";
export function focusElapsed(session: FocusSession, now = Date.now()) {
  return Math.max(
    0,
    Math.min(
      session.targetMinutes * 60000,
      session.elapsedMs +
        (session.resumedAt === null ? 0 : Math.max(0, now - session.resumedAt)),
    ),
  );
}
export function focusRemaining(session: FocusSession, now = Date.now()) {
  return Math.max(
    0,
    session.targetMinutes * 60000 - focusElapsed(session, now),
  );
}
export function clockLabel(ms: number) {
  const seconds = Math.ceil(ms / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export class FocusError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
export function elapsedFocus(session, now = Date.now()) {
  return Math.max(
    0,
    Math.min(
      session.targetMinutes * 60000,
      session.elapsedMs +
        (session.resumedAt === null ? 0 : Math.max(0, now - session.resumedAt)),
    ),
  );
}
export function pauseFocus(session, now = Date.now()) {
  if (session.resumedAt === null)
    throw new FocusError("A sessão já está pausada.", 409);
  return { ...session, elapsedMs: elapsedFocus(session, now), resumedAt: null };
}
export function resumeFocus(session, now = Date.now()) {
  if (session.resumedAt !== null)
    throw new FocusError("A sessão já está em andamento.", 409);
  if (elapsedFocus(session, now) >= session.targetMinutes * 60000)
    throw new FocusError(
      "O tempo terminou. Registre esta sessão antes de começar outra.",
    );
  return { ...session, resumedAt: now };
}
export function finishFocus(session, now = Date.now()) {
  const elapsed = elapsedFocus(session, now);
  if (elapsed < 60000)
    throw new FocusError(
      "Registre pelo menos um minuto, ou descarte esta sessão.",
    );
  return {
    id: session.id,
    label: session.label,
    minutes: Math.round(elapsed / 600) / 100,
    startedAt: session.startedAt,
    finishedAt: now,
    completed: elapsed >= session.targetMinutes * 60000,
    habitId: session.habitId,
  };
}

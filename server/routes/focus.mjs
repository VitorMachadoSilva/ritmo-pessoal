import { randomUUID } from "node:crypto";
import { z } from "zod";
import { dateKey } from "../defaults.mjs";
import { dayKey } from "../schema.mjs";
import { FocusError, pauseFocus, resumeFocus, finishFocus } from "../focus.mjs";
import { getDay } from "../day-state.mjs";

const route = (handler) => (req, res, next) => {
  try { handler(req, res); } catch (error) { next(error); }
};

export function registerFocusRoutes(app, { getState, save }) {
  app.post("/api/focus/start", route((req, res) => {
    const input = z.object({
      label: z.string().trim().min(1).max(120),
      minutes: z.number().int().min(1).max(120),
      habitId: z.string().max(100).nullable().optional(),
    }).parse(req.body);
    const state = getState();
    if (state.focus) throw new FocusError("Você já tem uma sessão aberta. Retome, registre ou descarte antes de começar outra.", 409);
    const date = dateKey(state.settings.timezone), day = getDay(state, date);
    if ((day.focusSessions?.length ?? 0) >= 100) throw new FocusError("Você atingiu o limite de sessões deste dia.");
    if (input.habitId && !day.habits.some((habit) => habit.id === input.habitId && habit.kind === "check" && habit.category === "mente"))
      throw new FocusError("Escolha um hábito de foco agendado para hoje.");
    const now = Date.now();
    state.focus = { id: randomUUID(), date, label: input.label, targetMinutes: input.minutes, startedAt: now, resumedAt: now, elapsedMs: 0, habitId: input.habitId ?? null };
    save(state);
    res.status(201).json(state);
  }));

  for (const action of ["pause", "resume", "finish", "cancel"]) {
    app.post(`/api/focus/${action}`, route((req, res) => {
      const state = getState();
      if (!state.focus) throw new FocusError("Esta sessão já foi encerrada. Atualize a página para continuar.", 409);
      const { sessionId } = z.object({ sessionId: z.string().min(1).max(100) }).parse(req.body);
      if (sessionId !== state.focus.id) throw new FocusError("A sessão de foco mudou em outra aba. Atualize a página antes de continuar; a sessão atual foi preservada.", 409);
      if (action === "pause") state.focus = pauseFocus(state.focus);
      if (action === "resume") state.focus = resumeFocus(state.focus);
      if (action === "finish") {
        const session = state.focus, log = finishFocus(session), day = getDay(state, session.date);
        if (day.focusSessions.length >= 100) throw new FocusError("Limite de sessões deste dia atingido.");
        if (day.focusSessions.some((entry) => entry.id === log.id)) throw new FocusError("Esta sessão já foi registrada.", 409);
        day.focusSessions.push(log);
        if (log.completed && session.habitId) {
          const habit = day.habits.find((entry) => entry.id === session.habitId && entry.kind === "check");
          if (habit) day.entries[habit.id] = habit.target;
        }
        state.focus = null;
      }
      if (action === "cancel") state.focus = null;
      save(state);
      res.json(state);
    }));
  }

  app.delete("/api/focus/:date/:id", route((req, res) => {
    const date = dayKey.parse(req.params.date), state = getState(), day = state.days[date];
    if (!day?.focusSessions.some((session) => session.id === req.params.id))
      return res.status(404).json({ error: "Registro não encontrado." });
    day.focusSessions = day.focusSessions.filter((session) => session.id !== req.params.id);
    save(state);
    res.json(state);
  }));
}

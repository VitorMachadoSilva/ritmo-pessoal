import { dateKey } from "./defaults.mjs";
export function assertUniqueIds(items, label) {
  const ids = items.map((item) => item.id);
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length)
    throw new Error(
      `O backup contém identificadores vazios ou duplicados em ${label}.`,
    );
}
export function validateImportedState(state) {
  const today = dateKey(state.settings.timezone);
  if (state.settings.startDate > today)
    throw new Error("A data inicial do backup é inválida.");
  assertUniqueIds(state.habits, "hábitos");
  assertUniqueIds(state.workouts, "fichas de treino");
  assertUniqueIds(state.meals, "refeições");
  for (const workout of state.workouts)
    assertUniqueIds(workout.exercises, "exercícios da ficha");
  const focusLogs = [];
  for (const [date, day] of Object.entries(state.days)) {
    if (date < state.settings.startDate || date > today)
      throw new Error(
        "O backup contém registros fora do período da sua rotina.",
      );
    assertUniqueIds(day.habits, `hábitos de ${date}`);
    if (day.mode === "essential" && !day.habits.some((h) => h.essential))
      throw new Error(
        "O backup contém um dia essencial sem hábitos escolhidos.",
      );
    if (day.workout)
      assertUniqueIds(day.workout.exercises, "exercícios de uma sessão");
    focusLogs.push(...day.focusSessions);
  }
  assertUniqueIds(focusLogs, "sessões de foco");
  if (state.focus) {
    if (state.focus.date < state.settings.startDate || state.focus.date > today)
      throw new Error("A sessão de foco está fora do período da sua rotina.");
    if (focusLogs.some((log) => log.id === state.focus.id))
      throw new Error("A sessão ativa já aparece no histórico de foco.");
  }
  const start = new Date(`${state.settings.startDate}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  const firstWeek = start.toISOString().slice(0, 10);
  for (const date of Object.keys(state.weeks)) {
    if (
      date < firstWeek ||
      date > today ||
      new Date(`${date}T12:00:00Z`).getUTCDay() !== 1
    )
      throw new Error(
        "O backup contém uma revisão fora das semanas da sua rotina.",
      );
  }
}

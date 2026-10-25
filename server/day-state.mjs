import { createDay, scheduledHabits } from "../shared/day-rules.mjs";
import { dateKey } from "./defaults.mjs";
import { FocusError } from "./focus.mjs";

export function getDay(state, date) {
  return (state.days[date] ||= createDay(state, date));
}

export function updateToday(state) {
  const today = dateKey(state.settings.timezone);
  if (!state.days[today]) return;
  state.days[today].habits = scheduledHabits(state, today);
  if (state.days[today].mode === "essential" && !state.days[today].habits.some((habit) => habit.essential))
    throw new FocusError(
      "Esta alteração deixaria o dia essencial vazio. Escolha outro hábito essencial ou volte à rotina completa antes de salvar.",
    );
  state.days[today].threshold = state.settings.dailyThreshold;
}

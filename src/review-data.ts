import { activeHabits, addDays, dayFor, habitValue, score } from "./lib.ts";
import type { Category, State } from "./types";
export { weekStart } from "../shared/day-rules.mjs";
import { weekStart } from "../shared/day-rules.mjs";
export function weeklyReview(state: State, date: string, today: string) {
  const start = weekStart(date);
  const days = Array.from({ length: 7 }, (_, i) => {
    const key = addDays(start, i);
    return {
      key,
      eligible: key >= state.settings.startDate && key <= today,
      day: dayFor(state, key),
    };
  });
  const elapsed = days.filter((d) => d.eligible);
  const scheduled = elapsed.filter((d) => activeHabits(d.day).length > 0);
  const sleep = elapsed.filter((d) => d.day.sleep !== null);
  const byCategory = (
    Object.keys({
      corpo: 0,
      mente: 0,
      alimentacao: 0,
      agua: 0,
      sono: 0,
      emocional: 0,
    }) as Category[]
  ).map((category) => {
    const portions = elapsed.flatMap(({ day }) =>
      activeHabits(day)
        .filter((h) => h.category === category)
        .map((h) => Math.min(1, habitValue(h, day) / h.target)),
    );
    return {
      category,
      count: portions.length,
      progress: portions.length
        ? Math.round(
            (portions.reduce((n, v) => n + v, 0) / portions.length) * 100,
          )
        : null,
    };
  });
  return {
    start,
    days,
    elapsed: elapsed.length,
    average: scheduled.length
      ? Math.round(
          scheduled.reduce((n, d) => n + score(d.day), 0) / scheduled.length,
        )
      : null,
    consistent: scheduled.filter((d) => score(d.day) >= d.day.threshold).length,
    water: elapsed.length
      ? elapsed.reduce((n, d) => n + d.day.water, 0) / elapsed.length
      : null,
    sleep: sleep.length
      ? sleep.reduce((n, d) => n + (d.day.sleep ?? 0), 0) / sleep.length
      : null,
    sleepCount: sleep.length,
    focus: elapsed.reduce(
      (n, d) =>
        n +
        (d.day.focusSessions ?? []).reduce(
          (m, session) => m + session.minutes,
          0,
        ),
      0,
    ),
    essential: elapsed.filter((d) => d.day.mode === "essential").length,
    byCategory,
  };
}

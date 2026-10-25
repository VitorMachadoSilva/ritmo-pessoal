import type { Category, Day, Habit, State } from "./types";
import essentialIds from "../shared/essential-habits.json" with { type: "json" };
import initialDifficulty from "../shared/habit-difficulty.json" with { type: "json" };
export const categories: Record<
  Category,
  {
    label: string;
    color: string;
  }
> = {
  corpo: { label: "Movimento", color: "green" },
  mente: { label: "Foco", color: "purple" },
  alimentacao: { label: "Alimentação", color: "orange" },
  agua: { label: "Hidratação", color: "blue" },
  sono: { label: "Sono", color: "indigo" },
  emocional: { label: "Bem-estar", color: "pink" },
};
export const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export function todayKey(tz = "America/Sao_Paulo") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function addDays(key: string, n: number) {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function dateLabel(
  key: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" },
) {
  return new Date(`${key}T12:00:00`).toLocaleDateString("pt-BR", options);
}
export const number = (n: number, digits = 0) =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: digits });
export function habitsFor(state: State, key: string) {
  const weekday = new Date(`${key}T12:00:00`).getDay();
  return state.habits
    .filter(
      (h) => !h.archived && h.createdDate <= key && h.days.includes(weekday),
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
export function dayFor(state: State, key: string): Day {
  return (
    state.days[key] ?? {
      habits: habitsFor(state, key),
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
      mode: "full",
      focusSessions: [],
    }
  );
}
export function habitValue(h: Habit, d: Day) {
  return h.kind === "water"
    ? d.water
    : h.kind === "sleep"
      ? (d.sleep ?? 0)
      : (d.entries[h.id] ?? 0);
}
export function isEssential(h: Habit) {
  return h.essential ?? essentialIds.includes(h.id);
}
export function activeHabits(d: Day) {
  return d.mode === "essential" ? d.habits.filter(isEssential) : d.habits;
}
export function orderedHabits(d: Day) {
  return [...activeHabits(d)].sort((a, b) => a.time.localeCompare(b.time));
}
export function isDone(h: Habit, d: Day) {
  return habitValue(h, d) >= h.target;
}
export function score(d: Day) {
  const habits = activeHabits(d);
  return habits.length
    ? Math.min(
        completed(d) === habits.length ? 100 : 99,
        Math.round(
          (habits.reduce(
            (n, h) => n + Math.min(1, habitValue(h, d) / h.target),
            0,
          ) /
            habits.length) *
            100,
        ),
      )
    : 0;
}
export function completed(d: Day) {
  return activeHabits(d).filter((h) => isDone(h, d)).length;
}
export function allCompleted(d: Day) {
  return d.habits.filter((h) => isDone(h, d)).length;
}
export const difficultyPoints = { light: 10, moderate: 20, challenging: 30 } as const;
export function habitDifficulty(h: Habit): keyof typeof difficultyPoints {
  return h.difficulty ?? (initialDifficulty as Record<string, keyof typeof difficultyPoints>)[h.id] ?? "moderate";
}
export function habitXp(h: Habit) {
  return difficultyPoints[habitDifficulty(h)];
}
export function isPerfectDay(d: Day) {
  return d.habits.length > 0 && d.habits.every((h) => isDone(h, d));
}
export function perfectDayBonus(days: number) {
  return days >= 30 ? 50 : days >= 14 ? 40 : days >= 7 ? 30 : days >= 3 ? 20 : 10;
}
export function perfectStreak(s: State, today: string) {
  let key = isPerfectDay(dayFor(s, today)) ? today : addDays(today, -1);
  let count = 0;
  while (key >= s.settings.startDate && s.days[key] && isPerfectDay(s.days[key])) {
    count++;
    key = addDays(key, -1);
  }
  return count;
}
export function xpTotal(s: State) {
  let total = 0;
  let perfectDays = 0;
  let previous = "";
  const today = todayKey(s.settings.timezone);
  for (const key of Object.keys(s.days).sort()) {
    if (key < s.settings.startDate || key > today) continue;
    const day = s.days[key];
    total += day.habits.reduce((points, habit) => points + (isDone(habit, day) ? habitXp(habit) : 0), 0);
    if (isPerfectDay(day)) {
      perfectDays = previous === addDays(key, -1) ? perfectDays + 1 : 1;
      total += perfectDayBonus(perfectDays);
    } else perfectDays = 0;
    previous = key;
  }
  return total;
}
export function streak(s: State, today: string) {
  let key =
    score(dayFor(s, today)) >= s.settings.dailyThreshold
      ? today
      : addDays(today, -1);
  let count = 0;
  while (key >= s.settings.startDate) {
    const d = s.days[key];
    if (!d || !activeHabits(d).length || score(d) < d.threshold) break;
    count++;
    key = addDays(key, -1);
  }
  return count;
}
export function bestStreak(s: State) {
  let best = 0,
    current = 0;
  for (
    let key = s.settings.startDate;
    key <= todayKey(s.settings.timezone);
    key = addDays(key, 1)
  ) {
    const d = s.days[key];
    current =
      d && activeHabits(d).length && score(d) >= d.threshold ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return best;
}
function hasUsageRecord(day?: Day) {
  if (!day) return false;
  return Object.values(day.entries).some((value) => value > 0)
    || day.water > 0
    || day.sleep !== null
    || day.weight !== null
    || day.energy !== null
    || day.mood !== null
    || !!day.journal.trim()
    || !!day.win.trim()
    || !!day.next.trim()
    || day.workout !== null
    || !!day.focusSessions?.length
    || day.mode === "essential";
}
/** Consecutive calendar days with a saved activity; today may still be completed. */
export function usageStreak(s: State, today: string) {
  let key = hasUsageRecord(s.days[today]) ? today : addDays(today, -1);
  let count = 0;
  while (key >= s.settings.startDate && hasUsageRecord(s.days[key])) {
    count++;
    key = addDays(key, -1);
  }
  return count;
}
export async function api<T>(
  url: string,
  body?: unknown,
  method?: string,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: method ?? (body === undefined ? "GET" : "POST"),
      credentials: "same-origin",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Sem conexão com o Ritmo. Confira se o aplicativo está aberto e tente novamente.",
    );
  }
  const data = await res
    .json()
    .catch(() => ({ error: "O servidor não respondeu. Tente novamente." }));
  if (!res.ok) {
    if (res.status === 401 && url != "/api/login")
      window.dispatchEvent(new Event("session-expired"));
    throw new Error(data.error || "Não foi possível concluir.");
  }
  return data;
}
export function downloadBackup() {
  const a = document.createElement("a");
  a.href = "/api/export";
  a.download = "ritmo-backup.json";
  a.click();
}

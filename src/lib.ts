import type { Category, Day, Habit, State } from "./types";
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
export function isDone(h: Habit, d: Day) {
  return habitValue(h, d) >= h.target;
}
export function score(d: Day) {
  return d.habits.length
    ? Math.min(
        completed(d) === d.habits.length ? 100 : 99,
        Math.round(
          (d.habits.reduce(
            (n, h) => n + Math.min(1, habitValue(h, d) / h.target),
            0,
          ) /
            d.habits.length) *
            100,
        ),
      )
    : 0;
}
export function completed(d: Day) {
  return d.habits.filter((h) => isDone(h, d)).length;
}
export function xpTotal(s: State) {
  return Object.values(s.days).reduce((n, d) => n + completed(d) * 10, 0);
}
export function streak(s: State, today: string) {
  let key =
    score(dayFor(s, today)) >= s.settings.dailyThreshold
      ? today
      : addDays(today, -1);
  let count = 0;
  while (key >= s.settings.startDate) {
    const d = s.days[key];
    if (!d || !d.habits.length || score(d) < d.threshold) break;
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
    current = d && d.habits.length && score(d) >= d.threshold ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return best;
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

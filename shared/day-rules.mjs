export const dateKey = (timezone = "America/Sao_Paulo", now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

export function addDays(key, amount) {
  const date = new Date(`${key}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function weekStart(key) {
  return addDays(key, -((new Date(`${key}T12:00:00`).getDay() + 6) % 7));
}

export function scheduledHabits(state, key) {
  const weekday = new Date(`${key}T12:00:00`).getDay();
  return state.habits
    .filter((habit) => !habit.archived && habit.createdDate <= key && habit.days.includes(weekday))
    .map((habit) => ({
      ...habit,
      target: habit.kind === "water"
        ? state.settings.waterGoal
        : habit.kind === "sleep"
          ? state.settings.sleepGoal
          : habit.target,
    }));
}

export function createDay(state, key) {
  return {
    habits: scheduledHabits(state, key),
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
  };
}

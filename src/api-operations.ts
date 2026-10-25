export type ApiOperationName =
  | "habit.create" | "habit.update" | "habit.remove"
  | "meal.create" | "meal.update" | "meal.remove"
  | "workout.create" | "workout.update" | "workout.remove"
  | "day.update" | "settings.update" | "password.update" | "backup.import"
  | "focus.start" | "focus.pause" | "focus.resume" | "focus.finish" | "focus.cancel" | "focus.remove"
  | "game.start" | "game.complete" | "game.cancel" | "game.resetTimers"
  | "week.update";

export type ApiOperation = Readonly<{
  name: ApiOperationName;
  url: string;
}>;

export type MutationTarget = string | ApiOperation;

const operation = (name: ApiOperationName, url: string): ApiOperation => ({ name, url });

export const apiEndpoints = {
  auth: "/api/auth",
  state: "/api/state",
  login: "/api/login",
  setup: "/api/setup",
  logout: "/api/logout",
  export: "/api/export",
} as const;

export const apiOperations = {
  day: {
    update: (date: string) => operation("day.update", `/api/day/${date}`),
  },
  habit: {
    create: operation("habit.create", "/api/habits"),
    update: (id: string) => operation("habit.update", `/api/habits/${id}`),
    remove: (id: string) => operation("habit.remove", `/api/habits/${id}`),
  },
  meal: {
    create: operation("meal.create", "/api/meals"),
    update: (id: string) => operation("meal.update", `/api/meals/${id}`),
    remove: (id: string) => operation("meal.remove", `/api/meals/${id}`),
  },
  workout: {
    create: operation("workout.create", "/api/workouts"),
    update: (id: string) => operation("workout.update", `/api/workouts/${id}`),
    remove: (id: string) => operation("workout.remove", `/api/workouts/${id}`),
  },
  settings: { update: operation("settings.update", "/api/settings") },
  password: { update: operation("password.update", "/api/password") },
  backup: { import: operation("backup.import", "/api/import") },
  focus: {
    start: operation("focus.start", "/api/focus/start"),
    pause: operation("focus.pause", "/api/focus/pause"),
    resume: operation("focus.resume", "/api/focus/resume"),
    finish: operation("focus.finish", "/api/focus/finish"),
    cancel: operation("focus.cancel", "/api/focus/cancel"),
    remove: (date: string, id: string) => operation("focus.remove", `/api/focus/${date}/${id}`),
  },
  game: {
    start: (id: string) => operation("game.start", `/api/games/${id}/start`),
    complete: (id: string) => operation("game.complete", `/api/games/${id}/complete`),
    cancel: (id: string) => operation("game.cancel", `/api/games/${id}/cancel`),
    resetTimers: operation("game.resetTimers", "/api/games/reset-timers"),
  },
  week: {
    update: (start: string) => operation("week.update", `/api/weeks/${start}`),
  },
} as const;

export function resolveMutationTarget(target: MutationTarget) {
  return typeof target === "string"
    ? { url: target, operation: undefined }
    : { url: target.url, operation: target.name };
}

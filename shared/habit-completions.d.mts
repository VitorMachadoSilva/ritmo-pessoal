import type { State } from "./domain-types.ts";

export type HabitCompletion = { date: string; habitId: string };
export function newlyCompletedHabits(previous: State, next: State): HabitCompletion[];

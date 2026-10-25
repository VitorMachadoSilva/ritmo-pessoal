import type { Day, Habit, State } from "../src/types";

export function dateKey(timezone?: string, now?: Date): string;
export function addDays(key: string, amount: number): string;
export function weekStart(key: string): string;
export function scheduledHabits(state: Pick<State, "habits" | "settings">, key: string): Habit[];
export function createDay(state: Pick<State, "habits" | "settings">, key: string): Day;

import { useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { State } from "../types";
import { api, todayKey, xpTotal } from "../lib";
import { errorToastForMutation, successToastForMutation, type ToastNotice } from "../toast-feedback";
import { resolveMutationTarget, type MutationTarget } from "../api-operations";
import { newlyCompletedHabits } from "../../shared/habit-completions.mjs";

export type HabitCompletionEvent = { date: string; habitId: string };

export function useMutationController({ state, setState, date, setDate, exitActive }: {
  state: State | null;
  setState: Dispatch<SetStateAction<State | null>>;
  date: string;
  setDate: Dispatch<SetStateAction<string>>;
  exitActive: () => boolean;
}) {
  const [toast, setToast] = useState<ToastNotice | null>(null);
  const [busy, setBusy] = useState(false);
  const [habitCompletions, setHabitCompletions] = useState<HabitCompletionEvent[]>([]);
  const mutating = useRef(false);

  async function mutate(target: MutationTarget, body?: unknown, method?: string): Promise<boolean> {
    if (mutating.current || exitActive()) return false;
    mutating.current = true;
    const { url, operation } = resolveMutationTarget(target);
    const habitId = operation?.startsWith("habit.") && url.startsWith("/api/habits/")
      ? url.slice("/api/habits/".length)
      : "";
    const previouslyArchived = Boolean(habitId && state?.habits.find((habit) => habit.id === habitId)?.archived);
    const busyTimer = window.setTimeout(() => setBusy(true), 180);
    try {
      const before = state ? xpTotal(state) : 0;
      const result = await api<State | { ok: boolean }>(url, body, method);
      if ("version" in result) {
        if (state && (operation === "day.update" || operation === "focus.finish")) {
          const newlyCompleted = newlyCompletedHabits(state, result);
          if (newlyCompleted.length) {
            setHabitCompletions((current) => {
              const pending = new Set(current.map(({ date, habitId }) => `${date}:${habitId}`));
              return [
                ...current,
                ...newlyCompleted.filter(({ date, habitId }) => !pending.has(`${date}:${habitId}`)),
              ];
            });
          }
        }
        setState(result);
        const resultToday = todayKey(result.settings.timezone);
        if (date < result.settings.startDate || date > resultToday) setDate(resultToday);
        const notice = successToastForMutation(url, body, method, xpTotal(result) - before, previouslyArchived);
        if (notice) setToast(notice);
      } else {
        const notice = successToastForMutation(url, body, method, 0, previouslyArchived);
        if (notice) setToast(notice);
      }
      return true;
    } catch (error) {
      setToast(errorToastForMutation(url, error, body, method, previouslyArchived));
      return false;
    } finally {
      window.clearTimeout(busyTimer);
      mutating.current = false;
      setBusy(false);
    }
  }

  function consumeHabitCompletion(date: string, habitId: string) {
    setHabitCompletions((current) => current.filter((event) => event.date !== date || event.habitId !== habitId));
  }

  return { busy, mutate, mutating, setBusy, setToast, toast, habitCompletions, consumeHabitCompletion };
}

import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { State } from "../types";
import { api, todayKey, xpTotal } from "../lib";
import { errorToastForMutation, successToastForMutation, type ToastNotice } from "../toast-feedback";
import { resolveMutationTarget, type MutationTarget } from "../api-operations";

export function useMutationController({ state, setState, date, setDate, exitActive }: {
  state: State | null;
  setState: Dispatch<SetStateAction<State | null>>;
  date: string;
  setDate: Dispatch<SetStateAction<string>>;
  exitActive: () => boolean;
}) {
  const [toast, setToast] = useState<ToastNotice | null>(null);
  const [busy, setBusy] = useState(false);
  const mutating = useRef(false);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), toast.tone === "error" ? 9000 : toast.tone === "achievement" ? 5000 : 3600);
    return () => window.clearTimeout(id);
  }, [toast]);

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

  return { busy, mutate, mutating, setBusy, setToast, toast };
}

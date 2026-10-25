import { useCallback, useEffect, useRef, useState } from "react";
import type { PageId } from "../types";
import { parseTutorialProgress, saveTutorialProgress, TUTORIAL_STORAGE_KEY, tutorialFor } from "../tutorials";

export function useTutorialController(page: PageId, dialogOpen: boolean) {
  const [completedTutorials, setCompletedTutorials] = useState<string[]>(() => {
    try { return parseTutorialProgress(window.localStorage.getItem(TUTORIAL_STORAGE_KEY)).completed; }
    catch { return []; }
  });
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
  const origin = useRef<HTMLElement | null>(null);

  const startTutorial = useCallback((id: string, trigger: HTMLElement) => {
    const guide = tutorialFor(id);
    if (!guide || guide.page !== page || dialogOpen) return;
    origin.current = trigger;
    setActiveTutorial(id);
  }, [page, dialogOpen]);

  const closeTutorial = useCallback(() => {
    setActiveTutorial(null);
    requestAnimationFrame(() => {
      if (origin.current?.isConnected) origin.current.focus({ preventScroll: true });
      origin.current = null;
    });
  }, []);
  const dismissTutorial = useCallback(() => setActiveTutorial(null), []);

  const completeTutorial = useCallback((id: string) => {
    const next = [...new Set([...completedTutorials, id])];
    setCompletedTutorials(next);
    saveTutorialProgress(next);
    closeTutorial();
  }, [completedTutorials, closeTutorial]);

  useEffect(() => {
    if (activeTutorial && tutorialFor(activeTutorial)?.page !== page) setActiveTutorial(null);
  }, [activeTutorial, page]);

  return { activeTutorial, completedTutorials, startTutorial, closeTutorial, completeTutorial, dismissTutorial };
}

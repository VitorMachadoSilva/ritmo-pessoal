import { useEffect, useRef, useState } from "react";

import { ENTRY_TIMING, entryGreeting, entryHold } from "./entry-sequence";
export { ENTRY_TIMING } from "./entry-sequence";
export function useEntrySequence() {
  const [phase, setPhase] = useState<"idle" | "entering" | "waiting">("idle");
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function run<T,>(prepare: () => Promise<T>): Promise<T> {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    setPhase("entering");
    const waiting = window.setTimeout(() => { if (mounted.current) setPhase("waiting"); }, ENTRY_TIMING.normal);
    try {
      const result = await prepare();
      const elapsed = performance.now() - start;
      const hold = entryHold(elapsed, reduced);
      if (hold) await new Promise((resolve) => window.setTimeout(resolve, hold));
      if (!mounted.current) throw new DOMException("Entry cancelled", "AbortError");
      return result;
    } catch (error) {
      if (mounted.current) setPhase("idle");
      throw error;
    } finally {
      window.clearTimeout(waiting);
    }
  }
  return { phase, run };
}

export function TransitionBrand() {
  return (
        <div className="entry-brand" aria-label="ritmo, pessoal">
          <div className="entry-mark" aria-hidden="true">
            <svg viewBox="0 0 80 80" fill="none">
              <rect width="80" height="80" rx="24" fill="#173c34" />
              <path className="entry-mark-base" d="M22 51V33a9 9 0 0 1 18 0v14a9 9 0 0 0 18 0V29" pathLength="100" />
              <path className="entry-mark-line" d="M22 51V33a9 9 0 0 1 18 0v14a9 9 0 0 0 18 0V29" pathLength="100" />
              <path className="entry-mark-loop" d="M22 51V33a9 9 0 0 1 18 0v14a9 9 0 0 0 18 0V29" pathLength="100" />
            </svg>
            <svg className="entry-sprout" viewBox="0 0 40 50" fill="none">
              <path className="entry-sprout-stem" d="M20 46C19 35 21 26 20 14" />
              <path className="entry-sprout-leaf left" d="M20 34C10 34 4 28 5 20C14 19 19 25 20 34Z" />
              <path className="entry-sprout-leaf right" d="M20 24C21 13 29 8 36 10C36 19 29 25 20 24Z" />
            </svg>
          </div>
          <span className="entry-wordmark">ritmo.</span>
          <span className="entry-personal">Pessoal</span>
        </div>
  );
}

export function EntrySurface({ phase, hour = new Date().getHours() }: { phase: "entering" | "waiting" | "reveal"; hour?: number }) {
  return (
    <div className="entry-transition" data-phase={phase}>
      <div className="entry-wash entry-wash-left" aria-hidden="true" />
      <div className="entry-wash entry-wash-right" aria-hidden="true" />
      <div className="entry-atmosphere" aria-hidden="true" />
      <div className="entry-content">
        <TransitionBrand />
        <div className="entry-welcome" role="status" aria-live="polite" aria-atomic="true">
          <p>Bom ter você de volta.</p>
          <span>{entryGreeting(hour)}</span>
        </div>
      </div>
    </div>
  );
}

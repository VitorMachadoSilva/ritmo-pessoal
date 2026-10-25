// Timing controls (ms). Keep dissolve/stagger aligned with entry-transition.css.
// Even the longest artificial hold + dissolve is 2.2s, below the 3s limit.
export const ENTRY_TIMING = { fast: 1300, normal: 1800, fastReady: 650, dissolve: 400, reduced: 200, stagger: 60 };

export function entryGreeting(hour: number) {
  // Edit the time-specific welcome copy here.
  return hour < 12 ? "Vamos começar com calma." : hour < 18 ? "Um passo de cada vez." : "Fechando o dia com leveza.";
}

export function entryHold(elapsed: number, reduced: boolean) {
  if (reduced) return 0;
  const minimum = elapsed < ENTRY_TIMING.fastReady ? ENTRY_TIMING.fast : ENTRY_TIMING.normal;
  return Math.max(0, minimum - elapsed);
}

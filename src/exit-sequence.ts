import { ENTRY_TIMING } from "./entry-sequence.ts";

// The ~2s choreography and 1.2s quiet pause fit inside this real 3s undo window.
// Do not shorten the undo window to match the visual motion. Reduced motion
// removes movement, not the user's opportunity to cancel.
export const EXIT_TIMING = { undo: 3000, reveal: ENTRY_TIMING.dissolve, reduced: ENTRY_TIMING.reduced };
export type ExitPhase = "idle" | "closing" | "committing" | "failed" | "reveal" | "returning";
export function canCancelExit(phase: ExitPhase, now: number, deadline: number) {
  return phase === "closing" && now < deadline;
}

// Never claim logout succeeded when the server could not confirm revocation.
// A lost POST response is reconciled through the read-only auth endpoint.
export async function revokeSession(request: typeof fetch = fetch) {
  try {
    const response = await request("/api/logout", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" }, body: "{}",
      signal: AbortSignal.timeout(10000),
    });
    if (response.ok || response.status === 401) return;
    throw new Error("Logout not confirmed");
  } catch {
    try {
      const response = await request("/api/auth", { credentials: "same-origin", signal: AbortSignal.timeout(5000) });
      if (response.ok && (await response.json()).authenticated === false) return;
    } catch { /* Keep the private surface covered until a retry confirms logout. */ }
    throw new Error("Não foi possível confirmar sua saída. Verifique a conexão e tente novamente.");
  }
}

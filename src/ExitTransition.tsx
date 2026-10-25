import { useEffect, useRef, useState } from "react";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { TransitionBrand } from "./EntryTransition";
import { canCancelExit, EXIT_TIMING, type ExitPhase } from "./exit-sequence";

export function useExitSequence(commit: () => Promise<void>) {
  const [phase, setPhase] = useState<ExitPhase>("idle");
  const [error, setError] = useState("");
  const current = useRef<ExitPhase>("idle");
  const callback = useRef(commit);
  callback.current = commit;
  const deadline = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(true);
  function change(next: ExitPhase) { current.current = next; if (mounted.current) setPhase(next); }
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; clearTimeout(timer.current); };
  }, []);
  async function finish() {
    if (!["closing", "failed"].includes(current.current)) return;
    change("committing"); setError("");
    try {
      await callback.current();
      if (!mounted.current) return;
      change("reveal");
      const duration = matchMedia("(prefers-reduced-motion: reduce)").matches ? EXIT_TIMING.reduced : EXIT_TIMING.reveal;
      timer.current = setTimeout(() => change("idle"), duration);
    } catch (err) {
      if (!mounted.current) return;
      setError((err as Error).message); change("failed");
    }
  }
  function start() {
    if (current.current !== "idle") return;
    deadline.current = performance.now() + EXIT_TIMING.undo;
    change("closing");
    timer.current = setTimeout(() => void finish(), EXIT_TIMING.undo);
  }
  function cancel() {
    if (!canCancelExit(current.current, performance.now(), deadline.current)) return false;
    clearTimeout(timer.current); change("returning");
    timer.current = setTimeout(() => change("idle"), EXIT_TIMING.reduced);
    return true;
  }
  return { phase, error, start, cancel, retry: finish, active: () => current.current !== "idle" };
}

export function ExitSurface({ phase, error, onCancel, onRetry }: {
  phase: Exclude<ExitPhase, "idle">; error: string; onCancel: () => void; onRetry: () => void;
}) {
  const action = useRef<HTMLButtonElement>(null);
  const status = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (phase === "closing" || phase === "failed") action.current?.focus({ preventScroll: true });
    else if (phase === "committing") status.current?.focus({ preventScroll: true });
  }, [phase]);
  return <section className="exit-transition" data-phase={phase} aria-label="Saída do seu espaço"
    onKeyDown={(event) => {
      if (event.key === "Escape" && phase === "closing") onCancel();
      // Background is inert. Keep keyboard navigation on the sole available action.
      if (event.key === "Tab") { event.preventDefault(); (action.current || status.current)?.focus(); }
    }}>
    <div className="exit-circle" aria-hidden="true" />
    <div className="exit-glow" aria-hidden="true" />
    <div className="entry-content exit-content">
      <TransitionBrand />
      <div className="entry-welcome exit-welcome" ref={status} tabIndex={-1} role="status" aria-live="polite" aria-atomic="true">
        {/* Configure farewell copy here; no claim that unsaved drafts were saved. */}
        <p>Até logo.</p>
        <span>Seus registros ficam salvos no seu computador.</span>
        <small className="exit-status" aria-hidden={phase !== "committing"}><LoaderCircle size={14} className="spin"/>Encerrando seu acesso…</small>
      </div>
      <div className="exit-actions">
        {phase === "closing" && <button ref={action} className="exit-return" onClick={onCancel}><ArrowLeft size={16}/>Voltar ao meu espaço</button>}
        {phase === "failed" && <><p role="alert" className="exit-error">{error}</p><button ref={action} className="exit-return" onClick={onRetry}>Tentar encerrar novamente</button></>}
      </div>
    </div>
  </section>;
}

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BookOpenCheck, Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { tutorialFor } from "./tutorials";

export function TutorialTrigger({ id, completed, onStart, label = "Como usar" }: { id: string; completed: boolean; onStart: (id: string, trigger: HTMLElement) => void; label?: string }) {
  const title = tutorialFor(id)?.title ?? id;
  return <button type="button" className="tutorial-trigger" aria-label={`${label}: ${title}${completed ? ", concluído, reabrir" : ""}`} title={completed ? `${label} · concluído (reabrir)` : label} onClick={(event) => onStart(id, event.currentTarget)}><BookOpenCheck size={15} /><span>{completed ? "Rever guia" : label}</span>{completed && <Check size={13} aria-hidden="true" />}</button>;
}

type Position = { top: number; left: number; width: number };
export function GuidedTutorial({ id, onClose, onComplete }: { id: string; onClose: () => void; onComplete: (id: string) => void }) {
  const guide = tutorialFor(id);
  const [index, setIndex] = useState(0);
  const [position, setPosition] = useState<Position | null>(null);
  const [missing, setMissing] = useState(false);
  const card = useRef<HTMLElement>(null);
  const targetRef = useRef<HTMLElement | null>(null);
  const step = guide?.steps[index];

  const measure = useCallback(() => {
    const target = step && document.querySelector<HTMLElement>(`[data-tutorial-target="${step.target}"]`);
    if (!target || !target.isConnected || target.getClientRects().length === 0) { setMissing(true); return; }
    targetRef.current = target;
    const rect = target.getBoundingClientRect();
    const width = Math.min(360, window.innerWidth - 32);
    const cardHeight = card.current?.offsetHeight ?? 190;
    const usableHeight = window.innerHeight - (window.innerWidth <= 650 ? 72 : 12);
    const gap = 14;
    const left = Math.max(16, Math.min(window.innerWidth - width - 16, rect.left + rect.width / 2 - width / 2));
    let top = rect.bottom + gap;
    if (top + cardHeight > usableHeight - 12 && rect.top > cardHeight + gap) top = rect.top - cardHeight - gap;
    top = Math.max(12, Math.min(usableHeight - cardHeight - 12, top));
    setPosition({ top, left, width });
    setMissing(false);
  }, [step]);

  useLayoutEffect(() => {
    if (!guide || !step) { onClose(); return; }
    const target = document.querySelector<HTMLElement>(`[data-tutorial-target="${step.target}"]`);
    if (!target || target.getClientRects().length === 0) { setMissing(true); return; }
    target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(target);
    if (card.current) observer.observe(card.current);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure, true); };
  }, [guide, step, measure, onClose]);

  useEffect(() => { card.current?.querySelector<HTMLElement>("[data-tutorial-heading]")?.focus({ preventScroll: true }); }, [index]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); onClose(); } };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);
  useEffect(() => { if (missing) onClose(); }, [missing, onClose]);

  if (!guide || !step || !position) return null;
  const targetRect = targetRef.current?.getBoundingClientRect();
  return <div className="guided-tutorial" data-testid="guided-tutorial">
    {targetRect && <div aria-hidden="true" className="tutorial-spotlight" style={{ top: targetRect.top, left: targetRect.left, width: targetRect.width, height: targetRect.height }} />}
    <section ref={card} className="tutorial-card" role="region" aria-label={`Guia ${guide.title}`} aria-live="polite" style={{ top: position.top, left: position.left, width: position.width }}>
      <div className="tutorial-card-top"><span>{guide.title}</span><button type="button" aria-label="Fechar guia" onClick={onClose}><X size={17} /></button></div>
      <h2 tabIndex={-1} data-tutorial-heading>{step.title}</h2>
      <p>{step.body}</p>
      <div className="tutorial-card-footer"><span aria-label={`Passo ${index + 1} de ${guide.steps.length}`}>{index + 1} / {guide.steps.length}</span><div>
        <button type="button" className="tutorial-skip" onClick={onClose}>Pular</button>
        <button type="button" className="tutorial-nav" onClick={() => setIndex((n) => Math.max(0, n - 1))} disabled={index === 0} aria-label="Passo anterior"><ChevronLeft size={16} />Voltar</button>
        {index < guide.steps.length - 1 ? <button type="button" className="tutorial-next" onClick={() => setIndex((n) => n + 1)}>Próximo<ChevronRight size={16} /></button> : <button type="button" className="tutorial-next" onClick={() => onComplete(guide.id)}>Concluir<Check size={16} /></button>}
      </div></div>
    </section>
  </div>;
}

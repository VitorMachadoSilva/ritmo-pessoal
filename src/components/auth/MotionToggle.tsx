import { Pause, Play } from "lucide-react";

export function MotionToggle({ paused, onToggle }: { paused: boolean; onToggle: () => void }) {
  return (
    <button className="auth-motion-toggle" type="button" aria-pressed={paused} onClick={onToggle}>
      {paused ? <Play size={14} /> : <Pause size={14} />}
      {paused ? "Retomar animação" : "Pausar animação"}
    </button>
  );
}

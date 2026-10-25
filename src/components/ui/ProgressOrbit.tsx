import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import type { Day } from "../../types";
import { completed, activeHabits, score } from "../../lib";

export function ProgressOrbit({ day }: { day: Day }) {
  const p = score(day),
    done = completed(day),
    total = activeHabits(day).length;
  const [animated, setAnimated] = useState(p);
  const current = useRef(p);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.hidden) {
      current.current = p;
      setAnimated(p);
      return;
    }
    const from = current.current;
    if (from === p) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = Math.min(1, (now - start) / 650);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      current.current = from + (p - from) * eased;
      setAnimated(current.current);
      if (elapsed < 1) frame = requestAnimationFrame(tick);
    };
    const onVisibility = () => {
      if (!document.hidden) return;
      cancelAnimationFrame(frame);
      current.current = p;
      setAnimated(p);
    };
    document.addEventListener("visibilitychange", onVisibility);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [p]);
  const visiblePercent = Math.round(animated);
  return (
    <div
      className="orbit"
      role="img"
      aria-label={`${p}% do dia, ${done} de ${total} hábitos completos`}
    >
      <svg viewBox="0 0 240 240" aria-hidden="true">
        <circle
          cx="120"
          cy="120"
          r="108"
          fill="none"
          stroke="currentColor"
          strokeOpacity=".12"
        />
        <circle
          cx="120"
          cy="120"
          r="91"
          fill="none"
          stroke="currentColor"
          strokeOpacity=".06"
          strokeWidth="18"
        />
        {Array.from({ length: 40 }, (_, i) => {
          const a = ((i * 9 - 90) * Math.PI) / 180,
            b = ((i * 9 - 84) * Math.PI) / 180,
            r = 91;
          return (
            <path
              key={i}
              d={`M${120 + r * Math.cos(a)},${120 + r * Math.sin(a)} A${r},${r} 0 0 1 ${120 + r * Math.cos(b)},${120 + r * Math.sin(b)}`}
              fill="none"
              stroke={i < Math.round(animated / 2.5) ? "#e0ecb3" : "#52756a"}
              strokeWidth="16"
              strokeLinecap="butt"
            />
          );
        })}
        <circle
          cx="120"
          cy="120"
          r="68"
          fill="none"
          stroke="#8ba896"
          strokeOpacity=".3"
          strokeDasharray="2 5"
        />
        <circle cx="120" cy="12" r="4" fill="#dceaaf" />
        <circle cx="228" cy="120" r="3" fill="#8ca39a" />
      </svg>
      <div className="orbit-value">
        <strong>
          {visiblePercent}
          <span>%</span>
        </strong>
        <span>do seu dia</span>
      </div>
      <div className="orbit-satellite">
        <Check size={12} />
        {done}/{total}
      </div>
    </div>
  );
}


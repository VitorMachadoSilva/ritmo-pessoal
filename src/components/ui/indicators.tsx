import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ArrowUpRight, Flame, Sparkles } from "lucide-react";

export function Metric({
  icon,
  label,
  value,
  detail,
  color = "green",
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  detail: ReactNode;
  color?: string;
}) {
  return (
    <div className="metric">
      <span className={`metric-icon ${color}`}>{icon}</span>
      <div>
        <span className="metric-label">{label}</span>
        <div className="metric-number">{value}</div>
        <span className="metric-detail">{detail}</span>
      </div>
    </div>
  );
}
export function StreakBadge({ count }: { count: number }) {
  return (
    <span className="streak-badge">
      <Flame size={15} />
      {count} {count === 1 ? "dia" : "dias"} de sequência
    </span>
  );
}
export function ArrowLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="text-button" onClick={onClick}>
      {children}
      <ArrowUpRight size={15} />
    </button>
  );
}
export function Celebration({ visible, points = 10 }: { visible: boolean; points?: number }) {
  return visible ? (
    <span className="xp-pop">
      <Sparkles size={14} /> +{points} XP
    </span>
  ) : null;
}
export function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  return now;
}


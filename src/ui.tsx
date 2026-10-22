import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  X,
  Sparkles,
  Droplets,
  Moon,
  Dumbbell,
  Brain,
  Utensils,
  Heart,
  Plus,
} from "lucide-react";
import type { Category, Day, Habit, State } from "./types";
import {
  addDays,
  categories,
  completed,
  activeHabits,
  dateLabel,
  dayFor,
  isDone,
  number,
  score,
} from "./lib";
export function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className={`brand ${small ? "small" : ""}`}>
      <svg width="37" height="37" viewBox="0 0 48 48" aria-hidden="true">
        <rect width="48" height="48" rx="14" fill="currentColor" />
        <path
          d="M13 31V19a5 5 0 0 1 10 0v10a5 5 0 0 0 10 0V17"
          fill="none"
          stroke="#e1edbd"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
      {!small && (
        <span>
          ritmo<span className="brand-dot">.</span>
        </span>
      )}
    </div>
  );
}
export function CategoryIcon({
  category,
  size = 18,
}: {
  category: Category;
  size?: number;
}) {
  const Icon = {
    agua: Droplets,
    sono: Moon,
    corpo: Dumbbell,
    mente: Brain,
    alimentacao: Utensils,
    emocional: Heart,
  }[category];
  return <Icon size={size} strokeWidth={1.8} />;
}
export function Tag({ category }: { category: Category }) {
  return (
    <span className={`tag ${categories[category].color}`}>
      <i />
      {categories[category].label}
    </span>
  );
}
export function Empty({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Modal({
  title,
  description,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const previous = useRef<HTMLElement | null>(
    document.activeElement as HTMLElement,
  );
  return (
    <Dialog.Root
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className={`modal ${wide ? "wide" : ""}`}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            previous.current?.focus();
          }}
        >
          <div className="modal-heading">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>
                {description || "Personalize sua rotina no seu ritmo."}
              </Dialog.Description>
            </div>
            <Dialog.Close className="icon-button" aria-label="Fechar janela">
              <X size={20} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function DatePicker({
  date,
  today,
  startDate,
  onChange,
}: {
  date: string;
  today: string;
  startDate: string;
  onChange: (d: string) => void;
}) {
  return (
    <div className="date-picker">
      <button
        className="icon-button"
        onClick={() => onChange(addDays(date, -1))}
        disabled={date <= startDate}
        aria-label="Dia anterior"
      >
        <ChevronLeft size={17} />
      </button>
      <label className="date-label">
        <span>
          {date === today
            ? "Hoje"
            : dateLabel(date, { day: "2-digit", month: "short" })}
        </span>
        <input
          aria-label="Escolher dia"
          type="date"
          value={date}
          min={startDate}
          max={today}
          onChange={(e) => {
            if (e.target.value >= startDate && e.target.value <= today)
              onChange(e.target.value);
          }}
        />
      </label>
      <button
        className="icon-button"
        onClick={() => onChange(addDays(date, 1))}
        disabled={date >= today}
        aria-label="Próximo dia"
      >
        <ChevronRight size={17} />
      </button>
    </div>
  );
}
export function ProgressOrbit({ day }: { day: Day }) {
  const p = score(day),
    done = completed(day),
    total = activeHabits(day).length;
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
              stroke={i < Math.round(p / 2.5) ? "#e0ecb3" : "#52756a"}
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
          {p}
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
export function HabitRow({
  habit,
  day,
  onToggle,
  onEdit,
  busy,
  status,
}: {
  habit: Habit;
  day: Day;
  onToggle: () => void;
  onEdit: () => void;
  busy: boolean;
  status?: string;
}) {
  const done = isDone(habit, day);
  const amount =
    habit.kind === "water"
      ? `${number(day.water / 1000, 2)} / ${number(habit.target / 1000, 1)} L`
      : habit.kind === "sleep"
        ? `${number(day.sleep ?? 0, 1)} / ${habit.target} h`
        : habit.kind === "counter"
          ? `${day.entries[habit.id] ?? 0} / ${habit.target} ${habit.unit}`
          : null;
  return (
    <div className={`habit-row ${done ? "is-done" : ""}`}>
      <button
        className={`habit-check ${done ? "checked" : ""}`}
        onClick={onToggle}
        disabled={busy}
        aria-label={`${done ? "Desmarcar" : "Registrar"} ${habit.title}`}
        aria-pressed={done}
      >
        {done ? (
          <Check size={15} />
        ) : habit.kind === "check" ? null : habit.kind === "water" ? (
          <Droplets size={14} />
        ) : habit.kind === "sleep" ? (
          <Moon size={14} />
        ) : (
          <Plus size={14} />
        )}
      </button>
      <button className="habit-body" onClick={onEdit}>
        <span className="habit-title">{habit.title}</span>
        <span className="habit-description">{habit.description}</span>
      </button>
      <div className="habit-meta">
        <Tag category={habit.category} />
        {amount ? (
          <span className="habit-amount">{amount}</span>
        ) : (
          <span className="habit-xp">
            {done ? (
              <>
                <Check size={11} />
                +10 XP
              </>
            ) : (
              status || "10 XP"
            )}
          </span>
        )}
      </div>
    </div>
  );
}
export function Heatmap({
  state,
  today,
  onSelect,
}: {
  state: State;
  today: string;
  onSelect: (key: string) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const [focusDay, setFocusDay] = useState(today);
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = scroll.current;
    if (!element) return;
    const showRecent = () => {
      element.scrollLeft = element.scrollWidth;
    };
    const observer = new ResizeObserver(showRecent);
    observer.observe(element);
    showRecent();
    return () => observer.disconnect();
  }, [today]);
  const start = addDays(today, -364);
  const monday = addDays(
    start,
    -((new Date(`${start}T12:00:00`).getDay() + 6) % 7),
  );
  const weeks = Math.ceil(
    (Math.round(
      (new Date(`${today}T12:00:00`).getTime() -
        new Date(`${monday}T12:00:00`).getTime()) /
        86400000,
    ) +
      1) /
      7,
  );
  const keys = Array.from({ length: weeks * 7 }, (_, i) => addDays(monday, i));
  const active = Object.values(state.days).filter((d) => score(d) > 0).length;
  return (
    <section className="heatmap-panel panel">
      <div className="section-heading">
        <div>
          <h2>Pequenos passos. Grandes mudanças.</h2>
          <p>
            {active
              ? `${active} ${active === 1 ? "dia em movimento" : "dias em movimento"}. Cada quadradinho conta a sua história.`
              : "Seu primeiro quadradinho começa com uma ação hoje."}
          </p>
        </div>
        <span className="pill neutral">Últimos 12 meses</span>
      </div>
      <div className="heatmap-scroll" ref={scroll}>
        <div className="heatmap-inner" style={{ minWidth: 620 }}>
          <div
            className="heatmap-months"
            style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}
          >
            {Array.from({ length: weeks }, (_, w) => {
              const key = addDays(monday, w * 7);
              const prev = addDays(key, -7);
              return (
                <span key={key}>
                  {w === 0 || key.slice(0, 7) !== prev.slice(0, 7)
                    ? dateLabel(key, { month: "short" }).replace(".", "")
                    : ""}
                </span>
              );
            })}
          </div>
          <div className="heatmap-main">
            <div className="heatmap-days">
              <span>Seg</span>
              <span>Qua</span>
              <span>Sex</span>
            </div>
            <div
              className="heatmap-grid"
              style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}
            >
              {keys.map((key) => {
                const future = key > today;
                const d = dayFor(state, key);
                const p = score(d);
                const level =
                  p === 0 ? 0 : p < 25 ? 1 : p < 50 ? 2 : p < 75 ? 3 : 4;
                const enabled = !future && key >= state.settings.startDate;
                return (
                  <button
                    key={key}
                    data-day={key}
                    tabIndex={key === focusDay ? 0 : -1}
                    disabled={!enabled}
                    className={`heat-cell heat-${level} ${future ? "future" : ""} ${key === today ? "is-today" : ""}`}
                    aria-label={`${dateLabel(key)}: ${p}% concluído${d.mode === "essential" ? ", dia essencial" : ""}`}
                    title={`${dateLabel(key)} · ${p}% · ${completed(d)} hábitos${d.mode === "essential" ? " · dia essencial" : ""}`}
                    onMouseEnter={() => setHover(key)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => {
                      setHover(key);
                      setFocusDay(key);
                    }}
                    onBlur={() => setHover(null)}
                    onKeyDown={(e) => {
                      const offsets: Record<string, number> = {
                        ArrowLeft: -7,
                        ArrowRight: 7,
                        ArrowUp: -1,
                        ArrowDown: 1,
                      };
                      if (!(e.key in offsets)) return;
                      e.preventDefault();
                      const next = addDays(key, offsets[e.key]);
                      const target =
                        e.currentTarget.parentElement?.querySelector<HTMLButtonElement>(
                          `[data-day="${next}"]`,
                        );
                      if (target && !target.disabled) target.focus();
                    }}
                    onClick={() => onSelect(key)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="heatmap-footer">
        <span>
          {hover ? (
            <>
              <strong>{dateLabel(hover)}</strong> ·{" "}
              {score(dayFor(state, hover))}% concluído
              {dayFor(state, hover).mode === "essential"
                ? " · dia essencial"
                : ""}
            </>
          ) : (
            <>
              <span className="live-dot" /> Clique em um dia para explorar
            </>
          )}
        </span>
        <div className="heatmap-legend">
          <span>Menos</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <i key={l} className={`heat-${l}`} />
          ))}
          <span>Mais</span>
        </div>
      </div>
    </section>
  );
}
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
export function Celebration({ visible }: { visible: boolean }) {
  return visible ? (
    <span className="xp-pop">
      <Sparkles size={14} /> +10 XP
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

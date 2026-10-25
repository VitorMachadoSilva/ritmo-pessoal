import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { createPortal } from "react-dom";
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
  CalendarDays,
} from "lucide-react";
import type { Category, Day, Habit, State } from "./types";
import {
  addDays,
  categories,
  completed,
  activeHabits,
  dateLabel,
  dayFor,
  habitValue,
  habitXp,
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
  className = "",
  draftKey,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  className?: string;
  draftKey?: string;
}) {
  const previous = useRef<HTMLElement | null>(
    document.activeElement as HTMLElement,
  );
  const changed = useRef(false);
  const [discard, setDiscard] = useState(false);
  useEffect(() => {
    changed.current = false;
    setDiscard(false);
  }, [draftKey]);
  const requestClose = () => (changed.current ? setDiscard(true) : onClose());
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (changed.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  return (
    <>
      <Dialog.Root
        open
        onOpenChange={(v) => {
          if (!v) requestClose();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content
            className={`modal ${wide ? "wide" : ""} ${className}`.trim()}
            {...(description ? {} : { "aria-describedby": undefined })}
            onChangeCapture={() => {
              changed.current = true;
            }}
            onClickCapture={(event) => {
              const target = (event.target as HTMLElement).closest("button");
              if (
                target &&
                (target.hasAttribute("aria-pressed") ||
                  target.hasAttribute("data-draft-change"))
              )
                changed.current = true;
              // Form cancel buttons use their existing callbacks; guard before they can unmount.
              if (
                target?.hasAttribute("data-close-dialog") &&
                changed.current
              ) {
                event.preventDefault();
                event.stopPropagation();
                setDiscard(true);
              }
            }}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              previous.current?.focus();
            }}
          >
            <div className="modal-heading">
              <div>
                <Dialog.Title>{title}</Dialog.Title>
                {description && <Dialog.Description>{description}</Dialog.Description>}
              </div>
              <Dialog.Close className="icon-button" aria-label="Fechar janela">
                <X size={20} />
              </Dialog.Close>
            </div>
            {children}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {discard && (
        <Dialog.Root
          open
          onOpenChange={(open) => {
            if (!open) setDiscard(false);
          }}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="modal-overlay discard-overlay" />
            <Dialog.Content className="modal discard-modal">
              <Dialog.Title>Descartar alterações?</Dialog.Title>
              <Dialog.Description>
                Há alterações nesta janela que ainda não foram salvas. Você pode
                continuar editando ou descartá-las.
              </Dialog.Description>
              <div className="modal-actions">
                <button
                  className="button secondary"
                  onClick={() => setDiscard(false)}
                  autoFocus
                >
                  Continuar editando
                </button>
                <button
                  className="button danger"
                  onClick={() => {
                    changed.current = false;
                    onClose();
                  }}
                >
                  Descartar alterações
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </>
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
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => `${date.slice(0, 7)}-01`);
  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPosition, setPopoverPosition] = useState<CSSProperties>({ visibility: "hidden" });
  const monthDate = new Date(`${visibleMonth}T12:00:00`);
  const firstWeekday = (monthDate.getDay() + 6) % 7;
  const monthLength = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const startMonth = `${startDate.slice(0, 7)}-01`;
  const todayMonth = `${today.slice(0, 7)}-01`;
  const monthTitle = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(monthDate);
  const weekdays = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

  useEffect(() => {
    setVisibleMonth(`${date.slice(0, 7)}-01`);
  }, [date]);

  useLayoutEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const anchor = triggerRef.current?.getBoundingClientRect();
      const popover = popoverRef.current;
      if (!anchor || !popover) return;
      const viewport = window.visualViewport;
      const viewportLeft = viewport?.offsetLeft ?? 0;
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const margin = 12;
      const width = Math.min(286, viewportWidth - margin * 2);
      const height = popover.offsetHeight;
      const left = Math.min(
        Math.max(anchor.left + anchor.width / 2 - width / 2, viewportLeft + margin),
        viewportLeft + viewportWidth - width - margin,
      );
      const below = anchor.bottom + 10;
      const above = anchor.top - height - 10;
      const maxTop = viewportTop + viewportHeight - margin - Math.min(height, viewportHeight - margin * 2);
      const top = below + height <= viewportTop + viewportHeight - margin
        ? below
        : Math.max(viewportTop + margin, Math.min(above, maxTop));
      setPopoverPosition({ position: "fixed", left, top, width, maxHeight: viewportHeight - margin * 2, overflowY: "auto", transform: "none", visibility: "visible" });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.visualViewport?.addEventListener("resize", updatePosition);
    window.visualViewport?.addEventListener("scroll", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.visualViewport?.removeEventListener("resize", updatePosition);
      window.visualViewport?.removeEventListener("scroll", updatePosition);
    };
  }, [open, visibleMonth]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!pickerRef.current?.contains(target) && !popoverRef.current?.contains(target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const shiftMonth = (amount: number) => {
    const next = new Date(monthDate.getFullYear(), monthDate.getMonth() + amount, 1, 12);
    setVisibleMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`);
  };

  return (
    <div className="date-picker" ref={pickerRef}>
      <button
        className="icon-button"
        onClick={() => onChange(addDays(date, -1))}
        disabled={date <= startDate}
        aria-label="Dia anterior"
      >
        <ChevronLeft size={17} />
      </button>
      <div className="date-label">
        <button ref={triggerRef} className="calendar-trigger" type="button" aria-label={`Escolher dia, ${dateLabel(date, { day: "numeric", month: "long", year: "numeric" })}`} aria-expanded={open} aria-haspopup="dialog" aria-controls="ritmo-date-calendar" onClick={() => setOpen((value) => !value)}>
          <CalendarDays size={14} aria-hidden="true" />
          <span>{date === today ? "Hoje" : dateLabel(date, { day: "2-digit", month: "short" })}</span>
        </button>
      </div>
      <button
        className="icon-button"
        onClick={() => onChange(addDays(date, 1))}
        disabled={date >= today}
        aria-label="Próximo dia"
      >
        <ChevronRight size={17} />
      </button>
      {open && createPortal(<div ref={popoverRef} className="date-calendar-popover" style={popoverPosition} id="ritmo-date-calendar" role="dialog" aria-label="Escolher data">
          <div className="date-calendar-heading">
            <strong>{monthTitle}</strong>
            <div>
              <button type="button" className="date-calendar-nav" aria-label="Mês anterior" disabled={visibleMonth <= startMonth} onClick={() => shiftMonth(-1)}><ChevronLeft size={16} /></button>
              <button type="button" className="date-calendar-nav" aria-label="Próximo mês" disabled={visibleMonth >= todayMonth} onClick={() => shiftMonth(1)}><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className="date-calendar-grid" role="grid" aria-label={monthTitle}>
            {weekdays.map((day) => <span className="date-calendar-weekday" role="columnheader" key={day}>{day}</span>)}
            {Array.from({ length: 42 }, (_, index) => {
              const day = index - firstWeekday + 1;
              if (day < 1 || day > monthLength) return <span className="date-calendar-empty" role="gridcell" key={`empty-${index}`} />;
              const value = `${visibleMonth.slice(0, 7)}-${String(day).padStart(2, "0")}`;
              const disabled = value < startDate || value > today;
              return <button type="button" role="gridcell" key={value} className={`date-calendar-day${value === date ? " is-selected" : ""}${value === today ? " is-today" : ""}`} aria-label={dateLabel(value, { day: "numeric", month: "long", year: "numeric" })} aria-selected={value === date} disabled={disabled} onClick={() => { onChange(value); setOpen(false); }}>{day}</button>;
            })}
          </div>
          <div className="date-calendar-footer">
            <span>Selecione um dia</span>
            <button type="button" disabled={today < startDate || date === today} onClick={() => { onChange(today); setOpen(false); }}>Hoje</button>
          </div>
        </div>, document.body)}
    </div>
  );
}
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
  const partial = habit.kind !== "check" && habitValue(habit, day) > 0 && !done;
  const amount =
    habit.kind === "water"
      ? `${number(day.water / 1000, 2)} / ${number(habit.target / 1000, 1)} L`
      : habit.kind === "sleep"
        ? `${number(day.sleep ?? 0, 2)} / ${habit.target} h`
        : habit.kind === "counter"
          ? `${day.entries[habit.id] ?? 0} / ${habit.target} ${habit.unit}`
          : null;
  return (
    <div className={`habit-row ${done ? "is-done" : ""} ${partial ? "is-partial" : ""}`}>
      <button
        className={`habit-check ${done ? "checked" : ""}`}
        onClick={onToggle}
        disabled={busy}
        data-pending-disabled={busy || undefined}
        aria-label={`${habit.kind === "check" ? done ? "Desmarcar" : "Concluir" : partial ? "Revisar meta não atingida de" : "Abrir registro de"} ${habit.title}`}
        aria-pressed={done}
      >
        {done ? (
          <Check size={15} />
        ) : partial ? (
          <X size={14} />
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
          <span className="habit-amount-wrap"><span className="habit-amount">{amount}</span>{partial && <span className="habit-partial">Meta não atingida · 0 XP</span>}</span>
        ) : (
          <span className="habit-xp">
            {done ? (
              <>
                <Check size={11} />
                +{habitXp(habit)} XP
              </>
            ) : (
              status || `${habitXp(habit)} XP`
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

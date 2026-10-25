import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { addDays, dateLabel } from "../../lib";

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


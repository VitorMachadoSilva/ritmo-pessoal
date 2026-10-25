import { useEffect, useRef, useState } from "react";
import type { State } from "../../types";
import { addDays, completed, dateLabel, dayFor, score } from "../../lib";

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


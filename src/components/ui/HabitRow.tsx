import { Check, X, Droplets, Moon, Plus, Sprout } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Day, Habit } from "../../types";
import { habitValue, habitXp, isDone, number } from "../../lib";
import { Tag } from "./primitives";
export function HabitRow({
  habit,
  day,
  onToggle,
  onEdit,
  busy,
  status,
  celebrating = false,
  onCelebrationConsumed,
}: {
  habit: Habit;
  day: Day;
  onToggle: () => void;
  onEdit: () => void;
  busy: boolean;
  status?: string;
  celebrating?: boolean;
  onCelebrationConsumed?: () => void;
}) {
  const [showSprout, setShowSprout] = useState(false);
  const handledCelebration = useRef(false);
  useEffect(() => {
    if (celebrating && !handledCelebration.current) {
      handledCelebration.current = true;
      setShowSprout(true);
      onCelebrationConsumed?.();
    } else if (!celebrating) {
      handledCelebration.current = false;
    }
  }, [celebrating, onCelebrationConsumed]);
  useEffect(() => {
    if (!showSprout) return;
    const timeout = window.setTimeout(() => setShowSprout(false), 720);
    return () => window.clearTimeout(timeout);
  }, [showSprout]);
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
    <div className={`habit-row ${done ? "is-done" : ""} ${partial ? "is-partial" : ""} ${showSprout ? "is-celebrating" : ""}`}>
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
        {showSprout && <Sprout className="habit-sprout" size={15} aria-hidden="true" />}
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


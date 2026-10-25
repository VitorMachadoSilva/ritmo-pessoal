import { Droplets, Plus } from "lucide-react";
import type { Day, Mutation } from "../../types";
import { number } from "../../lib";
import { TutorialTrigger } from "../../GuidedTutorial";
import { apiOperations } from "../../api-operations";

export function WaterWidget({
  day,
  mutate,
  date,
  busy,
  goal,
  startTutorial,
  completedTutorials,
}: {
  day: Day;
  mutate: Mutation;
  date: string;
  busy: boolean;
  goal: number;
  startTutorial: (id: string, trigger: HTMLElement) => void;
  completedTutorials: string[];
}) {
  const ratio = Math.min(1, day.water / goal);
  return (
    <section className="water-widget" data-tutorial-target="today-water">
      <div className="widget-heading">
        <span className="widget-icon">
          <Droplets size={18} />
        </span>
        <h3>Um gole de cuidado.</h3>
        <span>{Math.round(ratio * 100)}%</span>
        <TutorialTrigger id="feature-water" completed={completedTutorials.includes("feature-water")} onStart={startTutorial} label="Guia" />
      </div>
      <div className="water-content">
        <div>
          <div className="water-number">
            {number(day.water / 1000, 2)}
            <span> / {number(goal / 1000, 1)} L</span>
          </div>
          <p>
            {ratio >= 1
              ? "Meta do dia alcançada."
              : "Distribua a água ao longo do dia."}
          </p>
        </div>
        <div
          className="water-vessel"
          role="img"
          aria-label={`${day.water} de ${goal} ml`}
        >
          <div className="vessel-mark m1" />
          <div className="vessel-mark m2" />
          <div className="vessel-mark m3" />
          <div
            className="water-fill"
            style={{ height: `${Math.max(4, ratio * 100)}%` }}
          />
          <Droplets size={20} />
        </div>
      </div>
      <div className="water-buttons">
        <button
          disabled={busy}
          data-pending-disabled={busy || undefined}
          onClick={() =>
            mutate(apiOperations.day.update(date), { waterDelta: 250 }, "PATCH")
          }
        >
          <Plus size={14} />
          250 ml
        </button>
        <button
          disabled={busy}
          data-pending-disabled={busy || undefined}
          onClick={() =>
            mutate(apiOperations.day.update(date), { waterDelta: 500 }, "PATCH")
          }
        >
          <Plus size={14} />
          500 ml
        </button>
        <button
          className="water-undo"
          title="Retirar 250 ml"
          aria-label="Retirar 250 ml"
          disabled={busy || day.water === 0}
          data-pending-disabled={(busy && day.water > 0) || undefined}
          onClick={() =>
            mutate(apiOperations.day.update(date), { waterDelta: -250 }, "PATCH")
          }
        >
          −
        </button>
      </div>
    </section>
  );
}


import { ArrowDownRight, Plus, Target } from "lucide-react";
import type { State } from "../../types";
import { number } from "../../lib";

export function WeightWidget({
  state,
  onRegister,
}: {
  state: State;
  onRegister: () => void;
}) {
  const weights = Object.entries(state.days)
    .filter(([, d]) => d.weight !== null)
    .sort(([a], [b]) => a.localeCompare(b));
  const current = weights.at(-1)?.[1].weight ?? state.settings.initialWeight;
  const delta = current - state.settings.initialWeight;
  const goal = state.settings.goalWeight;
  const progress =
    state.settings.initialWeight === goal
      ? 100
      : Math.min(
          100,
          Math.max(
            0,
            ((state.settings.initialWeight - current) /
              (state.settings.initialWeight - goal)) *
              100,
          ),
        );
  return (
    <section className="panel weight-widget">
      <div className="section-heading small">
        <h3>Sua primeira conquista</h3>
        <Target size={17} />
      </div>
      <div className="weight-values">
        <div>
          <strong>
            {number(current, 1)}
            <small>kg</small>
          </strong>
          <span>{weights.length ? "Último registro" : "Ponto de partida"}</span>
        </div>
        <ArrowDownRight size={21} className="weight-arrow" />
        <div className="weight-target">
          <strong>
            {number(goal, 1)}
            <small>kg</small>
          </strong>
          <span>Primeira meta</span>
        </div>
      </div>
      <div className="goal-track">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="weight-bottom">
        <span>
          {delta < 0
            ? `${number(-delta, 1)} kg a menos`
            : delta > 0
              ? `${number(delta, 1)} kg acima do início`
              : "Cada passo aproxima você."}
        </span>
        <button className="text-button" onClick={onRegister}>
          Registrar
          <Plus size={13} />
        </button>
      </div>
    </section>
  );
}


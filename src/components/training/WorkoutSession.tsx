import { useState } from "react";
import { Check, Dumbbell } from "lucide-react";
import type { Mutation, Workout, WorkoutRecord } from "../../types";
import { dateLabel } from "../../lib";
import { apiOperations } from "../../api-operations";

export function WorkoutSession({
  workout,
  previous,
  mutate,
  date,
  onClose,
}: {
  workout: Workout;
  previous: WorkoutRecord | null;
  mutate: Mutation;
  date: string;
  onClose: () => void;
}) {
  const [record, setRecord] = useState<WorkoutRecord>(
    previous?.templateId === workout.id
      ? previous
      : {
          templateId: workout.id,
          name: workout.name,
          completed: false,
          exercises: workout.exercises.map((e) => ({
            id: e.id,
            name: e.name,
            sets: Array.from({ length: e.sets }, () => ({
              weight: 0,
              reps: "",
              done: false,
            })),
          })),
        },
  );
  const [busy, setBusy] = useState(false);
  const allSets = record.exercises.flatMap((e) => e.sets);
  const [reopen, setReopen] = useState(false);
  const setCount = allSets.filter((s) => s.done).length;
  const update = (
    id: string,
    index: number,
    patch: Partial<WorkoutRecord["exercises"][0]["sets"][0]>,
  ) =>
    setRecord((r) => ({
      ...r,
      exercises: r.exercises.map((e) =>
        e.id === id
          ? {
              ...e,
              sets: e.sets.map((s, i) =>
                i === index ? { ...s, ...patch } : s,
              ),
            }
          : e,
      ),
    }));
  async function save(complete: boolean, forceReopen = false) {
    setBusy(true);
    if (
      await mutate(
        apiOperations.day.update(date),
        {
          workout: {
            ...record,
            completed: !forceReopen && (complete || record.completed),
          },
        },
        "PATCH",
      )
    )
      onClose();
    setBusy(false);
  }
  return (
    <div className="session">
      <div className="session-status">
        <Dumbbell size={19} />
        <strong>
          {setCount} de {allSets.length} séries registradas
        </strong>
        <span>{dateLabel(date)}</span>
      </div>
      <p className="field-help">{workout.notes}</p>
      {record.exercises.map((e, i) => (
        <section className="session-exercise" key={e.id}>
          <h3>
            <span>{String(i + 1).padStart(2, "0")}</span>
            {e.name}
          </h3>
          <div className="set-table">
            <div className="set-table-head">
              <span>Série</span>
              <span>Carga (kg)</span>
              <span>Reps / tempo</span>
              <span>Feito</span>
            </div>
            {e.sets.map((set, j) => (
              <div className={`set-row ${set.done ? "done" : ""}`} key={j}>
                <span>{j + 1}</span>
                <input
                  aria-label={`Carga ${e.name} série ${j + 1}`}
                  type="number"
                  min="0"
                  max="1000"
                  step="0.5"
                  value={set.weight}
                  onChange={(ev) =>
                    update(e.id, j, {
                      weight: Math.min(
                        1000,
                        Math.max(0, Number(ev.target.value)),
                      ),
                    })
                  }
                />
                <input
                  aria-label={`Repetições ${e.name} série ${j + 1}`}
                  placeholder={
                    workout.exercises.find((v) => v.id === e.id)?.reps ?? "Reps"
                  }
                  maxLength={50}
                  value={set.reps}
                  onChange={(ev) => update(e.id, j, { reps: ev.target.value })}
                />
                <button
                  className={`set-check ${set.done ? "checked" : ""}`}
                  aria-label={`${set.done ? "Desmarcar" : "Concluir"} série ${j + 1} de ${e.name}`}
                  aria-pressed={set.done}
                  onClick={() => update(e.id, j, { done: !set.done })}
                >
                  <Check size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}
      <div className="modal-actions sticky-actions">
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => (record.completed ? setReopen(true) : save(false))}
        >
          {record.completed ? "Reabrir treino" : "Salvar progresso"}
        </button>
        <button
          className="button primary"
          disabled={busy || setCount === 0}
          onClick={() => save(true)}
        >
          <Check size={16} />
          {busy
            ? "Salvando…"
            : record.completed
              ? "Salvar alterações"
              : "Concluir treino"}
        </button>
      </div>
      {reopen && (
        <div
          className="workout-reopen"
          role="region"
          aria-label="Confirmar reabertura"
        >
          <strong>Reabrir este treino?</strong>
          <p>
            Ao salvar como em andamento, o hábito de treino deste dia será
            desmarcado e seus pontos de conclusão serão retirados. Cargas e
            séries serão preservadas.
          </p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setReopen(false)}
            >
              Manter concluído
            </button>
            <button
              className="button primary"
              disabled={busy}
              onClick={() => save(false, true)}
            >
              Reabrir e salvar
            </button>
          </div>
        </div>
      )}
      <p className="field-help">
        Você pode concluir com menos séries: respeite sua recuperação. Concluir
        também marca o hábito de treino, quando agendado.
      </p>
    </div>
  );
}


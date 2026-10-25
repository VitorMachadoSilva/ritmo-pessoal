import { useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import type { Mutation, Workout } from "../../types";
import { FormActions } from "./FormActions";
import { apiOperations } from "../../api-operations";

export function WorkoutForm({
  workout,
  mutate,
  onClose,
}: {
  workout?: Workout;
  mutate: Mutation;
  onClose: () => void;
}) {
  const [exercises, setExercises] = useState(
    workout?.exercises ?? [
      { id: crypto.randomUUID(), name: "", sets: 3, reps: "8–12" },
    ],
  );
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    const ok = await mutate(
      workout ? apiOperations.workout.update(workout.id) : apiOperations.workout.create,
      {
        name: data.get("name"),
        focus: data.get("focus"),
        notes: data.get("notes"),
        exercises,
      },
      workout ? "PUT" : "POST",
    );
    setBusy(false);
    if (ok) onClose();
  }
  return (
    <form className="stack-form" onSubmit={submit}>
      <div className="form-grid">
        <label>
          Nome do treino
          <input
            name="name"
            defaultValue={workout?.name}
            required
            maxLength={120}
          />
        </label>
        <label>
          Objetivo
          <input
            name="focus"
            defaultValue={workout?.focus ?? "Força e movimento"}
            maxLength={200}
          />
        </label>
      </div>
      <div className="exercise-editor">
        <div className="section-heading small">
          <h3>Exercícios</h3>
          <button
            className="text-button"
            type="button"
            disabled={exercises.length >= 20}
            data-draft-change
            onClick={() =>
              setExercises([
                ...exercises,
                { id: crypto.randomUUID(), name: "", sets: 3, reps: "8–12" },
              ])
            }
          >
            <Plus size={15} />
            Adicionar
          </button>
        </div>
        {exercises.map((ex, i) => (
          <div key={ex.id} className="exercise-edit-row">
            <label>
              Exercício {i + 1}
              <input
                value={ex.name}
                maxLength={120}
                required
                placeholder="Nome do exercício"
                onChange={(e) =>
                  setExercises(
                    exercises.map((v) =>
                      v.id === ex.id ? { ...v, name: e.target.value } : v,
                    ),
                  )
                }
              />
            </label>
            <label>
              Séries
              <input
                type="number"
                min="1"
                max="10"
                required
                value={ex.sets}
                onChange={(e) =>
                  setExercises(
                    exercises.map((v) =>
                      v.id === ex.id
                        ? { ...v, sets: Number(e.target.value) }
                        : v,
                    ),
                  )
                }
              />
            </label>
            <label>
              Repetições
              <input
                value={ex.reps}
                maxLength={50}
                required
                onChange={(e) =>
                  setExercises(
                    exercises.map((v) =>
                      v.id === ex.id ? { ...v, reps: e.target.value } : v,
                    ),
                  )
                }
              />
            </label>
            <button
              className="icon-button danger-text"
              type="button"
              aria-label={`Remover exercício ${i + 1}`}
              data-draft-change
              disabled={exercises.length === 1}
              onClick={() =>
                setExercises(exercises.filter((v) => v.id !== ex.id))
              }
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <label>
        Orientações
        <textarea
          name="notes"
          rows={3}
          defaultValue={workout?.notes}
          maxLength={5000}
        />
      </label>
      <FormActions busy={busy} onCancel={onClose} submitLabel="Salvar treino" icon={<Save size={16} />} />
    </form>
  );
}


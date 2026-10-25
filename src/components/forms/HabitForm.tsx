import { useState } from "react";
import { Save } from "lucide-react";
import { categories, weekdays, habitDifficulty, isEssential } from "../../lib";
import type { Habit, Mutation } from "../../types";
import { FormActions } from "./FormActions";
import { apiOperations } from "../../api-operations";

export function HabitForm({
  habit,
  mutate,
  onClose,
}: {
  habit?: Habit;
  mutate: Mutation;
  onClose: () => void;
}) {
  const [days, setDays] = useState(habit?.days ?? [0, 1, 2, 3, 4, 5, 6]);
  const [kind, setKind] = useState(habit?.kind ?? "check");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!days.length) {
      setError("Escolha pelo menos um dia da semana.");
      return;
    }
    const data = new FormData(e.currentTarget);
    setBusy(true);
    const ok = await mutate(
      habit ? apiOperations.habit.update(habit.id) : apiOperations.habit.create,
      {
        ...habit,
        title: data.get("title"),
        time: data.get("time"),
        category: data.get("category"),
        description: data.get("description"),
        days,
        kind,
        target:
          kind === "check"
            ? 1
            : Number(data.get("target") || habit?.target || 1),
        unit: kind === "check" ? "" : data.get("unit") || habit?.unit || "",
        archived: habit?.archived ?? false,
        essential: data.get("essential") === "on",
        difficulty: data.get("difficulty"),
      },
      habit ? "PUT" : "POST",
    );
    setBusy(false);
    if (ok) onClose();
  }
  return (
    <form className="stack-form" onSubmit={submit}>
      <label>
        Nome do hábito
        <input
          name="title"
          defaultValue={habit?.title}
          placeholder="O que você quer cultivar?"
          maxLength={120}
          required
        />
      </label>
      <div className="form-grid">
        <label>
          Horário
          <input
            name="time"
            type="time"
            defaultValue={habit?.time ?? "08:00"}
            required
          />
        </label>
        <label>
          Área da vida
          <select name="category" defaultValue={habit?.category ?? "corpo"}>
            {Object.entries(categories).map(([id, c]) => (
              <option key={id} value={id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <fieldset>
        <legend>Repetir nos dias</legend>
        <div className="weekday-picker">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <button
              type="button"
              className={days.includes(d) ? "selected" : ""}
              key={d}
              aria-pressed={days.includes(d)}
              onClick={() =>
                setDays(
                  days.includes(d) ? days.filter((v) => v !== d) : [...days, d],
                )
              }
            >
              {weekdays[d]}
            </button>
          ))}
        </div>
      </fieldset>
      {!habit && (
        <label>
          Como acompanhar
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as Habit["kind"])}
          >
            <option value="check">Marcar como concluído</option>
            <option value="counter">Contar uma quantidade</option>
          </select>
        </label>
      )}
      {kind === "counter" && (
        <div className="form-grid">
          <label>
            Meta
            <input
              name="target"
              type="number"
              min="1"
              max="20000"
              defaultValue={habit?.target ?? 8000}
              required
            />
          </label>
          <label>
            Unidade
            <input
              name="unit"
              placeholder="passos, páginas, minutos..."
              defaultValue={habit?.unit ?? "passos"}
              maxLength={20}
            />
          </label>
        </div>
      )}
      {(kind === "water" || kind === "sleep") && (
        <p className="field-help">
          A meta de {kind === "water" ? "água" : "sono"} é ajustada em Ajustes,
          junto às suas outras metas.
        </p>
      )}
      <label>
        Esforço deste hábito
        <select name="difficulty" defaultValue={habit ? habitDifficulty(habit) : "moderate"}>
          <option value="light">Leve · 10 XP</option>
          <option value="moderate">Moderado · 20 XP</option>
          <option value="challenging">Desafiador · 30 XP</option>
        </select>
        <small className="field-help">Escolha pelo esforço que exige de você. Vale ao atingir a meta; registros parciais ficam sem XP.</small>
      </label>
      <label>
        Detalhes e lembretes
        <textarea
          name="description"
          rows={3}
          maxLength={5000}
          defaultValue={habit?.description}
          placeholder="Deixe uma dica para facilitar seu próximo passo."
        />
      </label>
      <label className="essential-check">
        <input
          type="checkbox"
          name="essential"
          defaultChecked={habit ? isEssential(habit) : false}
        />
        <span>
          Incluir no dia essencial
          <small>
            Uma lista menor para dias corridos. A meta deste hábito não muda.
          </small>
        </span>
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <FormActions busy={busy} onCancel={onClose} submitLabel="Salvar hábito" icon={<Save size={16} />} />
    </form>
  );
}


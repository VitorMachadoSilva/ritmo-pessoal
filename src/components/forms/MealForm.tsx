import { useState } from "react";
import { Save } from "lucide-react";
import type { Meal, Mutation } from "../../types";
import { FormActions } from "./FormActions";
import { apiOperations } from "../../api-operations";

export function MealForm({
  meal,
  mutate,
  onClose,
}: {
  meal?: Meal;
  mutate: Mutation;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    const ok = await mutate(
      meal ? apiOperations.meal.update(meal.id) : apiOperations.meal.create,
      {
        name: data.get("name"),
        time: data.get("time"),
        description: data.get("description"),
        calories: Number(data.get("calories")),
        protein: Number(data.get("protein")),
      },
      meal ? "PUT" : "POST",
    );
    setBusy(false);
    if (ok) onClose();
  }
  return (
    <form className="stack-form" onSubmit={submit}>
      <div className="form-grid">
        <label>
          Refeição
          <input
            name="name"
            defaultValue={meal?.name}
            required
            maxLength={120}
            placeholder="Almoço"
          />
        </label>
        <label>
          Horário
          <input
            name="time"
            type="time"
            defaultValue={meal?.time ?? "12:00"}
            required
          />
        </label>
      </div>
      <label>
        Alimentos e porções
        <textarea
          name="description"
          rows={4}
          defaultValue={meal?.description}
          required
          maxLength={5000}
        />
      </label>
      <div className="form-grid">
        <label>
          Calorias estimadas (kcal)
          <input
            type="number"
            name="calories"
            defaultValue={meal?.calories ?? 0}
            min="0"
            max="5000"
            required
          />
        </label>
        <label>
          Proteína estimada (g)
          <input
            type="number"
            name="protein"
            defaultValue={meal?.protein ?? 0}
            min="0"
            max="300"
            required
          />
        </label>
      </div>
      <p className="field-help">
        Valores do planejamento. Registrar a refeição na rotina não mede a
        ingestão real.
      </p>
      <FormActions busy={busy} onCancel={onClose} submitLabel="Salvar refeição" icon={<Save size={16} />} />
    </form>
  );
}


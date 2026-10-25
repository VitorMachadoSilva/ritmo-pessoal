import { useState } from "react";
import { usePageDraft } from "../../drafts";
import { Save } from "lucide-react";
import type { Mutation, Settings } from "../../types";
import { apiOperations } from "../../api-operations";

export function SettingsForm({
  settings,
  mutate,
}: {
  settings: Settings;
  mutate: Mutation;
}) {
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  usePageDraft(dirty);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const input: Record<string, unknown> = { ...settings };
    for (const [k, v] of data)
      input[k] = ["name", "timezone"].includes(k) ? v : Number(v);
    setBusy(true);
    if (await mutate(apiOperations.settings.update, input, "PUT")) setDirty(false);
    setBusy(false);
  }
  return (
    <form
      onSubmit={submit}
      onChange={() => setDirty(true)}
      className="stack-form"
    >
      <div className="form-grid">
        <label>
          Seu nome
          <input
            name="name"
            defaultValue={settings.name}
            required
            maxLength={100}
          />
        </label>
        <label>
          Fuso horário
          <select name="timezone" defaultValue={settings.timezone}>
            <option value="America/Sao_Paulo">Brasília (São Paulo)</option>
            <option value="America/Manaus">Manaus</option>
            <option value="America/Rio_Branco">Rio Branco</option>
            <option value="America/Noronha">Fernando de Noronha</option>
            <option value="Europe/Lisbon">Lisboa</option>
            <option value="UTC">UTC</option>
          </select>
        </label>
      </div>
      <div className="form-divider" />
      <h3>Suas metas, do seu jeito</h3>
      <div className="form-grid">
        <label>
          Peso inicial (kg)
          <input
            type="number"
            name="initialWeight"
            min="30"
            max="350"
            step="0.1"
            defaultValue={settings.initialWeight}
            required
          />
        </label>
        <label>
          Primeira meta de peso (kg)
          <input
            type="number"
            name="goalWeight"
            min="30"
            max="350"
            step="0.1"
            defaultValue={settings.goalWeight}
            required
          />
        </label>
        <label>
          Altura (cm)
          <input
            type="number"
            name="height"
            min="100"
            max="250"
            defaultValue={settings.height}
            required
          />
        </label>
        <label>
          Água (ml/dia)
          <input
            type="number"
            name="waterGoal"
            min="500"
            max="6000"
            step="50"
            defaultValue={settings.waterGoal}
            required
          />
        </label>
        <label>
          Sono (horas/noite)
          <input
            type="number"
            name="sleepGoal"
            min="4"
            max="12"
            step="0.5"
            defaultValue={settings.sleepGoal}
            required
          />
        </label>
        <label>
          Dia consistente a partir de (%)
          <input
            type="number"
            name="dailyThreshold"
            min="1"
            max="100"
            defaultValue={settings.dailyThreshold}
            required
          />
        </label>
        <label>
          Calorias planejadas (kcal/dia)
          <input
            type="number"
            name="calorieGoal"
            min="1200"
            max="6000"
            step="50"
            defaultValue={settings.calorieGoal}
            required
          />
        </label>
        <label>
          Proteína planejada (g/dia)
          <input
            type="number"
            name="proteinGoal"
            min="30"
            max="300"
            step="5"
            defaultValue={settings.proteinGoal}
            required
          />
        </label>
      </div>
      <p className="field-help">
        Metas iniciais editáveis, baseadas na conversa. Ajuste alimentação,
        hidratação e treino com profissionais que conheçam seu histórico.
      </p>
      <div className="form-end">
        {dirty && (
          <span className="field-help" role="status">
            Alterações não salvas
          </span>
        )}
        <button className="button primary" disabled={busy}>
          <Save size={16} />
          {busy ? "Salvando…" : "Salvar minhas metas"}
        </button>
      </div>
    </form>
  );
}


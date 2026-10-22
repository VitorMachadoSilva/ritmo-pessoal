import { useState } from "react";
import { Plus, Trash2, Save, ArchiveRestore, Check, Minus } from "lucide-react";
import { categories, weekdays, isEssential } from "./lib";
import type {
  Category,
  Habit,
  Meal,
  Mutation,
  Settings,
  Workout,
} from "./types";
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
      habit ? `/api/habits/${habit.id}` : "/api/habits",
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
      <div className="modal-actions">
        <button type="button" className="button secondary" onClick={onClose}>
          Cancelar
        </button>
        <button className="button primary" disabled={busy}>
          <Save size={16} />
          {busy ? "Salvando…" : "Salvar hábito"}
        </button>
      </div>
    </form>
  );
}
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
      meal ? `/api/meals/${meal.id}` : "/api/meals",
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
      <div className="modal-actions">
        <button type="button" className="button secondary" onClick={onClose}>
          Cancelar
        </button>
        <button className="button primary" disabled={busy}>
          <Save size={16} />
          {busy ? "Salvando…" : "Salvar refeição"}
        </button>
      </div>
    </form>
  );
}
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
      workout ? `/api/workouts/${workout.id}` : "/api/workouts",
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
      <div className="modal-actions">
        <button type="button" className="button secondary" onClick={onClose}>
          Cancelar
        </button>
        <button className="button primary" disabled={busy}>
          <Save size={16} />
          {busy ? "Salvando…" : "Salvar treino"}
        </button>
      </div>
    </form>
  );
}
export function SettingsForm({
  settings,
  mutate,
}: {
  settings: Settings;
  mutate: Mutation;
}) {
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const input: Record<string, unknown> = { ...settings };
    for (const [k, v] of data)
      input[k] = ["name", "timezone"].includes(k) ? v : Number(v);
    setBusy(true);
    await mutate("/api/settings", input, "PUT");
    setBusy(false);
  }
  return (
    <form onSubmit={submit} className="stack-form">
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
        <button className="button primary" disabled={busy}>
          <Save size={16} />
          {busy ? "Salvando…" : "Salvar minhas metas"}
        </button>
      </div>
    </form>
  );
}
export function PasswordForm({
  mutate,
  onClose,
}: {
  mutate: Mutation;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      className="stack-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        if (d.get("password") !== d.get("confirm")) {
          setError("As novas senhas precisam ser iguais.");
          return;
        }
        setBusy(true);
        if (
          await mutate("/api/password", {
            current: d.get("current"),
            password: d.get("password"),
          })
        )
          onClose();
        setBusy(false);
      }}
    >
      <label>
        Senha atual
        <input
          name="current"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <label>
        Nova senha
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
        />
      </label>
      <label>
        Confirmar nova senha
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
        />
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <p className="field-help">
        As outras sessões serão encerradas. Sua sessão atual continuará ativa.
      </p>
      <div className="modal-actions">
        <button type="button" className="button secondary" onClick={onClose}>
          Cancelar
        </button>
        <button className="button primary" disabled={busy}>
          Salvar nova senha
        </button>
      </div>
    </form>
  );
}
export function HabitDetail({
  habit,
  value,
  onSave,
  onEdit,
  onArchive,
  onClose,
}: {
  habit: Habit;
  value: number;
  onSave: (value: number) => Promise<boolean>;
  onEdit: () => void;
  onArchive: () => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(value),
    [busy, setBusy] = useState(false);
  const isCounter = habit.kind !== "check";
  return (
    <div className="habit-detail">
      <span className={`tag ${categories[habit.category as Category].color}`}>
        {categories[habit.category].label}
      </span>
      <p>{habit.description || "Um pequeno compromisso com o seu dia."}</p>
      <div className="detail-schedule">
        <span>{habit.time}</span>
        <span>
          {habit.days.length === 7
            ? "Todos os dias"
            : habit.days.map((d) => weekdays[d]).join(", ")}
        </span>
      </div>
      {isCounter && (
        <label>
          Quantidade (
          {habit.kind === "water"
            ? "ml"
            : habit.kind === "sleep"
              ? "horas"
              : habit.unit || "unidades"}
          )
          <div className="stepper">
            <button
              className="icon-button"
              aria-label="Diminuir quantidade"
              onClick={() =>
                setAmount(
                  Math.max(
                    0,
                    amount -
                      (habit.kind === "water"
                        ? 250
                        : habit.kind === "sleep"
                          ? 0.5
                          : 1),
                  ),
                )
              }
            >
              <Minus size={18} />
            </button>
            <input
              type="number"
              min="0"
              max={
                habit.kind === "sleep"
                  ? 24
                  : habit.kind === "water"
                    ? 10000
                    : 20000
              }
              step={habit.kind === "sleep" ? "0.5" : "1"}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <button
              className="icon-button"
              aria-label="Aumentar quantidade"
              onClick={() =>
                setAmount(
                  Math.min(
                    habit.kind === "sleep"
                      ? 24
                      : habit.kind === "water"
                        ? 10000
                        : 20000,
                    amount +
                      (habit.kind === "water"
                        ? 250
                        : habit.kind === "sleep"
                          ? 0.5
                          : 1),
                  ),
                )
              }
            >
              <Plus size={18} />
            </button>
          </div>
        </label>
      )}
      <div className="detail-actions">
        <button className="text-button" onClick={onEdit}>
          Editar hábito
        </button>
        <button className="text-button danger-text" onClick={onArchive}>
          <ArchiveRestore size={15} />
          Remover da rotina
        </button>
      </div>
      <div className="modal-actions">
        <button className="button secondary" onClick={onClose}>
          Fechar
        </button>
        <button
          className="button primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            if (await onSave(isCounter ? amount : value ? 0 : 1)) onClose();
            setBusy(false);
          }}
        >
          <Check size={16} />
          {busy
            ? "Salvando…"
            : isCounter
              ? "Salvar registro"
              : value
                ? "Desmarcar hábito"
                : "Concluir hábito"}
        </button>
      </div>
    </div>
  );
}

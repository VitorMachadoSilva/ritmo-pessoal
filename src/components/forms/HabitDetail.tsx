import { useState } from "react";
import { Plus, ArchiveRestore, Check, Minus, ChevronLeft, ChevronRight } from "lucide-react";
import { categories, weekdays, habitXp } from "../../lib";
import type { Category, Habit } from "../../types";

export function HabitDetail({
  habit,
  value,
  index,
  total,
  onPrevious,
  onNext,
  onSave,
  onEdit,
  onArchive,
  onClose,
}: {
  habit: Habit;
  value: number;
  index: number;
  total: number;
  onPrevious?: () => void;
  onNext?: () => void;
  onSave: (value: number) => Promise<boolean>;
  onEdit: () => void;
  onArchive: () => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(String(value));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const amountId = `habit-amount-${habit.id}`;
  const isCounter = habit.kind !== "check";
  const limit = habit.kind === "sleep" ? 24 : habit.kind === "water" ? 10000 : 20000;
  const step = habit.kind === "water" ? 250 : habit.kind === "sleep" ? 0.5 : 1;
  const parsed = Number(amount.replace(",", "."));
  const validFormat = habit.kind === "sleep"
    ? /^\d+(?:[.,]\d{1,2})?$/.test(amount)
    : /^\d+$/.test(amount);
  const valid = validFormat && Number.isFinite(parsed) && parsed <= limit;
  const dirty = isCounter && amount !== String(value);
  const move = (action?: () => void) => {
    if (!action || busy) return;
    if (dirty) setPendingAction(() => action);
    else action();
  };
  const adjust = (direction: -1 | 1) => {
    const base = valid ? parsed : value;
    setAmount(String(Math.max(0, Math.min(limit, Math.round((base + direction * step) * 100) / 100))));
    setError("");
  };
  async function saveAmount() {
    if (busy) return;
    if (isCounter && !valid) {
      setError(`Informe um valor de 0 a ${limit}${habit.kind === "sleep" ? " (até duas casas decimais)" : " (inteiro)"}.`);
      return;
    }
    setBusy(true);
    try { await onSave(isCounter ? parsed : value ? 0 : 1); }
    finally { setBusy(false); }
  }
  return (
    <div className="habit-detail">
      <div className="habit-journey" aria-label="Navegação pelos hábitos do dia">
        <span>Hábito {index + 1} de {total}</span>
        <div>
          <button type="button" className="icon-button" aria-label="Hábito anterior" disabled={!onPrevious || busy} onClick={() => move(onPrevious)}><ChevronLeft size={18} /></button>
          <button type="button" className="icon-button" aria-label="Próximo hábito" disabled={!onNext || busy} onClick={() => move(onNext)}><ChevronRight size={18} /></button>
        </div>
      </div>
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
        <div className="habit-amount-field">
          <label htmlFor={amountId}>
          Quantidade (
          {habit.kind === "water"
            ? "ml"
            : habit.kind === "sleep"
              ? "horas"
              : habit.unit || "unidades"}
          )
          </label>
          <div className="stepper">
            <button
              className="icon-button"
              aria-label="Diminuir quantidade"
              type="button"
              onClick={() => adjust(-1)}
            >
              <Minus size={18} />
            </button>
            <input
              id={amountId}
              type="text"
              inputMode={habit.kind === "sleep" ? "decimal" : "numeric"}
              autoComplete="off"
              aria-label="Quantidade registrada"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "habit-value-error" : "habit-value-status"}
              value={amount}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => { setAmount(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); void saveAmount(); } }}
            />
            <button
              className="icon-button"
              aria-label="Aumentar quantidade"
              type="button"
              onClick={() => adjust(1)}
            >
              <Plus size={18} />
            </button>
          </div>
          {error ? <span id="habit-value-error" className="habit-value-error" role="alert">{error}</span> : (
            <span id="habit-value-status" className={`habit-value-status ${valid && parsed > 0 && parsed < habit.target ? "below-goal" : ""}`}>
              {!valid ? "Digite um valor válido para salvar." : parsed === 0 ? "Zero remove o registro deste hábito." : parsed < habit.target ? "Meta não atingida. O valor será salvo sem XP." : `Meta atingida. Este hábito vale ${habitXp(habit)} XP.`}
            </span>
          )}
        </div>
      )}
      <div className="detail-actions">
        <button className="text-button" onClick={() => move(onEdit)}>
          Editar hábito
        </button>
        <button className="text-button danger-text" onClick={() => move(onArchive)}>
          <ArchiveRestore size={15} />
          Remover da rotina
        </button>
      </div>
      <div className="modal-actions">
        <button
          data-close-dialog
          className="button secondary"
          onClick={onClose}
        >
          Fechar
        </button>
        <button
          className="button primary"
          disabled={busy}
          onClick={() => void saveAmount()}
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
      {pendingAction && (
        <div className="habit-discard" role="group" aria-label="Alterações não salvas">
          <p>Você alterou o valor sem salvar. Deseja descartar e navegar?</p>
          <button className="button secondary" onClick={() => setPendingAction(null)}>Continuar editando</button>
          <button className="button danger" onClick={() => { const action = pendingAction; setPendingAction(null); action(); }}>Descartar e continuar</button>
        </div>
      )}
    </div>
  );
}


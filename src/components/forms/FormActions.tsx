import type { ReactNode } from "react";

export function FormActions({ busy, onCancel, submitLabel, busyLabel = "Salvando…", icon }: {
  busy: boolean;
  onCancel: () => void;
  submitLabel: string;
  busyLabel?: string;
  icon?: ReactNode;
}) {
  return <div className="modal-actions">
    <button data-close-dialog type="button" className="button secondary" onClick={onCancel} disabled={busy}>Cancelar</button>
    <button className="button primary" disabled={busy}>{icon}{busy ? busyLabel : submitLabel}</button>
  </div>;
}

import { useRef, useState, type ReactNode } from "react";

export function ConfirmAction({ body, onConfirm, onClose, cancelLabel = "Cancelar", confirmLabel = "Confirmar", busyLabel = "Confirmando…", tone = "danger" }: {
  body: ReactNode;
  onConfirm: () => Promise<boolean>;
  onClose: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  busyLabel?: string;
  tone?: "primary" | "danger";
}) {
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  return <>{typeof body === "string" ? <p className="dialog-body">{body}</p> : body}<div className="modal-actions">
    <button className="button secondary" onClick={onClose} disabled={busy}>{cancelLabel}</button>
    <button className={`button ${tone}`} disabled={busy} onClick={async () => {
      if (pending.current) return;
      pending.current = true;
      setBusy(true);
      try { if (await onConfirm()) onClose(); } finally { pending.current = false; setBusy(false); }
    }}>{busy ? busyLabel : confirmLabel}</button>
  </div></>;
}

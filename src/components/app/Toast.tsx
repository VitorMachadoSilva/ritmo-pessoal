import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, CircleAlert, CircleHelp, Sprout, X } from "lucide-react";
import type { ToastNotice } from "../../toast-feedback";

export function Toast({ notice, onClose, inDialog = false }: { notice: ToastNotice; onClose: () => void; inDialog?: boolean }) {
  const [exiting, setExiting] = useState(false);
  const [dialogRoot, setDialogRoot] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setDialogRoot(inDialog ? document.querySelector<HTMLElement>(".modal") : null);
  }, [inDialog, notice]);

  useEffect(() => {
    setExiting(false);
    const duration = notice.durationMs ?? 2000;
    const exitTimer = window.setTimeout(() => setExiting(true), Math.max(0, duration - 400));
    const closeTimer = window.setTimeout(onClose, duration);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(closeTimer);
    };
  }, [notice, onClose]);

  const toast = <div role={notice.tone === "error" ? "alert" : "status"} className={`toast toast-${notice.tone}${exiting ? " toast-exiting" : ""}`}>
    <span>{notice.tone === "error" ? <CircleAlert size={18} /> : notice.tone === "achievement" ? <Sprout size={18} /> : notice.tone === "info" ? <CircleHelp size={18} /> : <Check size={18} />}</span>
    <div className="toast-copy"><strong>{notice.title}</strong>{notice.message && <span>{notice.message}</span>}{notice.hint && <small>{notice.hint}</small>}</div>
    <button aria-label="Fechar aviso" onClick={onClose}><X size={16} /></button>
  </div>;
  return dialogRoot ? createPortal(toast, dialogRoot) : toast;
}

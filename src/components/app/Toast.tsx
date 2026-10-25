import { useEffect, useState } from "react";
import { Check, CircleAlert, CircleHelp, Sprout, X } from "lucide-react";
import type { ToastNotice } from "../../toast-feedback";

export function Toast({ notice, onClose }: { notice: ToastNotice; onClose: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    setExiting(false);
    const exitTimer = window.setTimeout(() => setExiting(true), 1600);
    const closeTimer = window.setTimeout(onClose, 2000);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(closeTimer);
    };
  }, [notice, onClose]);

  return <div role={notice.tone === "error" ? "alert" : "status"} className={`toast toast-${notice.tone}${exiting ? " toast-exiting" : ""}`}>
    <span>{notice.tone === "error" ? <CircleAlert size={18} /> : notice.tone === "achievement" ? <Sprout size={18} /> : notice.tone === "info" ? <CircleHelp size={18} /> : <Check size={18} />}</span>
    <div className="toast-copy"><strong>{notice.title}</strong>{notice.message && <span>{notice.message}</span>}{notice.hint && <small>{notice.hint}</small>}</div>
    <button aria-label="Fechar aviso" onClick={onClose}><X size={16} /></button>
  </div>;
}

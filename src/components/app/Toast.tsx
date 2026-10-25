import { Check, CircleAlert, CircleHelp, Sprout, X } from "lucide-react";
import type { ToastNotice } from "../../toast-feedback";

export function Toast({ notice, onClose }: { notice: ToastNotice; onClose: () => void }) {
  return <div role={notice.tone === "error" ? "alert" : "status"} className={`toast toast-${notice.tone}`}>
    <span>{notice.tone === "error" ? <CircleAlert size={18} /> : notice.tone === "achievement" ? <Sprout size={18} /> : notice.tone === "info" ? <CircleHelp size={18} /> : <Check size={18} />}</span>
    <div className="toast-copy"><strong>{notice.title}</strong>{notice.message && <span>{notice.message}</span>}{notice.hint && <small>{notice.hint}</small>}</div>
    <button aria-label="Fechar aviso" onClick={onClose}><X size={16} /></button>
  </div>;
}

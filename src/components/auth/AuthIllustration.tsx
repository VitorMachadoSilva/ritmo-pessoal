import { Check } from "lucide-react";
import { GrowingPlant } from "./GrowingPlant";

export function AuthIllustration() {
  return (
    <div className="auth-art" aria-hidden="true">
      <div className="auth-orbit one" />
      <div className="auth-orbit two" />
      <div className="auth-orbit three" />
      <div className="auth-art-center"><GrowingPlant /></div>
      <div className="floating-note note-one"><span className="note-check"><Check size={14} /></span> Cuidar de mim</div>
      <div className="floating-note note-two"><span>✦</span> A constância transforma.</div>
    </div>
  );
}

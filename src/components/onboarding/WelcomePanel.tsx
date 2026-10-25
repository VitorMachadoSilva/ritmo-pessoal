import { ArrowUpRight, Check, Sprout, Trophy } from "lucide-react";
import { DropletsIcon } from "../icons/DropletsIcon";

export function WelcomePanel({ onClose }: { onClose: () => void }) {
  return <div className="welcome-content">
    <div className="welcome-mark"><Sprout size={43} strokeWidth={1.3} /></div>
    <h3>Uma pequena ação já muda o dia.</h3>
    <p>Sua rotina inicial está pronta, baseada na nossa conversa. Ajuste horários e metas para o que funciona para você.</p>
    <div className="welcome-steps">
      <div><Check size={16} /><span>Hábitos rendem 10, 20 ou 30 XP conforme o esforço.</span></div>
      <div><DropletsIcon /><span>Registre água, sono, peso e como se sente.</span></div>
      <div><Trophy size={16} /><span>Alcance sua meta diária e construa sua sequência.</span></div>
    </div>
    <p className="field-help">O calendário começa vazio porque sua história é real. Ele ganha cor a cada dia de cuidado.</p>
    <button className="button primary" onClick={onClose}>Começar meu primeiro dia<ArrowUpRight size={16} /></button>
  </div>;
}

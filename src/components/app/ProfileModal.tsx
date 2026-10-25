import { Flame } from "lucide-react";
import type { State } from "../../types";
import { Modal } from "../../ui";
import LeafBadge from "../LeafBadge";

export function ProfileModal({ state, level, totalXp, usageDays, onClose }: { state: State; level: number; totalXp: number; usageDays: number; onClose: () => void }) {
  const xpInLevel = totalXp % 500;
  const xpToNextLevel = 500 - xpInLevel;
  return <Modal className="profile-modal" title="Seu perfil" description="Seu progresso, no seu ritmo." onClose={onClose}>
    <div className="profile-level-overview"><LeafBadge level={level} size={88} /><div className="profile-identity"><strong>{state.settings.name}</strong><span>{totalXp.toLocaleString("pt-BR")} XP acumulados</span></div></div>
    <section className="profile-progress-section" aria-label="Progresso de nível">
      <div className="profile-progress-heading"><strong>Próximo nível</strong><span>{xpInLevel} / 500 XP</span></div>
      <div className="profile-xp-track" role="progressbar" aria-label="XP para o próximo nível" aria-valuemin={0} aria-valuemax={500} aria-valuenow={xpInLevel} aria-valuetext={`${xpInLevel} de 500 XP`}><span style={{ width: `${(xpInLevel / 500) * 100}%` }} /></div>
      <p>Faltam <strong>{xpToNextLevel} XP</strong> para o nível {level + 1}.</p>
    </section>
    <section className="profile-usage-streak" aria-label="Sequência de dias com atividade registrada"><span className="profile-streak-icon"><Flame size={19} /></span><div><strong>{usageDays > 0 ? `${usageDays} ${usageDays === 1 ? "dia ativo" : "dias ativos"} seguidos` : "Comece sua sequência ativa"}</strong><span>{usageDays > 0 ? "com ao menos um registro salvo por dia" : "Faça um registro hoje para iniciar."}</span></div>{usageDays > 0 && <b>{usageDays}</b>}</section>
    <p className="profile-streak-note">Cada dia conta quando há um registro salvo. O dia de hoje permanece aberto até a meia-noite.</p>
  </Modal>;
}

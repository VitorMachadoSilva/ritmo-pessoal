import type { ReactNode } from "react";
import { ArrowUpRight, CircleHelp, LogOut, Settings2, Sprout } from "lucide-react";
import type { PageId } from "../../types";
import { Logo } from "../../ui";

export function Sidebar({ links, page, name, nav, help, logout }: {
  links: ReactNode;
  page: PageId;
  name: string;
  nav: (page: PageId) => void;
  help: () => void;
  logout: () => void;
}) {
  return <aside className="sidebar">
    <div className="sidebar-brand"><Logo /><span className="personal-label">Pessoal</span></div>
    <div className="sidebar-label">Seu espaço</div>
    <nav aria-label="Navegação principal">{links}</nav>
    <div className="sidebar-bottom">
      <button className="sidebar-help" onClick={help}>
        <span className="help-sprout"><Sprout size={24} strokeWidth={1.5} /></span>
        <strong>Cultive sua melhor versão.</strong>
        <p>Um compromisso pequeno.<br />Uma mudança de verdade.</p>
        <span>Conhecer meu ritmo <ArrowUpRight size={14} /></span>
      </button>
      <button className={`nav-link ${page === "ajustes" ? "active" : ""}`} onClick={() => nav("ajustes")}>
        <Settings2 size={19} /><span>Ajustes</span>
      </button>
      <button className="nav-link" onClick={help}><CircleHelp size={19} /><span>Como funciona</span></button>
      <div className="sidebar-profile">
        <span className="avatar">{name.slice(0, 1).toUpperCase()}</span>
        <div><strong>{name}</strong><span>Seu espaço pessoal</span></div>
        <button className="icon-button" title="Sair" aria-label="Sair da conta" onClick={logout}><LogOut size={16} /></button>
      </div>
    </div>
  </aside>;
}

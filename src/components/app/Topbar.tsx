import { ChevronRight, CircleHelp } from "lucide-react";
import type { FocusSession, PageId } from "../../types";
import { ThemeToggle } from "../../Theme";
import { FocusIndicator } from "../../Focus";
import { pageNames } from "../../navigation";

export function Topbar({ page, busy, focus, name, level, profileOpen, nav, help, openProfile }: {
  page: PageId;
  busy: boolean;
  focus: FocusSession | null;
  name: string;
  level: number;
  profileOpen: boolean;
  nav: (page: PageId) => void;
  help: () => void;
  openProfile: () => void;
}) {
  return <header className="topbar">
    <div className="breadcrumb"><span>Meu espaço</span><ChevronRight size={13} /><strong>{pageNames[page]}</strong></div>
    <div className="topbar-right">
      <ThemeToggle />
      <FocusIndicator session={focus} onOpen={() => nav("foco")} />
      <span className="local-status"><span className="live-dot" />{busy ? "Salvando…" : "Tudo no seu ritmo"}</span>
      <button className="icon-button help-button" aria-label="Como o Ritmo funciona" onClick={help}><CircleHelp size={18} /></button>
      <span className="profile-avatar-control">
        <button type="button" className="avatar small-avatar profile-avatar-button" aria-label={`Abrir perfil de ${name}, nível ${level}`} aria-haspopup="dialog" aria-expanded={profileOpen} onClick={openProfile}>
          {name.slice(0, 1).toUpperCase()}
        </button>
        <span className="profile-avatar-level" aria-hidden="true">{level}</span>
      </span>
    </div>
  </header>;
}

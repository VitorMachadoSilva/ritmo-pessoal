import { useSyncExternalStore } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";

type Appearance = "light" | "dark" | "system";
declare global {
  interface Window {
    RitmoTheme: { get: () => Appearance; resolved: () => "light" | "dark"; set: (value: Appearance) => void };
  }
}
const subscribe = (callback: () => void) => {
  window.addEventListener("ritmo-theme-change", callback);
  return () => window.removeEventListener("ritmo-theme-change", callback);
};
const snapshot = () => `${window.RitmoTheme.get()}:${window.RitmoTheme.resolved()}`;
function useAppearance() {
  useSyncExternalStore(subscribe, snapshot);
  return window.RitmoTheme;
}

export function ThemeToggle() {
  const theme = useAppearance();
  const dark = theme.resolved() === "dark";
  const label = dark ? "Ativar modo claro" : "Ativar modo escuro";
  return (
    <button className="icon-button theme-toggle" aria-label={label} title={label}
      onClick={() => theme.set(dark ? "light" : "dark")}>
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export function AppearanceSettings() {
  const theme = useAppearance();
  return (
    <section className="panel appearance-panel" aria-labelledby="appearance-title">
      <div className="section-heading">
        <div><h3 id="appearance-title">Aparência</h3><p>Um espaço confortável em qualquer hora do dia.</p></div>
        <Moon size={20} aria-hidden="true" />
      </div>
      <div className="appearance-options" role="group" aria-label="Tema do aplicativo">
        {([
          ["light", "Claro", Sun], ["dark", "Escuro", Moon], ["system", "Sistema", Monitor],
        ] as const).map(([value, title, Icon]) => (
          <button key={value} type="button" aria-pressed={theme.get() === value} onClick={() => theme.set(value)}>
            <span className={`theme-preview preview-${value}`} aria-hidden="true"><i /><b /><b /><b /></span>
            <span><Icon size={15} />{title}{theme.get() === value && <Check size={14} />}</span>
          </button>
        ))}
      </div>
      <p className="appearance-note">A escolha vale neste navegador. Sistema acompanha o tema do seu dispositivo.</p>
    </section>
  );
}

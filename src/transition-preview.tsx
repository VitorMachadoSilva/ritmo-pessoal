import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, Check, Droplets, Leaf, RotateCcw } from "lucide-react";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import Auth from "./Auth";
import { ThemeToggle } from "./Theme";
import { EntrySurface, ENTRY_TIMING } from "./EntryTransition";
import "./styles.css";
import "./next.css";
import "./theme.css";
import "./auth.css";
import "./entry-transition.css";
import "./transition-preview.css";
import "./controls.css";

const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
function Preview() {
  const [scenario, setScenario] = useState("fast");
  const [hour, setHour] = useState(9);
  const [run, setRun] = useState(0);
  const [running, setRunning] = useState(false);
  const [dashboard, setDashboard] = useState(false);
  const [cover, setCover] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [result, setResult] = useState("Demonstração isolada · nenhum dado real é enviado.");
  const started = useRef(0);

  useEffect(() => {
    if (!run) return;
    const timer = window.setTimeout(() => {
      // Fictional credentials; the preview never calls authentication or state APIs.
      const form = document.querySelector<HTMLFormElement>(".auth-form-wrap form");
      for (const [name, value] of [["username", "preview"], ["password", "ritmo-preview-2026"]]) {
        const input = form?.elements.namedItem(name) as HTMLInputElement | null;
        if (input) { input.value = value; input.dispatchEvent(new Event("input", { bubbles: true })); }
      }
      form?.requestSubmit();
    }, 100);
    return () => clearTimeout(timer);
  }, [run]);

  useEffect(() => {
    if (!dashboard) return;
    const duration = matchMedia("(prefers-reduced-motion: reduce)").matches ? ENTRY_TIMING.reduced : ENTRY_TIMING.dissolve;
    const timer = window.setTimeout(() => {
      setCover(false);
      setRunning(false);
      setResult(`Entrada concluída em ${((performance.now() - started.current) / 1000).toFixed(1)}s · dados fictícios.`);
    }, duration);
    const stagger = window.setTimeout(() => setReveal(false), duration + 500);
    return () => { clearTimeout(timer); clearTimeout(stagger); };
  }, [dashboard]);
  useEffect(() => {
    if (dashboard && !cover) document.getElementById("main-content")?.focus({ preventScroll: true });
  }, [dashboard, cover]);

  function replay() {
    setDashboard(false); setCover(false); setReveal(false); setRunning(true);
    setResult("Preparando sua entrada…"); setRun((value) => value + 1);
  }
  return <div className="preview-root">
    {!dashboard ? <Auth key={run} configured greetingHour={hour}
      authenticate={async () => {
        started.current = performance.now(); setRunning(true);
        await pause(200);
        if (scenario === "error") {
          setRunning(false); setResult("Login recusado: formulário preservado, sem transição.");
          throw new Error("Login ou senha incorretos.");
        }
      }}
      prepare={async () => {
        // Simulated data latency. Adjust these values to exercise the waiting loop.
        await pause(scenario === "slow" ? 3800 : scenario === "normal" ? 950 : 120);
        if (scenario === "state-error") {
          setRunning(false); setResult("Falha ao abrir: o formulário volta a aceitar uma tentativa.");
          throw new Error("Não foi possível abrir seu espaço. Tente novamente.");
        }
        return true;
      }}
      onSuccess={() => { setDashboard(true); setCover(true); setReveal(true); }}
    /> : <div className={`preview-dashboard${reveal ? " entry-reveal" : ""}`} inert={cover} aria-hidden={cover || undefined}>
      <aside className="sidebar preview-sidebar"><strong>ritmo.</strong><span>Pessoal</span><nav aria-label="Menu da demonstração"><b>Meu dia</b><span>Minha rotina</span><span>Minha evolução</span></nav><Leaf size={28}/><small>No seu tempo.</small></aside>
      <main id="main-content" tabIndex={-1} className="preview-main">
        <div className="topbar"><span>SEU ESPAÇO PESSOAL</span><span>Uma demonstração, sem cobranças.</span></div>
        <header className="page-heading"><h1>Seu dia, no seu ritmo.</h1><p>Pequenos cuidados. Um caminho que é seu.</p></header>
        <div className="overview-top"><section className="preview-hero"><span>UM PASSO DE CADA VEZ</span><h2>Você já começou.<br/>Isso importa.</h2><p>Reserve um pouco de espaço para cuidar de você.</p><span className="preview-next">Seu próximo cuidado <ArrowRight size={18}/></span></section><section className="preview-progress"><div>25<small>%</small></div><span>do seu dia</span><p>1 de 4 cuidados</p></section></div>
        <div className="metrics-strip"><span>1 pequena vitória</span><span>Seu ritmo é pessoal</span><span>Sem pressa para chegar</span></div>
        <section className="dashboard-columns preview-habits"><h2>Hábitos do dia</h2>{["Beber um copo de água", "Caminhar por 10 minutos", "Fazer uma pausa", "Preparar o descanso"].map((habit, i) => <div key={habit}><span className={i === 0 ? "preview-check" : ""}>{i === 0 ? <Check size={18}/> : <Droplets size={18}/>}</span><strong>{habit}</strong><small>{i === 0 ? "Registrado" : "No seu tempo"}</small></div>)}</section>
      </main>
    </div>}
    {cover && <EntrySurface phase="reveal" hour={hour}/>}
    <aside className="preview-controls" aria-label="Controles do preview">
      <div><label>Cenário<select value={scenario} disabled={running} onChange={(e) => setScenario(e.target.value)}><option value="fast">Painel rápido</option><option value="normal">Painel normal</option><option value="slow">Painel lento (3,8s reais)</option><option value="error">Erro de login</option><option value="state-error">Erro ao abrir painel</option></select></label><label>Horário<select value={hour} disabled={running} onChange={(e) => setHour(Number(e.target.value))}><option value={9}>Manhã</option><option value={15}>Tarde</option><option value={21}>Noite</option></select></label><button className="button" onClick={replay} disabled={running}><RotateCcw size={16}/>Repetir animação</button></div>
      <footer><p role="status">{result}</p><ThemeToggle/></footer>
    </aside>
  </div>;
}
createRoot(document.getElementById("root")!).render(<StrictMode><Preview/></StrictMode>);

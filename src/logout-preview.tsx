import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Leaf, LogOut, RotateCcw } from "lucide-react";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import Auth from "./Auth";
import { Modal } from "./ui";
import { ThemeToggle } from "./Theme";
import { ExitSurface, useExitSequence } from "./ExitTransition";
import "./styles.css";
import "./next.css";
import "./theme.css";
import "./auth.css";
import "./entry-transition.css";
import "./exit-transition.css";
import "./transition-preview.css";
import "./controls.css";

function Preview() {
  const [scenario, setScenario] = useState("normal");
  const [loggedIn, setLoggedIn] = useState(true);
  const [draft, setDraft] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState("Demonstração fictícia. Nenhuma sessão real é encerrada.");
  const started = useRef(0);
  const attempt = useRef(0);
  const exit = useExitSequence(async () => {
    // Preview-only latency and error. Never calls real logout or personal-data APIs.
    await new Promise((resolve) => setTimeout(resolve, scenario === "slow" ? 2200 : 120));
    if (scenario === "error" && attempt.current++ === 0) throw new Error("Não foi possível confirmar sua saída. Tente novamente.");
    setLoggedIn(false); setDraft("");
    setResult(`Sessão fictícia encerrada após ${((performance.now() - started.current) / 1000).toFixed(1)}s. Nenhum dado real alterado.`);
  });
  const previous = useRef(exit.phase);
  useEffect(() => {
    if (previous.current === "returning" && exit.phase === "idle") {
      setResult("Você voltou. O rascunho e a sessão fictícia continuam intactos.");
      document.getElementById("preview-exit")?.focus();
    }
    previous.current = exit.phase;
  }, [exit.phase]);
  function begin() {
    setConfirm(false); started.current = performance.now(); attempt.current = 0;
    setResult("Você pode voltar durante os primeiros 3 segundos."); exit.start();
  }
  function replay() {
    setLoggedIn(true);
    if (draft.trim()) setConfirm(true); else begin();
  }
  return <div className="preview-root">
    {loggedIn ? <div className={`preview-dashboard${exit.phase === "returning" ? " exit-restoring" : exit.phase !== "idle" ? " exit-departure" : ""}`} inert={exit.phase !== "idle"} aria-hidden={exit.phase !== "idle" || undefined}>
      <aside className="sidebar preview-sidebar"><strong>ritmo.</strong><span>Pessoal</span><nav aria-label="Menu da demonstração"><b>Meu dia</b><span>Meu diário</span></nav><Leaf size={28}/><small>No seu tempo.</small></aside>
      <main id="main-content" className="preview-main" tabIndex={-1}>
        <div className="topbar"><span>Seu espaço pessoal</span><button id="preview-exit" className="button secondary" onClick={replay}><LogOut size={16}/>Sair da conta</button></div>
        <header className="page-heading"><h1>Por hoje, está tudo bem.</h1><p>O cuidado também está na hora de descansar.</p></header>
        <section className="overview-top"><div className="preview-hero"><h2>Cada pequeno cuidado<br/>tem seu lugar.</h2><p>Amanhã é outro dia. Seu espaço continua aqui.</p></div><div className="preview-progress"><Leaf size={60}/><p>No seu tempo.</p></div></section>
        <section className="dashboard-columns preview-habits" style={{marginTop:24}}><h2>Uma nota antes de ir</h2><label htmlFor="preview-draft">Rascunho de demonstração</label><textarea id="preview-draft" rows={3} value={draft} placeholder="Digite algo para testar a confirmação de saída…" onChange={(event)=>setDraft(event.target.value)} style={{width:"100%",marginTop:12}}/><p>Este campo é fictício e não é salvo. Voltar durante a despedida preserva o texto.</p></section>
      </main>
    </div> : <div className={exit.phase === "reveal" ? "logout-login" : undefined}>
      <Auth configured blocked={exit.phase !== "idle"} authenticate={async()=>{}} prepare={async()=>true} onSuccess={()=>{setLoggedIn(true);setResult("Entrada fictícia concluída.");}}/>
    </div>}
    {exit.phase !== "idle" && <ExitSurface phase={exit.phase} error={exit.error} onCancel={()=>exit.cancel()} onRetry={()=>void exit.retry()}/>}
    {confirm && <Modal title="Sair do seu espaço?" description="Você tem alterações não salvas. Sair mesmo assim?" onClose={()=>setConfirm(false)}><div className="modal-actions"><button autoFocus className="button secondary" onClick={()=>setConfirm(false)}>Continuar editando</button><button className="button primary" onClick={begin}>Sair mesmo assim</button></div></Modal>}
    <aside className="preview-controls" aria-label="Controles do preview" inert={exit.phase !== "idle" || confirm}>
      <div><label>Cenário<select disabled={exit.phase !== "idle"} value={scenario} onChange={(event)=>setScenario(event.target.value)}><option value="normal">Saída normal</option><option value="slow">Servidor lento</option><option value="error">Falha e nova tentativa</option></select></label><button className="button" onClick={replay} disabled={exit.phase !== "idle"}><RotateCcw size={16}/>Repetir animação</button></div>
      <footer><p role="status">{result}</p><ThemeToggle/></footer>
    </aside>
  </div>;
}
createRoot(document.getElementById("root")!).render(<StrictMode><Preview/></StrictMode>);

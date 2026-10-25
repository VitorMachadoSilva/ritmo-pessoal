import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Play, RotateCcw, Square } from "lucide-react";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import { Folhinha } from "./components/app/Folhinha";
import { AMBIENT_SCENES, type AmbientSceneId } from "./components/app/useFolhinhaAmbient";
import { ThemeToggle } from "./Theme";
import "./styles.css";
import "./theme.css";
import "./help-agent.css";
import "./folhinha-preview.css";

const SCENES: Record<AmbientSceneId, { title: string; description: string; duration: number }> = {
  plant: { title: "Plantar e regar", description: "Caminha, planta uma semente e cuida do broto.", duration: 18 },
  read: { title: "Ler um livro", description: "Senta, coloca os óculos e começa a leitura.", duration: 15 },
  nap: { title: "Tirar uma soneca", description: "Deita na cama enquanto surgem os zzz.", duration: 18 },
  stretch: { title: "Alongar-se", description: "Estica as folhas, inclina o corpo e respira.", duration: 12 },
  butterfly: { title: "Observar a borboleta", description: "Acompanha a borboleta pousar e partir.", duration: 16 },
};

function Sample({ scene, phase, run }: { scene: AmbientSceneId | null; phase: "idle" | "playing" | "exiting"; run: number }) {
  return <div key={run} className={`help-agent${scene ? ` is-ambient is-ambient-${scene}${phase === "exiting" ? " is-ambient-exiting" : ""}` : ""}`} data-scene={scene ?? undefined}>
    <div className="help-agent-trigger"><Folhinha size={46} mood="idle" /></div>
  </div>;
}

function Preview() {
  const [scene, setScene] = useState<AmbientSceneId | null>(null);
  const [phase, setPhase] = useState<"idle" | "playing" | "exiting">("idle");
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (!scene) return;
    const timer = window.setTimeout(() => {
      if (phase === "playing") setPhase("exiting");
      else { setScene(null); setPhase("idle"); }
    }, phase === "playing" ? SCENES[scene].duration * 1_000 : 1_200);
    return () => window.clearTimeout(timer);
  }, [scene, phase, run]);

  function play(next: AmbientSceneId) {
    setScene(next);
    setPhase("playing");
    setRun((current) => current + 1);
  }

  function stop() {
    setScene(null);
    setPhase("idle");
    setRun((current) => current + 1);
  }

  return <main className="ambient-preview">
    <header className="ambient-preview-header">
      <div><span className="ambient-preview-eyebrow">RITMO · LABORATÓRIO VISUAL</span><h1>As pausas do Folhinha</h1><p>Escolha uma cena para observar os gestos, objetos e a transição de volta ao repouso. Este preview não usa sua conta nem altera dados.</p></div>
      <ThemeToggle />
    </header>
    <div className="ambient-preview-layout">
      <section className="ambient-preview-controls" aria-labelledby="ambient-preview-scenes">
        <h2 id="ambient-preview-scenes">Escolha uma cena</h2>
        <div className="ambient-preview-options">{AMBIENT_SCENES.map((id) => <button key={id} type="button" className={scene === id ? "is-selected" : ""} aria-pressed={scene === id} onClick={() => play(id)}><span><strong>{SCENES[id].title}</strong><small>{SCENES[id].description}</small></span><Play size={17} aria-hidden="true" /></button>)}</div>
        <div className="ambient-preview-actions"><button type="button" onClick={() => scene && play(scene)} disabled={!scene}><RotateCcw size={16} /> Repetir</button><button type="button" onClick={stop} disabled={!scene}><Square size={15} /> Voltar ao repouso</button></div>
        <p role="status">{scene ? `${SCENES[scene].title} · ${phase === "exiting" ? "retornando ao repouso" : `${SCENES[scene].duration} segundos`}` : "Folhinha em repouso. Escolha uma cena para começar."}</p>
      </section>
      <section className="ambient-preview-view" aria-label="Visualização da cena">
        <div className="ambient-preview-view-heading"><h2>Vista ampliada</h2><span>2× · para observar os detalhes</span></div>
        <div className="ambient-preview-stage is-large"><Sample scene={scene} phase={phase} run={run} /></div>
        <div className="ambient-preview-view-heading"><h2>No tamanho real</h2><span>Como aparece no canto da aplicação</span></div>
        <div className="ambient-preview-stage is-real"><Sample scene={scene} phase={phase} run={run} /></div>
      </section>
    </div>
  </main>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><Preview /></StrictMode>);

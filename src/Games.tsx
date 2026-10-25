import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  ArrowLeft, Brain, CheckCircle2, Clock3, Lightbulb, RotateCcw, Sparkles, Timer, Zap,
} from "lucide-react";
import { TutorialTrigger } from "./GuidedTutorial";
import type { CognitiveGameDifficulty, CognitiveGameId } from "./types";
import type { PageProps } from "./pages";
import { elapsedLabel, games } from "./components/games/catalog";
import { apiOperations } from "./api-operations";
import { CancelGameConfirmation, GameDifficultyChooser, GamePlay, GameResult, ResetGameTimersConfirmation } from "./components/games/GameExperience";
const gameTimerResetOwner = "vitor machado silva";
// Orbit assignment is derived from the catalog, so newly added games join a path automatically.
const orbitGroups = [games.filter((_, index) => index % 2 === 0), games.filter((_, index) => index % 2 === 1)];
const formatDuration = (ms: number) => {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
};

export function GamesPage(p: PageProps) {
  const [serverOffset, setServerOffset] = useState(() => (p.state.serverNow ?? Date.now()) - Date.now());
  const [now, setNow] = useState(() => Date.now() + serverOffset);
  const [currentGame, setCurrentGame] = useState<CognitiveGameId | null>(null);
  const [choosingDifficulty, setChoosingDifficulty] = useState(false);
  const canResetGameTimers = p.state.settings.name.trim().toLocaleLowerCase("pt-BR") === gameTimerResetOwner;
  useEffect(() => {
    if (p.state.serverNow) setServerOffset(p.state.serverNow - Date.now());
  }, [p.state.serverNow]);
  const available = games.filter(({ id }) => {
    const progress = p.state.cognitiveGames?.[id];
    return !!progress?.active || !progress?.nextAvailableAt || progress.nextAvailableAt <= now;
  }).length;
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now() + serverOffset), 1000);
    return () => window.clearInterval(timer);
  }, [serverOffset]);

  function requestCancel(gameId: CognitiveGameId, sessionId: string) {
    p.dialog({
      title: "Cancelar esta partida?",
      description: "Esta tentativa será contada, mesmo sem resultado.",
      children: <CancelGameConfirmation
        onKeep={() => p.dialog(null)}
        onConfirm={async () => {
          const ok = await p.mutate(apiOperations.game.cancel(gameId), { sessionId });
          if (ok) setCurrentGame(null);
          return ok;
        }}
      />,
    });
  }

  if (currentGame) {
    const game = games.find((item) => item.id === currentGame)!;
    const progress = p.state.cognitiveGames?.[currentGame];
    const session = progress?.active;
    const completed = !session && progress?.last;
    return (
      <section className="games-page" aria-label="Jogos cognitivos">
        <button className="games-back button ghost" onClick={() => { setCurrentGame(null); setChoosingDifficulty(false); }}><ArrowLeft size={16} /> Voltar aos jogos</button>
        {session ? (
          <GamePlay key={session.id} game={game} session={session} mutate={p.mutate} serverOffset={serverOffset} onCancel={() => requestCancel(game.id, session.id)} />
        ) : choosingDifficulty ? (
          <GameDifficultyChooser game={game} onChoose={(difficulty) => void startGame(currentGame, difficulty)} />
        ) : completed ? (
          <GameResult game={game} result={progress.last!} onBack={() => setCurrentGame(null)} />
        ) : (
          <div className="games-empty panel" aria-live="polite"><Brain size={26} /><h2>Abrindo seu desafio…</h2><p>Preparando uma nova rodada para você.</p></div>
        )}
      </section>
    );
  }

  async function startGame(gameId: CognitiveGameId, difficulty: CognitiveGameDifficulty = "easy") {
    setChoosingDifficulty(false);
    const ok = await p.mutate(apiOperations.game.start(gameId), { difficulty });
    if (!ok) setCurrentGame(null);
  }

  async function openGame(gameId: CognitiveGameId) {
    setCurrentGame(gameId);
    if (p.state.cognitiveGames?.[gameId]?.active) { setChoosingDifficulty(false); return; }
    setChoosingDifficulty(true);
  }

  return (
    <section className="games-page" aria-label="Jogos cognitivos">
      <div className="games-intro panel" data-tutorial-target="games-intro">
        <div className="games-intro-copy">
          <span className="games-kicker"><Sparkles size={14} /> Uma pausa para a mente</span>
          <h2>Jogos para a mente.<br />No seu ritmo.</h2>
          <p>Exercícios curtos de memória e atenção. Cada jogo libera uma nova rodada 24 horas após concluir ou cancelar a tentativa.</p>
          <div className="games-intro-foot"><span><Clock3 size={15} /> 24 horas entre rodadas do mesmo jogo</span><span><CheckCircle2 size={15} /> Os jogos não alteram sua rotina ou XP</span></div>
        </div>
        <div className="games-orbit" aria-hidden="true">
          <div className="games-orbit-ring ring-boundary" />
          <div className="games-orbit-ring ring-one" /><div className="games-orbit-ring ring-two" />
          <div className="games-orbit-core"><Brain size={43} strokeWidth={1.4} /></div>
          {orbitGroups.map((orbitGames, orbitIndex) => (
            <div className={`games-orbit-track ${orbitIndex === 0 ? "orbit-forward" : "orbit-reverse"}`} key={orbitIndex}>
              {orbitGames.map((game, index) => {
                const Icon = game.icon;
                const delay = orbitGames.length > 1 ? (-42 * index) / orbitGames.length : 0;
                const position = (100 * index) / orbitGames.length;
                return <span className="orbit-chip" key={game.id} style={{ "--orbit-delay": `${delay}s`, "--orbit-position": `${position}%` } as CSSProperties}><Icon size={17} strokeWidth={1.9} /></span>;
              })}
            </div>
          ))}
        </div>
        <div className="games-count"><strong>{available}<small>/ {games.length}</small></strong><span>disponíveis agora</span></div>
      </div>

      <div className="games-section-heading" data-tutorial-target="games-grid">
        <div><h2>Escolha um desafio</h2><p>As rodadas são independentes; faça qualquer uma quando estiver disponível.</p></div>
        <div className="games-heading-actions">
          {canResetGameTimers && <button type="button" className="button ghost game-timer-reset" aria-label="Resetar tempos dos jogos" title="Resetar tempos dos jogos" onClick={() => p.dialog({
            title: "Resetar tempo dos jogos?",
            description: "Os quatro jogos ficarão disponíveis para uma nova rodada.",
            children: <ResetGameTimersConfirmation onKeep={() => p.dialog(null)} onConfirm={async () => {
              const ok = await p.mutate(apiOperations.game.resetTimers, {});
              if (ok) p.dialog(null);
              return ok;
            }} />,
          })}><RotateCcw size={15} /> Resetar tempos</button>}
          <TutorialTrigger id="feature-games" completed={p.completedTutorials.includes("feature-games")} onStart={p.startTutorial} label="Como jogar" />
        </div>
      </div>
      <div className="games-grid">
        {games.map((game, index) => {
          const progress = p.state.cognitiveGames?.[game.id];
          const active = progress?.active;
          const locked = !active && !!progress?.nextAvailableAt && progress.nextAvailableAt > now;
          const Icon = game.icon;
          return (
            <article className={`game-card ${game.kind}${locked ? " is-locked" : ""}`} key={game.id}>
              <div className="game-card-top"><span className="game-icon"><Icon size={21} strokeWidth={1.8} /></span><span className="game-domain">{game.domain}</span></div>
              <div><h3>{game.title}</h3><p>{game.description}</p></div>
              <div className="game-card-meta"><span><Timer size={14} /> {game.duration}</span>{progress?.plays ? <span>{progress.plays} {progress.plays === 1 ? "tentativa" : "tentativas"}</span> : <span>Primeira rodada</span>}</div>
              {progress?.last && (progress.last.cancelled
                ? <div className="game-last-result is-cancelled"><span>Última tentativa</span><strong>Cancelada</strong><small>Uma rodada foi contada</small></div>
                : <div className="game-last-result"><span>Último resultado</span><strong>{progress.last.score}%</strong><small>{elapsedLabel(progress.last.durationMs ?? 0)} de jogo</small></div>)}
              {locked ? (
                <div className="game-lock-status" aria-live="polite"><Clock3 size={15} /><span>Disponível em <strong>{formatDuration(progress!.nextAvailableAt! - now)}</strong></span></div>
              ) : (
                <button className="game-play-button" onClick={() => void openGame(game.id)}>
                  {active ? <RotateCcw size={15} /> : <Zap size={15} />}{active ? "Continuar desafio" : "Jogar agora"}
                </button>
              )}
              {index === 0 && <span className="game-card-sprig" aria-hidden="true">✳</span>}
            </article>
          );
        })}
      </div>

      <div className="games-note" data-tutorial-target="games-note"><Lightbulb size={17} /><p>São atividades recreativas de prática. O resultado descreve só esta rodada e não é uma avaliação da sua capacidade cognitiva.</p></div>
    </section>
  );
}

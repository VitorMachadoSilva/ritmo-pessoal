import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  ArrowLeft, Brain, Check, CheckCircle2, ChevronRight, Clock3, Eye, Grid3X3, Hash, Leaf,
  Lightbulb, RotateCcw, Sparkles, Timer, Trophy, Zap,
} from "lucide-react";
import { TutorialTrigger } from "./GuidedTutorial";
import type { CognitiveGameDifficulty, CognitiveGameId, CognitiveGameSession } from "./types";
import type { PageProps } from "./pages";

const games: { id: CognitiveGameId; name: string; title: string; domain: string; description: string; duration: string; icon: typeof Brain; kind: "green" | "purple" | "blue" | "orange" }[] = [
  { id: "memory", name: "Pares", title: "Memória visual", domain: "Memória", description: "Encontre os pares observando as posições e os símbolos.", duration: "2–4 min", icon: Brain, kind: "green" },
  { id: "sequence", name: "Sequência", title: "Sequência numérica", domain: "Memória de trabalho", description: "Observe uma sequência curta e tente lembrá-la na ordem.", duration: "1–2 min", icon: Hash, kind: "purple" },
  { id: "stroop", name: "Stroop", title: "Palavra e cor", domain: "Atenção seletiva", description: "Escolha a cor da tinta, mesmo quando a palavra aponta para outra.", duration: "2–3 min", icon: Eye, kind: "orange" },
  { id: "schulte", name: "Busca", title: "Busca visual", domain: "Atenção visual", description: "Encontre os números na ordem, mantendo o olhar no quadro.", duration: "1–3 min", icon: Grid3X3, kind: "blue" },
];
const gameTimerResetOwner = "vitor machado silva";
// Orbit assignment is derived from the catalog, so newly added games join a path automatically.
const orbitGroups = [games.filter((_, index) => index % 2 === 0), games.filter((_, index) => index % 2 === 1)];
const colors: Record<string, string> = { vermelho: "#a94845", azul: "#4478a2", verde: "#527b4a", amarelo: "#ba8b35" };
const memorySymbolNames: Record<string, string> = { "🌿": "folha", "🍐": "pera", "🪷": "flor de lótus", "🪺": "ninho", "🍋": "limão", "🫐": "mirtilos", "🪴": "planta em vaso", "🌻": "girassol", "🍄": "cogumelo", "🪸": "coral", "🍇": "uvas", "🪻": "jacinto", "🐚": "concha", "🍉": "melancia", "🌱": "broto", "🦋": "borboleta" };
const formatDuration = (ms: number) => {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
};
const elapsedLabel = (ms: number) => {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
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
          const ok = await p.mutate(`/api/games/${gameId}/cancel`, { sessionId });
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
    const ok = await p.mutate(`/api/games/${gameId}/start`, { difficulty });
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
              const ok = await p.mutate("/api/games/reset-timers", {});
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

function ResetGameTimersConfirmation({ onKeep, onConfirm }: { onKeep: () => void; onConfirm: () => Promise<boolean> }) {
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  return <>
    <p className="dialog-body">Isso remove a pausa de 24 horas e mantém seus recordes e histórico. As novas rodadas terão desafios inéditos.</p>
    <div className="modal-actions">
      <button type="button" className="button secondary" onClick={onKeep} disabled={busy} autoFocus>Manter tempos</button>
      <button type="button" className="button primary" disabled={busy} onClick={async () => {
        if (pending.current) return;
        pending.current = true;
        setBusy(true);
        const ok = await onConfirm();
        if (!ok) { pending.current = false; setBusy(false); }
      }}>{busy ? "Resetando…" : "Liberar jogos"}</button>
    </div>
  </>;
}

function GameDifficultyChooser({ game, onChoose }: { game: typeof games[number]; onChoose: (difficulty: CognitiveGameDifficulty) => void }) {
  const details: Record<CognitiveGameId, { count: string[]; detail: string[] }> = {
    memory: { count: ["8 pares · 16 cartas", "10 pares · 20 cartas", "12 pares · 24 cartas"], detail: ["A experiência atual, para aquecer a memória.", "Mais símbolos para observar e guardar.", "Mais pares e uma busca mais desafiadora."] },
    sequence: { count: ["6 algarismos", "7 algarismos", "8 algarismos"], detail: ["Uma sequência curta para memorizar.", "Mais um número para guardar na ordem.", "Uma sequência mais longa para recordar."] },
    stroop: { count: ["12 rodadas", "18 rodadas", "24 rodadas"], detail: ["Pratique distinguir palavra e cor.", "Mais rodadas e mais interferência entre palavra e tinta.", "Sessão mais longa, com mais palavras conflitantes."] },
    schulte: { count: ["5 × 5 · 25 casas", "6 × 6 · 36 casas", "7 × 7 · 49 casas"], detail: ["Encontre os números em uma grade compacta.", "Mais casas para percorrer em ordem.", "Uma grade ampla para desafiar sua busca visual."] },
  };
  const options: { id: CognitiveGameDifficulty; name: string; icon: typeof Brain }[] = [
    { id: "easy", name: "Fácil", icon: Leaf },
    { id: "medium", name: "Médio", icon: Brain },
    { id: "hard", name: "Difícil", icon: Zap },
  ];
  return <article className="game-stage panel game-difficulty-picker" aria-labelledby="game-difficulty-title">
    <span className="game-stage-kicker"><game.icon size={15} /> {game.title}</span>
    <h2 id="game-difficulty-title">Escolha a dificuldade</h2>
    <p>A dificuldade muda apenas esta rodada. A pausa de 24 horas vale para todos os níveis deste jogo.</p>
    <div className="game-difficulty-grid" role="group" aria-label={`Dificuldade de ${game.title}`}>
      {options.map((option, index) => {
        const Icon = option.icon;
        return <button type="button" key={option.id} className={`game-difficulty-option ${option.id}`} onClick={() => onChoose(option.id)} aria-label={`Começar ${game.title} no nível ${option.name}: ${details[game.id].count[index]}`}>
          <span className="game-difficulty-icon"><Icon size={20} /></span>
          <span className="game-difficulty-copy"><strong>{option.name}</strong><span>{details[game.id].count[index]}</span><small>{details[game.id].detail[index]}</small></span>
          <ChevronRight className="game-difficulty-arrow" size={18} />
        </button>;
      })}
    </div>
  </article>;
}

function CancelGameConfirmation({ onKeep, onConfirm }: { onKeep: () => void; onConfirm: () => Promise<boolean> }) {
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  return <>
    <p className="dialog-body">O progresso desta partida será descartado.</p>
    <p className="game-cancel-cooldown"><Clock3 size={16} /> Uma nova rodada será liberada 24 horas após o cancelamento.</p>
    <div className="modal-actions">
      <button type="button" className="button secondary" onClick={onKeep} disabled={busy} autoFocus>Continuar partida</button>
      <button type="button" className="button danger" disabled={busy} onClick={async () => {
        if (pending.current) return;
        pending.current = true;
        setBusy(true);
        const ok = await onConfirm();
        if (ok) onKeep();
        else { pending.current = false; setBusy(false); }
      }}>{busy ? "Cancelando…" : "Cancelar e contar tentativa"}</button>
    </div>
  </>;
}

function GamePlay({ game, session, mutate, serverOffset, onCancel }: { game: typeof games[number]; session: CognitiveGameSession; mutate: PageProps["mutate"]; serverOffset: number; onCancel: () => void }) {
  const [now, setNow] = useState(() => Date.now() + serverOffset);
  const [pendingResult, setPendingResult] = useState<{ score: number; correct: number; total: number; attempts?: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const saved = useRef(false);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now() + serverOffset), 1000);
    return () => window.clearInterval(timer);
  }, [serverOffset]);
  async function finish(result: { score: number; correct: number; total: number; attempts?: number }) {
    if (saved.current || saving) return;
    setPendingResult(result); setSaving(true); setSaveFailed(false);
    const ok = await mutate(`/api/games/${game.id}/complete`, { sessionId: session.id, ...result });
    setSaving(false);
    if (ok) saved.current = true;
    else setSaveFailed(true);
  }
  const challenge = session.challenge;
  const difficulty = challenge.difficulty ?? "easy";
  const difficultyName = difficulty === "medium" ? "Médio" : difficulty === "hard" ? "Difícil" : "Fácil";
  const challengeSize = challenge.kind === "memory" ? `${challenge.cards.length} cartas` : null;
  if (pendingResult) return (
    <article className="game-stage panel" aria-live="polite">
      <span className="game-stage-kicker"><CheckCircle2 size={15} /> Rodada finalizada</span>
      <div className="game-finish-mark"><Trophy size={28} /></div>
      <h2>{saving ? "Salvando seu resultado…" : "Resultado pronto"}</h2>
      <p>Você concluiu {game.title.toLocaleLowerCase("pt-BR")} no nível {difficultyName.toLocaleLowerCase("pt-BR")}. A próxima rodada desse jogo será liberada 24 horas após a conclusão.</p>
      <div className="game-result-score"><strong>{pendingResult.score}%</strong><span>{pendingResult.attempts ? "eficiência das tentativas" : "resultado desta rodada"}</span><small>{pendingResult.attempts ? `${pendingResult.correct} pares em ${pendingResult.attempts} tentativas` : `${pendingResult.correct} de ${pendingResult.total} respostas ou etapas corretas`}</small></div>
      {saveFailed ? <div className="games-error" role="alert"><p>Não foi possível salvar. Seu desafio continua disponível para tentar registrar o resultado novamente.</p><button className="button secondary" onClick={() => void finish(pendingResult)}>Tentar salvar</button></div> : saved.current ? <p className="game-saved-note"><Check size={15} /> Resultado salvo</p> : null}
    </article>
  );
  return (
    <article className="game-stage panel" aria-label={`${game.title}: partida`}>
      <div className="game-stage-top"><span className={`game-stage-icon ${game.kind}`}><game.icon size={19} /></span><div><span className="game-stage-kicker">{game.domain}</span><h2>{game.title}</h2></div><span className={`game-difficulty-pill ${difficulty}`}>Nível {difficultyName}{challengeSize ? ` · ${challengeSize}` : ""}</span><span className="game-elapsed"><Timer size={14} /> {elapsedLabel(now - session.startedAt)}</span></div>
      {challenge.kind === "memory" ? <MemoryGame cards={challenge.cards} onFinish={(moves, pairs) => void finish({ score: Math.round((pairs / Math.max(pairs, moves)) * 100), correct: pairs, total: pairs, attempts: moves })} /> : null}
      {challenge.kind === "sequence" ? <SequenceGame digits={challenge.digits} onFinish={(correct) => void finish({ score: correct ? 100 : 0, correct: Number(correct), total: 1 })} /> : null}
      {challenge.kind === "stroop" ? <StroopGame trials={challenge.trials} onFinish={(correct, total) => void finish({ score: Math.round(correct / total * 100), correct, total })} /> : null}
      {challenge.kind === "schulte" ? <SchulteGame tiles={challenge.tiles} onFinish={(errors, total) => void finish({ score: Math.max(0, Math.round(total / (total + errors) * 100)), correct: total, total })} /> : null}
      <div className="game-session-actions"><span>Voltar mantém a rodada disponível, mas o progresso na tela recomeça.</span><button type="button" className="button ghost game-cancel-button" onClick={onCancel}>Cancelar partida</button></div>
    </article>
  );
}

function MemoryGame({ cards, onFinish }: { cards: string[]; onFinish: (moves: number, pairs: number) => void }) {
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const lock = useRef(false);
  const finished = useRef(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  const pairCount = cards.length / 2;
  function flip(index: number) {
    if (lock.current || open.length === 2 || matched.includes(index) || open.includes(index)) return;
    if (open.length === 0) { setOpen([index]); setAnnouncement(`Carta ${index + 1} revelada. Escolha outra carta.`); return; }
    const pair = [open[0], index];
    const nextMoves = moves + 1;
    setMoves(nextMoves);
    setOpen(pair);
    if (cards[pair[0]] === cards[pair[1]]) {
      const nextMatched = [...matched, ...pair];
      setMatched(nextMatched);
      const nextPairs = nextMatched.length / 2;
      setAnnouncement(nextPairs === pairCount ? `Par encontrado. Todos os ${pairCount} pares foram encontrados em ${nextMoves} tentativas.` : `Par encontrado. ${nextPairs} de ${pairCount} pares.`);
      timers.current.push(window.setTimeout(() => setOpen([]), 560));
      if (nextMatched.length === cards.length && !finished.current) {
        finished.current = true;
        // Keep the final pair visible long enough for its success motion to finish.
        const finishDelay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650;
        timers.current.push(window.setTimeout(() => onFinish(nextMoves, pairCount), finishDelay));
      }
    } else {
      setAnnouncement("Essas cartas não formam um par. Tente guardar as posições.");
      lock.current = true;
      timers.current.push(window.setTimeout(() => { setOpen([]); lock.current = false; }, 720));
    }
  }
  const pairsFound = matched.length / 2;
  return <div className="memory-game">
    <div className="game-instruction-row"><p>Encontre os {pairCount} pares iguais.</p><span>{pairsFound} / {pairCount} pares · {moves} {moves === 1 ? "tentativa" : "tentativas"}</span></div>
    <div className="memory-progress" role="progressbar" aria-label="Pares encontrados" aria-valuemin={0} aria-valuemax={pairCount} aria-valuenow={pairsFound}><span style={{ width: `${(pairsFound / pairCount) * 100}%` }} /></div>
    <p className="memory-live" role="status" aria-live="polite">{announcement}</p>
    <div className="memory-board" data-card-count={cards.length} role="group" aria-label={`Tabuleiro com ${cards.length} cartas. Encontre os pares.`}>
      {cards.map((symbol, index) => {
        const faceUp = open.includes(index) || matched.includes(index);
        const isMatched = matched.includes(index);
        const blocked = lock.current || (open.length === 2 && !open.includes(index));
        const symbolName = memorySymbolNames[symbol] ?? "símbolo";
        const cardName = isMatched ? `: ${symbolName}, par encontrado` : faceUp ? `: ${symbolName}, revelada` : ": fechada. Revelar carta.";
        return <button key={`${symbol}-${index}`} type="button" className={`memory-card${faceUp ? " face-up" : ""}${isMatched ? " matched" : ""}`} onClick={() => flip(index)} aria-disabled={isMatched || blocked} aria-label={`Carta ${index + 1}${cardName}`} aria-pressed={faceUp}>
          <span className="memory-card-inner" aria-hidden="true">
            <span className="memory-card-back"><span className="memory-card-back-emblem">✳</span></span>
            <span className="memory-card-face"><span className="memory-card-corner">✳</span><span className="memory-card-symbol">{symbol}</span><span className="memory-card-corner is-bottom">✳</span></span>
          </span>
        </button>;
      })}
    </div>
    <p className="game-hint"><CheckCircle2 size={14} /> Cada par encontrado fica aberto. Use o teclado ou toque nas cartas.</p>
  </div>;
}

function SequenceGame({ digits, onFinish }: { digits: string; onFinish: (correct: boolean) => void }) {
  const length = digits.length;
  const [show, setShow] = useState(true);
  const [value, setValue] = useState("");
  useEffect(() => { const timer = window.setTimeout(() => setShow(false), 5500); return () => window.clearTimeout(timer); }, [digits]);
  return <div className="sequence-game"><p>{show ? "Observe a sequência. Ela vai desaparecer em alguns segundos." : `Digite os ${length} algarismos na mesma ordem.`}</p><div className={`sequence-display${show ? " showing" : " hidden"}`} aria-live="polite">{show ? digits.split("").join(" ") : Array.from({ length }, () => "•").join(" ")}</div>{!show && <form className="sequence-answer" onSubmit={(event) => { event.preventDefault(); if (value.length === length) onFinish(value === digits); }}><label htmlFor="sequence-answer">Sua resposta</label><input id="sequence-answer" autoComplete="off" inputMode="numeric" pattern={`[0-9]{${length}}`} maxLength={length} value={value} onChange={(event) => setValue(event.target.value.replace(/\D/g, "").slice(0, length))} autoFocus aria-describedby="sequence-help" /><small id="sequence-help">{length} algarismos, sem espaços.</small><button className="button primary" disabled={value.length !== length}>Conferir sequência</button></form>}<p className="game-hint"><Hash size={14} /> A sequência só é mostrada uma vez.</p></div>;
}

function StroopGame({ trials, onFinish }: { trials: { word: string; ink: string }[]; onFinish: (correct: number, total: number) => void }) {
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const trial = trials[index];
  function answer(color: string) {
    if (answered) return;
    const isCorrect = color === trial.ink;
    const nextCorrect = correct + Number(isCorrect);
    setAnswered(true); setLastCorrect(isCorrect); setCorrect(nextCorrect);
    window.setTimeout(() => {
      if (index + 1 === trials.length) { onFinish(nextCorrect, trials.length); return; }
      setIndex((value) => value + 1); setAnswered(false); setLastCorrect(null);
    }, 280);
  }
  return <div className="stroop-game"><div className="game-instruction-row"><p>Toque na cor da tinta, não no que está escrito.</p><span>{index + 1} / {trials.length}</span></div><div className="stroop-word" style={{ color: colors[trial.ink] }} aria-label={`Palavra ${trial.word}, escrita em tinta ${trial.ink}`}>{trial.word}</div><div className="stroop-answers" role="group" aria-label="Escolha a cor da tinta">{Object.keys(colors).map((color) => <button key={color} className="stroop-answer" onClick={() => answer(color)} disabled={answered}><i style={{ background: colors[color] }} />{color}</button>)}</div><p className={`game-hint stroop-feedback${lastCorrect === null ? "" : lastCorrect ? " correct" : " incorrect"}`} aria-live="polite">{lastCorrect === null ? <><Eye size={14} /> Observe as letras e a cor.</> : lastCorrect ? <><CheckCircle2 size={14} /> Cor certa.</> : <>Mais uma rodada, sem pressa.</>}</p></div>;
}

function SchulteGame({ tiles, onFinish }: { tiles: number[]; onFinish: (errors: number, total: number) => void }) {
  const total = tiles.length;
  const columns = Math.sqrt(total);
  const [next, setNext] = useState(1);
  const [errors, setErrors] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const selected = useMemo(() => new Set(Array.from({ length: next - 1 }, (_, index) => index + 1)), [next]);
  function select(value: number) {
    if (value < next) return;
    if (value === next) { if (value === total) onFinish(errors, total); else setNext(value + 1); return; }
    setErrors((count) => count + 1); setWrong(value); window.setTimeout(() => setWrong(null), 420);
  }
  return <div className="schulte-game"><div className="game-instruction-row"><p>Toque nos números em ordem crescente.</p><span>{columns} × {columns} · Próximo: <strong>{next}</strong> · Erros: {errors}</span></div><div className="schulte-board" style={{ "--schulte-columns": columns } as CSSProperties} role="group" aria-label={`Tabela de busca ${columns} por ${columns}, próximo número ${next}`}>
    {tiles.map((value, index) => <button key={`${value}-${index}`} className={`${selected.has(value) ? "found" : ""}${wrong === value ? " wrong" : ""}`} disabled={selected.has(value)} onClick={() => select(value)} aria-label={`Número ${value}${selected.has(value) ? ", encontrado" : ""}`}>{value}</button>)}
  </div><p className="game-hint"><Grid3X3 size={14} /> Procure sem mover a cabeça, se isso for confortável.</p></div>;
}

function GameResult({ game, result, onBack }: { game: typeof games[number]; result: CognitiveGameSession; onBack: () => void }) {
  const difficulty = result.challenge.difficulty ?? "easy";
  const difficultyName = difficulty === "medium" ? "médio" : difficulty === "hard" ? "difícil" : "fácil";
  if (result.cancelled) return <article className="game-stage panel game-result-page" aria-live="polite"><span className="game-stage-kicker"><Clock3 size={15} /> Tentativa contada</span><h2>Partida cancelada.</h2><p>A rodada de {game.name} no nível {difficultyName} ficará disponível 24 horas após o cancelamento.</p><button className="button primary" onClick={onBack}>Voltar aos jogos</button></article>;
  const memoryResult = game.id === "memory" && result.attempts != null;
  return <article className="game-stage panel game-result-page" aria-live="polite"><span className="game-stage-kicker"><CheckCircle2 size={15} /> Rodada concluída</span><div className="game-finish-mark"><Trophy size={28} /></div><h2>Bom trabalho.</h2><p>Você concluiu {game.title.toLocaleLowerCase()} no nível {difficultyName}. Este resultado descreve apenas esta rodada.</p><div className="game-result-score"><strong>{result.score}%</strong><span>{memoryResult ? "eficiência das tentativas" : "resultado da rodada"}</span><small>{memoryResult ? `${result.correct} pares em ${result.attempts} tentativas` : `${result.correct} de ${result.total} etapas certas`} · {elapsedLabel(result.durationMs ?? 0)}</small></div><div className="game-result-next"><Clock3 size={16} /><span>Uma nova rodada de <strong>{game.name}</strong> fica disponível após 24 horas.</span></div><button className="button primary" onClick={onBack}>Voltar aos jogos</button></article>;
}

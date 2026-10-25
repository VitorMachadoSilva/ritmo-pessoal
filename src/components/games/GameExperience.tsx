import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Brain, Check, CheckCircle2, ChevronRight, Clock3, Eye, Grid3X3, Hash, Leaf, Timer, Trophy, Zap } from "lucide-react";
import type { CognitiveGameDifficulty, CognitiveGameId, CognitiveGameSession } from "../../types";
import type { PageProps } from "../../pages";
import { elapsedLabel, gameColors, games, memorySymbolNames } from "./catalog";
import { apiOperations } from "../../api-operations";
import { ConfirmAction } from "../dialogs/ConfirmAction";

export function ResetGameTimersConfirmation({ onKeep, onConfirm }: { onKeep: () => void; onConfirm: () => Promise<boolean> }) {
  return <ConfirmAction
    body="Isso remove a pausa de 24 horas e mantém seus recordes e histórico. As novas rodadas terão desafios inéditos."
    onClose={onKeep}
    onConfirm={onConfirm}
    cancelLabel="Manter tempos"
    confirmLabel="Liberar jogos"
    busyLabel="Resetando…"
    tone="primary"
  />;
}

export function GameDifficultyChooser({ game, onChoose }: { game: typeof games[number]; onChoose: (difficulty: CognitiveGameDifficulty) => void }) {
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

export function CancelGameConfirmation({ onKeep, onConfirm }: { onKeep: () => void; onConfirm: () => Promise<boolean> }) {
  return <ConfirmAction
    body={<><p className="dialog-body">O progresso desta partida será descartado.</p><p className="game-cancel-cooldown"><Clock3 size={16} /> Uma nova rodada será liberada 24 horas após o cancelamento.</p></>}
    onClose={onKeep}
    onConfirm={onConfirm}
    cancelLabel="Continuar partida"
    confirmLabel="Cancelar e contar tentativa"
    busyLabel="Cancelando…"
  />;
}

export function GamePlay({ game, session, mutate, serverOffset, onCancel }: { game: typeof games[number]; session: CognitiveGameSession; mutate: PageProps["mutate"]; serverOffset: number; onCancel: () => void }) {
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
    const ok = await mutate(apiOperations.game.complete(game.id), { sessionId: session.id, ...result });
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
  return <div className="stroop-game"><div className="game-instruction-row"><p>Toque na cor da tinta, não no que está escrito.</p><span>{index + 1} / {trials.length}</span></div><div className="stroop-word" style={{ color: gameColors[trial.ink] }} aria-label={`Palavra ${trial.word}, escrita em tinta ${trial.ink}`}>{trial.word}</div><div className="stroop-answers" role="group" aria-label="Escolha a cor da tinta">{Object.keys(gameColors).map((color) => <button key={color} className="stroop-answer" onClick={() => answer(color)} disabled={answered}><i style={{ background: gameColors[color] }} />{color}</button>)}</div><p className={`game-hint stroop-feedback${lastCorrect === null ? "" : lastCorrect ? " correct" : " incorrect"}`} aria-live="polite">{lastCorrect === null ? <><Eye size={14} /> Observe as letras e a cor.</> : lastCorrect ? <><CheckCircle2 size={14} /> Cor certa.</> : <>Mais uma rodada, sem pressa.</>}</p></div>;
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

export function GameResult({ game, result, onBack }: { game: typeof games[number]; result: CognitiveGameSession; onBack: () => void }) {
  const difficulty = result.challenge.difficulty ?? "easy";
  const difficultyName = difficulty === "medium" ? "médio" : difficulty === "hard" ? "difícil" : "fácil";
  if (result.cancelled) return <article className="game-stage panel game-result-page" aria-live="polite"><span className="game-stage-kicker"><Clock3 size={15} /> Tentativa contada</span><h2>Partida cancelada.</h2><p>A rodada de {game.name} no nível {difficultyName} ficará disponível 24 horas após o cancelamento.</p><button className="button primary" onClick={onBack}>Voltar aos jogos</button></article>;
  const memoryResult = game.id === "memory" && result.attempts != null;
  return <article className="game-stage panel game-result-page" aria-live="polite"><span className="game-stage-kicker"><CheckCircle2 size={15} /> Rodada concluída</span><div className="game-finish-mark"><Trophy size={28} /></div><h2>Bom trabalho.</h2><p>Você concluiu {game.title.toLocaleLowerCase()} no nível {difficultyName}. Este resultado descreve apenas esta rodada.</p><div className="game-result-score"><strong>{result.score}%</strong><span>{memoryResult ? "eficiência das tentativas" : "resultado da rodada"}</span><small>{memoryResult ? `${result.correct} pares em ${result.attempts} tentativas` : `${result.correct} de ${result.total} etapas certas`} · {elapsedLabel(result.durationMs ?? 0)}</small></div><div className="game-result-next"><Clock3 size={16} /><span>Uma nova rodada de <strong>{game.name}</strong> fica disponível após 24 horas.</span></div><button className="button primary" onClick={onBack}>Voltar aos jogos</button></article>;
}


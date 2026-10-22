import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Pause,
  Play,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import type { FocusSession } from "./types";
import type { PageProps } from "./pages";
import { dateLabel, dayFor, number } from "./lib";
import { clockLabel, focusElapsed, focusRemaining } from "./timer";

function useClock() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}
export function FocusIndicator({
  session,
  onOpen,
}: {
  session?: FocusSession | null;
  onOpen: () => void;
}) {
  const now = useClock();
  const label = session ? clockLabel(focusRemaining(session, now)) : "";
  useEffect(() => {
    document.title = session
      ? `${label} · ${session.resumedAt === null ? "Pausado" : "Foco"} · Ritmo`
      : "Ritmo — sua rotina, no seu ritmo";
    return () => {
      document.title = "Ritmo — sua rotina, no seu ritmo";
    };
  }, [label, session]);
  return session ? (
    <button
      className="focus-indicator"
      onClick={onOpen}
      aria-label={`Abrir sessão de foco, ${label}${session.resumedAt === null ? ", pausada" : ""}`}
    >
      <Timer size={15} />
      <span>
        {session.resumedAt === null ? "Pausado" : "Foco"} {label}
      </span>
    </button>
  ) : null;
}
export function FocusPage(p: PageProps) {
  const now = useClock();
  const [minutes, setMinutes] = useState(25);
  const [label, setLabel] = useState("");
  const [habitId, setHabitId] = useState("");
  const session = p.state.focus;
  const day = dayFor(p.state, p.date);
  const logs = day.focusSessions ?? [];
  const habits = dayFor(p.state, p.today).habits.filter(
    (h) => h.kind === "check" && h.category === "mente",
  );
  const elapsed = session ? focusElapsed(session, now) : 0;
  const remaining = session ? focusRemaining(session, now) : minutes * 60000;
  const finished = !!session && remaining === 0;
  async function start(e: React.FormEvent) {
    e.preventDefault();
    await p.mutate("/api/focus/start", {
      label: label.trim(),
      minutes,
      habitId: habitId || null,
    });
  }
  return (
    <>
      <div className="page-intro">
        <div>
          <h2>Abra espaço para uma coisa.</h2>
          <p>
            Escolha uma tarefa pequena. O resto pode esperar por alguns minutos.
          </p>
        </div>
      </div>
      <div className="focus-layout">
        <section
          className={`focus-stage ${finished ? "finished" : ""}`}
          aria-label="Cronômetro de foco"
        >
          <div className="focus-stage-heading">
            <Timer size={21} />
            <span>
              {session
                ? finished
                  ? "Tempo concluído"
                  : session.resumedAt === null
                    ? "Sessão pausada"
                    : "Seu tempo de foco"
                : "Um intervalo sem distrações"}
            </span>
            {session && <span>{session.targetMinutes} min</span>}
          </div>
          <div
            className="focus-dial"
            style={
              {
                "--focus-progress": `${session ? (elapsed / (session.targetMinutes * 60000)) * 100 : 0}%`,
              } as React.CSSProperties
            }
          >
            <div>
              <span
                className="focus-clock"
                aria-label={`${clockLabel(remaining)} restantes`}
              >
                {clockLabel(remaining)}
              </span>
              <span>
                {finished
                  ? "Você chegou ao fim."
                  : session?.resumedAt === null
                    ? "Retome quando puder."
                    : session
                      ? "Só esta tarefa, por enquanto."
                      : "O primeiro passo cabe aqui."}
              </span>
            </div>
          </div>
          <h3>{session?.label || "O que merece sua atenção?"}</h3>
          <p className="focus-session-date">
            {session
              ? `Iniciada em ${dateLabel(session.date)}`
              : "O tempo começa quando você decidir."}
          </p>
          <div className="focus-controls">
            {session ? (
              <>
                {!finished && (
                  <button
                    className="button focus-light"
                    disabled={p.busy}
                    onClick={() =>
                      p.mutate(
                        `/api/focus/${session.resumedAt === null ? "resume" : "pause"}`,
                        {},
                      )
                    }
                  >
                    {session.resumedAt === null ? (
                      <Play size={17} />
                    ) : (
                      <Pause size={17} />
                    )}
                    {session.resumedAt === null ? "Retomar" : "Pausar"}
                  </button>
                )}
                <button
                  className="button focus-light"
                  disabled={p.busy || elapsed < 60000}
                  onClick={() => p.mutate("/api/focus/finish", {})}
                >
                  <Check size={17} />
                  {finished ? "Concluir e registrar" : "Registrar sessão"}
                </button>
                <button
                  className="focus-cancel"
                  disabled={p.busy}
                  onClick={() =>
                    p.confirm(
                      "Descartar esta sessão?",
                      "O tempo desta sessão não será registrado. Seus outros registros serão preservados.",
                      () => p.mutate("/api/focus/cancel", {}),
                    )
                  }
                >
                  <X size={14} />
                  Descartar
                </button>
              </>
            ) : (
              <span className="focus-stage-hint">
                <ArrowUpRight size={17} /> Prepare sua sessão ao lado.
              </span>
            )}
          </div>
          <p className="focus-status" role="status">
            {finished
              ? "Registre a sessão para salvar seu tempo e concluir o hábito vinculado."
              : session
                ? "Você pode sair desta tela ou recarregar. O cronômetro continua até o limite escolhido."
                : "Sem pontuação extra por deixar o relógio rodando."}
          </p>
        </section>
        <section className="panel focus-setup">
          <div className="section-heading">
            <h3>{session ? "Proteja este intervalo" : "Prepare seu foco"}</h3>
            <Timer size={18} />
          </div>
          {session ? (
            <div className="focus-guidance">
              <p>
                Feche as abas que não fazem parte da tarefa e deixe o celular
                fora de alcance.
              </p>
              <ol>
                <li>Comece pelo menor passo concreto.</li>
                <li>Anote uma distração para resolver depois.</li>
                <li>Ao terminar, levante e faça uma pausa.</li>
              </ol>
              <div className="focus-link-note">
                {session.habitId
                  ? "A duração completa marca o hábito vinculado. Uma sessão parcial registra apenas o tempo."
                  : "Esta sessão registra tempo, sem alterar seus hábitos."}
              </div>
            </div>
          ) : (
            <form className="stack-form" onSubmit={start}>
              <label>
                O que você vai fazer?
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  maxLength={120}
                  placeholder="Ex.: revisar o primeiro capítulo"
                  required
                />
              </label>
              <fieldset>
                <legend>Tempo reservado</legend>
                <div className="focus-presets">
                  {[25, 50, 90].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={minutes === n}
                      onClick={() => setMinutes(n)}
                    >
                      {n} min
                    </button>
                  ))}
                </div>
              </fieldset>
              <label>
                Ou escolha a duração, em minutos
                <input
                  type="number"
                  min={1}
                  max={120}
                  required
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                />
              </label>
              <label>
                Vincular a um hábito de foco
                <select
                  value={habitId}
                  onChange={(e) => setHabitId(e.target.value)}
                >
                  <option value="">Somente registrar o tempo</option>
                  {habits.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.title}
                    </option>
                  ))}
                </select>
              </label>
              <p className="field-help">
                Ao cumprir a duração inteira, o hábito vinculado é concluído uma
                única vez. Sessões parciais precisam de pelo menos 1 minuto.
              </p>
              <button
                className="button primary"
                disabled={p.busy || p.date !== p.today || !label.trim()}
              >
                <Play size={17} />
                Iniciar foco
              </button>
              {p.date !== p.today && (
                <button
                  className="text-button"
                  type="button"
                  onClick={() => p.setDate(p.today)}
                >
                  Voltar para hoje para iniciar
                </button>
              )}
            </form>
          )}
        </section>
      </div>
      <section className="panel focus-history">
        <div className="section-heading">
          <div>
            <h3>
              Sessões de {p.date === p.today ? "hoje" : dateLabel(p.date)}
            </h3>
            <p>
              {logs.length
                ? `${number(
                    logs.reduce((sum, item) => sum + item.minutes, 0),
                    1,
                  )} minutos registrados · ${logs.length} ${logs.length === 1 ? "sessão" : "sessões"}`
                : "Seu primeiro intervalo começa com uma tarefa."}
            </p>
          </div>
        </div>
        {!logs.length ? (
          <div className="focus-history-empty">
            <Timer size={20} />
            <p>Nenhuma sessão registrada neste dia.</p>
          </div>
        ) : (
          [...logs].reverse().map((log) => (
            <div className="focus-log" key={log.id}>
              <span className={`focus-log-icon ${log.completed ? "done" : ""}`}>
                {log.completed ? <Check size={18} /> : <Timer size={18} />}
              </span>
              <div>
                <strong>{log.label}</strong>
                <p>
                  {new Date(log.startedAt).toLocaleTimeString("pt-BR", {
                    timeZone: p.state.settings.timezone,
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {log.completed ? "Duração completa" : "Sessão parcial"}
                </p>
              </div>
              <span>{number(log.minutes, 1)} min</span>
              <button
                className="icon-button danger-text"
                aria-label={`Excluir sessão ${log.label}`}
                disabled={p.busy}
                onClick={() =>
                  p.confirm(
                    "Excluir sessão?",
                    "O tempo será removido do histórico. O hábito vinculado, se concluído, continua marcado e pode ser desmarcado na visão geral.",
                    () =>
                      p.mutate(`/api/focus/${p.date}/${log.id}`, {}, "DELETE"),
                  )
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </section>
      <p className="focus-footnote">
        O cronômetro registra tempo de sessão, não mede sua atenção. Não é
        necessário manter esta tela aberta.
      </p>
    </>
  );
}

import { useState } from "react";
import { Activity, ArrowUpRight, Check, ChevronRight, Clock3, Dumbbell, Edit3, Plus, ShieldCheck, Trash2 } from "lucide-react";
import type { Workout } from "../types";
import { dateLabel, dayFor } from "../lib";
import { Empty } from "../ui";
import { WorkoutForm } from "../forms";
import { TutorialTrigger } from "../GuidedTutorial";
import type { PageProps } from "./types";
import { apiOperations } from "../api-operations";

import { WorkoutSession } from "../components/training/WorkoutSession";
export function TrainingPage(p: PageProps) {
  const [sessionPage, setSessionPage] = useState(0);
  const sessions = Object.entries(p.state.days)
    .filter(([, d]) => d.workout)
    .sort(([a], [b]) => b.localeCompare(a));
  const lastSessionPage = Math.max(0, Math.ceil(sessions.length / 12) - 1);
  const visibleSessionPage = Math.min(sessionPage, lastSessionPage);
  const todayWorkout = dayFor(p.state, p.date).workout;
  function edit(workout?: Workout) {
    p.dialog({
      title: workout ? "Editar treino" : "Criar treino",
      wide: true,
      children: (
        <WorkoutForm
          workout={workout}
          mutate={p.mutate}
          onClose={() => p.dialog(null)}
        />
      ),
    });
  }
  function start(workout: Workout) {
    const go = () =>
      p.dialog({
        title: `${workout.name} · seu treino`,
        description: "Registre cada série e respeite seu próprio ritmo.",
        wide: true,
        children: (
          <WorkoutSession
            workout={workout}
            previous={todayWorkout}
            mutate={p.mutate}
            date={p.date}
            onClose={() => p.dialog(null)}
          />
        ),
      });
    if (todayWorkout && todayWorkout.templateId !== workout.id)
      p.confirm(
        "Trocar o treino deste dia?",
        "Há um treino salvo para esta data. Ao salvar outro treino, ele será substituído.",
        async () => {
          go();
          return false;
        },
      );
    else go();
  }
  return (
    <>
      <div className="page-intro" data-tutorial-target="training-intro">
        <div>
          <h2>Mais forte para a vida.</h2>
          <p>
            Treine com intenção. Registre o esforço. Respeite a recuperação.
          </p>
        </div>
        <div className="tutorial-actions" data-tutorial-target="training-create"><TutorialTrigger id="feature-workout" completed={p.completedTutorials.includes("feature-workout")} onStart={p.startTutorial} /><button className="button primary" onClick={() => edit()}><Plus size={16} /> Novo treino</button></div>
      </div>
      <div className="training-banner">
        <div className="training-illustration">
          <Dumbbell size={55} strokeWidth={1.2} />
          <span />
        </div>
        <div>
          <span className="pill green">Seu plano de força</span>
          <h3>Constância é a repetição que mais importa.</h3>
          <p>
            Comece com 2 sessões por semana. Progrida para 3, alternando A e B,
            com descanso entre os dias.
          </p>
        </div>
        <div className="training-banner-stat">
          <strong>
            {sessions.filter(([, d]) => d.workout?.completed).length}
          </strong>
          <span>treinos concluídos</span>
        </div>
      </div>
      <div className="workout-grid" data-tutorial-target="training-list">
        {p.state.workouts.map((w, i) => (
          <section key={w.id} className="panel workout-card">
            <div className="workout-card-top">
              <span className={`workout-letter ${i % 2 ? "purple" : "green"}`}>
                {w.name.replace(/treino\s*/i, "").slice(0, 2) || String(i + 1)}
              </span>
              <div className="row-actions">
                <button
                  className="icon-button"
                  onClick={() => edit(w)}
                  aria-label={`Editar ${w.name}`}
                >
                  <Edit3 size={16} />
                </button>
                <button
                  className="icon-button danger-text"
                  aria-label={`Remover ${w.name}`}
                  onClick={() =>
                    p.confirm(
                      "Remover este treino?",
                      `“${w.name}” será removido dos modelos. As sessões já registradas serão mantidas.`,
                      () => p.mutate(apiOperations.workout.remove(w.id), {}, "DELETE"),
                    )
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h3>{w.name}</h3>
            <p>{w.focus}</p>
            <div className="workout-meta">
              <span>
                <Dumbbell size={14} />
                {w.exercises.length} exercícios
              </span>
              <span>
                <Activity size={14} />
                {w.exercises.reduce((n, e) => n + e.sets, 0)} séries previstas
              </span>
            </div>
            <div className="workout-exercises">
              {w.exercises.map((e, j) => (
                <div key={e.id}>
                  <span>{String(j + 1).padStart(2, "0")}</span>
                  <strong>{e.name}</strong>
                  <small>
                    {e.sets} × {e.reps}
                  </small>
                </div>
              ))}
            </div>
            <button className="button primary" onClick={() => start(w)}>
              {todayWorkout?.templateId === w.id
                ? "Abrir registro do dia"
                : "Começar meu treino"}
              <ArrowUpRight size={17} />
            </button>
          </section>
        ))}
      </div>
      {!p.state.workouts.length && (
        <Empty
          icon={<Dumbbell size={28} />}
          title="Seu próximo treino começa aqui."
          action={
            <button className="button primary" onClick={() => edit()}>
              Criar treino
            </button>
          }
        >
          Adicione exercícios, séries e repetições para montar seu plano.
        </Empty>
      )}
      <section className="panel recent-sessions" data-tutorial-target="training-history">
        <div className="section-heading">
          <h3>Seu histórico de treinos</h3>
          <span className="muted">
            {sessions.length} {sessions.length === 1 ? "sessão" : "sessões"}
          </span>
        </div>
        {sessions.length ? (
          sessions
            .slice(visibleSessionPage * 12, (visibleSessionPage + 1) * 12)
            .map(([key, d]) => (
              <button
                key={key}
                className="session-history-row"
                onClick={() => {
                  p.setDate(key);
                  const currentTemplate = p.state.workouts.find(
                    (v) => v.id === d.workout?.templateId,
                  );
                  // Reconstruct the record's own structure, even if its original template was removed.
                  const w: Workout = {
                    id: d.workout!.templateId,
                    name: d.workout!.name,
                    focus: currentTemplate?.focus ?? "",
                    notes: currentTemplate?.notes ?? "",
                    exercises: d.workout!.exercises.map((e) => ({
                      id: e.id,
                      name: e.name,
                      sets: e.sets.length,
                      reps: "",
                    })),
                  };
                  p.dialog({
                    title: `${d.workout?.name} · ${dateLabel(key)}`,
                    wide: true,
                    children: (
                      <WorkoutSession
                        workout={w}
                        previous={d.workout}
                        date={key}
                        mutate={p.mutate}
                        onClose={() => p.dialog(null)}
                      />
                    ),
                  });
                }}
              >
                <span
                  className={`history-icon ${d.workout?.completed ? "" : "partial"}`}
                >
                  {d.workout?.completed ? (
                    <Check size={17} />
                  ) : (
                    <Clock3 size={17} />
                  )}
                </span>
                <strong>
                  {d.workout?.name}
                  <span className="session-state">
                    {d.workout?.completed ? "Concluído" : "Em andamento"}
                  </span>
                </strong>
                <span>{dateLabel(key)}</span>
                <small>
                  {d.workout?.exercises.reduce(
                    (n, e) => n + e.sets.filter((s) => s.done).length,
                    0,
                  )}{" "}
                  {d.workout?.exercises.reduce(
                    (n, e) => n + e.sets.filter((s) => s.done).length,
                    0,
                  ) === 1
                    ? "série"
                    : "séries"}
                </small>
                <ChevronRight size={17} />
              </button>
            ))
        ) : (
          <p className="empty-inline">
            As sessões salvas, parciais ou concluídas, vão aparecer aqui.
          </p>
        )}
        {sessions.length > 12 && (
          <nav
            className="session-pagination"
            aria-label="Paginação do histórico de treinos"
          >
            <button
              className="button secondary compact"
              disabled={visibleSessionPage === 0}
              onClick={() => setSessionPage(visibleSessionPage - 1)}
            >
              Mais recentes
            </button>
            <span>
              Página {visibleSessionPage + 1} de {lastSessionPage + 1}
            </span>
            <button
              className="button secondary compact"
              disabled={visibleSessionPage === lastSessionPage}
              onClick={() => setSessionPage(visibleSessionPage + 1)}
            >
              Mais antigos
            </button>
          </nav>
        )}
      </section>
      <div className="soft-note">
        <ShieldCheck size={18} />
        <span>
          Aprenda a técnica com um profissional. Dor articular, tontura ou
          mal-estar são sinais para interromper e buscar avaliação.
        </span>
      </div>
    </>
  );
}


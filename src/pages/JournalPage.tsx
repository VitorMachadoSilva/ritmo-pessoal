import { useState } from "react";
import { usePageDraft } from "../drafts";
import { BookOpen, Check, ChevronRight, LockKeyhole, Sprout } from "lucide-react";
import { dateLabel, dayFor } from "../lib";
import { TutorialTrigger } from "../GuidedTutorial";
import type { PageProps } from "./types";
import { apiOperations } from "../api-operations";

export function JournalPage(p: PageProps) {
  const d = dayFor(p.state, p.date);
  const [mood, setMood] = useState(d.mood);
  const [dirty, setDirty] = useState(false);
  usePageDraft(dirty);
  const saved = !!(d.journal || d.win || d.next || d.mood);
  const entries = Object.entries(p.state.days)
    .filter(([, day]) => day.journal || day.win || day.next || day.mood)
    .sort(([a], [b]) => b.localeCompare(a));
  return (
    <>
      <div className="page-intro">
        <div>
          <h2>Você também merece ser ouvido.</h2>
          <p>
            Um espaço para organizar pensamentos e reconhecer pequenas vitórias.
          </p>
        </div>
        <span className="pill purple">
          <LockKeyhole size={13} />
          Só seu
        </span>
      </div>
      <div className="journal-layout">
        <section className="panel journal-editor" data-tutorial-target="journal-editor">
          <div className="journal-date">
            <TutorialTrigger id="feature-journal" completed={p.completedTutorials.includes("feature-journal")} onStart={p.startTutorial} />
            <span className="category-tile purple">
              <BookOpen size={22} />
            </span>
            <div>
              <h3>
                {p.date === p.today
                  ? "Uma pausa no seu dia"
                  : dateLabel(p.date)}
              </h3>
              <p>
                {dateLabel(p.date, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>
            <span className="journal-save-state">
              {dirty ? (
                "Alterações não salvas"
              ) : saved ? (
                <>
                  <Check size={13} />
                  Salvo
                </>
              ) : (
                "Seu espaço está aberto"
              )}
            </span>
          </div>
          <form
            className="stack-form"
            onChange={() => setDirty(true)}
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (
                await p.mutate(
                  apiOperations.day.update(p.date),
                  {
                    mood,
                    journal: f.get("journal"),
                    win: f.get("win"),
                    next: f.get("next"),
                  },
                  "PATCH",
                )
              )
                setDirty(false);
            }}
          >
            <fieldset>
              <legend>Como você está se sentindo?</legend>
              <div className="journal-moods">
                {[
                  { id: 1, emoji: "😞", label: "Difícil" },
                  { id: 2, emoji: "😕", label: "Meio pra baixo" },
                  { id: 3, emoji: "😐", label: "Neutro" },
                  { id: 4, emoji: "🙂", label: "Bem" },
                  { id: 5, emoji: "😄", label: "Muito bem" },
                ].map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    className={mood === m.id ? "selected" : ""}
                    aria-pressed={mood === m.id}
                    onClick={() => {
                      setMood(mood === m.id ? null : m.id);
                      setDirty(true);
                    }}
                  >
                    <span>{m.emoji}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <label>
              O que está passando pela sua cabeça?
              <textarea
                name="journal"
                rows={6}
                maxLength={5000}
                defaultValue={d.journal}
                placeholder="Sem certo ou errado. Escreva o que precisar tirar da cabeça."
              />
            </label>
            <label>
              Uma pequena vitória de hoje
              <textarea
                name="win"
                rows={2}
                maxLength={1000}
                defaultValue={d.win}
                placeholder="Algo que você fez por você, por menor que pareça."
              />
            </label>
            <label>
              Um próximo passo possível
              <textarea
                name="next"
                rows={2}
                maxLength={1000}
                defaultValue={d.next}
                placeholder="O que pode tornar amanhã um pouco melhor?"
              />
            </label>
            <div className="form-end">
              <button className="button primary" disabled={p.busy}>
                <Check size={16} />
                {p.busy ? "Salvando…" : "Salvar meu dia"}
              </button>
            </div>
          </form>
        </section>
        <aside className="journal-aside">
          <div className="journal-quote">
            <span>“</span>
            <h3>Você não precisa dar conta de tudo para estar progredindo.</h3>
            <Sprout size={30} strokeWidth={1.2} />
          </div>
          <section className="panel journal-history" data-tutorial-target="journal-history">
            <h3>Seus dias, suas histórias.</h3>
            {entries.length ? (
              entries.slice(0, 12).map(([key, day]) => (
                <button
                  key={key}
                  className={key === p.date ? "selected" : ""}
                  onClick={() => {
                    if (dirty) {
                      p.confirm(
                        "Sair sem salvar?",
                        "Há alterações no diário que ainda não foram salvas.",
                        async () => {
                          setDirty(false);
                          window.dispatchEvent(
                            new CustomEvent("journal-dirty", { detail: false }),
                          );
                          p.setDate(key);
                          return true;
                        },
                      );
                    } else p.setDate(key);
                  }}
                >
                  <span>
                    <strong>
                      {dateLabel(key, { day: "numeric", month: "short" })}
                    </strong>
                    <small>
                      {(day.win || day.journal || "Como me senti hoje").slice(
                        0,
                        65,
                      )}
                    </small>
                  </span>
                  <ChevronRight size={15} />
                </button>
              ))
            ) : (
              <p className="muted">
                Depois de salvar, seus registros aparecem aqui.
              </p>
            )}
          </section>
          <p className="journal-care">
            Se o desânimo persistir ou atrapalhar sua vida, conversar com um
            psicólogo ou médico também é uma forma de cuidado.
          </p>
        </aside>
      </div>
    </>
  );
}


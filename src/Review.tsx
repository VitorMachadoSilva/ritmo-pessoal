import { useState } from "react";
import { usePageDraft } from "./drafts";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  Check,
  Leaf,
  Save,
} from "lucide-react";
import type { PageProps } from "./pages";
import { apiOperations } from "./api-operations";
import {
  activeHabits,
  addDays,
  categories,
  dateLabel,
  number,
  score,
  weekdays,
} from "./lib";
import { weeklyReview, weekStart } from "./review-data";
import { CategoryIcon } from "./ui";
import { TutorialTrigger } from "./GuidedTutorial";
export function ReviewPage(p: PageProps) {
  const review = weeklyReview(p.state, p.date, p.today);
  const note = p.state.weeks?.[review.start];
  const [worked, setWorked] = useState(note?.worked ?? "");
  const [adjustment, setAdjustment] = useState(note?.adjustment ?? "");
  const [priority, setPriority] = useState(note?.priority ?? "");
  const [dirty, setDirty] = useState(false);
  usePageDraft(dirty);
  const changeWeek = (offset: number) =>
    p.setDate(
      offset < 0
        ? [addDays(review.start, offset), p.state.settings.startDate]
            .sort()
            .at(-1)!
        : [addDays(review.start, offset), p.today].sort()[0],
    );
  return (
    <>
      <div className="review-heading">
        <div>
          <h2>Observe. Ajuste. Continue.</h2>
          <p>Uma semana é informação, não uma nota sobre você.</p>
        </div>
        <div className="review-pagination">
          <button
            className="icon-button"
            aria-label="Semana anterior"
            disabled={review.start <= weekStart(p.state.settings.startDate)}
            onClick={() => changeWeek(-7)}
          >
            <ArrowLeft size={17} />
          </button>
          <strong>
            {dateLabel(review.start, { day: "numeric", month: "short" })} —{" "}
            {dateLabel(addDays(review.start, 6), {
              day: "numeric",
              month: "short",
            })}
          </strong>
          <button
            className="icon-button"
            aria-label="Próxima semana"
            disabled={review.start >= weekStart(p.today)}
            onClick={() => changeWeek(7)}
          >
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
      <section className="panel review-week" data-tutorial-target="review-week">
        <div className="section-heading">
          <div>
            <h3>Seu ritmo, dia a dia</h3>
            <p>
              {review.elapsed}{" "}
              {review.elapsed === 1 ? "dia acompanhado" : "dias acompanhados"} ·{" "}
              {review.essential} no modo essencial
            </p>
          </div>
          <span className="review-average">
            {review.average === null ? "—" : `${review.average}%`}
            <small>média até hoje</small>
          </span>
        </div>
        <div className="review-bars">
          {review.days.map(({ key, day, eligible }) => {
            const value = score(day),
              scheduled = activeHabits(day).length > 0;
            return (
              <button
                key={key}
                className={`review-day ${key === p.today ? "today" : ""} ${key === p.date ? "selected" : ""} ${!eligible ? "unavailable" : ""}`}
                disabled={!eligible}
                aria-pressed={key === p.date}
                aria-label={`${dateLabel(key)}: ${!eligible ? "fora do período" : !scheduled ? "sem hábitos" : `${value}%${day.mode === "essential" ? ", dia essencial" : ""}`}`}
                onClick={() => {
                  p.setDate(key);
                }}
              >
                <span className="review-bar-value">
                  {eligible && scheduled ? `${value}%` : "—"}
                </span>
                <span className="review-bar-track">
                  <i
                    style={{
                      height:
                        eligible && scheduled ? `${Math.max(2, value)}%` : "0%",
                    }}
                  />
                  {day.mode === "essential" && eligible && <Leaf size={13} />}
                </span>
                <strong>
                  {weekdays[new Date(`${key}T12:00:00`).getDay()]}
                </strong>
                <small>
                  {dateLabel(key, { day: "numeric", month: "2-digit" })}
                </small>
                <span className="review-day-status">
                  {key === p.today
                    ? "Em andamento"
                    : eligible
                      ? p.state.days[key]
                        ? "Registrado"
                        : "Sem registro"
                      : "—"}
                </span>
              </button>
            );
          })}
        </div>
        <p className="review-method">
          Dias sem registro contam como zero; dias futuros ficam de fora. O modo
          essencial usa somente os hábitos escolhidos para aquele dia. Selecione
          uma coluna para mudar o dia em análise.
        </p>
      </section>
      <div className="review-facts">
        <div>
          <span>Dias na meta de constância</span>
          <strong>
            {review.consistent}
            <small> de {review.elapsed}</small>
          </strong>
        </div>
        <div>
          <span>Água por dia acompanhado</span>
          <strong>
            {review.water === null ? "—" : number(review.water / 1000, 2)}
            <small> L</small>
          </strong>
        </div>
        <div>
          <span>Sono nos dias registrados</span>
          <strong>
            {review.sleep === null ? "—" : number(review.sleep, 1)}
            <small> h</small>
          </strong>
          <p>
            {review.sleepCount}{" "}
            {review.sleepCount === 1 ? "registro" : "registros"}
          </p>
        </div>
        <div>
          <span>Tempo de foco registrado</span>
          <strong>
            {number(review.focus, 1)}
            <small> min</small>
          </strong>
        </div>
      </div>
      <div className="review-layout">
        <section className="panel review-notes" data-tutorial-target="review-notes">
          <div className="section-heading">
            <div>
              <h3>Leve um aprendizado adiante.</h3>
              <p>Escolha um ajuste pequeno para a próxima semana.</p>
            </div>
            <CalendarCheck2 size={21} />
            <TutorialTrigger id="feature-review" completed={p.completedTutorials.includes("feature-review")} onStart={p.startTutorial} />
          </div>
          <form
            className="stack-form"
            onChange={() => setDirty(true)}
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await p.mutate(
                  apiOperations.week.update(review.start),
                  { worked, adjustment, priority },
                  "PUT",
                )
              )
                setDirty(false);
            }}
          >
            <label>
              O que funcionou?
              <textarea
                rows={3}
                maxLength={2000}
                value={worked}
                onChange={(e) => setWorked(e.target.value)}
                placeholder="Ex.: caminhar logo depois do almoço"
              />
            </label>
            <label>
              O que precisa ficar mais fácil?
              <textarea
                rows={3}
                maxLength={2000}
                value={adjustment}
                onChange={(e) => setAdjustment(e.target.value)}
                placeholder="Ex.: deixar o café da manhã pronto na noite anterior"
              />
            </label>
            <label>
              Uma prioridade para a próxima semana
              <textarea
                rows={2}
                maxLength={1000}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                placeholder="Escolha uma mudança que caiba no seu dia."
              />
            </label>
            <div className="review-save" data-tutorial-target="review-save">
              <span role="status">
                {dirty ? (
                  "Alterações não salvas"
                ) : note ? (
                  <>
                    <Check size={14} />
                    Revisão salva
                  </>
                ) : (
                  "Ainda sem anotações"
                )}
              </span>
              <button className="button primary" disabled={p.busy || !dirty}>
                <Save size={16} />
                Salvar revisão
              </button>
            </div>
          </form>
        </section>
        <section className="panel review-areas">
          <div className="section-heading">
            <h3>Um olhar por área</h3>
            <Leaf size={19} />
          </div>
          <p>Cumprimento dos hábitos previstos até hoje.</p>
          {review.byCategory.map(({ category, progress, count }) => (
            <div className="review-category" key={category}>
              <span className={`category-tile ${categories[category].color}`}>
                <CategoryIcon category={category} />
              </span>
              <div>
                <strong>{categories[category].label}</strong>
                <div className="review-category-track">
                  <i style={{ width: `${progress ?? 0}%` }} />
                </div>
                <small>
                  {count
                    ? `${count} ${count === 1 ? "hábito previsto" : "hábitos previstos"}`
                    : "Sem hábitos previstos"}
                </small>
              </div>
              <span>{progress === null ? "—" : `${progress}%`}</span>
            </div>
          ))}
          <button className="button secondary" onClick={() => p.nav("rotina")}>
            Ajustar minha rotina
            <ArrowRight size={16} />
          </button>
        </section>
      </div>
    </>
  );
}

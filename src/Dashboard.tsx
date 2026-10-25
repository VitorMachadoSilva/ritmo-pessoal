import { useState } from "react";
import { ArrowUpRight, BookOpen as BookIcon, Check, ChevronDown, ChevronRight, CircleCheck, Flame, Footprints, Moon, Plus, Sprout, Trophy, Zap } from "lucide-react";
import type { Habit, Mutation, PageId, State } from "./types";
import { addDays, completed, orderedHabits, habitValue, isPerfectDay, perfectDayBonus, perfectStreak, isEssential, dateLabel, dayFor, isDone, number, score, streak, xpTotal } from "./lib";
import { ArrowLink, Empty, HabitRow, Heatmap, Metric, ProgressOrbit } from "./ui";
import { WaterWidget } from "./components/dashboard/WaterWidget";
import { MoodWidget } from "./components/dashboard/MoodWidget";
import { WeightWidget } from "./components/dashboard/WeightWidget";
import { apiOperations } from "./api-operations";
export { WaterWidget, MoodWidget, WeightWidget };

type Props = {
  state: State;
  date: string;
  today: string;
  mutate: Mutation;
  busy: boolean;
  openHabit: (habit: Habit) => void;
  nav: (page: PageId) => void;
  onSelectDate: (date: string) => void;
  addHabit: () => void;
  startTutorial: (id: string, trigger: HTMLElement) => void;
  completedTutorials: string[];
};

export default function Dashboard({
  state,
  date,
  today,
  mutate,
  busy,
  openHabit,
  nav,
  onSelectDate,
  addHabit,
  startTutorial,
  completedTutorials,
}: Props) {
  const day = dayFor(state, date);
  const [filter, setFilter] = useState("all");
  const [openPeriods, setOpenPeriods] = useState<Record<string, boolean>>({ morning: true, afternoon: true, evening: true });
  const totalXp = xpTotal(state);
  const seq = streak(state, today);
  const perfectDays = perfectStreak(state, date);
  const weekStart = addDays(
    date,
    -((new Date(`${date}T12:00:00`).getDay() + 6) % 7),
  );
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const consistent = week.filter(
    (d) => d <= today && score(dayFor(state, d)) >= dayFor(state, d).threshold,
  ).length;
  const level = Math.floor(totalXp / 500) + 1;
  const scheduled = orderedHabits(day);
  const remaining = scheduled.filter((h) => !isDone(h, day));
  const nextHabit = remaining.find((h) => habitValue(h, day) === 0) ?? remaining[0];
  const timeNow = new Intl.DateTimeFormat("en-GB", {
    timeZone: state.settings.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
  const groups = [
    {
      id: "morning",
      label: "Manhã",
      sub: "Comece cuidando de você",
      range: [0, 12],
      icon: <Sprout size={16} />,
    },
    {
      id: "afternoon",
      label: "Tarde",
      sub: "Movimento e intenção",
      range: [12, 18],
      icon: <Zap size={16} />,
    },
    {
      id: "evening",
      label: "Noite",
      sub: "Recupere. Amanhã tem mais.",
      range: [18, 24],
      icon: <Moon size={16} />,
    },
  ];
  const rows = scheduled.filter(
      (h) =>
        filter === "all" ||
        (filter === "done" ? isDone(h, day) : !isDone(h, day)),
    );
  const completedToday = completed(day);
  async function toggle(h: Habit) {
    if (h.kind !== "check") {
      openHabit(h);
      return;
    }
    await mutate(
      apiOperations.day.update(date),
      { habitId: h.id, value: isDone(h, day) ? 0 : h.target },
      "PATCH",
    );
  }
  return (
    <>
      <div className="overview-top">
        <section className="daily-hero" data-tutorial-target="today-overview">
          <div className="hero-copy">
            <span className="hero-overline">
              <span className="live-dot" />{" "}
              {date === today
                ? "Seu dia está acontecendo"
                : "Um capítulo da sua jornada"}
            </span>
            <h2>
              {score(day) >= 100 ? (
                <>
                  Você cuidou de você.
                  <br />
                  Isso é uma conquista.
                </>
              ) : (
                <>
                  Uma boa rotina.
                  <br />
                  Um dia de cada vez.
                </>
              )}
            </h2>
            <p>
              {!scheduled.length
                ? "Nenhum hábito previsto nesta seleção. Você pode ajustar sua rotina."
                : remaining.length
                  ? `${completedToday} de ${scheduled.length} hábitos concluídos. Seu próximo passo conta.`
                  : "Reserve um momento para reconhecer seu esforço."}
            </p>
            <button
              className="hero-action"
              onClick={() => {
                if (!scheduled.length) nav("rotina");
                else if (nextHabit) openHabit(nextHabit);
                else nav("diario");
              }}
            >
              {!scheduled.length
                ? "Editar minha rotina"
                : remaining.length
                  ? "Continuar meu dia"
                  : "Registrar minha vitória"}
              <ArrowUpRight size={16} />
            </button>
          </div>
          <ProgressOrbit key={date} day={day} />
        </section>
        <section className="journey-panel">
          <div className="journey-top">
            <span className="journey-trophy">
              <Trophy size={21} />
            </span>
            <span>
              Nível {level}
              <small>
                {
                  [
                    "Primeiros passos",
                    "Criando raízes",
                    "Em movimento",
                    "Encontrando o ritmo",
                    "Sua melhor versão",
                  ][Math.min(4, level - 1)]
                }
              </small>
            </span>
            <span className="journey-spark">✦</span>
          </div>
          <div className="xp-line">
            <strong>
              {number(totalXp)} <small>XP</small>
            </strong>
            <span>{500 - (totalXp % 500)} para o próximo nível</span>
          </div>
          <div className="xp-track">
            <span style={{ width: `${(totalXp % 500) / 5}%` }} />
          </div>
          {isPerfectDay(day) && (
            <p className="perfect-day-note">Dia completo · +{perfectDayBonus(perfectDays)} XP · {perfectDays} {perfectDays === 1 ? "dia" : "dias"} a 100%</p>
          )}
          <div className="journey-week">
            <span>Seu ritmo nesta semana</span>
            <div className="week-dots">
              {week.map((key, i) => {
                const d = dayFor(state, key);
                const good = score(d) >= d.threshold && d.habits.length > 0;
                return (
                  <button
                    key={key}
                    disabled={key > today || key < state.settings.startDate}
                    onClick={() => onSelectDate(key)}
                    title={`${dateLabel(key)}: ${score(d)}%`}
                    className={`${good ? "good" : ""} ${key === date ? "current" : ""}`}
                  >
                    <span>{["S", "T", "Q", "Q", "S", "S", "D"][i]}</span>
                    <i>
                      {good ? (
                        <Check size={13} />
                      ) : key === today ? (
                        <span />
                      ) : null}
                    </i>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
      <section className="day-mode" aria-label="Ritmo do dia">
        <div>
          <strong>
            {date !== today
              ? "O ritmo deste dia ficou registrado."
              : day.mode === "essential"
                ? "Hoje, cuide do essencial."
                : "Qual é o ritmo de hoje?"}
          </strong>
          <p>
            {date === today
              ? "Escolha uma lista menor quando precisar. Metas e registros são preservados."
              : "O ritmo escolhido ficou registrado neste dia."}
          </p>
        </div>
        <div className="mode-options">
          {(
            [
              { id: "full", label: "Rotina completa" },
              { id: "essential", label: "Dia essencial" },
            ] as const
          ).map((mode) => (
            <button
              key={mode.id}
              aria-pressed={(day.mode ?? "full") === mode.id}
              disabled={
                busy ||
                date !== today ||
                (mode.id === "essential" && !day.habits.some(isEssential))
              }
              data-pending-disabled={
                (busy && date === today &&
                  (mode.id === "full" || day.habits.some(isEssential))) || undefined
              }
              onClick={() =>
                mutate(apiOperations.day.update(date), { mode: mode.id }, "PATCH")
              }
            >
              {mode.label}
            </button>
          ))}
        </div>
        {!day.habits.some(isEssential) && (
          <button className="text-button" onClick={() => nav("rotina")}>
            Escolher hábitos essenciais
          </button>
        )}
      </section>
      <div className="rhythm-shortcuts">
        <button onClick={() => nav("foco")}>
          <Zap size={16} />
          <span>Uma coisa de cada vez</span>
          <strong>Abrir foco</strong>
          <ArrowUpRight size={15} />
        </button>
        <button onClick={() => nav("semana")}>
          <BookIcon />
          <span>Olhe para a sua semana</span>
          <strong>Fazer revisão</strong>
          <ArrowUpRight size={15} />
        </button>
      </div>
      <div className="metrics-strip">
        <Metric
          icon={<CircleCheck size={21} />}
          label="Hábitos do dia"
          value={
            <>
              {completedToday}
              <small> / {scheduled.length}</small>
            </>
          }
          detail={
            !scheduled.length
              ? "Nenhum hábito previsto nesta seleção"
              : remaining.length
                ? `${remaining.length} oportunidades à frente`
                : "Dia completo. Celebre!"
          }
          color="green"
        />
        <Metric
          icon={<Flame size={21} />}
          label="Sequência da meta"
          value={
            <>
              {seq}
              <small> {seq === 1 ? "dia" : "dias"}</small>
            </>
          }
          detail={`Meta diária: ${state.settings.dailyThreshold}% para manter a sequência`}
          color="orange"
        />
        <Metric
          icon={<Footprints size={21} />}
          label="Dias consistentes"
          value={
            <>
              {consistent}
              <small> / 7</small>
            </>
          }
          detail="Nesta semana"
          color="purple"
        />
        <Metric
          icon={<Moon size={21} />}
          label="Sono da noite"
          value={
            <>
              {day.sleep === null ? "—" : number(day.sleep, 1)}
              <small> horas</small>
            </>
          }
          detail={`Um encontro com ${state.settings.sleepGoal}h de descanso`}
          color="blue"
        />
      </div>
      <div className="dashboard-columns">
        <section className="panel agenda-panel" data-tutorial-target="today-agenda">
          <div className="section-heading">
            <div>
              <h2>Seu dia, passo a passo</h2>
              <p>
                {dateLabel(date, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>
            <button
              className="icon-button add-outline"
              aria-label="Adicionar hábito"
              onClick={addHabit}
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="agenda-toolbar">
            <div className="tabs" role="group" aria-label="Filtrar hábitos">
              {[
                ["all", "Todos"],
                ["todo", "A fazer"],
                ["done", "Concluídos"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  aria-pressed={filter === id}
                  className={filter === id ? "active" : ""}
                  onClick={() => setFilter(id)}
                >
                  {label}
                  {id === "all" && <span>{scheduled.length}</span>}
                </button>
              ))}
            </div>
            <ArrowLink onClick={() => nav("rotina")}>Minha rotina</ArrowLink>
          </div>
          <div className="agenda-scroll">
            {!rows.length ? (
              <Empty
                icon={<CircleCheck size={28} />}
                title={
                  filter === "todo"
                    ? "Tudo feito por aqui."
                    : filter === "done"
                      ? "Sua primeira vitória espera por você."
                      : "Um dia com espaço para recomeçar."
                }
                action={
                  filter === "all" ? (
                    <button className="button secondary" onClick={addHabit}>
                      Adicionar um hábito
                    </button>
                  ) : undefined
                }
              >
                {filter === "done"
                  ? "Conclua um hábito para começar a preencher esta lista."
                  : filter === "todo"
                    ? "Aproveite uma pausa e reconheça seu progresso."
                    : "Adicione hábitos e monte uma rotina que faça sentido para você."}
              </Empty>
            ) : (
              groups.map((group) => {
                const habits = rows.filter((h) => {
                  const hour = Number(h.time.slice(0, 2));
                  return hour >= group.range[0] && hour < group.range[1];
                });
                return habits.length ? (
                  <section className={`time-group period-${group.id}`} key={group.id} aria-label={`Hábitos da ${group.label.toLowerCase()}`}>
                    <button type="button" className="time-group-heading" aria-expanded={openPeriods[group.id]} aria-controls={`period-${group.id}`} onClick={() => setOpenPeriods((current) => ({ ...current, [group.id]: !current[group.id] }))}>
                      <span className="time-group-name">
                        {group.icon}
                        {group.label}
                      </span>
                      <small>{group.sub}</small>
                      <span className="time-group-count">
                        {habits.filter((h) => isDone(h, day)).length}/
                        {habits.length}
                      </span>
                      <ChevronDown className="time-group-chevron" size={16} aria-hidden="true" />
                    </button>
                    <div id={`period-${group.id}`} hidden={!openPeriods[group.id]} className="time-group-items">
                    {habits.map((h) => (
                      <div className="timeline-row" key={h.id}>
                        <time>{h.time}</time>
                        <HabitRow
                          habit={h}
                          day={day}
                          busy={busy}
                          status={
                            date < today
                              ? "Pendente"
                              : h.time <= timeNow
                                ? "Disponível"
                                : "Mais tarde"
                          }
                          onToggle={() => toggle(h)}
                          onEdit={() => openHabit(h)}
                        />
                      </div>
                    ))}
                    </div>
                  </section>
                ) : null;
              })
            )}
          </div>
          <div className="agenda-footer">
            <span>
              <span className="live-dot" />
              {completedToday
                ? "Cada ação é um voto em você."
                : "Seu próximo passo pode ser pequeno."}
            </span>
            <span>
              {score(day)}% do dia
              <ChevronRight size={13} />
            </span>
          </div>
        </section>
        <aside className="dashboard-rail">
          <WaterWidget
            day={day}
            date={date}
            mutate={mutate}
            busy={busy}
            startTutorial={startTutorial}
            completedTutorials={completedTutorials}
            goal={
              day.habits.find((h) => h.kind === "water")?.target ??
              state.settings.waterGoal
            }
          />
          <WeightWidget state={state} onRegister={() => nav("evolucao")} />
          <MoodWidget day={day} date={date} mutate={mutate} busy={busy} />
          <button className="journal-prompt" onClick={() => nav("diario")}>
            <div>
              <span>Um instante para você</span>
              <p>O que fez seu dia valer a pena?</p>
            </div>
            <ArrowUpRight size={20} />
          </button>
        </aside>
      </div>
      <Heatmap state={state} today={today} onSelect={onSelectDate} />
      <div className="dashboard-footnote">
        <Sprout size={14} />
        <span>
          Você está construindo uma rotina, não disputando uma corrida.
        </span>
      </div>
    </>
  );
}

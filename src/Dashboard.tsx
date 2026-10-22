import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleCheck,
  Droplets,
  Flame,
  Footprints,
  Moon,
  Plus,
  Sprout,
  Target,
  Trophy,
  Zap,
  BookOpen as BookIcon,
} from "lucide-react";
import type { Day, Habit, Mutation, PageId, State } from "./types";
import {
  addDays,
  completed,
  activeHabits,
  isEssential,
  dateLabel,
  dayFor,
  isDone,
  number,
  score,
  streak,
  xpTotal,
} from "./lib";
import {
  ArrowLink,
  Empty,
  HabitRow,
  Heatmap,
  Metric,
  ProgressOrbit,
} from "./ui";
type Props = {
  state: State;
  date: string;
  today: string;
  mutate: Mutation;
  busy: boolean;
  openHabit: (h: Habit) => void;
  nav: (p: PageId) => void;
  onSelectDate: (date: string) => void;
  addHabit: () => void;
};
export function WaterWidget({
  day,
  mutate,
  date,
  busy,
  goal,
}: {
  day: Day;
  mutate: Mutation;
  date: string;
  busy: boolean;
  goal: number;
}) {
  const ratio = Math.min(1, day.water / goal);
  return (
    <section className="water-widget">
      <div className="widget-heading">
        <span className="widget-icon">
          <Droplets size={18} />
        </span>
        <h3>Um gole de cuidado.</h3>
        <span>{Math.round(ratio * 100)}%</span>
      </div>
      <div className="water-content">
        <div>
          <div className="water-number">
            {number(day.water / 1000, 2)}
            <span> / {number(goal / 1000, 1)} L</span>
          </div>
          <p>
            {ratio >= 1
              ? "Meta do dia alcançada."
              : "Distribua a água ao longo do dia."}
          </p>
        </div>
        <div
          className="water-vessel"
          role="img"
          aria-label={`${day.water} de ${goal} ml`}
        >
          <div className="vessel-mark m1" />
          <div className="vessel-mark m2" />
          <div className="vessel-mark m3" />
          <div
            className="water-fill"
            style={{ height: `${Math.max(4, ratio * 100)}%` }}
          />
          <Droplets size={20} />
        </div>
      </div>
      <div className="water-buttons">
        <button
          disabled={busy}
          onClick={() =>
            mutate(`/api/day/${date}`, { waterDelta: 250 }, "PATCH")
          }
        >
          <Plus size={14} />
          250 ml
        </button>
        <button
          disabled={busy}
          onClick={() =>
            mutate(`/api/day/${date}`, { waterDelta: 500 }, "PATCH")
          }
        >
          <Plus size={14} />
          500 ml
        </button>
        <button
          className="water-undo"
          title="Retirar 250 ml"
          aria-label="Retirar 250 ml"
          disabled={busy || day.water === 0}
          onClick={() =>
            mutate(`/api/day/${date}`, { waterDelta: -250 }, "PATCH")
          }
        >
          −
        </button>
      </div>
    </section>
  );
}
export function MoodWidget({
  day,
  date,
  mutate,
  busy,
}: {
  day: Day;
  date: string;
  mutate: Mutation;
  busy: boolean;
}) {
  return (
    <section className="panel mood-widget">
      <div className="section-heading small">
        <h3>Como está sua energia?</h3>
        <Zap size={16} />
      </div>
      <p>Uma pausa para perceber como você está.</p>
      <div className="mood-buttons">
        {[
          { v: 1, face: "😴", name: "Muito baixa" },
          { v: 2, face: "😕", name: "Baixa" },
          { v: 3, face: "😌", name: "Regular" },
          { v: 4, face: "🙂", name: "Boa" },
          { v: 5, face: "⚡", name: "Muito boa" },
        ].map((m) => (
          <button
            key={m.v}
            aria-label={`Energia ${m.name.toLowerCase()}`}
            aria-pressed={day.energy === m.v}
            title={m.name}
            disabled={busy}
            className={day.energy === m.v ? "selected" : ""}
            onClick={() =>
              mutate(
                `/api/day/${date}`,
                { energy: day.energy === m.v ? null : m.v },
                "PATCH",
              )
            }
          >
            <span>{m.face}</span>
            <i>{m.v}</i>
          </button>
        ))}
      </div>
    </section>
  );
}
export function WeightWidget({
  state,
  onRegister,
}: {
  state: State;
  onRegister: () => void;
}) {
  const weights = Object.entries(state.days)
    .filter(([, d]) => d.weight !== null)
    .sort(([a], [b]) => a.localeCompare(b));
  const current = weights.at(-1)?.[1].weight ?? state.settings.initialWeight;
  const delta = current - state.settings.initialWeight;
  const goal = state.settings.goalWeight;
  const progress =
    state.settings.initialWeight === goal
      ? 100
      : Math.min(
          100,
          Math.max(
            0,
            ((state.settings.initialWeight - current) /
              (state.settings.initialWeight - goal)) *
              100,
          ),
        );
  return (
    <section className="panel weight-widget">
      <div className="section-heading small">
        <h3>Sua primeira conquista</h3>
        <Target size={17} />
      </div>
      <div className="weight-values">
        <div>
          <strong>
            {number(current, 1)}
            <small>kg</small>
          </strong>
          <span>{weights.length ? "Último registro" : "Ponto de partida"}</span>
        </div>
        <ArrowDownRight size={21} className="weight-arrow" />
        <div className="weight-target">
          <strong>
            {number(goal, 1)}
            <small>kg</small>
          </strong>
          <span>Primeira meta</span>
        </div>
      </div>
      <div className="goal-track">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="weight-bottom">
        <span>
          {delta < 0
            ? `${number(-delta, 1)} kg a menos`
            : delta > 0
              ? `${number(delta, 1)} kg acima do início`
              : "Cada passo aproxima você."}
        </span>
        <button className="text-button" onClick={onRegister}>
          Registrar
          <Plus size={13} />
        </button>
      </div>
    </section>
  );
}
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
}: Props) {
  const day = dayFor(state, date);
  const [filter, setFilter] = useState("all");
  const totalXp = xpTotal(state);
  const seq = streak(state, today);
  const weekStart = addDays(
    date,
    -((new Date(`${date}T12:00:00`).getDay() + 6) % 7),
  );
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const consistent = week.filter(
    (d) => d <= today && score(dayFor(state, d)) >= dayFor(state, d).threshold,
  ).length;
  const level = Math.floor(totalXp / 500) + 1;
  const scheduled = activeHabits(day);
  const remaining = scheduled.filter((h) => !isDone(h, day));
  const timeNow = new Intl.DateTimeFormat("en-GB", {
    timeZone: state.settings.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
  const groups = [
    {
      label: "Manhã",
      sub: "Comece cuidando de você",
      range: [0, 12],
      icon: <Sprout size={16} />,
    },
    {
      label: "Tarde",
      sub: "Movimento e intenção",
      range: [12, 18],
      icon: <Zap size={16} />,
    },
    {
      label: "Noite",
      sub: "Recupere. Amanhã tem mais.",
      range: [18, 24],
      icon: <Moon size={16} />,
    },
  ];
  const rows = scheduled
    .filter(
      (h) =>
        filter === "all" ||
        (filter === "done" ? isDone(h, day) : !isDone(h, day)),
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  const completedToday = completed(day);
  async function toggle(h: Habit) {
    if (h.kind !== "check") {
      openHabit(h);
      return;
    }
    await mutate(
      `/api/day/${date}`,
      { habitId: h.id, value: isDone(h, day) ? 0 : h.target },
      "PATCH",
    );
  }
  return (
    <>
      <div className="overview-top">
        <section className="daily-hero">
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
                else if (remaining[0]) openHabit(remaining[0]);
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
          <ProgressOrbit day={day} />
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
              onClick={() =>
                mutate(`/api/day/${date}`, { mode: mode.id }, "PATCH")
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
          label="Sua sequência"
          value={
            <>
              {seq}
              <small> {seq === 1 ? "dia" : "dias"}</small>
            </>
          }
          detail={`Sua meta de constância: ${state.settings.dailyThreshold}%`}
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
        <section className="panel agenda-panel">
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
                  <div className="time-group" key={group.label}>
                    <div className="time-group-heading">
                      <span>
                        {group.icon}
                        {group.label}
                      </span>
                      <small>{group.sub}</small>
                      <span className="time-group-count">
                        {habits.filter((h) => isDone(h, day)).length}/
                        {habits.length}
                      </span>
                    </div>
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

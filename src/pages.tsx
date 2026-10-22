import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  ArchiveRestore,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowUpRight,
  Award,
  BookOpen,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  Dumbbell,
  Edit3,
  Flame,
  Heart,
  Leaf,
  LockKeyhole,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  Target,
  Trash2,
  Trophy,
  Utensils,
  Weight,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  Habit,
  Meal,
  Mutation,
  PageId,
  State,
  Workout,
  WorkoutRecord,
} from "./types";
import {
  addDays,
  bestStreak,
  categories,
  allCompleted,
  isEssential,
  dateLabel,
  dayFor,
  downloadBackup,
  number,
  score,
  weekdays,
  xpTotal,
} from "./lib";
import { CategoryIcon, Empty, Heatmap, Metric, Tag } from "./ui";
import { MealForm, PasswordForm, SettingsForm, WorkoutForm } from "./forms";
export type DialogOptions = {
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
};
export type PageProps = {
  state: State;
  date: string;
  today: string;
  mutate: Mutation;
  busy: boolean;
  nav: (p: PageId) => void;
  openHabit: (h: Habit) => void;
  editHabit: (h: Habit) => void;
  addHabit: () => void;
  setDate: (d: string) => void;
  dialog: (d: DialogOptions | null) => void;
  confirm: (
    title: string,
    body: string,
    action: () => Promise<boolean>,
  ) => void;
};
export function RoutinePage(p: PageProps) {
  const [category, setCategory] = useState("all"),
    [search, setSearch] = useState(""),
    [archived, setArchived] = useState(false);
  const habits = p.state.habits
    .filter(
      (h) =>
        h.archived === archived &&
        (category === "all" || h.category === category) &&
        h.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  return (
    <>
      <div className="page-intro">
        <div>
          <h2>Uma rotina com a sua cara.</h2>
          <p>Comece com o que faz sentido. Ajuste conforme a vida acontece.</p>
        </div>
        <button className="button primary" onClick={p.addHabit}>
          <Plus size={17} />
          Novo hábito
        </button>
      </div>
      <div className="routine-summary">
        <span className="routine-sprout">
          <Sprout size={32} strokeWidth={1.4} />
        </span>
        <div>
          <strong>
            {p.state.habits.filter((h) => !h.archived).length} hábitos para
            cultivar
          </strong>
          <p>Corpo, mente e bem-estar caminhando juntos.</p>
        </div>
        <div className="category-dots">
          {Object.keys(categories).map((c) => (
            <span
              key={c}
              className={categories[c as keyof typeof categories].color}
            >
              <CategoryIcon category={c as keyof typeof categories} />
            </span>
          ))}
        </div>
      </div>
      <div className="routine-tools">
        <div className="filter-chips" aria-label="Filtrar área">
          <button
            className={category === "all" ? "selected" : ""}
            onClick={() => setCategory("all")}
          >
            Todas as áreas
          </button>
          {Object.entries(categories).map(([id, c]) => (
            <button
              key={id}
              className={category === id ? "selected" : ""}
              onClick={() => setCategory(id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <label className="search-field">
          <Search size={16} />
          <input
            aria-label="Buscar hábito"
            placeholder="Buscar hábito"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      <section className="panel routine-list">
        <div className="section-heading">
          <h3>{archived ? "Hábitos removidos" : "Seus compromissos"}</h3>
          <button
            className="text-button"
            onClick={() => setArchived(!archived)}
          >
            <ArchiveRestore size={15} />
            {archived ? "Ver hábitos ativos" : "Ver removidos"}
          </button>
        </div>
        {habits.length ? (
          habits.map((h) => (
            <div className="routine-row" key={h.id}>
              <span className={`category-tile ${categories[h.category].color}`}>
                <CategoryIcon category={h.category} />
              </span>
              <div className="routine-habit-text">
                <strong>
                  {h.title}{" "}
                  {isEssential(h) && (
                    <span className="essential-badge">Essencial</span>
                  )}
                </strong>
                <p>{h.description}</p>
                <div className="routine-schedule">
                  <Clock3 size={12} />
                  {h.time}
                  <span>·</span>
                  {h.days.length === 7
                    ? "Todos os dias"
                    : h.days.map((d) => weekdays[d]).join(", ")}
                </div>
              </div>
              <Tag category={h.category} />
              <div className="row-actions">
                {archived ? (
                  <button
                    className="button secondary compact"
                    onClick={() =>
                      p.mutate(
                        `/api/habits/${h.id}`,
                        { ...h, archived: false },
                        "PUT",
                      )
                    }
                  >
                    <ArchiveRestore size={14} />
                    Restaurar
                  </button>
                ) : (
                  <>
                    <button
                      className="icon-button"
                      aria-label={`Editar ${h.title}`}
                      onClick={() => p.editHabit(h)}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      className="icon-button danger-text"
                      aria-label={`Remover ${h.title}`}
                      onClick={() =>
                        p.confirm(
                          "Remover da rotina?",
                          `“${h.title}” deixará de aparecer a partir de hoje. Registros anteriores serão preservados. Você pode restaurá-lo em Ver removidos.`,
                          () =>
                            p.mutate(
                              `/api/habits/${h.id}`,
                              { ...h, archived: true },
                              "PUT",
                            ),
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <Empty
            icon={<Leaf size={28} />}
            title={
              archived ? "Nada removido por aqui." : "Nenhum hábito encontrado."
            }
          >
            {archived
              ? "Se você remover um hábito, poderá recuperá-lo aqui."
              : "Tente outra busca ou adicione um novo hábito."}
          </Empty>
        )}
      </section>
      <div className="soft-note">
        <Heart size={17} />
        <span>
          A rotina é uma ferramenta para cuidar de você. Edite sem culpa quando
          precisar.
        </span>
      </div>
    </>
  );
}
export function ProgressPage(p: PageProps) {
  const [period, setPeriod] = useState(30);
  const s = p.state,
    day = dayFor(s, p.date);
  const history = Object.entries(s.days)
    .filter(([, d]) => d.weight !== null)
    .sort(([a], [b]) => a.localeCompare(b));
  const current = history.at(-1)?.[1].weight ?? s.settings.initialWeight;
  const lost = s.settings.initialWeight - current;
  const first = addDays(p.today, -period + 1);
  const daily = Array.from({ length: period }, (_, i) =>
    addDays(first, i),
  ).filter((k) => k >= s.settings.startDate);
  const average = daily.length
    ? Math.round(
        daily.reduce((n, k) => n + score(dayFor(s, k)), 0) / daily.length,
      )
    : 0;
  const chart = history
    .filter(([date]) => date >= first)
    .map(([date, d]) => ({
      date,
      label: dateLabel(date, { day: "2-digit", month: "short" }),
      weight: d.weight,
    }));
  const totalHabits = Object.values(s.days).reduce(
    (n, d) => n + allCompleted(d),
    0,
  );
  const best = bestStreak(s);
  const achievements = [
    {
      name: "Primeiro passo",
      detail: "Conclua seu primeiro hábito",
      done: totalHabits >= 1,
      icon: <Sprout size={23} />,
    },
    {
      name: "Uma semana de ritmo",
      detail: "7 dias seguidos de constância",
      done: best >= 7,
      icon: <Flame size={23} />,
    },
    {
      name: "Pequenas grandes vitórias",
      detail: "Conclua 100 hábitos",
      done: totalHabits >= 100,
      icon: <Trophy size={23} />,
    },
    {
      name: "Raízes fortes",
      detail: "30 dias seguidos de constância",
      done: best >= 30,
      icon: <Award size={23} />,
    },
  ];
  return (
    <>
      <div className="page-intro">
        <div>
          <h2>Veja o quanto você já caminhou.</h2>
          <p>O progresso aparece nos detalhes que se repetem.</p>
        </div>
        <div className="tabs period-tabs">
          {[7, 30, 90].map((n) => (
            <button
              key={n}
              aria-pressed={period === n}
              className={period === n ? "active" : ""}
              onClick={() => setPeriod(n)}
            >
              {n} dias
            </button>
          ))}
        </div>
      </div>
      <div className="metrics-strip page-metrics">
        <Metric
          icon={<Target size={22} />}
          label="Consistência média"
          value={
            <>
              {average}
              <small>%</small>
            </>
          }
          detail={`Últimos ${period} dias, desde seu início`}
        />
        <Metric
          icon={<CheckCheck size={22} />}
          label="Hábitos concluídos"
          value={number(totalHabits)}
          detail="Pequenas vitórias acumuladas"
          color="purple"
        />
        <Metric
          icon={<Flame size={22} />}
          label="Melhor sequência"
          value={
            <>
              {best}
              <small> dias</small>
            </>
          }
          detail={`Dias com pelo menos ${s.settings.dailyThreshold}%`}
          color="orange"
        />
        <Metric
          icon={<Sparkles size={22} />}
          label="Experiência total"
          value={
            <>
              {number(xpTotal(s))}
              <small> XP</small>
            </>
          }
          detail="10 XP por hábito concluído"
          color="blue"
        />
      </div>
      <div className="progress-columns">
        <section className="panel weight-chart-panel">
          <div className="section-heading">
            <div>
              <h3>Mais saúde, passo a passo</h3>
              <p>Peso registrado em kg</p>
            </div>
            <span className="pill green">
              Meta: {number(s.settings.goalWeight, 1)} kg
            </span>
          </div>
          <div className="weight-chart-numbers">
            <strong>
              {number(current, 1)}
              <small>kg</small>
            </strong>
            <span>
              {lost > 0
                ? `${number(lost, 1)} kg desde o início`
                : lost < 0
                  ? `${number(-lost, 1)} kg acima do início`
                  : "Seu ponto de partida"}
            </span>
          </div>
          {chart.length > 0 ? (
            <div className="weight-chart">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart
                  data={chart}
                  margin={{ top: 20, right: 20, left: -20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 5"
                    vertical={false}
                    stroke="#e8ece9"
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#78847d" }}
                    minTickGap={35}
                  />
                  <YAxis
                    domain={["dataMin - 1", "dataMax + 1"]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#78847d" }}
                    tickFormatter={(v) => number(v, 1)}
                  />
                  <Tooltip
                    formatter={(v) => [`${number(Number(v), 1)} kg`, "Peso"]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e6eae7",
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#397a65"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#fff", strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty
              icon={<Weight size={30} />}
              title="Seu gráfico começa com um registro."
            >
              Registre seu peso ao lado. Com o tempo, observe a tendência em vez
              de um número isolado.
            </Empty>
          )}
        </section>
        <section className="panel weight-register">
          <span className="category-tile green">
            <Weight size={21} />
          </span>
          <h3>Um registro, sem julgamento.</h3>
          <p>
            Prefira o mesmo horário e as mesmas condições. Oscilações diárias
            são normais.
          </p>
          <form
            className="stack-form"
            key={`${p.date}-${day.weight}`}
            onSubmit={async (e) => {
              e.preventDefault();
              const d = new FormData(e.currentTarget);
              await p.mutate(
                `/api/day/${p.date}`,
                { weight: Number(d.get("weight")) },
                "PATCH",
              );
            }}
          >
            <label>
              Peso em {p.date === p.today ? "hoje" : dateLabel(p.date)}
              <div className="input-unit">
                <input
                  type="number"
                  name="weight"
                  min="30"
                  max="350"
                  step="0.1"
                  placeholder="96,0"
                  defaultValue={day.weight ?? ""}
                  required
                />
                <span>kg</span>
              </div>
            </label>
            <button className="button primary" disabled={p.busy}>
              <Plus size={16} />
              Salvar meu peso
            </button>
          </form>
          {day.weight !== null && (
            <button
              className="text-button danger-text"
              disabled={p.busy}
              onClick={() =>
                p.confirm(
                  "Remover este registro?",
                  `O peso registrado em ${dateLabel(p.date)} será removido.`,
                  () =>
                    p.mutate(`/api/day/${p.date}`, { weight: null }, "PATCH"),
                )
              }
            >
              Remover registro do dia
            </button>
          )}
        </section>
      </div>
      <Heatmap
        state={s}
        today={p.today}
        onSelect={(d) => {
          p.setDate(d);
          p.nav("hoje");
        }}
      />
      <section className="achievements">
        <div className="section-heading">
          <div>
            <h2>Conquistas que significam algo.</h2>
            <p>Reconheça o caminho, uma etapa de cada vez.</p>
          </div>
          <span>
            {achievements.filter((a) => a.done).length} de {achievements.length}
          </span>
        </div>
        <div className="achievement-grid">
          {achievements.map((a) => (
            <div
              className={`achievement ${a.done ? "unlocked" : ""}`}
              key={a.name}
            >
              <span className="achievement-icon">{a.icon}</span>
              <div>
                <h3>{a.name}</h3>
                <p>{a.detail}</p>
              </div>
              {a.done ? <Check size={16} /> : <LockKeyhole size={14} />}
            </div>
          ))}
        </div>
      </section>
      <div className="soft-note">
        <Activity size={17} />
        <span>
          A balança conta parte da história. Observe também sono, energia, força
          e como você se sente.
        </span>
      </div>
    </>
  );
}
function WorkoutSession({
  workout,
  previous,
  mutate,
  date,
  onClose,
}: {
  workout: Workout;
  previous: WorkoutRecord | null;
  mutate: Mutation;
  date: string;
  onClose: () => void;
}) {
  const [record, setRecord] = useState<WorkoutRecord>(
    previous?.templateId === workout.id
      ? previous
      : {
          templateId: workout.id,
          name: workout.name,
          completed: false,
          exercises: workout.exercises.map((e) => ({
            id: e.id,
            name: e.name,
            sets: Array.from({ length: e.sets }, () => ({
              weight: 0,
              reps: "",
              done: false,
            })),
          })),
        },
  );
  const [busy, setBusy] = useState(false);
  const allSets = record.exercises.flatMap((e) => e.sets);
  const setCount = allSets.filter((s) => s.done).length;
  const update = (
    id: string,
    index: number,
    patch: Partial<WorkoutRecord["exercises"][0]["sets"][0]>,
  ) =>
    setRecord((r) => ({
      ...r,
      exercises: r.exercises.map((e) =>
        e.id === id
          ? {
              ...e,
              sets: e.sets.map((s, i) =>
                i === index ? { ...s, ...patch } : s,
              ),
            }
          : e,
      ),
    }));
  async function save(complete: boolean) {
    setBusy(true);
    if (
      await mutate(
        `/api/day/${date}`,
        { workout: { ...record, completed: complete } },
        "PATCH",
      )
    )
      onClose();
    setBusy(false);
  }
  return (
    <div className="session">
      <div className="session-status">
        <Dumbbell size={19} />
        <strong>
          {setCount} de {allSets.length} séries registradas
        </strong>
        <span>{dateLabel(date)}</span>
      </div>
      <p className="field-help">{workout.notes}</p>
      {record.exercises.map((e, i) => (
        <section className="session-exercise" key={e.id}>
          <h3>
            <span>{String(i + 1).padStart(2, "0")}</span>
            {e.name}
          </h3>
          <div className="set-table">
            <div className="set-table-head">
              <span>Série</span>
              <span>Carga (kg)</span>
              <span>Reps / tempo</span>
              <span>Feito</span>
            </div>
            {e.sets.map((set, j) => (
              <div className={`set-row ${set.done ? "done" : ""}`} key={j}>
                <span>{j + 1}</span>
                <input
                  aria-label={`Carga ${e.name} série ${j + 1}`}
                  type="number"
                  min="0"
                  max="1000"
                  step="0.5"
                  value={set.weight}
                  onChange={(ev) =>
                    update(e.id, j, {
                      weight: Math.min(
                        1000,
                        Math.max(0, Number(ev.target.value)),
                      ),
                    })
                  }
                />
                <input
                  aria-label={`Repetições ${e.name} série ${j + 1}`}
                  placeholder={
                    workout.exercises.find((v) => v.id === e.id)?.reps ?? "Reps"
                  }
                  maxLength={50}
                  value={set.reps}
                  onChange={(ev) => update(e.id, j, { reps: ev.target.value })}
                />
                <button
                  className={`set-check ${set.done ? "checked" : ""}`}
                  aria-label={`${set.done ? "Desmarcar" : "Concluir"} série ${j + 1} de ${e.name}`}
                  aria-pressed={set.done}
                  onClick={() => update(e.id, j, { done: !set.done })}
                >
                  <Check size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}
      <div className="modal-actions sticky-actions">
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => save(false)}
        >
          Salvar progresso
        </button>
        <button
          className="button primary"
          disabled={busy || setCount === 0}
          onClick={() => save(true)}
        >
          <Check size={16} />
          {busy ? "Salvando…" : "Concluir treino"}
        </button>
      </div>
      <p className="field-help">
        Você pode concluir com menos séries: respeite sua recuperação. Concluir
        também marca o hábito de treino, quando agendado.
      </p>
    </div>
  );
}
export function TrainingPage(p: PageProps) {
  const sessions = Object.entries(p.state.days)
    .filter(([, d]) => d.workout?.completed)
    .sort(([a], [b]) => b.localeCompare(a));
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
      <div className="page-intro">
        <div>
          <h2>Mais forte para a vida.</h2>
          <p>
            Treine com intenção. Registre o esforço. Respeite a recuperação.
          </p>
        </div>
        <button className="button primary" onClick={() => edit()}>
          <Plus size={16} />
          Novo treino
        </button>
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
          <strong>{sessions.length}</strong>
          <span>treinos concluídos</span>
        </div>
      </div>
      <div className="workout-grid">
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
                      () => p.mutate(`/api/workouts/${w.id}`, {}, "DELETE"),
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
      <section className="panel recent-sessions">
        <div className="section-heading">
          <h3>Seu histórico de treinos</h3>
          <span className="muted">{sessions.length} sessões</span>
        </div>
        {sessions.length ? (
          sessions.slice(0, 12).map(([key, d]) => (
            <button
              key={key}
              className="session-history-row"
              onClick={() => {
                p.setDate(key);
                const w = p.state.workouts.find(
                  (v) => v.id === d.workout?.templateId,
                );
                if (w)
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
                else
                  p.dialog({
                    title: d.workout!.name,
                    description: dateLabel(key),
                    children: (
                      <div className="stack-form">
                        {d.workout!.exercises.map((e) => (
                          <div key={e.id}>
                            <h3>{e.name}</h3>
                            <p>
                              {e.sets.filter((s) => s.done).length} séries
                              concluídas
                            </p>
                            <p className="muted">
                              {e.sets
                                .filter((s) => s.done)
                                .map(
                                  (s) =>
                                    `${s.weight} kg · ${s.reps || "reps não informadas"}`,
                                )
                                .join(" / ")}
                            </p>
                          </div>
                        ))}
                      </div>
                    ),
                  });
              }}
            >
              <span className="history-icon">
                <Check size={17} />
              </span>
              <strong>{d.workout?.name}</strong>
              <span>{dateLabel(key)}</span>
              <small>
                {d.workout?.exercises.reduce(
                  (n, e) => n + e.sets.filter((s) => s.done).length,
                  0,
                )}{" "}
                séries
              </small>
              <ChevronRight size={17} />
            </button>
          ))
        ) : (
          <p className="empty-inline">
            Sua primeira sessão concluída vai aparecer aqui.
          </p>
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
export function FoodPage(p: PageProps) {
  const meals = [...p.state.meals].sort((a, b) => a.time.localeCompare(b.time));
  const calories = meals.reduce((n, m) => n + m.calories, 0),
    protein = meals.reduce((n, m) => n + m.protein, 0);
  function edit(meal?: Meal) {
    p.dialog({
      title: meal ? "Editar refeição" : "Nova refeição",
      children: (
        <MealForm
          meal={meal}
          mutate={p.mutate}
          onClose={() => p.dialog(null)}
        />
      ),
    });
  }
  return (
    <>
      <div className="page-intro">
        <div>
          <h2>Comer bem cabe na vida real.</h2>
          <p>
            Um plano simples, com comida de verdade e espaço para suas
            preferências.
          </p>
        </div>
        <button className="button primary" onClick={() => edit()}>
          <Plus size={16} />
          Nova refeição
        </button>
      </div>
      <div className="nutrition-overview">
        <div className="nutrition-intro">
          <span className="category-tile orange">
            <Utensils size={25} />
          </span>
          <h3>Nutrir também é cuidar.</h3>
          <p>Refeições planejadas, escolhas mais leves no dia a dia.</p>
        </div>
        <div className="nutrition-total">
          <span>Energia planejada</span>
          <strong>
            {number(calories)}
            <small>kcal</small>
          </strong>
          <div className="nutrition-track">
            <span
              style={{
                width: `${Math.min(100, (calories / p.state.settings.calorieGoal) * 100)}%`,
              }}
            />
          </div>
          <p>Referência pessoal: {number(p.state.settings.calorieGoal)} kcal</p>
        </div>
        <div className="nutrition-total protein">
          <span>Proteína planejada</span>
          <strong>
            {number(protein)}
            <small>g</small>
          </strong>
          <div className="nutrition-track">
            <span
              style={{
                width: `${Math.min(100, (protein / p.state.settings.proteinGoal) * 100)}%`,
              }}
            />
          </div>
          <p>Referência pessoal: {p.state.settings.proteinGoal} g</p>
        </div>
      </div>
      <div className="food-layout">
        <div className="meal-list">
          {meals.map((m, i) => (
            <section className="panel meal-card" key={m.id}>
              <div className="meal-time">
                <span>{m.time}</span>
                <i />
              </div>
              <div className="meal-main">
                <div className="section-heading small">
                  <h3>{m.name}</h3>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      aria-label={`Editar ${m.name}`}
                      onClick={() => edit(m)}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      className="icon-button danger-text"
                      aria-label={`Remover ${m.name}`}
                      onClick={() =>
                        p.confirm(
                          "Remover refeição?",
                          `“${m.name}” será removida do planejamento.`,
                          () => p.mutate(`/api/meals/${m.id}`, {}, "DELETE"),
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p>{m.description}</p>
                <div className="meal-footer">
                  <span className={`meal-symbol meal-${i % 4}`}>
                    <Utensils size={15} />
                  </span>
                  <span>{number(m.calories)} kcal estimadas</span>
                  <i />
                  <span>{m.protein} g de proteína</span>
                </div>
              </div>
            </section>
          ))}
          {!meals.length && (
            <Empty
              icon={<Utensils size={27} />}
              title="Um plano que começa no seu prato."
              action={
                <button className="button primary" onClick={() => edit()}>
                  Adicionar refeição
                </button>
              }
            >
              Crie sua primeira refeição com alimentos que você goste.
            </Empty>
          )}
        </div>
        <aside className="food-aside">
          <section className="food-principles">
            <Leaf size={28} strokeWidth={1.4} />
            <h3>O básico bem feito.</h3>
            {[
              "Proteína nas refeições principais.",
              "Frutas, verduras e legumes todos os dias.",
              "Arroz e feijão são seus aliados.",
              "Coma com atenção, sem pressa.",
              "Prepare o ambiente para boas escolhas.",
            ].map((text) => (
              <p key={text}>
                <Check size={14} />
                {text}
              </p>
            ))}
            <button className="text-button" onClick={() => p.nav("rotina")}>
              Ver hábitos de alimentação
              <ArrowUpRight size={15} />
            </button>
          </section>
          <section className="panel food-note">
            <h3>Planejamento ≠ consumo</h3>
            <p>
              Os valores são estimativas do cardápio. Marcar uma refeição na
              rotina registra o hábito, sem calcular automaticamente o que você
              comeu.
            </p>
            <p>
              As metas iniciais são referências editáveis. Um nutricionista pode
              ajustar porções, preferências e necessidades.
            </p>
            <button className="text-button" onClick={() => p.nav("ajustes")}>
              Ajustar minhas metas
              <ArrowUpRight size={14} />
            </button>
          </section>
        </aside>
      </div>
    </>
  );
}
export function JournalPage(p: PageProps) {
  const d = dayFor(p.state, p.date);
  const [mood, setMood] = useState(d.mood);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("journal-dirty", { detail: dirty }));
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      window.dispatchEvent(new CustomEvent("journal-dirty", { detail: false }));
    };
  }, [dirty]);
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
        <section className="panel journal-editor">
          <div className="journal-date">
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
                  `/api/day/${p.date}`,
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
          <section className="panel journal-history">
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
export function SettingsPage(p: PageProps) {
  const file = useRef<HTMLInputElement>(null);
  async function importFile(f: File) {
    if (f.size > 5 * 1024 * 1024) {
      p.dialog({
        title: "Arquivo muito grande",
        children: (
          <p className="dialog-body">
            Escolha um backup do Ritmo com até 5 MB.
          </p>
        ),
      });
      return;
    }
    try {
      const data = JSON.parse(await f.text());
      p.confirm(
        "Restaurar este backup?",
        `Seus hábitos, metas e registros atuais serão substituídos pelos dados do arquivo “${f.name}”. Exporte uma cópia antes de continuar. Seu login e sua senha não serão alterados.`,
        () => p.mutate("/api/import", data),
      );
    } catch {
      p.dialog({
        title: "Não foi possível abrir o backup",
        children: (
          <p className="dialog-body">
            Escolha um arquivo JSON exportado pelo Ritmo.
          </p>
        ),
      });
    }
  }
  return (
    <>
      <div className="page-intro">
        <div>
          <h2>Seu espaço, suas escolhas.</h2>
          <p>Ajuste as metas para a vida que você está construindo.</p>
        </div>
      </div>
      <div className="settings-layout">
        <section className="panel settings-form">
          <div className="section-heading">
            <div>
              <h3>Perfil e metas</h3>
              <p>As alterações valem para hoje e para os próximos dias.</p>
            </div>
            <Target size={20} />
          </div>
          <SettingsForm settings={p.state.settings} mutate={p.mutate} />
        </section>
        <aside className="settings-aside">
          <section className="panel backup-card">
            <span className="category-tile blue">
              <ShieldCheck size={22} />
            </span>
            <h3>Cuide da sua história.</h3>
            <p>
              Exporte uma cópia com hábitos, metas, treinos e registros. O
              arquivo contém informações pessoais de saúde: guarde em um lugar
              seguro.
            </p>
            <button className="button secondary" onClick={downloadBackup}>
              <ArrowDownToLine size={16} />
              Exportar backup
            </button>
            <button
              className="button ghost"
              onClick={() => file.current?.click()}
            >
              <ArrowUpFromLine size={16} />
              Restaurar backup
            </button>
            <input
              ref={file}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              aria-label="Arquivo de backup"
              onChange={(e) => {
                if (e.target.files?.[0]) void importFile(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </section>
          <section className="panel">
            <span className="category-tile purple">
              <LockKeyhole size={21} />
            </span>
            <h3>Seu acesso pessoal</h3>
            <p className="muted">
              Uma conta exclusiva, com senha protegida e sessões privadas.
            </p>
            <button
              className="button secondary"
              onClick={() =>
                p.dialog({
                  title: "Alterar minha senha",
                  children: (
                    <PasswordForm
                      mutate={p.mutate}
                      onClose={() => p.dialog(null)}
                    />
                  ),
                })
              }
            >
              <LockKeyhole size={15} />
              Alterar senha
            </button>
          </section>
          <section className="health-note">
            <Heart size={21} />
            <h3>Saúde antes da pontuação.</h3>
            <p>
              O plano inicial é um ponto de partida editável. Acompanhe a
              testosterona relatada com um médico; um resultado isolado não
              confirma deficiência.
            </p>
            <p>
              Um hemograma não mede testosterona. Leve o laudo com unidade,
              horário da coleta e sintomas à consulta.
            </p>
            <a
              href="https://www.endocrine.org/clinical-practice-guidelines/testosterone-therapy"
              target="_blank"
              rel="noreferrer"
            >
              Orientação da Endocrine Society
              <ArrowUpRight size={14} />
            </a>
          </section>
        </aside>
      </div>
    </>
  );
}
export function ConfirmDialog({
  body,
  onConfirm,
  onClose,
}: {
  body: string;
  onConfirm: () => Promise<boolean>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <>
      <p className="dialog-body">{body}</p>
      <div className="modal-actions">
        <button className="button secondary" onClick={onClose}>
          Cancelar
        </button>
        <button
          className="button danger"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            if (await onConfirm()) onClose();
            setBusy(false);
          }}
        >
          {busy ? "Confirmando…" : "Confirmar"}
        </button>
      </div>
    </>
  );
}
export function WelcomePanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="welcome-content">
      <div className="welcome-mark">
        <Sprout size={43} strokeWidth={1.3} />
      </div>
      <h3>Uma pequena ação já muda o dia.</h3>
      <p>
        Sua rotina inicial está pronta, baseada na nossa conversa. Ajuste
        horários e metas para o que funciona para você.
      </p>
      <div className="welcome-steps">
        <div>
          <Check size={16} />
          <span>Conclua hábitos e ganhe 10 XP por vitória.</span>
        </div>
        <div>
          <DropletsIcon />
          <span>Registre água, sono, peso e como se sente.</span>
        </div>
        <div>
          <Trophy size={16} />
          <span>Alcance sua meta diária e construa sua sequência.</span>
        </div>
      </div>
      <p className="field-help">
        O calendário começa vazio porque sua história é real. Ele ganha cor a
        cada dia de cuidado.
      </p>
      <button className="button primary" onClick={onClose}>
        Começar meu primeiro dia
        <ArrowUpRight size={16} />
      </button>
    </div>
  );
}
function DropletsIcon() {
  return <Leaf size={16} />;
}

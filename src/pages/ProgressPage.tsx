import { useEffect, useRef, useState } from "react";
import { Activity, Award, Check, CheckCheck, ChevronDown, ChevronUp, Flame, LockKeyhole, Plus, Sparkles, Sprout, Target, Trophy, Weight } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { addDays, bestStreak, allCompleted, dateLabel, dayFor, number, score, xpTotal } from "../lib";
import { Empty, Heatmap, Metric } from "../ui";
import { TutorialTrigger } from "../GuidedTutorial";
import type { PageProps } from "./types";
import { apiOperations } from "../api-operations";

export function ProgressPage(p: PageProps) {
  const [period, setPeriod] = useState(30);
  const s = p.state,
    day = dayFor(s, p.date);
  const weightInput = useRef<HTMLInputElement>(null);
  const [weightValue, setWeightValue] = useState(
    day.weight === null ? "" : String(day.weight),
  );
  useEffect(() => {
    setWeightValue(day.weight === null ? "" : String(day.weight));
  }, [p.date, day.weight]);
  const adjustWeight = (direction: 1 | -1) => {
    const input = weightInput.current;
    if (!input) return;
    if (direction > 0) input.stepUp();
    else input.stepDown();
    setWeightValue(input.value);
  };
  const weightNumber = Number(weightValue);
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
      <div className="page-intro" data-tutorial-target="evolution-periods">
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
          detail="XP por esforço e bônus de dias completos"
          color="blue"
        />
      </div>
      <div className="progress-columns">
        <section className="panel weight-chart-panel" data-tutorial-target="evolution-chart">
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
                    stroke="var(--chart-grid)"
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted)" }}
                    minTickGap={35}
                  />
                  <YAxis
                    domain={["dataMin - 1", "dataMax + 1"]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted)" }}
                    tickFormatter={(v) => number(v, 1)}
                  />
                  <Tooltip
                    formatter={(v) => [`${number(Number(v), 1)} kg`, "Peso"]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--text)",
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="var(--chart-line)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "var(--surface)", strokeWidth: 2 }}
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
        <section className="panel weight-register" data-tutorial-target="weight-register">
          <TutorialTrigger id="feature-weight" completed={p.completedTutorials.includes("feature-weight")} onStart={p.startTutorial} />
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
                apiOperations.day.update(p.date),
                { weight: Number(d.get("weight")) },
                "PATCH",
              );
            }}
          >
            <label>
              Peso em {p.date === p.today ? "hoje" : dateLabel(p.date)}
              <div className="input-unit">
                <input
                  ref={weightInput}
                  type="number"
                  name="weight"
                  min="30"
                  max="350"
                  step="0.1"
                  placeholder="96,0"
                  value={weightValue}
                  onChange={(event) => setWeightValue(event.currentTarget.value)}
                  required
                />
                <span className="input-unit-label">kg</span>
                <div className="input-unit-stepper" role="group" aria-label="Ajustar peso em passos de 0,1 kg">
                  <button
                    type="button"
                    aria-label="Aumentar peso em 0,1 kg"
                    disabled={p.busy || (weightValue !== "" && weightNumber >= 350)}
                    onClick={() => adjustWeight(1)}
                  >
                    <ChevronUp aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Diminuir peso em 0,1 kg"
                    disabled={p.busy || (weightValue !== "" && weightNumber <= 30)}
                    onClick={() => adjustWeight(-1)}
                  >
                    <ChevronDown aria-hidden="true" />
                  </button>
                </div>
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
                    p.mutate(apiOperations.day.update(p.date), { weight: null }, "PATCH"),
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


import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  CircleHelp,
  Dumbbell,
  Heart,
  House,
  ListChecks,
  LoaderCircle,
  LogOut,
  Menu,
  Plus,
  Settings2,
  ShieldCheck,
  Sprout,
  Utensils,
  WifiOff,
  X,
} from "lucide-react";
import type { Habit, PageId, State } from "./types";
import {
  api,
  completed,
  dateLabel,
  dayFor,
  habitValue,
  todayKey,
  xpTotal,
} from "./lib";
import { DatePicker, Logo, Modal, useNow } from "./ui";
import { HabitDetail, HabitForm } from "./forms";
import Auth from "./Auth";
import Dashboard from "./Dashboard";
import {
  ConfirmDialog,
  WelcomePanel,
  RoutinePage,
  ProgressPage,
  TrainingPage,
  FoodPage,
  JournalPage,
  SettingsPage,
} from "./pages";
import type { DialogOptions, PageProps } from "./pages";
const navItems = [
  { id: "hoje", title: "Visão geral", icon: House },
  { id: "rotina", title: "Minha rotina", icon: ListChecks },
  { id: "evolucao", title: "Evolução", icon: ChartNoAxesCombined },
  { id: "treinos", title: "Treinos", icon: Dumbbell },
  { id: "alimentacao", title: "Alimentação", icon: Utensils },
  { id: "diario", title: "Meu diário", icon: BookOpen },
] as const;
const pageNames: Record<PageId, string> = {
  hoje: "Visão geral",
  rotina: "Minha rotina",
  evolucao: "Evolução",
  treinos: "Treinos",
  alimentacao: "Alimentação",
  diario: "Meu diário",
  ajustes: "Ajustes",
};
const validPage = (hash: string): PageId =>
  hash in pageNames ? (hash as PageId) : "hoje";
export default function App() {
  const [auth, setAuth] = useState<{
    configured: boolean;
    authenticated: boolean;
  } | null>(null);
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState("");
  const [date, setDate] = useState(todayKey());
  const [page, setPage] = useState<PageId>(validPage(location.hash.slice(1)));
  const [dialog, setDialog] = useState<DialogOptions | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    error: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const mutating = useRef(false);
  const journalDirty = useRef(false);
  const [menu, setMenu] = useState(false);
  const now = useNow();
  const today = todayKey(state?.settings.timezone);
  const totalXp = state ? xpTotal(state) : 0;
  const level = Math.floor(totalXp / 500) + 1;
  const load = useCallback(async () => {
    try {
      setError("");
      const status = await api<{
        configured: boolean;
        authenticated: boolean;
      }>("/api/auth");
      setAuth(status);
      if (status.authenticated) {
        const data = await api<State>("/api/state");
        setState(data);
        setDate(todayKey(data.settings.timezone));
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    void load();
    const expired = () => {
      setAuth({ configured: true, authenticated: false });
      setState(null);
      setDialog(null);
    };
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, [load]);
  useEffect(() => {
    const hash = () => setPage(validPage(location.hash.slice(1)));
    window.addEventListener("hashchange", hash);
    return () => window.removeEventListener("hashchange", hash);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), toast.error ? 8000 : 3500);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    const dirty = (e: Event) => {
      journalDirty.current = (e as CustomEvent).detail;
    };
    window.addEventListener("journal-dirty", dirty);
    return () => window.removeEventListener("journal-dirty", dirty);
  }, []);
  // Move to the new date only if the user was following today, rather than inspecting history.
  const previousToday = useRef(today);
  useEffect(() => {
    if (previousToday.current !== today) {
      if (date === previousToday.current && !journalDirty.current)
        setDate(today);
      previousToday.current = today;
    }
  }, [today, date, now]);
  async function mutate(
    url: string,
    body?: unknown,
    method?: string,
  ): Promise<boolean> {
    if (mutating.current) return false;
    mutating.current = true;
    setBusy(true);
    try {
      const before = state ? completed(dayFor(state, date)) : 0;
      const result = await api<
        | State
        | {
            ok: boolean;
          }
      >(url, body, method);
      if ("version" in result) {
        setState(result);
        if (
          date < result.settings.startDate ||
          date > todayKey(result.settings.timezone)
        )
          setDate(todayKey(result.settings.timezone));
        const gained = completed(dayFor(result, date)) - before;
        setToast({
          message:
            gained > 0
              ? `Pequena vitória! +${gained * 10} XP`
              : "Salvo. Cada passo conta.",
          error: false,
        });
      } else setToast({ message: "Alteração salva.", error: false });
      return true;
    } catch (e) {
      setToast({ message: (e as Error).message, error: true });
      return false;
    } finally {
      mutating.current = false;
      setBusy(false);
    }
  }
  function confirm(
    title: string,
    body: string,
    action: () => Promise<boolean>,
  ) {
    setDialog({
      title,
      description: "Confira antes de continuar.",
      children: (
        <ConfirmDialog
          body={body}
          onConfirm={action}
          onClose={() => setDialog(null)}
        />
      ),
    });
  }
  function guarded(action: () => void) {
    if (journalDirty.current) {
      confirm(
        "Sair sem salvar?",
        "Há alterações no diário que ainda não foram salvas. Ao continuar, elas serão descartadas.",
        async () => {
          journalDirty.current = false;
          action();
          return true;
        },
      );
    } else action();
  }
  function nav(p: PageId) {
    if (p === page) {
      setMenu(false);
      return;
    }
    guarded(() => {
      location.hash = p;
      setPage(p);
      setMenu(false);
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  }
  function selectDate(d: string) {
    if (d === date) return;
    guarded(() => setDate(d));
  }
  function editHabit(h?: Habit) {
    setDialog({
      title: h ? "Editar meu hábito" : "Um novo compromisso com você",
      children: (
        <HabitForm habit={h} mutate={mutate} onClose={() => setDialog(null)} />
      ),
    });
  }
  function archive(h: Habit) {
    confirm(
      "Remover da rotina?",
      `“${h.title}” deixará de aparecer a partir de hoje. Seu histórico será mantido. Você poderá restaurá-lo em Minha rotina.`,
      () => mutate(`/api/habits/${h.id}`, { ...h, archived: true }, "PUT"),
    );
  }
  function openHabit(h: Habit) {
    if (!state) return;
    const d = dayFor(state, date),
      value = habitValue(h, d);
    setDialog({
      title: h.title,
      description: "Um pequeno passo na direção que você escolheu.",
      children: (
        <HabitDetail
          habit={h}
          value={value}
          onSave={(v) =>
            mutate(
              `/api/day/${date}`,
              h.kind === "water"
                ? { waterDelta: v - d.water }
                : h.kind === "sleep"
                  ? { sleep: v }
                  : { habitId: h.id, value: v },
              "PATCH",
            )
          }
          onEdit={() => editHabit(h)}
          onArchive={() => archive(h)}
          onClose={() => setDialog(null)}
        />
      ),
    });
  }
  function help() {
    setDialog({
      title: "O seu ritmo, explicado",
      description: "Um guia rápido para construir sua rotina.",
      children: (
        <div className="help-content">
          <div>
            <span className="category-tile green">
              <Check size={20} />
            </span>
            <h3>Pequenas vitórias valem experiência.</h3>
            <p>
              Cada hábito concluído vale 10 XP. Água, sono e contadores
              contribuem proporcionalmente para o dia, e só ganham XP quando
              atingem a meta. Desmarcar retira a pontuação correspondente.
            </p>
          </div>
          <div>
            <span className="category-tile orange">
              <Activity size={20} />
            </span>
            <h3>A sequência acompanha a constância.</h3>
            <p>
              Um dia é consistente quando você atinge sua meta em Ajustes (70%
              no início). Hoje pode estar em andamento sem quebrar a sequência
              de ontem. Registros dos dias anteriores podem ser corrigidos.
            </p>
          </div>
          <div>
            <span className="category-tile purple">
              <Heart size={20} />
            </span>
            <h3>Seu plano pode mudar com você.</h3>
            <p>
              Edite horários, dias, refeições, exercícios e metas. Remover um
              hábito preserva o histórico anterior. Cada quadradinho mostra a
              porcentagem daquele dia.
            </p>
          </div>
          <div>
            <span className="category-tile blue">
              <ShieldCheck size={20} />
            </span>
            <h3>Sua história fica com você.</h3>
            <p>
              Os registros são salvos neste computador. Use Ajustes para
              exportar backups regularmente. Faça uma cópia antes de trocar de
              computador ou hospedar a aplicação.
            </p>
          </div>
          <div className="help-sources">
            <h3>Referências do plano inicial</h3>
            <a
              href="https://www.who.int/initiatives/behealthy/physical-activity/"
              target="_blank"
              rel="noreferrer"
            >
              Atividade física · OMS
              <ArrowUpRight size={14} />
            </a>
            <a
              href="https://www.gov.br/saude/pt-br/assuntos/saude-brasil/publicacoes-para-promocao-a-saude/guia_alimentar_populacao_brasileira_2ed.pdf/view"
              target="_blank"
              rel="noreferrer"
            >
              Guia Alimentar · Ministério da Saúde
              <ArrowUpRight size={14} />
            </a>
            <a
              href="https://www.nhlbi.nih.gov/health/sleep/how-much-sleep"
              target="_blank"
              rel="noreferrer"
            >
              Sono · NIH
              <ArrowUpRight size={14} />
            </a>
            <a
              href="https://www.endocrine.org/clinical-practice-guidelines/testosterone-therapy"
              target="_blank"
              rel="noreferrer"
            >
              Avaliação de testosterona · Endocrine Society
              <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      ),
    });
  }
  async function logout() {
    guarded(() => {
      void api("/api/logout", {})
        .then(() => {
          setState(null);
          setAuth({ configured: true, authenticated: false });
          setDialog(null);
          setMenu(false);
        })
        .catch((e) => setToast({ message: e.message, error: true }));
    });
  }
  if (error && !state)
    return (
      <main className="loading-screen">
        <WifiOff size={35} />
        <h1>Vamos retomar a conexão.</h1>
        <p>{error}</p>
        <button className="button primary" onClick={load}>
          Tentar novamente
        </button>
      </main>
    );
  if (!auth || (auth.authenticated && !state))
    return (
      <main className="loading-screen">
        <Logo />
        <LoaderCircle className="spin" size={23} />
        <p>Abrindo seu espaço…</p>
      </main>
    );
  if (!auth.authenticated)
    return (
      <Auth
        configured={auth.configured}
        onSuccess={async () => {
          await load();
          if (!auth.configured)
            setDialog({
              title: "Bem-vindo ao seu novo ritmo.",
              description: "Seu primeiro dia começa agora.",
              children: <WelcomePanel onClose={() => setDialog(null)} />,
            });
        }}
      />
    );
  if (!state) return null;
  const props: PageProps = {
    state,
    date,
    today,
    mutate,
    busy,
    nav,
    openHabit,
    editHabit,
    addHabit: () => editHabit(),
    setDate: selectDate,
    dialog: setDialog,
    confirm,
  };
  const hour = Number(
    new Intl.DateTimeFormat("en", {
      timeZone: state.settings.timezone,
      hour: "numeric",
      hourCycle: "h23",
    }).format(now),
  );
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const links = (
    <>
      {navItems.map(({ id, title, icon: Icon }) => (
        <a
          key={id}
          href={`#${id}`}
          onClick={(e) => {
            e.preventDefault();
            nav(id);
          }}
          className={`nav-link ${page === id ? "active" : ""}`}
          aria-current={page === id ? "page" : undefined}
        >
          <Icon size={19} strokeWidth={1.8} />
          <span>{title}</span>
          {id === "hoje" && <span className="nav-live" />}
        </a>
      ))}
    </>
  );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Logo />
          <span className="personal-label">Pessoal</span>
        </div>
        <div className="sidebar-label">Seu espaço</div>
        <nav aria-label="Navegação principal">{links}</nav>
        <div className="sidebar-bottom">
          <button className="sidebar-help" onClick={help}>
            <span className="help-sprout">
              <Sprout size={24} strokeWidth={1.5} />
            </span>
            <strong>Cultive sua melhor versão.</strong>
            <p>
              Um compromisso pequeno.
              <br />
              Uma mudança de verdade.
            </p>
            <span>
              Conhecer meu ritmo
              <ArrowUpRight size={14} />
            </span>
          </button>
          <button
            className={`nav-link ${page === "ajustes" ? "active" : ""}`}
            onClick={() => nav("ajustes")}
          >
            <Settings2 size={19} />
            <span>Ajustes</span>
          </button>
          <button className="nav-link" onClick={help}>
            <CircleHelp size={19} />
            <span>Como funciona</span>
          </button>
          <div className="sidebar-profile">
            <span className="avatar">
              {state.settings.name.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{state.settings.name}</strong>
              <span>Seu espaço pessoal</span>
            </div>
            <button
              className="icon-button"
              title="Sair"
              aria-label="Sair da conta"
              onClick={logout}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Meu espaço</span>
            <ChevronRight size={13} />
            <strong>{pageNames[page]}</strong>
          </div>
          <div className="topbar-right">
            <span className="local-status">
              <span className="live-dot" />
              {busy ? "Salvando…" : "Tudo no seu ritmo"}
            </span>
            <button
              className="icon-button help-button"
              aria-label="Como o Ritmo funciona"
              onClick={help}
            >
              <CircleHelp size={18} />
            </button>
            <span className="avatar small-avatar">
              {state.settings.name.slice(0, 1).toUpperCase()}
            </span>
          </div>
        </header>
        <main id="main-content" className="main-content">
          <div className="page-heading">
            <div>
              <div className="heading-date">
                <CalendarDays size={14} />
                {dateLabel(date, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <h1>
                {page === "hoje" ? (
                  <>
                    {greeting}, {state.settings.name.split(" ")[0]}
                    <span className="greeting-spark">✳</span>
                  </>
                ) : (
                  pageNames[page]
                )}
              </h1>
              {page === "hoje" && (
                <p>Vamos fazer de hoje um bom dia para você.</p>
              )}
            </div>
            <div className="page-heading-actions">
              <DatePicker
                date={date}
                today={today}
                startDate={state.settings.startDate}
                onChange={selectDate}
              />
              {page === "hoje" && (
                <button
                  className="button secondary"
                  onClick={() => editHabit()}
                >
                  <Plus size={16} />
                  <span>Novo hábito</span>
                </button>
              )}
            </div>
          </div>
          {date !== today && (
            <div className="history-banner">
              <ClockIcon />
              <span>
                Você está vendo {dateLabel(date)}. Os registros salvos pertencem
                a esse dia.
              </span>
              <button onClick={() => selectDate(today)}>
                Voltar para hoje
                <X size={13} />
              </button>
            </div>
          )}
          <Suspense
            fallback={
              <div className="page-loading">
                <LoaderCircle className="spin" />
                Abrindo…
              </div>
            }
          >
            {page === "hoje" ? (
              <Dashboard
                state={state}
                date={date}
                today={today}
                mutate={mutate}
                busy={busy}
                openHabit={openHabit}
                nav={nav}
                onSelectDate={(d) => {
                  selectDate(d);
                }}
                addHabit={() => editHabit()}
              />
            ) : page === "rotina" ? (
              <RoutinePage {...props} />
            ) : page === "evolucao" ? (
              <ProgressPage {...props} />
            ) : page === "treinos" ? (
              <TrainingPage {...props} />
            ) : page === "alimentacao" ? (
              <FoodPage {...props} />
            ) : page === "diario" ? (
              <JournalPage key={date} {...props} />
            ) : (
              <SettingsPage {...props} />
            )}
          </Suspense>
          <footer className="app-footer">
            <Logo small />
            <span>Um dia melhor começa com um pequeno passo.</span>
            <span>Ritmo pessoal · Nível {level}</span>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Navegação no celular">
        {navItems.slice(0, 4).map(({ id, title, icon: Icon }) => (
          <button
            key={id}
            className={page === id ? "active" : ""}
            aria-current={page === id ? "page" : undefined}
            onClick={() => nav(id)}
          >
            <Icon size={20} />
            <span>
              {id === "hoje" ? "Hoje" : id === "rotina" ? "Rotina" : title}
            </span>
          </button>
        ))}
        <button onClick={() => setMenu(true)} aria-label="Mais páginas">
          <Menu size={20} />
          <span>Mais</span>
        </button>
      </nav>
      {menu && (
        <Modal
          title="Seu espaço"
          description="Sua rotina, em um só lugar."
          onClose={() => setMenu(false)}
        >
          <div className="mobile-menu-links">
            {links}
            <button className="nav-link" onClick={() => nav("ajustes")}>
              <Settings2 size={19} />
              Ajustes
            </button>
            <button
              className="nav-link"
              onClick={() => {
                setMenu(false);
                help();
              }}
            >
              <CircleHelp size={19} />
              Como funciona
            </button>
            <button className="nav-link" onClick={logout}>
              <LogOut size={19} />
              Sair da conta
            </button>
          </div>
        </Modal>
      )}
      {dialog && (
        <Modal
          title={dialog.title}
          description={dialog.description}
          wide={dialog.wide}
          onClose={() => setDialog(null)}
        >
          {dialog.children}
        </Modal>
      )}
      {toast && (
        <div
          role={toast.error ? "alert" : "status"}
          className={`toast ${toast.error ? "toast-error" : ""}`}
        >
          <span>
            {toast.error ? <WifiOff size={18} /> : <Check size={18} />}
          </span>
          {toast.message}
          <button aria-label="Fechar aviso" onClick={() => setToast(null)}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
function ClockIcon() {
  return <CalendarDays size={16} />;
}

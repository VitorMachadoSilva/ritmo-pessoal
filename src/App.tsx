import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Brain,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  CircleAlert,
  ChevronRight,
  CircleHelp,
  Flame,
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
  Timer,
  CalendarCheck2,
} from "lucide-react";
import type { Habit, PageId, State } from "./types";
import { api, dateLabel, dayFor, habitValue, isDone, orderedHabits, todayKey, usageStreak, xpTotal } from "./lib";
import { DatePicker, Logo, Modal, useNow } from "./ui";
import { dailyWordFor } from "./daily-words";
import { HabitDetail, HabitForm } from "./forms";
import Auth from "./Auth";
import { EntrySurface, ENTRY_TIMING } from "./EntryTransition";
import { ExitSurface, useExitSequence } from "./ExitTransition";
import { revokeSession } from "./exit-sequence";
import { ThemeToggle } from "./Theme";
import { GuidedTutorial, TutorialTrigger } from "./GuidedTutorial";
import { parseTutorialProgress, saveTutorialProgress, TUTORIAL_STORAGE_KEY, tutorialFor } from "./tutorials";
import Dashboard from "./Dashboard";
import { FocusPage, FocusIndicator } from "./Focus";
import { ReviewPage } from "./Review";
import LeafBadge from "./components/LeafBadge";
import { GamesPage } from "./Games";
import { weekStart } from "./review-data";
import { errorToastForMutation, successToastForMutation, type ToastNotice } from "./toast-feedback";
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
  { id: "jogos", title: "Jogos da mente", icon: Brain },
  { id: "alimentacao", title: "Alimentação", icon: Utensils },
  { id: "diario", title: "Meu diário", icon: BookOpen },
  { id: "foco", title: "Tempo de foco", icon: Timer },
  { id: "semana", title: "Revisão semanal", icon: CalendarCheck2 },
] as const;
const pageNames: Record<PageId, string> = {
  hoje: "Visão geral",
  rotina: "Minha rotina",
  evolucao: "Evolução",
  treinos: "Treinos",
  alimentacao: "Alimentação",
  diario: "Meu diário",
  ajustes: "Ajustes",
  foco: "Tempo de foco",
  semana: "Revisão semanal",
  jogos: "Jogos da mente",
};
const validPage = (hash: string): PageId =>
  Object.hasOwn(pageNames, hash) ? (hash as PageId) : "hoje";
export default function App() {
  const [auth, setAuth] = useState<{
    configured: boolean;
    authenticated: boolean;
  } | null>(null);
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState("");
  const [date, setDate] = useState(todayKey());
  const [page, setPage] = useState<PageId>(validPage(location.hash.slice(1)));
  const [completedTutorials, setCompletedTutorials] = useState<string[]>(() => {
    try { return parseTutorialProgress(window.localStorage.getItem(TUTORIAL_STORAGE_KEY)).completed; }
    catch { return []; }
  });
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
  const tutorialOrigin = useRef<HTMLElement | null>(null);
  const [dialog, setDialog] = useState<DialogOptions | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [entryReveal, setEntryReveal] = useState(false);
  const [entryCover, setEntryCover] = useState(false);
  const welcomeAfterEntry = useRef(false);
  const [toast, setToast] = useState<ToastNotice | null>(null);
  const [busy, setBusy] = useState(false);
  const mutating = useRef(false);
  const journalDirty = useRef(false);
  const route = useRef({ page, index: 0 });
  const restoringRoute = useRef<{ page: PageId; index: number } | null>(null);
  const promptRoute = useRef<(target: { page: PageId; index: number }) => void>(
    () => {},
  );
  const [menu, setMenu] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const startTutorial = useCallback((id: string, trigger: HTMLElement) => {
    const guide = tutorialFor(id);
    if (!guide || guide.page !== page || dialog) return;
    tutorialOrigin.current = trigger;
    setActiveTutorial(id);
  }, [page, dialog]);
  const closeTutorial = useCallback(() => {
    setActiveTutorial(null);
    requestAnimationFrame(() => {
      const origin = tutorialOrigin.current;
      if (origin?.isConnected) origin.focus({ preventScroll: true });
      tutorialOrigin.current = null;
    });
  }, []);
  const completeTutorial = useCallback((id: string) => {
    const next = [...new Set([...completedTutorials, id])];
    setCompletedTutorials(next);
    saveTutorialProgress(next);
    closeTutorial();
  }, [completedTutorials, closeTutorial]);
  useEffect(() => {
    if (activeTutorial && tutorialFor(activeTutorial)?.page !== page) setActiveTutorial(null);
  }, [activeTutorial, page]);
  const exitOrigin = useRef<HTMLElement | null>(null);
  const exit = useExitSequence(async () => {
    await revokeSession();
    // Clear private data only after the undo window and confirmed revocation.
    journalDirty.current = false;
    setState(null); setAuth({ configured: true, authenticated: false });
    setDialog(null); setSelectedHabitId(null); setMenu(false); setToast(null);
    setError(""); setBusy(false); setEntryCover(false); setEntryReveal(false);
    restoringRoute.current = null; welcomeAfterEntry.current = false;
    setPage("hoje"); setDate(todayKey()); route.current.page = "hoje";
    history.replaceState({ ...history.state, ritmoIndex: route.current.index }, "", "#hoje");
  });
  const previousExit = useRef(exit.phase);
  useEffect(() => { if (dialog || exit.phase !== "idle") setActiveTutorial(null); }, [dialog, exit.phase]);
  useEffect(() => {
    if (previousExit.current === "returning" && exit.phase === "idle") {
      const origin = exitOrigin.current;
      (origin?.isConnected && origin.getClientRects().length ? origin : document.getElementById("main-content"))?.focus({ preventScroll: true });
    }
    previousExit.current = exit.phase;
  }, [exit.phase]);
  const now = useNow();
  const today = todayKey(state?.settings.timezone);
  const actualTotalXp = state ? xpTotal(state) : 0;
  // Local-only visual preview; changing the query string never writes XP or history.
  const previewLevelValue = ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? Number(new URLSearchParams(window.location.search).get("previewLevel"))
    : Number.NaN;
  const previewLevel = Number.isInteger(previewLevelValue) && previewLevelValue >= 1 && previewLevelValue <= 999
    ? previewLevelValue
    : null;
  const totalXp = previewLevel ? (previewLevel - 1) * 500 : actualTotalXp;
  const level = previewLevel ?? Math.floor(actualTotalXp / 500) + 1;
  const xpInLevel = previewLevel ? 0 : actualTotalXp % 500;
  const xpToNextLevel = 500 - xpInLevel;
  const usageDays = state ? usageStreak(state, today) : 0;
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
    if (!entryReveal) return;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? ENTRY_TIMING.reduced : ENTRY_TIMING.dissolve;
    const reveal = window.setTimeout(() => {
      setEntryCover(false);
    }, duration);
    const settle = window.setTimeout(() => setEntryReveal(false), duration + 500);
    return () => { window.clearTimeout(reveal); window.clearTimeout(settle); };
  }, [entryReveal]);
  useEffect(() => {
    if (!entryReveal || entryCover) return;
    // Focus only after React has removed inert from the dashboard.
    document.getElementById("main-content")?.focus({ preventScroll: true });
    if (welcomeAfterEntry.current) {
      welcomeAfterEntry.current = false;
      setDialog({ title: "Bem-vindo ao seu novo ritmo.", description: "Seu primeiro dia começa agora.", children: <WelcomePanel onClose={() => setDialog(null)} /> });
    }
  }, [entryReveal, entryCover]);
  useEffect(() => {
    void load();
    const expired = () => {
      setAuth({ configured: true, authenticated: false });
      setState(null);
      setDialog(null);
      setSelectedHabitId(null);
    };
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, [load]);
  useEffect(() => {
    route.current.index = history.state?.ritmoIndex ?? 0;
    history.replaceState(
      { ...history.state, ritmoIndex: route.current.index },
      "",
      `#${route.current.page}`,
    );
    const hash = () => {
      if (exit.active()) {
        history.replaceState({ ...history.state, ritmoIndex: route.current.index }, "", `#${route.current.page}`);
        return;
      }
      const target = {
        page: validPage(location.hash.slice(1)),
        index: history.state?.ritmoIndex ?? route.current.index + 1,
      };
      if (restoringRoute.current) {
        if (target.index === route.current.index) {
          const pending = restoringRoute.current;
          restoringRoute.current = null;
          promptRoute.current(pending);
        }
        return;
      }
      if (target.page === route.current.page) {
        route.current = target;
        history.replaceState(
          { ...history.state, ritmoIndex: target.index },
          "",
          `#${target.page}`,
        );
        return;
      }
      if (journalDirty.current) {
        // Restore the current entry before asking; cancellation preserves the history stack.
        history.replaceState(
          { ...history.state, ritmoIndex: target.index },
          "",
          `#${target.page}`,
        );
        restoringRoute.current = target;
        history.go(route.current.index - target.index);
        return;
      }
      route.current = target;
      history.replaceState(
        { ...history.state, ritmoIndex: target.index },
        "",
        `#${target.page}`,
      );
      setPage(target.page);
      setMenu(false);
    };
    window.addEventListener("popstate", hash);
    window.addEventListener("hashchange", hash);
    return () => {
      window.removeEventListener("popstate", hash);
      window.removeEventListener("hashchange", hash);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), toast.tone === "error" ? 9000 : toast.tone === "achievement" ? 5000 : 3600);
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
    if (mutating.current || exit.active()) return false;
    mutating.current = true;
    const habitId = url.startsWith("/api/habits/") ? url.slice("/api/habits/".length) : "";
    const previouslyArchived = Boolean(habitId && state?.habits.find((habit) => habit.id === habitId)?.archived);
    // Most local writes finish before a loading state can be perceived.
    // Keep the duplicate-write guard immediate, but avoid flashing every disabled control.
    const busyTimer = window.setTimeout(() => setBusy(true), 180);
    try {
      const before = state ? xpTotal(state) : 0;
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
        const gained = xpTotal(result) - before;
        const notice = successToastForMutation(url, body, method, gained, previouslyArchived);
        if (notice) setToast(notice);
      } else {
        const notice = successToastForMutation(url, body, method, 0, previouslyArchived);
        if (notice) setToast(notice);
      }
      return true;
    } catch (e) {
      setToast(errorToastForMutation(url, e, body, method, previouslyArchived));
      return false;
    } finally {
      window.clearTimeout(busyTimer);
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
        "Há alterações que ainda não foram salvas. Ao continuar, elas serão descartadas.",
        async () => {
          journalDirty.current = false;
          action();
          return true;
        },
      );
    } else action();
  }
  function nav(p: PageId) {
    // Leave the mobile menu before asking about a draft; cancel returns to editing.
    setMenu(false);
    if (p === page) {
      return;
    }
    guarded(() => {
      route.current = { page: p, index: route.current.index + 1 };
      history.pushState(
        { ...history.state, ritmoIndex: route.current.index },
        "",
        `#${p}`,
      );
      setPage(p);
      setMenu(false);
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  }
  promptRoute.current = (target) =>
    guarded(() => history.go(target.index - route.current.index));
  function selectDate(d: string) {
    if (d === date) return;
    guarded(() => setDate(d));
  }
  function editHabit(h?: Habit) {
    setSelectedHabitId(null);
    setDialog({
      title: h ? "Editar meu hábito" : "Um novo compromisso com você",
      children: (
        <HabitForm habit={h} mutate={mutate} onClose={() => setDialog(null)} />
      ),
    });
  }
  function archive(h: Habit) {
    setSelectedHabitId(null);
    confirm(
      "Remover da rotina?",
      `“${h.title}” deixará de aparecer a partir de hoje. Seu histórico será mantido. Você poderá restaurá-lo em Minha rotina.`,
      () => mutate(`/api/habits/${h.id}`, { ...h, archived: true }, "PUT"),
    );
  }
  function openHabit(h: Habit) {
    setSelectedHabitId(h.id);
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
              O XP acompanha o esforço escolhido em cada hábito. Água, sono e
              contadores contribuem proporcionalmente para o dia, mas só ganham
              XP ao atingir a meta. Desmarcar retira os pontos.
            </p>
            <table className="points-table"><caption>Pontos por hábito concluído</caption><tbody>
              <tr><th scope="row">Leve</th><td>10 XP</td></tr>
              <tr><th scope="row">Moderado</th><td>20 XP</td></tr>
              <tr><th scope="row">Desafiador</th><td>30 XP</td></tr>
            </tbody></table>
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
            <table className="points-table"><caption>Bônus por dias seguidos com 100% dos hábitos previstos</caption><tbody>
              <tr><th scope="row">1–2 dias</th><td>+10 XP por dia</td></tr>
              <tr><th scope="row">3–6 dias</th><td>+20 XP por dia</td></tr>
              <tr><th scope="row">7–13 dias</th><td>+30 XP por dia</td></tr>
              <tr><th scope="row">14–29 dias</th><td>+40 XP por dia</td></tr>
              <tr><th scope="row">30+ dias</th><td>+50 XP por dia</td></tr>
            </tbody></table>
            <p>O bônus de 100% considera a rotina inteira, inclusive no dia essencial. Um dia abaixo de 100% reinicia apenas essa sequência de bônus.</p>
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
  function logout() {
    if (exit.active()) return;
    if (mutating.current) {
      setToast({ title: "Salvamento em andamento", message: "Aguarde a confirmação antes de sair.", tone: "info" });
      return;
    }
    exitOrigin.current = document.activeElement as HTMLElement;
    setMenu(false);
    const begin = () => { setDialog(null); exit.start(); };
    if (journalDirty.current) {
      // Do not clear the dirty flag here: undo must preserve the original draft.
      setDialog({
        title: "Sair do seu espaço?",
        description: "Você tem alterações não salvas. Sair mesmo assim?",
        children: <div className="modal-actions">
          <button className="button secondary" onClick={() => setDialog(null)} autoFocus>Continuar editando</button>
          <button className="button primary" onClick={begin}>Sair mesmo assim</button>
        </div>,
      });
    } else begin();
  }
  const exitSurface = exit.phase !== "idle" ? <ExitSurface phase={exit.phase} error={exit.error} onCancel={() => exit.cancel()} onRetry={() => void exit.retry()} /> : null;
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
      <>
      <div className={exit.phase === "reveal" ? "logout-login" : undefined}>
      <Auth
        blocked={exit.phase !== "idle"}
        configured={auth.configured}
        prepare={() => api<State>("/api/state")}
        onSuccess={(prepared) => {
          welcomeAfterEntry.current = !auth.configured;
          setState(prepared);
          setDate(todayKey(prepared.settings.timezone));
          setAuth({ configured: true, authenticated: true });
          setEntryCover(true);
          setEntryReveal(true);
          setPage("hoje");
          route.current.page = "hoje";
          history.replaceState({ ...history.state, ritmoIndex: route.current.index }, "", "#hoje");
        }}
      />
      </div>
      {exitSurface}
      </>
    );
  if (!state) return null;
  const selectedDay = dayFor(state, date);
  const journey = orderedHabits(selectedDay);
  const selectedIndex = journey.findIndex((h) => h.id === selectedHabitId);
  const selectedHabit = selectedIndex >= 0 ? journey[selectedIndex] : null;
  function afterHabitSave(h: Habit, value: number) {
    if (value > 0 && value < h.target)
      setToast({ title: "Registro salvo · meta não atingida", message: "Este valor não gera XP. Você pode complementar depois.", tone: "info" });
    const next = [...journey.slice(selectedIndex + 1), ...journey.slice(0, selectedIndex)]
      .find((candidate) => !isDone(candidate, selectedDay));
    setSelectedHabitId(next?.id ?? null);
  }
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
    startTutorial,
    completedTutorials,
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
    <>
    <div className={`app-shell${entryReveal ? " entry-reveal" : ""}${exit.phase === "returning" ? " exit-restoring" : exit.phase !== "idle" ? " exit-departure" : ""}`} inert={entryCover || exit.phase !== "idle"} aria-hidden={entryCover || exit.phase !== "idle" || undefined}>
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
            <ThemeToggle />
            <FocusIndicator session={state.focus} onOpen={() => nav("foco")} />
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
            <span className="profile-avatar-control">
              <button
                type="button"
                className="avatar small-avatar profile-avatar-button"
                aria-label={`Abrir perfil de ${state.settings.name}, nível ${level}`}
                aria-haspopup="dialog"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen(true)}
              >
                {state.settings.name.slice(0, 1).toUpperCase()}
              </button>
              <span className="profile-avatar-level" aria-hidden="true">{level}</span>
            </span>
          </div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          <div className={`page-heading${page === "hoje" ? " with-daily-word" : ""}`}>
            <div>
              {page !== "jogos" && <div className="heading-date">
                <CalendarDays size={14} />
                {dateLabel(date, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>}
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
            {page === "hoje" && (
              <blockquote className="daily-word" aria-label="Mensagem do dia">
                “{dailyWordFor(now, state.settings.timezone)}”
              </blockquote>
            )}
            <div className="page-heading-actions">
              <TutorialTrigger id={`page-${page}`} completed={completedTutorials.includes(`page-${page}`)} onStart={startTutorial} label="Guia da página" />
              {page !== "jogos" && <DatePicker
                date={date}
                today={today}
                startDate={state.settings.startDate}
                onChange={selectDate}
              />}
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
          {date !== today && page !== "jogos" && (
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
                startTutorial={startTutorial}
                completedTutorials={completedTutorials}
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
            ) : page === "foco" ? (
              <FocusPage {...props} />
            ) : page === "semana" ? (
              <ReviewPage key={weekStart(date)} {...props} />
            ) : page === "jogos" ? (
              <GamesPage {...props} />
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
      {profileOpen && state && (
        <Modal
          className="profile-modal"
          title="Seu perfil"
          description="Seu progresso, no seu ritmo."
          onClose={() => setProfileOpen(false)}
        >
          <div className="profile-level-overview">
            <LeafBadge level={level} size={88} />
            <div className="profile-identity">
              <strong>{state.settings.name}</strong>
              <span>{totalXp.toLocaleString("pt-BR")} XP acumulados</span>
            </div>
          </div>
          <section className="profile-progress-section" aria-label="Progresso de nível">
            <div className="profile-progress-heading">
              <strong>Próximo nível</strong>
              <span>{xpInLevel} / 500 XP</span>
            </div>
            <div className="profile-xp-track" role="progressbar" aria-label="XP para o próximo nível" aria-valuemin={0} aria-valuemax={500} aria-valuenow={xpInLevel} aria-valuetext={`${xpInLevel} de 500 XP`}>
              <span style={{ width: `${(xpInLevel / 500) * 100}%` }} />
            </div>
            <p>Faltam <strong>{xpToNextLevel} XP</strong> para o nível {level + 1}.</p>
          </section>
          <section className="profile-usage-streak" aria-label="Sequência de dias com atividade registrada">
            <span className="profile-streak-icon"><Flame size={19} /></span>
            <div>
              <strong>{usageDays > 0 ? `${usageDays} ${usageDays === 1 ? "dia ativo" : "dias ativos"} seguidos` : "Comece sua sequência ativa"}</strong>
              <span>{usageDays > 0 ? "com ao menos um registro salvo por dia" : "Faça um registro hoje para iniciar."}</span>
            </div>
            {usageDays > 0 && <b>{usageDays}</b>}
          </section>
          <p className="profile-streak-note">Cada dia conta quando há um registro salvo. O dia de hoje permanece aberto até a meia-noite.</p>
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
      {selectedHabit && (
        <Modal
          title={selectedHabit.title}
          description="Um pequeno passo na direção que você escolheu."
          draftKey={`${date}:${selectedHabit.id}`}
          onClose={() => setSelectedHabitId(null)}
        >
          <HabitDetail
            key={selectedHabit.id}
            habit={selectedHabit}
            value={habitValue(selectedHabit, selectedDay)}
            index={selectedIndex}
            total={journey.length}
            onPrevious={selectedIndex > 0 ? () => setSelectedHabitId(journey[selectedIndex - 1].id) : undefined}
            onNext={selectedIndex < journey.length - 1 ? () => setSelectedHabitId(journey[selectedIndex + 1].id) : undefined}
            onSave={async (value) => {
              const ok = await mutate(
                `/api/day/${date}`,
                selectedHabit.kind === "water"
                  ? { waterDelta: value - selectedDay.water }
                  : selectedHabit.kind === "sleep"
                    ? { sleep: value }
                    : { habitId: selectedHabit.id, value },
                "PATCH",
              );
              if (ok) afterHabitSave(selectedHabit, value);
              return ok;
            }}
            onEdit={() => editHabit(selectedHabit)}
            onArchive={() => archive(selectedHabit)}
            onClose={() => setSelectedHabitId(null)}
          />
        </Modal>
      )}
      {activeTutorial && !dialog && <GuidedTutorial key={activeTutorial} id={activeTutorial} onClose={closeTutorial} onComplete={completeTutorial} />}
      {toast && (
        <div
          role={toast.tone === "error" ? "alert" : "status"}
          className={`toast toast-${toast.tone}`}
        >
          <span>
            {toast.tone === "error" ? <CircleAlert size={18} /> : toast.tone === "achievement" ? <Sprout size={18} /> : toast.tone === "info" ? <CircleHelp size={18} /> : <Check size={18} />}
          </span>
          <div className="toast-copy">
            <strong>{toast.title}</strong>
            {toast.message && <span>{toast.message}</span>}
            {toast.hint && <small>{toast.hint}</small>}
          </div>
          <button aria-label="Fechar aviso" onClick={() => setToast(null)}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
    {entryCover && <EntrySurface phase="reveal" />}
    {exitSurface}
    </>
  );
}
function ClockIcon() {
  return <CalendarDays size={16} />;
}

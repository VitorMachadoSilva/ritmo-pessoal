import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, CircleAlert, Eye, EyeOff, LoaderCircle, LockKeyhole, Pause, Play, Sprout } from "lucide-react";
import { api } from "./lib";
import { Logo, Modal } from "./ui";
import { ThemeToggle } from "./Theme";
import { EntrySurface, useEntrySequence } from "./EntryTransition";

function GrowingPlant() {
  return (
    <svg className="auth-plant" viewBox="0 0 120 130" fill="none" aria-hidden="true">
      <ellipse className="plant-soil" cx="60" cy="111" rx="32" ry="5" />
      <ellipse className="plant-seed" cx="60" cy="105" rx="7" ry="5" />
      <path className="plant-stem" d="M60 103C58 82 63 61 60 33" />
      <path className="plant-leaf plant-leaf-left" d="M61 78C46 79 37 71 36 61C47 59 58 64 61 78Z" />
      <path className="plant-leaf plant-leaf-right" d="M59 63C62 48 73 42 83 44C82 55 74 64 59 63Z" />
      <path className="plant-bud" d="M60 38C53 32 53 25 60 19C67 25 67 32 60 38Z" />
      <path className="plant-flower" d="M60 24C49 20 51 12 57 13C57 3 65 4 65 13C75 12 75 20 65 24C68 33 60 35 57 25Z" />
    </svg>
  );
}

type Credentials = { name?: FormDataEntryValue; username: FormDataEntryValue | null; password: FormDataEntryValue | null; remember: boolean };
export default function Auth<T>({ configured: initiallyConfigured, prepare, onSuccess, authenticate, greetingHour, blocked = false }: {
  configured: boolean;
  prepare: () => Promise<T>;
  onSuccess: (prepared: T) => void;
  authenticate?: (credentials: Credentials) => Promise<unknown>;
  greetingHour?: number;
  blocked?: boolean;
}) {
  const [accountCreated, setAccountCreated] = useState(false);
  const configured = initiallyConfigured || accountCreated;
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [errorKind, setErrorKind] = useState<"confirm" | "credentials" | "server" | "">("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const entry = useEntrySequence();
  const [capsLock, setCapsLock] = useState(false);
  const [hasLogin, setHasLogin] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const [pageHidden, setPageHidden] = useState(document.hidden);
  const confirmRef = useRef<HTMLInputElement>(null);
  const loginRef = useRef<HTMLInputElement>(null);
  const recoveryTriggerRef = useRef<HTMLButtonElement>(null);
  const submitting = useRef(false);
  const growth = success ? "flower" : busy ? "bud" : hasPassword ? "leaves" : hasLogin ? "sprout" : "seed";
  useEffect(() => {
    if (!blocked && configured) loginRef.current?.focus({ preventScroll: true });
  }, [blocked, configured]);

  useEffect(() => {
    const onVisibility = () => setPageHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  function updateForm(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    setHasLogin(String(data.get("username") || "").trim().length > 0);
    setHasPassword(String(data.get("password") || "").length > 0);
    if (error) { setError(""); setErrorKind(""); }
  }

  function closeRecovery() {
    setRecoveryOpen(false);
    window.requestAnimationFrame(() => recoveryTriggerRef.current?.focus());
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || blocked) return;
    const data = new FormData(event.currentTarget);
    if (!configured && data.get("password") !== data.get("confirm")) {
      setError("As duas senhas precisam ser iguais.");
      setErrorKind("confirm");
      confirmRef.current?.focus();
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError("");
    setErrorKind("");
    setShake(false);
    try {
      const credentials = {
        name: data.get("name") || undefined,
        username: data.get("username"),
        password: data.get("password"),
        remember: data.has("remember"),
      };
      await (authenticate ? authenticate(credentials) : api(configured ? "/api/login" : "/api/setup", credentials));
      // Setup may succeed even if loading the dashboard fails. Retry as login,
      // never attempt to create the already-reserved personal account again.
      if (!configured) setAccountCreated(true);
      setSuccess(true);
      const prepared = await entry.run(prepare);
      onSuccess(prepared);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError((err as Error).message);
      setErrorKind((err as Error).message === "Login ou senha incorretos." ? "credentials" : "server");
      setSuccess(false);
      setShake(true);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      <main className="auth-page" data-growth={growth} data-submitting={busy || success} data-motion-paused={motionPaused || pageHidden || blocked || entry.phase !== "idle"} inert={blocked || entry.phase !== "idle"} aria-hidden={blocked || entry.phase !== "idle" || undefined}>
        <section className="auth-story">
          <Logo />
          <div className="auth-story-content">
            <span className="auth-kicker"><Sprout size={16} /> Um espaço para você</span>
            <h1>Seu próximo capítulo<br />começa no dia a dia.</h1>
            <p>Mais saúde. Mais presença. Um pequeno passo de cada vez.</p>
            <div className="auth-art" aria-hidden="true">
              <div className="auth-orbit one" /><div className="auth-orbit two" /><div className="auth-orbit three" />
              <div className="auth-art-center"><GrowingPlant /></div>
              <div className="floating-note note-one"><span className="note-check"><Check size={14} /></span> Cuidar de mim</div>
              <div className="floating-note note-two"><span>✦</span> A constância transforma.</div>
            </div>
            <button className="auth-motion-toggle" type="button" aria-pressed={motionPaused} onClick={() => setMotionPaused(!motionPaused)}>
              {motionPaused ? <Play size={14} /> : <Pause size={14} />}
              {motionPaused ? "Retomar animação" : "Pausar animação"}
            </button>
          </div>
          <div className="auth-story-footer"><span>Feito de pequenas vitórias.</span><span>Todos os dias.</span></div>
        </section>
        <section className="auth-form-side">
          <div className="auth-top"><LockKeyhole size={14} /> Seu espaço pessoal <ThemeToggle /></div>
          <div className="auth-form-wrap">
            <span className="auth-form-icon"><Sprout size={26} /></span>
            <h2>{configured ? "Bom ter você de volta." : "Encontre o seu ritmo."}</h2>
            <p>{configured ? "Entre para continuar construindo sua melhor rotina." : "Crie seu acesso exclusivo e dê o primeiro passo."}</p>
            <form onSubmit={submit} onInput={updateForm} className={shake ? "auth-shake" : undefined} onAnimationEnd={(event) => { if (event.animationName === "entry-error-shake") setShake(false); }}>
              <fieldset className="auth-fields" disabled={busy || success}>
              {!configured && <label>Como você quer ser chamado?<input name="name" autoComplete="given-name" placeholder="Seu nome" maxLength={100} required autoFocus /></label>}
              <label>Login<input ref={loginRef} name="username" autoComplete="username" placeholder={configured ? "Seu login" : "Escolha seu login"} minLength={3} maxLength={100} required autoFocus={configured && !blocked} aria-invalid={errorKind === "credentials"} aria-describedby={errorKind === "credentials" ? "auth-error" : undefined} /></label>
              <div className="auth-password-group">
                <label htmlFor="auth-password">Senha</label>
                <div className="password-field">
                  <input id="auth-password" name="password" type={show ? "text" : "password"} autoComplete={configured ? "current-password" : "new-password"} placeholder={configured ? "Sua senha" : "Pelo menos 12 caracteres"} minLength={12} maxLength={128} required aria-invalid={errorKind === "credentials"} aria-describedby={[capsLock ? "caps-warning" : "", errorKind === "credentials" ? "auth-error" : ""].filter(Boolean).join(" ") || undefined} onKeyDown={(event) => setCapsLock(event.getModifierState("CapsLock"))} onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))} onBlur={() => setCapsLock(false)} />
                  <button type="button" className="icon-button" aria-label={show ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShow(!show)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                {capsLock && <span id="caps-warning" className="auth-caps-note">Caps Lock está ativado.</span>}
              </div>
              {!configured && <label>Confirmar senha<input ref={confirmRef} name="confirm" type={show ? "text" : "password"} autoComplete="new-password" placeholder="Repita sua senha" minLength={12} maxLength={128} required aria-invalid={errorKind === "confirm"} aria-describedby={errorKind === "confirm" ? "auth-error" : undefined} /></label>}
              <div className="auth-options">
                <label className="auth-remember"><input type="checkbox" name="remember" /><span>Manter conectado por 7 dias</span></label>
                {configured && <button ref={recoveryTriggerRef} type="button" className="auth-recover-link" onClick={() => setRecoveryOpen(true)}>Esqueci minha senha</button>}
              </div>
              {error && <p id="auth-error" role="alert" className="form-error auth-error"><CircleAlert size={17} aria-hidden="true" />{error}</p>}
              </fieldset>
              <button className="button primary auth-submit" disabled={busy || success} aria-busy={busy}>
                {busy ? <><span>{configured ? "Entrando…" : "Criando seu espaço…"}</span><LoaderCircle size={18} className="spin" /></> : success ? <><span>Pronto para continuar</span><Check size={19} /></> : <>{configured ? "Entrar no meu espaço" : "Criar meu espaço"}<ArrowUpRight size={19} /></>}
              </button>
            </form>
            <div className="auth-note"><LockKeyhole size={15} /><span>{configured ? "Acesso reservado. Seus registros ficam no seu computador." : "Uma única conta. Depois de criada, novos cadastros ficam fechados."}</span></div>
          </div>
          <div className="auth-bottom">Um compromisso com você. No seu tempo.</div>
        </section>
      </main>
      {entry.phase !== "idle" && <EntrySurface phase={entry.phase} hour={greetingHour} />}
      {recoveryOpen && <Modal title="Recuperar meu acesso" description="A recuperação acontece no computador onde o Ritmo está instalado." onClose={closeRecovery}>
        <div className="auth-recovery">
          <p>Abra um terminal na pasta do projeto e execute:</p>
          <code>npm run recover</code>
          <p>O comando mostra seu login e pede uma confirmação antes de gerar uma senha temporária. Todas as sessões serão encerradas, mas seus registros permanecem.</p>
          <p>Entre com a senha temporária e use <strong>Ajustes → Alterar senha</strong>. Se o Ritmo estiver hospedado em outro computador, execute o comando no servidor.</p>
          <div className="modal-actions"><button type="button" className="button primary" onClick={closeRecovery}>Entendi</button></div>
        </div>
      </Modal>}
    </>
  );
}

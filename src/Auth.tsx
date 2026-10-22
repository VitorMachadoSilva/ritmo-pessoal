import { useState } from "react";
import {
  ArrowUpRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Check,
  Sprout,
  LoaderCircle,
} from "lucide-react";
import { api } from "./lib";
import { Logo } from "./ui";
export default function Auth({
  configured,
  onSuccess,
}: {
  configured: boolean;
  onSuccess: () => Promise<void>;
}) {
  const [show, setShow] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (!configured && data.get("password") !== data.get("confirm")) {
      setError("As duas senhas precisam ser iguais.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api(configured ? "/api/login" : "/api/setup", {
        name: data.get("name") || undefined,
        username: data.get("username"),
        password: data.get("password"),
      });
      await onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <section className="auth-story">
        <Logo />
        <div className="auth-story-content">
          <span className="auth-kicker">
            <Sprout size={16} /> Um espaço para você
          </span>
          <h1>
            Seu próximo capítulo
            <br />
            começa no dia a dia.
          </h1>
          <p>Mais saúde. Mais presença. Um pequeno passo de cada vez.</p>
          <div className="auth-art" aria-hidden="true">
            <div className="auth-orbit one" />
            <div className="auth-orbit two" />
            <div className="auth-orbit three" />
            <div className="auth-art-center">
              <Sprout size={57} strokeWidth={1.1} />
            </div>
            <div className="floating-note note-one">
              <span className="note-check">
                <Check size={14} />
              </span>{" "}
              Cuidar de mim
            </div>
            <div className="floating-note note-two">
              <span>✦</span> A constância transforma.
            </div>
            <div className="auth-art-point" />
          </div>
        </div>
        <div className="auth-story-footer">
          <span>Feito de pequenas vitórias.</span>
          <span>Todos os dias.</span>
        </div>
      </section>
      <section className="auth-form-side">
        <div className="auth-top">
          <LockKeyhole size={14} /> Seu espaço pessoal
        </div>
        <div className="auth-form-wrap">
          <span className="auth-form-icon">
            <Sprout size={26} />
          </span>
          <h2>
            {configured ? "Bom ter você de volta." : "Encontre o seu ritmo."}
          </h2>
          <p>
            {configured
              ? "Entre para continuar construindo sua melhor rotina."
              : "Crie seu acesso exclusivo e dê o primeiro passo."}
          </p>
          <form onSubmit={submit}>
            {!configured && (
              <label>
                Como você quer ser chamado?
                <input
                  name="name"
                  autoComplete="given-name"
                  placeholder="Seu nome"
                  maxLength={100}
                  required
                  autoFocus
                />
              </label>
            )}
            <label>
              Login
              <input
                name="username"
                autoComplete="username"
                placeholder="Escolha seu login"
                minLength={3}
                maxLength={100}
                required
                autoFocus={configured}
              />
            </label>
            <label>
              Senha
              <div className="password-field">
                <input
                  name="password"
                  type={show ? "text" : "password"}
                  autoComplete={
                    configured ? "current-password" : "new-password"
                  }
                  placeholder={
                    configured ? "Sua senha" : "Pelo menos 12 caracteres"
                  }
                  minLength={12}
                  maxLength={128}
                  required
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {!configured && (
              <label>
                Confirmar senha
                <input
                  name="confirm"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repita sua senha"
                  minLength={12}
                  maxLength={128}
                  required
                />
              </label>
            )}
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <button className="button primary auth-submit" disabled={busy}>
              {busy ? (
                <LoaderCircle size={18} className="spin" />
              ) : (
                <>
                  {configured ? "Entrar no meu espaço" : "Criar meu espaço"}
                  <ArrowUpRight size={19} />
                </>
              )}
            </button>
          </form>
          <div className="auth-note">
            <LockKeyhole size={15} />
            <span>
              {configured
                ? "Acesso reservado. Seus registros ficam no seu computador."
                : "Uma única conta. Depois de criada, novos cadastros ficam fechados."}
            </span>
          </div>
        </div>
        <div className="auth-bottom">
          Um compromisso com você. No seu tempo.
        </div>
      </section>
    </main>
  );
}

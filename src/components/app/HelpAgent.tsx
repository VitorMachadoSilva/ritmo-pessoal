import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Send, X } from "lucide-react";
import type { PageId } from "../../types";
import { getPageSuggestions, searchHelp, type HelpSearchResult } from "../../help/search";
import type { HelpEntry } from "../../help/knowledge";
import { Folhinha } from "./Folhinha";
import { useFolhinhaAmbient } from "./useFolhinhaAmbient";

type Message = { id: number; from: "bot" | "user"; text: string; options?: HelpEntry[]; links?: HelpEntry["links"]; noFeedback?: boolean };
const GREETING = "Oi! Eu sou o Folhinha. Posso ajudar você a usar o Ritmo. O que quer descobrir?";
const FALLBACK = "Ainda não encontrei uma resposta segura para isso. Tente escolher uma sugestão ou reformular sua dúvida. O guia “Como funciona” continua disponível no menu.";
const SESSION_MS = 120_000;
const REPLY_DELAY_MS = 3_000;

export function HelpAgent({ page }: { page: PageId }) {
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState<"idle" | "happy" | "thinking" | "wave">("idle");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ id: 0, from: "bot", text: GREETING }]);
  const [replyRevision, setReplyRevision] = useState(0);
  const [reminderVisible, setReminderVisible] = useState(false);
  const [followUpDismissed, setFollowUpDismissed] = useState(false);
  const [showMoreSuggestions, setShowMoreSuggestions] = useState(false);
  const [farewellPhase, setFarewellPhase] = useState<"none" | "waving" | "settling">("none");
  const hasAsked = messages.some((message) => message.from === "user");
  const canRemind = !open && !busy && hasAsked;
  const nextId = useRef(1);
  const responseTimer = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const ambient = useFolhinhaAmbient(!open && !busy && !hasAsked && farewellPhase === "none", () => {
    setOpen(true);
    setMood("wave");
  });

  useEffect(() => {
    if (farewellPhase === "none") return;
    const timer = window.setTimeout(() => setFarewellPhase(farewellPhase === "waving" ? "settling" : "none"), farewellPhase === "waving" ? 3_000 : 450);
    return () => window.clearTimeout(timer);
  }, [farewellPhase]);

  useEffect(() => {
    if (!canRemind) {
      setReminderVisible(false);
      return;
    }
    let hideTimer: number;
    const remind = () => {
      setReminderVisible(true);
      hideTimer = window.setTimeout(() => setReminderVisible(false), 2800);
    };
    remind();
    const repeatTimer = window.setInterval(remind, 10_000);
    return () => {
      window.clearInterval(repeatTimer);
      window.clearTimeout(hideTimer);
    };
  }, [canRemind]);

  useEffect(() => {
    return () => { if (responseTimer.current !== null) window.clearTimeout(responseTimer.current); };
  }, []);

  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (busy) return;
    const timer = window.setTimeout(() => {
      resetConversation();
    }, SESSION_MS);
    return () => window.clearTimeout(timer);
  }, [busy, replyRevision]);

  function addUser(text: string) {
    setFollowUpDismissed(false);
    setShowMoreSuggestions(false);
    setMessages((current) => [...current, { id: nextId.current++, from: "user", text }]);
  }

  function resetConversation() {
    setMessages([{ id: nextId.current++, from: "bot", text: GREETING }]);
    setInput("");
    setMood("idle");
    setFollowUpDismissed(false);
    setShowMoreSuggestions(false);
  }

  function finishConversation() {
    resetConversation();
    setOpen(false);
    setFarewellPhase("waving");
    triggerRef.current?.focus();
  }

  function addBotResult(result: HelpSearchResult) {
    const answer = result.type === "answer" ? result.entry.answer : result.type === "options"
      ? "Encontrei alguns assuntos próximos. Qual deles combina melhor com sua dúvida?"
      : FALLBACK;
    const entry = result.type === "answer" ? result.entry : undefined;
    setMessages((current) => [...current, {
      id: nextId.current++, from: "bot", text: answer,
      options: result.type === "options" ? result.entries : undefined,
      links: entry?.links,
      noFeedback: entry?.noFeedback,
    }]);
    setMood("happy");
    setReplyRevision((current) => current + 1);
  }

  function answerEntry(entry: HelpEntry) {
    if (busy) return;
    addUser(entry.question);
    setBusy(true);
    setMood("thinking");
    responseTimer.current = window.setTimeout(() => {
      addBotResult({ type: "answer", entry });
      setBusy(false);
    }, REPLY_DELAY_MS);
  }

  function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    setInput("");
    addUser(question);
    setBusy(true);
    setMood("thinking");
    responseTimer.current = window.setTimeout(() => {
      addBotResult(searchHelp(question, page));
      setBusy(false);
    }, REPLY_DELAY_MS);
  }

  const suggestions = getPageSuggestions(page);

  return <div className={`help-agent${open ? " is-open" : ""}${ambient.scene ? ` is-ambient is-ambient-${ambient.scene}${ambient.phase === "exiting" ? " is-ambient-exiting" : ""}${!ambient.visible ? " is-ambient-paused" : ""}` : ""}`} data-scene={ambient.scene ?? undefined} ref={rootRef}>
    {open && <section className="help-agent-panel" role="dialog" aria-modal="false" aria-labelledby="help-agent-title">
      <header className="help-agent-header">
        <span className="help-agent-avatar"><Folhinha size={38} mood={busy ? "thinking" : mood} /></span>
        <span className="help-agent-heading"><strong id="help-agent-title">Folhinha</strong><small>{busy ? "Procurando uma resposta…" : "Ajuda do Ritmo"}</small></span>
        <button className="help-agent-close" type="button" aria-label="Minimizar ajuda" onClick={() => { setOpen(false); triggerRef.current?.focus(); }}><X size={18} /></button>
      </header>
      <div className="help-agent-messages" ref={listRef} aria-live="polite" aria-relevant="additions text">
        {messages.map((message) => <article key={message.id} className={`help-agent-message is-${message.from}`}>
          <p>{message.text}</p>
          {message.links?.map((link) => <a className="help-agent-option" key={link.href} href={link.href} target={link.href.startsWith("https:") ? "_blank" : undefined} rel={link.href.startsWith("https:") ? "noreferrer" : undefined}>{link.label}{link.href.startsWith("https:") && <ArrowUpRight size={13} />}</a>)}
          {message.options?.map((entry) => <button className="help-agent-option" key={entry.id} type="button" disabled={busy} onClick={() => answerEntry(entry)}>{entry.question}</button>)}
        </article>)}
        {busy && <div className="help-agent-typing" role="status" aria-label="Folhinha está escrevendo"><span /><span /><span /></div>}
      </div>
      {(!hasAsked || messages.at(-1)?.text === FALLBACK || showMoreSuggestions) && <div className="help-agent-suggestions" aria-label="Sugestões para esta página">
        {suggestions.map((entry) => <button type="button" key={entry.id} disabled={busy} onClick={() => answerEntry(entry)}>{entry.question}</button>)}
      </div>}
      {hasAsked && !busy && !followUpDismissed && messages.at(-1)?.from === "bot" && <div className="help-agent-followup" role="group" aria-label="Continuar conversa">
        <span>Precisa de mais alguma coisa?</span>
        <div>
          <button type="button" onClick={() => { setFollowUpDismissed(true); setShowMoreSuggestions(true); document.getElementById("help-agent-input")?.focus(); }}>Sim</button>
          <button type="button" onClick={finishConversation}>Não, finalizar</button>
        </div>
      </div>}
      <form className="help-agent-form" onSubmit={(event) => { event.preventDefault(); send(input); }}>
        <label className="sr-only" htmlFor="help-agent-input">Escreva sua dúvida</label>
        <input id="help-agent-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Escreva sua dúvida…" disabled={busy} autoComplete="off" />
        <button type="submit" aria-label="Enviar pergunta" disabled={busy || !input.trim()}><Send size={16} /></button>
      </form>
    </section>}
    {canRemind && reminderVisible && <span className="help-agent-reminder" aria-hidden="true">Sua conversa está aqui 🌱</span>}
    {farewellPhase !== "none" && <span className={`help-agent-reminder${farewellPhase === "settling" ? " is-leaving" : ""}`} aria-live="polite">Tchau, até logo! 👋</span>}
    <button ref={triggerRef} className="help-agent-trigger" type="button" onClick={() => { if (ambient.openAfterExit()) return; setFarewellPhase("none"); setOpen((current) => !current); setMood(open ? "idle" : "wave"); }} onMouseEnter={() => setButtonHovered(true)} onMouseLeave={() => setButtonHovered(false)} onFocus={() => setButtonHovered(true)} onBlur={() => setButtonHovered(false)} aria-label={open ? "Minimizar ajuda do Folhinha" : "Abrir ajuda do Folhinha"} aria-expanded={open}>
      <Folhinha size={46} mood={open ? "listening" : farewellPhase === "waving" ? "wave" : farewellPhase === "settling" ? "settling" : canRemind && reminderVisible ? "reminder" : "idle"} hovered={buttonHovered} />
    </button>
  </div>;
}

export type ToastTone = "success" | "achievement" | "info" | "error";

export type ToastNotice = {
  title: string;
  message?: string;
  hint?: string;
  tone: ToastTone;
  durationMs?: number;
};

type Payload = Record<string, unknown>;

function record(value: unknown): Payload {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Payload)
    : {};
}

function endpointLabel(url: string, body: unknown, method = "PATCH", previouslyArchived = false) {
  const data = record(body);
  if (url.startsWith("/api/games/")) {
    if (url.endsWith("/reset-timers")) return { action: "resetar os tempos dos jogos", subject: "jogos", hint: "Os tempos continuam como estavam. Confira a conexão e tente novamente." };
    const action = url.endsWith("/start") ? "abrir o desafio" : url.endsWith("/cancel") ? "cancelar a partida" : "salvar o resultado";
    return { action, subject: "jogo", hint: url.endsWith("/cancel") ? "A partida continua ativa. Confira a conexão e tente novamente." : "Seu desafio continua disponível. Confira a conexão e tente novamente." };
  }
  if (url === "/api/password") return { action: "alterar a senha", subject: "senha", hint: "Confira a senha atual e tente novamente." };
  if (url === "/api/settings") return { action: "salvar os ajustes", subject: "ajustes", hint: "Suas alterações continuam na tela para você tentar novamente." };
  if (url === "/api/import") return { action: "restaurar o backup", subject: "backup", hint: "Os dados atuais foram mantidos. Confira se o arquivo é um backup válido." };
  if (url.startsWith("/api/habits")) {
    if (data.archived === true) return { action: "remover o hábito", subject: "hábito", hint: "O hábito continua na rotina. Tente novamente ou revise os hábitos essenciais do dia." };
    if (data.archived === false && previouslyArchived) return { action: "restaurar o hábito", subject: "hábito", hint: "O hábito continua removido. Você pode tentar novamente em Minha rotina." };
    if (method === "DELETE") return { action: "remover o hábito", subject: "hábito", hint: "O histórico permanece preservado. Tente novamente." };
    return { action: "salvar o hábito", subject: "hábito", hint: "Suas alterações continuam no formulário." };
  }
  if (url.startsWith("/api/meals")) {
    return method === "DELETE"
      ? { action: "remover a refeição", subject: "refeição", hint: "O planejamento não foi alterado. Tente novamente." }
      : { action: "salvar a refeição", subject: "refeição", hint: "Seus dados continuam no formulário." };
  }
  if (url.startsWith("/api/workouts/")) {
    return method === "DELETE"
      ? { action: "remover a ficha", subject: "treino", hint: "As sessões registradas são preservadas. Tente novamente." }
      : { action: "salvar o treino", subject: "treino", hint: "Suas alterações continuam no formulário." };
  }
  if (url === "/api/workouts") return { action: "salvar a ficha", subject: "treino", hint: "Suas alterações continuam no formulário." };
  if (url.startsWith("/api/focus/")) {
    const action = url.split("/").at(-1) ?? "";
    const labels: Record<string, string> = {
      start: "iniciar o foco", pause: "pausar o foco", resume: "retomar o foco",
      finish: "registrar a sessão", cancel: "descartar a sessão",
    };
    return { action: labels[action] ?? (method === "DELETE" ? "remover a sessão" : "atualizar o foco"), subject: "sessão de foco", hint: "A sessão não foi alterada. Confira a conexão e tente novamente." };
  }
  if (url.startsWith("/api/weeks/")) return { action: "salvar a revisão", subject: "revisão semanal", hint: "Suas reflexões continuam na tela." };
  if (url.startsWith("/api/day/")) {
    if ("mode" in data) return { action: "mudar o ritmo do dia", subject: "modo do dia", hint: "O modo anterior foi mantido. Você pode tentar novamente." };
    if ("energy" in data) return { action: "atualizar sua energia", subject: "energia", hint: "O registro anterior foi mantido. Tente novamente." };
    if ("waterDelta" in data) return { action: "atualizar a água", subject: "hidratação", hint: "O volume anterior foi mantido. Confira a conexão e tente novamente." };
    if ("weight" in data) return { action: "salvar o peso", subject: "peso", hint: "O peso não foi alterado. Confira o valor e tente novamente." };
    if ("workout" in data) return { action: "salvar o treino do dia", subject: "treino", hint: "O registro anterior foi mantido. Confira a conexão e tente novamente." };
    if ("journal" in data || "win" in data || "next" in data || "mood" in data) return { action: "salvar o diário", subject: "diário", hint: "Suas anotações continuam na tela." };
    if ("habitId" in data || "sleep" in data) return { action: "salvar a atividade", subject: "registro", hint: "O valor continua disponível para tentar novamente." };
  }
  return { action: "salvar a alteração", subject: "alteração", hint: "Confira a conexão e tente novamente." };
}

/** A confirmed write gets feedback only when it helps the person understand a meaningful change. */
export function successToastForMutation(
  url: string,
  body: unknown,
  method = "PATCH",
  gainedXp = 0,
  previouslyArchived = false,
): ToastNotice | null {
  const data = record(body);
  if (url === "/api/games/reset-timers") return { title: "Jogos liberados", message: "As novas rodadas terão desafios inéditos.", tone: "success" };
  if (url.startsWith("/api/games/")) return null;
  if (url.startsWith("/api/day/") && ("mode" in data || "energy" in data)) return null;

  if (gainedXp > 0 && url.startsWith("/api/day/") && ("habitId" in data || "sleep" in data || "waterDelta" in data || "workout" in data)) {
    return { title: "Pequena vitória!", message: `+${gainedXp} XP registrados.`, tone: "achievement" };
  }
  if (url.startsWith("/api/day/")) {
    if ("waterDelta" in data) {
      const amount = Math.abs(Number(data.waterDelta) || 0);
      return { title: Number(data.waterDelta) < 0 ? "Registro de água ajustado" : "Água registrada", message: `${amount} ml ${Number(data.waterDelta) < 0 ? "retirados do registro" : "adicionados"}.`, tone: "success" };
    }
    if ("weight" in data) return data.weight === null
      ? { title: "Registro removido", message: "O peso saiu deste dia.", tone: "info" }
      : { title: "Peso registrado", message: "Seu histórico foi atualizado.", tone: "success" };
    if ("workout" in data) return { title: data.workout && typeof data.workout === "object" && (data.workout as Payload).completed ? "Treino concluído" : "Treino salvo", message: "O registro do dia foi atualizado.", tone: "success" };
    if ("journal" in data || "win" in data || "next" in data || "mood" in data) return { title: "Diário salvo", message: "Suas anotações ficaram registradas.", tone: "success" };
    if ("habitId" in data) return Number(data.value) === 0
      ? { title: "Atividade desmarcada", message: "O progresso e os pontos foram atualizados.", tone: "info" }
      : null; // Partial values announce their zero-XP status after the saved state is known.
    if ("sleep" in data) return { title: "Sono registrado", message: "O valor ficou salvo neste dia.", tone: "success" };
  }
  if (url.startsWith("/api/habits")) {
    if (data.archived === true || method === "DELETE") return { title: "Hábito removido", message: "O histórico continua preservado.", tone: "info" };
    if (data.archived === false && previouslyArchived) return { title: "Hábito restaurado", message: "Ele voltou para sua rotina.", tone: "success" };
    return { title: url === "/api/habits" ? "Hábito criado" : "Hábito atualizado", message: "Sua rotina foi salva.", tone: "success" };
  }
  if (url.startsWith("/api/meals")) return method === "DELETE"
    ? { title: "Refeição removida", message: "Seu planejamento foi atualizado.", tone: "info" }
    : { title: url === "/api/meals" ? "Refeição adicionada" : "Refeição atualizada", message: "Seu planejamento foi salvo.", tone: "success" };
  if (url.startsWith("/api/workouts/")) return method === "DELETE"
    ? { title: "Ficha removida", message: "As sessões já registradas foram mantidas.", tone: "info" }
    : { title: "Ficha atualizada", message: "Seu treino foi salvo.", tone: "success" };
  if (url === "/api/workouts") return { title: "Ficha criada", message: "Seu treino está pronto para usar.", tone: "success" };
  if (url === "/api/password") return { title: "Senha atualizada", message: "Use a nova senha no próximo acesso.", tone: "success" };
  if (url === "/api/settings") return { title: "Ajustes salvos", message: "Suas preferências foram atualizadas.", tone: "success" };
  if (url === "/api/import") return { title: "Backup restaurado", message: "Seus dados foram atualizados pelo arquivo.", tone: "success" };
  if (url.startsWith("/api/weeks/")) return { title: "Revisão salva", message: "Suas reflexões ficaram registradas.", tone: "success" };
  if (url === "/api/focus/start") return { title: "Foco iniciado", message: "Sua sessão está em andamento.", tone: "success" };
  if (url === "/api/focus/pause") return { title: "Sessão pausada", message: "Você pode retomar quando quiser.", tone: "info" };
  if (url === "/api/focus/resume") return { title: "Foco retomado", message: "Sua sessão continua de onde parou.", tone: "success" };
  if (url === "/api/focus/finish") return gainedXp > 0
    ? { title: "Sessão registrada", message: `Pequena vitória! +${gainedXp} XP.`, tone: "achievement" }
    : { title: "Sessão registrada", message: "Seu tempo de foco foi salvo.", tone: "success" };
  if (url === "/api/focus/cancel") return { title: "Sessão descartada", message: "O tempo não entrou no histórico.", tone: "info" };
  if (url.startsWith("/api/focus/") && method === "DELETE") return { title: "Sessão removida", message: "O histórico de foco foi atualizado.", tone: "info" };
  return null;
}

export function errorToastForMutation(url: string, error: unknown, body?: unknown, method = "PATCH", previouslyArchived = false): ToastNotice {
  if (error && typeof error === "object" && "status" in error && error.status === 429) {
    const retryAfter = "retryAfterSeconds" in error && typeof error.retryAfterSeconds === "number"
      ? error.retryAfterSeconds
      : undefined;
    const wait = retryAfter === undefined
      ? "Aguarde um pouco e tente novamente."
      : retryAfter >= 60
        ? `Tente novamente em ${Math.ceil(retryAfter / 60)} min.`
        : `Tente novamente em ${Math.max(1, retryAfter)} s.`;
    return {
      title: "Muitas solicitações em pouco tempo",
      message: wait,
      hint: "Esta ação não foi salva. Seus dados continuam disponíveis na tela.",
      tone: "error",
      durationMs: 5000,
    };
  }
  const { action, hint } = endpointLabel(url, body, method, previouslyArchived);
  const detail = error instanceof Error && error.message.trim()
    ? error.message.trim()
    : "Tente novamente em instantes.";
  const offline = /sem conexão|não respondeu|fetch failed|networkerror/i.test(detail);
  return {
    title: `Não foi possível ${action}`,
    message: detail,
    hint: offline ? "Confira se o Ritmo e a conexão estão ativos. Depois, verifique a tela antes de repetir a ação." : hint,
    tone: "error",
  };
}

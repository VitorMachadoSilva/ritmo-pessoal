import type { PageId } from "./types";

export type TutorialStep = { target: string; title: string; body: string };
export type Tutorial = { id: string; page: PageId; title: string; steps: TutorialStep[] };

// IDs são persistidos no navegador; aumente a versão quando mudar a semântica dos guias.
export const TUTORIAL_STORAGE_KEY = "ritmo:guided-tutorials:v1";
export const TUTORIAL_VERSION = 1;
export const tutorials: Tutorial[] = [
  { id: "page-hoje", page: "hoje", title: "Visão geral", steps: [
    { target: "today-overview", title: "Seu dia começa aqui", body: "Veja o resumo, o progresso real e os próximos passos da rotina." },
    { target: "today-agenda", title: "Uma atividade por vez", body: "Consulte os hábitos do dia e abra um registro quando estiver pronto." },
  ] },
  { id: "feature-water", page: "hoje", title: "Hidratação", steps: [
    { target: "today-water", title: "Acompanhe a água", body: "Registre ao longo do dia. O painel mostra o total sem exigir que você beba de uma vez." },
    { target: "today-agenda", title: "O registro é seu", body: "A hidratação só muda quando você escolhe uma ação no painel." },
  ] },
  { id: "page-rotina", page: "rotina", title: "Minha rotina", steps: [
    { target: "routine-intro", title: "Uma rotina ajustável", body: "Crie hábitos que façam sentido para sua semana e edite-os quando necessário." },
    { target: "routine-tools", title: "Encontre e organize", body: "Filtre por área, busque hábitos e alterne entre ativos e removidos." },
    { target: "routine-list", title: "Seus compromissos", body: "A lista é paginada; mudar a quantidade por página não altera os registros." },
  ] },
  { id: "feature-routine", page: "rotina", title: "Gestão de hábitos", steps: [
    { target: "routine-create", title: "Crie um hábito", body: "Defina nome, horário, frequência e esforço. O Ritmo não executa ações por você." },
    { target: "routine-list", title: "Edite ou remova", body: "Cada hábito pode ser ajustado ou arquivado; o histórico permanece preservado." },
  ] },
  { id: "page-evolucao", page: "evolucao", title: "Evolução", steps: [
    { target: "evolution-periods", title: "Escolha o período", body: "Alterne entre janelas de 7, 30 e 90 dias para observar tendências." },
    { target: "evolution-chart", title: "Peso ao longo do tempo", body: "Os pontos vêm de registros que você salvou. A tendência não é diagnóstico." },
  ] },
  { id: "feature-weight", page: "evolucao", title: "Registro de peso", steps: [
    { target: "weight-register", title: "Registre quando quiser", body: "Use o campo para informar o peso e salvar uma medição com a data escolhida." },
    { target: "evolution-chart", title: "Acompanhe sem pressa", body: "Uma medida isolada oscila; observe a tendência em vez de reagir a um único dia." },
  ] },
  { id: "page-treinos", page: "treinos", title: "Treinos", steps: [
    { target: "training-intro", title: "Força para a vida", body: "Organize fichas, exercícios e sessões em um só lugar." },
    { target: "training-list", title: "Escolha uma ficha", body: "Abra uma ficha para iniciar ou editar. Registros concluídos ficam no histórico." },
  ] },
  { id: "feature-workout", page: "treinos", title: "Fichas e registros", steps: [
    { target: "training-create", title: "Monte sua ficha", body: "Inclua exercícios e parâmetros que você escolheu. O app não prescreve cargas." },
    { target: "training-history", title: "Registre a sessão", body: "Salve sessões parciais ou concluídas; o histórico reflete o que foi registrado." },
  ] },
  { id: "page-jogos", page: "jogos", title: "Jogos da mente", steps: [
    { target: "games-intro", title: "Desafios curtos", body: "Cada jogo pratica uma tarefa diferente. Você pode escolher qualquer desafio disponível." },
    { target: "games-grid", title: "Uma rodada por vez", body: "Depois de concluir um jogo, ele libera uma nova configuração após 24 horas." },
    { target: "games-note", title: "Um resultado da rodada", body: "Os resultados são recreativos e não avaliam sua saúde ou capacidade geral." },
  ] },
  { id: "feature-games", page: "jogos", title: "Como jogar", steps: [
    { target: "games-grid", title: "Escolha um jogo", body: "Pares, sequência, Stroop ou busca visual: cada experiência tem instruções simples." },
    { target: "games-note", title: "Sem pressão por pontuação", body: "O placar descreve somente a rodada atual e não acrescenta XP à sua rotina." },
  ] },
  { id: "page-alimentacao", page: "alimentacao", title: "Alimentação", steps: [
    { target: "food-overview", title: "Planejamento alimentar", body: "Os totais são estimativas do plano cadastrado, não consumo medido." },
    { target: "food-list", title: "Organize refeições", body: "Veja horários e refeições e ajuste o planejamento às suas preferências." },
  ] },
  { id: "feature-meal", page: "alimentacao", title: "Refeições", steps: [
    { target: "food-create", title: "Adicione uma refeição", body: "Informe nome e horário; os valores nutricionais são estimativas editáveis." },
    { target: "food-list", title: "Revise seu plano", body: "Edite ou remova itens sem transformar estimativas em metas clínicas." },
  ] },
  { id: "page-diario", page: "diario", title: "Meu diário", steps: [
    { target: "journal-editor", title: "Um espaço privado", body: "Registre humor, pensamentos, uma vitória e um próximo passo." },
    { target: "journal-history", title: "Consulte outros dias", body: "As entradas salvas podem ser revistas pelo histórico, na data correspondente." },
  ] },
  { id: "feature-journal", page: "diario", title: "Escrita e humor", steps: [
    { target: "journal-editor", title: "Escreva no seu ritmo", body: "Você pode registrar só o que quiser. Salve antes de sair para manter as mudanças." },
    { target: "journal-history", title: "Volte quando precisar", body: "O histórico reúne entradas já salvas e não interfere em outras áreas." },
  ] },
  { id: "page-foco", page: "foco", title: "Tempo de foco", steps: [
    { target: "focus-stage", title: "Um intervalo protegido", body: "O relógio mostra a sessão em andamento; ele não mede sua atenção." },
    { target: "focus-setup", title: "Prepare uma sessão", body: "Escolha uma tarefa e uma duração de 1 a 120 minutos. A sessão pode ser pausada." },
  ] },
  { id: "feature-focus", page: "foco", title: "Sessão de foco", steps: [
    { target: "focus-setup", title: "Antes de começar", body: "Defina a tarefa e o tempo. Vincular um hábito é opcional." },
    { target: "focus-stage", title: "Ao terminar", body: "Registre a sessão para guardar os minutos; o cronômetro não cria XP por si só." },
  ] },
  { id: "page-semana", page: "semana", title: "Revisão semanal", steps: [
    { target: "review-week", title: "Observe a semana", body: "Compare os dias registrados e navegue para outras semanas disponíveis." },
    { target: "review-notes", title: "Reflita sem julgamento", body: "Anote o que funcionou, o que pode ficar mais fácil e uma prioridade." },
  ] },
  { id: "feature-review", page: "semana", title: "Reflexão semanal", steps: [
    { target: "review-notes", title: "Três perguntas curtas", body: "Use as perguntas para escolher ajustes pequenos para a semana seguinte." },
    { target: "review-save", title: "Salve suas notas", body: "As reflexões só são gravadas quando você aciona Salvar revisão." },
  ] },
  { id: "page-ajustes", page: "ajustes", title: "Ajustes", steps: [
    { target: "settings-form", title: "Perfil e metas", body: "Revise seu nome, fuso e metas editáveis para o seu contexto." },
    { target: "settings-backup", title: "Cuide dos seus dados", body: "Exporte uma cópia privada ou restaure um backup com confirmação." },
  ] },
  { id: "feature-backup", page: "ajustes", title: "Backup e restauração", steps: [
    { target: "settings-backup", title: "Exporte uma cópia", body: "O arquivo inclui registros pessoais de saúde; guarde-o com cuidado." },
    { target: "settings-backup", title: "Restaure com atenção", body: "A restauração substitui os dados atuais e pede confirmação antes de prosseguir." },
  ] },
];

export type TutorialProgress = { version: number; completed: string[] };
export function parseTutorialProgress(raw: string | null): TutorialProgress {
  if (!raw) return { version: TUTORIAL_VERSION, completed: [] };
  try {
    const value = JSON.parse(raw) as Partial<TutorialProgress>;
    if (value.version !== TUTORIAL_VERSION || !Array.isArray(value.completed)) return { version: TUTORIAL_VERSION, completed: [] };
    const known = new Set(tutorials.map((tutorial) => tutorial.id));
    return { version: TUTORIAL_VERSION, completed: [...new Set(value.completed.filter((id): id is string => typeof id === "string" && known.has(id)))] };
  } catch { return { version: TUTORIAL_VERSION, completed: [] }; }
}
export function saveTutorialProgress(ids: string[], storage?: Pick<Storage, "setItem">): boolean {
  try {
    const target = storage ?? window.localStorage;
    const known = new Set(tutorials.map((tutorial) => tutorial.id));
    target.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify({ version: TUTORIAL_VERSION, completed: [...new Set(ids.filter((id) => known.has(id)))] }));
    return true;
  } catch { return false; }
}
export function tutorialFor(id: string) { return tutorials.find((tutorial) => tutorial.id === id); }

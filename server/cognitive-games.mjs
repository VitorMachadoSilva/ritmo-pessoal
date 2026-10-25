import { createHash, randomInt, randomUUID } from "node:crypto";

export const COGNITIVE_GAME_IDS = ["memory", "sequence", "stroop", "schulte"];
export const COGNITIVE_GAME_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const COLORS = ["vermelho", "azul", "verde", "amarelo"];
const SYMBOLS = ["🌿", "🍐", "🪷", "🪺", "🍋", "🫐", "🪴", "🌻", "🍄", "🪸", "🍇", "🪻", "🐚", "🍉", "🌱", "🦋"];
export const MEMORY_DIFFICULTIES = Object.freeze({ easy: 8, medium: 10, hard: 12 });
export const GAME_DIFFICULTIES = Object.freeze({
  memory: MEMORY_DIFFICULTIES,
  sequence: Object.freeze({ easy: 6, medium: 7, hard: 8 }),
  stroop: Object.freeze({ easy: 12, medium: 18, hard: 24 }),
  schulte: Object.freeze({ easy: 5, medium: 6, hard: 7 }),
});

export function createCognitiveGamesState() {
  return Object.fromEntries(COGNITIVE_GAME_IDS.map((id) => [id, {
    active: null,
    last: null,
    bestScore: null,
    plays: 0,
    usedChallengeKeys: [],
    nextAvailableAt: null,
  }]));
}

function shuffle(values) {
  const output = [...values];
  for (let index = output.length - 1; index > 0; index--) {
    const swap = randomInt(index + 1);
    [output[index], output[swap]] = [output[swap], output[index]];
  }
  return output;
}

function challengeFor(gameId, difficulty = "easy") {
  if (gameId === "memory") {
    const pairs = MEMORY_DIFFICULTIES[difficulty];
    if (!pairs) throw new Error("Dificuldade da memória visual inválida.");
    const symbols = shuffle(SYMBOLS).slice(0, pairs);
    return { kind: "memory", difficulty, cards: shuffle([...symbols, ...symbols]) };
  }
  if (gameId === "sequence") {
    const length = GAME_DIFFICULTIES.sequence[difficulty];
    return { kind: "sequence", difficulty, digits: Array.from({ length }, () => String(randomInt(10))).join("") };
  }
  if (gameId === "stroop") {
    const trialsCount = GAME_DIFFICULTIES.stroop[difficulty];
    const incongruentChance = difficulty === "hard" ? 99 : difficulty === "medium" ? 96 : 70;
    const trials = Array.from({ length: trialsCount }, () => {
      const word = COLORS[randomInt(COLORS.length)];
      let ink;
      if (difficulty === "easy") {
        // Preserve the current easy challenge distribution.
        ink = COLORS[randomInt(COLORS.length)];
        if (randomInt(100) < incongruentChance) {
          while (ink === word) ink = COLORS[randomInt(COLORS.length)];
        }
      } else if (randomInt(100) < incongruentChance) {
        const conflictingColors = COLORS.filter((color) => color !== word);
        ink = conflictingColors[randomInt(conflictingColors.length)];
      } else {
        ink = word;
      }
      return { word, ink };
    });
    return { kind: "stroop", difficulty, trials };
  }
  const size = GAME_DIFFICULTIES.schulte[difficulty];
  const tileCount = size * size;
  return { kind: "schulte", difficulty, tiles: shuffle(Array.from({ length: tileCount }, (_, index) => index + 1)) };
}

export function issueCognitiveChallenge(gameId, progress, difficulty = "easy") {
  if (!COGNITIVE_GAME_IDS.includes(gameId)) throw new Error("Jogo não encontrado.");
  if (!Object.hasOwn(GAME_DIFFICULTIES[gameId], difficulty)) throw new Error("Dificuldade inválida para este jogo.");
  if (progress.usedChallengeKeys.length >= 50000) throw new Error("Este jogo chegou ao limite de desafios únicos armazenados.");
  const known = new Set(progress.usedChallengeKeys);
  for (let attempt = 0; attempt < 100; attempt++) {
      const challenge = challengeFor(gameId, difficulty);
    const key = createHash("sha256").update(JSON.stringify(challenge)).digest("hex").slice(0, 32);
    if (!known.has(key)) return { challenge, challengeKey: key };
  }
  throw new Error("Não foi possível preparar um desafio novo. Tente novamente.");
}

export function startCognitiveGame(gameId, progress, now = Date.now(), difficulty = "easy") {
  if (!COGNITIVE_GAME_IDS.includes(gameId) || !Object.hasOwn(GAME_DIFFICULTIES[gameId], difficulty)) {
    const error = new Error("Dificuldade inválida para este jogo.");
    error.status = 400;
    throw error;
  }
  if (progress.active) return progress;
  if (progress.nextAvailableAt && now < progress.nextAvailableAt) {
    const error = new Error("Este desafio ainda está descansando.");
    error.status = 409;
    error.nextAvailableAt = progress.nextAvailableAt;
    throw error;
  }
  const { challenge, challengeKey } = issueCognitiveChallenge(gameId, progress, difficulty);
  progress.usedChallengeKeys.push(challengeKey);
  progress.active = {
    id: randomUUID(),
    gameId,
    challengeKey,
    challenge,
    startedAt: now,
    completedAt: null,
    score: null,
    correct: null,
    total: null,
    cancelled: false,
    durationMs: null,
  };
  return progress;
}

export function completeCognitiveGame(gameId, progress, result, now = Date.now()) {
  const active = progress.active;
  if (!active || active.gameId !== gameId || active.id !== result.sessionId) {
    const error = new Error("Esta partida não está mais ativa. Reabra o desafio para continuar.");
    error.status = 409;
    throw error;
  }
  if (active.startedAt > now) throw new Error("O horário da partida é inválido.");
  if (gameId === "memory" && result.attempts !== undefined) {
    const pairCount = new Set(active.challenge.cards).size;
    const expectedScore = Math.round((pairCount / result.attempts) * 100);
    if (result.correct !== pairCount || result.total !== pairCount || result.attempts < pairCount || result.score !== expectedScore) {
      const error = new Error("O resultado da memória visual é inválido. Atualize a página e tente novamente.");
      error.status = 400;
      throw error;
    }
  }
  const completed = {
    ...active,
    completedAt: now,
    score: result.score,
    correct: result.correct,
    total: result.total,
    attempts: result.attempts ?? null,
    cancelled: false,
    durationMs: Math.min(86400000, now - active.startedAt),
  };
  progress.last = completed;
  progress.active = null;
  progress.plays += 1;
  progress.bestScore = progress.bestScore === null ? completed.score : Math.max(progress.bestScore, completed.score);
  progress.nextAvailableAt = now + COGNITIVE_GAME_COOLDOWN_MS;
  return progress;
}

export function cancelCognitiveGame(gameId, progress, sessionId, now = Date.now()) {
  const active = progress.active;
  // A retry after a lost response must not count the same attempt twice.
  if (!active && progress.last?.id === sessionId && progress.last.cancelled) return progress;
  if (!active || active.gameId !== gameId || active.id !== sessionId) {
    const error = new Error("Esta partida não está mais ativa. Reabra os jogos para conferir o estado.");
    error.status = 409;
    throw error;
  }
  if (active.startedAt > now) throw new Error("O horário da partida é inválido.");
  progress.last = {
    ...active,
    completedAt: now,
    score: null,
    correct: null,
    total: null,
    attempts: null,
    cancelled: true,
    durationMs: Math.min(86400000, now - active.startedAt),
  };
  progress.active = null;
  progress.plays += 1;
  progress.nextAvailableAt = now + COGNITIVE_GAME_COOLDOWN_MS;
  return progress;
}

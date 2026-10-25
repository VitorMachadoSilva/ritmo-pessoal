import test from "node:test";
import assert from "node:assert/strict";
import { COGNITIVE_GAME_COOLDOWN_MS, cancelCognitiveGame, createCognitiveGamesState, startCognitiveGame } from "../server/cognitive-games.mjs";

test("cancelar uma partida conta uma tentativa e inicia 24 horas sem alterar o recorde", () => {
  const progress = createCognitiveGamesState().memory;
  const start = 1_800_000_000_000;
  progress.bestScore = 85;
  startCognitiveGame("memory", progress, start);
  const sessionId = progress.active.id;
  const cancelledAt = start + 12_000;

  cancelCognitiveGame("memory", progress, sessionId, cancelledAt);

  assert.equal(progress.active, null);
  assert.equal(progress.plays, 1);
  assert.equal(progress.bestScore, 85);
  assert.equal(progress.last.cancelled, true);
  assert.equal(progress.last.score, null);
  assert.equal(progress.last.durationMs, 12_000);
  assert.equal(progress.nextAvailableAt, cancelledAt + COGNITIVE_GAME_COOLDOWN_MS);
  assert.throws(() => startCognitiveGame("memory", progress, cancelledAt + COGNITIVE_GAME_COOLDOWN_MS - 1), { status: 409 });
  startCognitiveGame("memory", progress, cancelledAt + COGNITIVE_GAME_COOLDOWN_MS);
  assert.ok(progress.active);
  assert.notEqual(progress.active.challengeKey, progress.last.challengeKey);
});

test("repetir cancelamento não conta duas vezes; sessão incorreta não é cancelada", () => {
  const progress = createCognitiveGamesState().memory;
  startCognitiveGame("memory", progress, 1_800_000_000_000);
  const sessionId = progress.active.id;
  assert.throws(() => cancelCognitiveGame("memory", progress, "00000000-0000-4000-8000-000000000000", 1_800_000_000_100), { status: 409 });
  assert.equal(progress.plays, 0);
  assert.ok(progress.active);
  cancelCognitiveGame("memory", progress, sessionId, 1_800_000_000_100);
  const next = progress.nextAvailableAt;
  cancelCognitiveGame("memory", progress, sessionId, 1_800_000_010_000);
  assert.equal(progress.plays, 1);
  assert.equal(progress.nextAvailableAt, next);
});

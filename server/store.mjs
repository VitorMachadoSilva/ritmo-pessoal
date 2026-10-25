import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import essentialIds from "../shared/essential-habits.json" with { type: "json" };
import { COGNITIVE_GAME_IDS, createCognitiveGamesState } from "./cognitive-games.mjs";

export function createStore(dbPath) {
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(
    "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS owner (id INTEGER PRIMARY KEY CHECK(id=1), username TEXT NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, expires INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL);",
  );

  const getState = () => {
    const state = JSON.parse(db.prepare("SELECT data FROM app_state WHERE id=1").get().data);
    state.focus ??= null;
    state.weeks ??= {};
    state.cognitiveGames ??= createCognitiveGamesState();
    for (const gameId of COGNITIVE_GAME_IDS) {
      const empty = createCognitiveGamesState()[gameId];
      state.cognitiveGames[gameId] ??= empty;
      state.cognitiveGames[gameId].usedChallengeKeys ??= [];
      state.cognitiveGames[gameId].plays ??= 0;
    }
    for (const habit of state.habits) habit.essential ??= essentialIds.includes(habit.id);
    for (const day of Object.values(state.days)) {
      day.mode ??= "full";
      day.focusSessions ??= [];
      for (const habit of day.habits) habit.essential ??= essentialIds.includes(habit.id);
    }
    return state;
  };

  const save = (state) =>
    db.prepare("INSERT OR REPLACE INTO app_state(id,data) VALUES(1,?)").run(JSON.stringify(state));

  return {
    db,
    getState,
    save,
    ownerExists: () => Boolean(db.prepare("SELECT id FROM owner WHERE id=1").get()),
    close: () => db.close(),
  };
}

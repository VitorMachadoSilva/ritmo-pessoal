import { z } from "zod";
import { cognitiveGameIdSchema, cognitiveGameResultSchema } from "../schema.mjs";
import { COGNITIVE_GAME_IDS, startCognitiveGame, completeCognitiveGame, cancelCognitiveGame } from "../cognitive-games.mjs";

const route = (handler) => (req, res, next) => {
  try { handler(req, res); } catch (error) { next(error); }
};

export function registerGameRoutes(app, { getState, save }) {
  app.post("/api/games/:gameId/start", route((req, res) => {
    const gameId = cognitiveGameIdSchema.parse(req.params.gameId);
    const { difficulty } = z.object({ difficulty: z.enum(["easy", "medium", "hard"]).default("easy") }).parse(req.body);
    const state = getState();
    try {
      startCognitiveGame(gameId, state.cognitiveGames[gameId], Date.now(), difficulty);
    } catch (error) {
      if (error.status) return res.status(error.status).json({ error: error.message, nextAvailableAt: error.nextAvailableAt });
      throw error;
    }
    save(state);
    res.json({ ...state, serverNow: Date.now() });
  }));

  app.post("/api/games/:gameId/complete", route((req, res) => {
    const gameId = cognitiveGameIdSchema.parse(req.params.gameId);
    const input = cognitiveGameResultSchema.parse(req.body);
    const state = getState();
    try { completeCognitiveGame(gameId, state.cognitiveGames[gameId], input); }
    catch (error) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      throw error;
    }
    save(state);
    res.json({ ...state, serverNow: Date.now() });
  }));

  app.post("/api/games/:gameId/cancel", route((req, res) => {
    const gameId = cognitiveGameIdSchema.parse(req.params.gameId);
    const { sessionId } = z.object({ sessionId: z.string().uuid() }).parse(req.body);
    const state = getState();
    try { cancelCognitiveGame(gameId, state.cognitiveGames[gameId], sessionId); }
    catch (error) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      throw error;
    }
    save(state);
    res.json({ ...state, serverNow: Date.now() });
  }));

  app.post("/api/games/reset-timers", route((req, res) => {
    const state = getState();
    if (state.settings.name.trim().toLocaleLowerCase("pt-BR") !== "vitor machado silva")
      return res.status(403).json({ error: "Este recurso está disponível apenas para a conta Vitor." });
    for (const gameId of COGNITIVE_GAME_IDS) state.cognitiveGames[gameId].nextAvailableAt = null;
    save(state);
    res.json({ ...state, serverNow: Date.now() });
  }));
}

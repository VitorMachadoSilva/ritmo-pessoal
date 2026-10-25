import { z } from "zod";
import { CATEGORY_IDS, COGNITIVE_DIFFICULTIES, COGNITIVE_GAME_IDS, HABIT_DIFFICULTIES, HABIT_KINDS } from "../shared/contract-values.mjs";
export const dayKey = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().startsWith(v),
    "Data inválida",
  );
const short = z.string().trim().min(1).max(120);
const text = z.string().max(5000);
export const habitSchema = z.object({
  id: z.string().max(100),
  title: short,
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  category: z.enum(CATEGORY_IDS),
  description: text,
  days: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  kind: z.enum(HABIT_KINDS),
  target: z.number().positive().max(20000),
  unit: z.string().max(20),
  createdDate: dayKey,
  archived: z.boolean(),
  essential: z.boolean().optional(),
  difficulty: z.enum(HABIT_DIFFICULTIES).optional(),
});
export const settingsSchema = z.object({
  name: short,
  startDate: dayKey,
  timezone: z.string().refine((v) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: v });
      return true;
    } catch {
      return false;
    }
  }, "Fuso inválido"),
  initialWeight: z.number().min(30).max(350),
  goalWeight: z.number().min(30).max(350),
  height: z.number().min(100).max(250),
  waterGoal: z.number().min(500).max(6000),
  sleepGoal: z.number().min(4).max(12),
  calorieGoal: z.number().min(1200).max(6000),
  proteinGoal: z.number().min(30).max(300),
  dailyThreshold: z.number().int().min(1).max(100),
});
export const workoutSchema = z.object({
  id: z.string().max(100),
  name: short,
  focus: z.string().max(200),
  notes: text,
  exercises: z
    .array(
      z.object({
        id: z.string().max(100),
        name: short,
        sets: z.number().int().min(1).max(10),
        reps: z.string().min(1).max(50),
      }),
    )
    .min(1)
    .max(20),
});
export const mealSchema = z.object({
  id: z.string().max(100),
  name: short,
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  description: text,
  calories: z.number().min(0).max(5000),
  protein: z.number().min(0).max(300),
});
export const workoutRecord = z.object({
  templateId: z.string().max(100),
  name: short,
  completed: z.boolean(),
  exercises: z
    .array(
      z.object({
        id: z.string().max(100),
        name: short,
        sets: z
          .array(
            z.object({
              weight: z.number().min(0).max(1000),
              reps: z.string().max(50),
              done: z.boolean(),
            }),
          )
          .max(10),
      }),
    )
    .max(20),
});
export const focusSessionSchema = z.object({
  id: z.string().max(100),
  date: dayKey,
  label: short,
  targetMinutes: z.number().int().min(1).max(120),
  startedAt: z.number().int().nonnegative(),
  resumedAt: z.number().int().nonnegative().nullable(),
  elapsedMs: z.number().min(0).max(7200000),
  habitId: z.string().max(100).nullable(),
});
export const focusLogSchema = z.object({
  id: z.string().max(100),
  label: short,
  minutes: z.number().min(0).max(120),
  startedAt: z.number().int().nonnegative(),
  finishedAt: z.number().int().nonnegative(),
  completed: z.boolean(),
  habitId: z.string().max(100).nullable(),
});
export const weekNoteSchema = z.object({
  worked: z.string().max(2000),
  adjustment: z.string().max(2000),
  priority: z.string().max(1000),
});
const memoryPairsByDifficulty = { easy: 8, medium: 10, hard: 12 };
const sequenceLengthByDifficulty = { easy: 6, medium: 7, hard: 8 };
const stroopTrialsByDifficulty = { easy: 12, medium: 18, hard: 24 };
const schulteSizeByDifficulty = { easy: 5, medium: 6, hard: 7 };
const cognitiveChallengeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("memory"), difficulty: z.enum(COGNITIVE_DIFFICULTIES).default("easy"), cards: z.array(z.string().max(24)).min(16).max(24) })
    .refine(({ difficulty, cards }) => {
      const pairCount = memoryPairsByDifficulty[difficulty];
      return cards.length === pairCount * 2
        && new Set(cards).size === pairCount
        && [...new Set(cards)].every((symbol) => cards.filter((card) => card === symbol).length === 2);
    }, "Desafio de memória incompatível com a dificuldade."),
  z.object({ kind: z.literal("sequence"), difficulty: z.enum(COGNITIVE_DIFFICULTIES).default("easy"), digits: z.string().regex(/^\d{6,8}$/) })
    .refine(({ difficulty, digits }) => digits.length === sequenceLengthByDifficulty[difficulty], "Sequência incompatível com a dificuldade."),
  z.object({
    kind: z.literal("stroop"),
    difficulty: z.enum(COGNITIVE_DIFFICULTIES).default("easy"),
    trials: z.array(z.object({ word: z.enum(["vermelho", "azul", "verde", "amarelo"]), ink: z.enum(["vermelho", "azul", "verde", "amarelo"]) })).min(12).max(24),
  }).refine(({ difficulty, trials }) => trials.length === stroopTrialsByDifficulty[difficulty], "Rodadas incompatíveis com a dificuldade."),
  z.object({ kind: z.literal("schulte"), difficulty: z.enum(COGNITIVE_DIFFICULTIES).default("easy"), tiles: z.array(z.number().int().min(1).max(49)).min(25).max(49) })
    .refine(({ difficulty, tiles }) => {
      const tileCount = schulteSizeByDifficulty[difficulty] ** 2;
      return tiles.length === tileCount
        && new Set(tiles).size === tileCount
        && tiles.every((tile) => tile <= tileCount);
    }, "Tabuleiro Schulte incompatível com a dificuldade."),
]);
const cognitiveSessionSchema = z.object({
  id: z.string().uuid(),
  gameId: z.enum(COGNITIVE_GAME_IDS),
  challengeKey: z.string().regex(/^[a-f0-9]{32}$/),
  challenge: cognitiveChallengeSchema,
  startedAt: z.number().int().nonnegative(),
  completedAt: z.number().int().nonnegative().nullable(),
  score: z.number().int().min(0).max(100).nullable(),
  correct: z.number().int().min(0).max(100).nullable(),
  total: z.number().int().min(1).max(100).nullable(),
  attempts: z.number().int().min(1).max(100000).nullable().default(null),
  cancelled: z.boolean().default(false),
  durationMs: z.number().int().min(0).max(86400000).nullable(),
}).refine((session) => session.challenge.kind === session.gameId, "Desafio incompatível com o jogo.");
const cognitiveGameProgressSchema = z.object({
  active: cognitiveSessionSchema.nullable().default(null),
  last: cognitiveSessionSchema.nullable().default(null),
  bestScore: z.number().int().min(0).max(100).nullable().default(null),
  plays: z.number().int().min(0).max(100000).default(0),
  usedChallengeKeys: z.array(z.string().regex(/^[a-f0-9]{32}$/)).max(50000).default([]),
  nextAvailableAt: z.number().int().nonnegative().nullable().default(null),
});
export const cognitiveGameResultSchema = z.object({
  sessionId: z.string().uuid(),
  score: z.number().int().min(0).max(100),
  correct: z.number().int().min(0).max(100),
  total: z.number().int().min(1).max(100),
  attempts: z.number().int().min(1).max(100000).optional(),
}).refine((result) => result.correct <= result.total, "Resultado inválido.");
export const cognitiveGameIdSchema = z.enum(COGNITIVE_GAME_IDS);
export const daySchema = z.object({
  habits: z.array(habitSchema).max(200),
  entries: z.record(z.string().max(100), z.number().min(0).max(20000)),
  water: z.number().min(0).max(10000),
  sleep: z.number().min(0).max(24).nullable(),
  weight: z.number().min(30).max(350).nullable(),
  energy: z.number().int().min(1).max(5).nullable(),
  mood: z.number().int().min(1).max(5).nullable(),
  journal: text,
  win: z.string().max(1000),
  next: z.string().max(1000),
  workout: workoutRecord.nullable(),
  threshold: z.number().int().min(1).max(100),
  mode: z.enum(["full", "essential"]).default("full"),
  focusSessions: z.array(focusLogSchema).max(100).default([]),
});
export const stateSchema = z.object({
  version: z.literal(1),
  settings: settingsSchema,
  habits: z.array(habitSchema).max(200),
  days: z
    .record(dayKey, daySchema)
    .refine((v) => Object.keys(v).length <= 5000),
  workouts: z.array(workoutSchema).max(50),
  meals: z.array(mealSchema).max(30),
  focus: focusSessionSchema.nullable().default(null),
  weeks: z
    .record(dayKey, weekNoteSchema)
    .refine((v) => Object.keys(v).length <= 1000)
    .default({}),
  cognitiveGames: z.record(z.string(), cognitiveGameProgressSchema).default({}).refine(
    (games) => Object.keys(games).every((id) => COGNITIVE_GAME_IDS.includes(id)),
    "Jogo inválido.",
  ),
});
export const dayPatch = z.object({
  habitId: z.string().max(100).optional(),
  value: z.number().min(0).max(20000).optional(),
  waterDelta: z.number().min(-10000).max(10000).optional(),
  sleep: z.number().min(0).max(24).nullable().optional(),
  weight: z.number().min(30).max(350).nullable().optional(),
  energy: z.number().int().min(1).max(5).nullable().optional(),
  mood: z.number().int().min(1).max(5).nullable().optional(),
  journal: text.optional(),
  win: z.string().max(1000).optional(),
  next: z.string().max(1000).optional(),
  workout: workoutRecord.nullable().optional(),
  mode: z.enum(["full", "essential"]).optional(),
});

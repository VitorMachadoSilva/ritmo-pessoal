import type { CATEGORY_IDS, COGNITIVE_DIFFICULTIES, COGNITIVE_GAME_IDS, HABIT_DIFFICULTIES, HABIT_KINDS } from "./contract-values.mjs";

export type Category = typeof CATEGORY_IDS[number];
export type Habit = {
  id: string;
  title: string;
  time: string;
  category: Category;
  description: string;
  days: number[];
  kind: typeof HABIT_KINDS[number];
  target: number;
  unit: string;
  createdDate: string;
  archived: boolean;
  essential?: boolean;
  difficulty?: typeof HABIT_DIFFICULTIES[number];
};
export type Settings = {
  name: string;
  startDate: string;
  timezone: string;
  initialWeight: number;
  goalWeight: number;
  height: number;
  waterGoal: number;
  sleepGoal: number;
  calorieGoal: number;
  proteinGoal: number;
  dailyThreshold: number;
};
export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
};
export type Workout = {
  id: string;
  name: string;
  focus: string;
  notes: string;
  exercises: Exercise[];
};
export type WorkoutRecord = {
  templateId: string;
  name: string;
  completed: boolean;
  exercises: {
    id: string;
    name: string;
    sets: {
      weight: number;
      reps: string;
      done: boolean;
    }[];
  }[];
};
export type Meal = {
  id: string;
  name: string;
  time: string;
  description: string;
  calories: number;
  protein: number;
};
export type Day = {
  habits: Habit[];
  entries: Record<string, number>;
  water: number;
  sleep: number | null;
  weight: number | null;
  energy: number | null;
  mood: number | null;
  journal: string;
  win: string;
  next: string;
  workout: WorkoutRecord | null;
  threshold: number;
  mode?: "full" | "essential";
  focusSessions?: FocusLog[];
};
export type FocusSession = {
  id: string;
  date: string;
  label: string;
  targetMinutes: number;
  startedAt: number;
  resumedAt: number | null;
  elapsedMs: number;
  habitId: string | null;
};
export type FocusLog = {
  id: string;
  label: string;
  minutes: number;
  startedAt: number;
  finishedAt: number;
  completed: boolean;
  habitId: string | null;
};
export type WeekNote = { worked: string; adjustment: string; priority: string };
export type CognitiveGameId = typeof COGNITIVE_GAME_IDS[number];
export type CognitiveGameDifficulty = typeof COGNITIVE_DIFFICULTIES[number];
export type CognitiveChallenge =
  | { kind: "memory"; difficulty?: CognitiveGameDifficulty; cards: string[] }
  | { kind: "sequence"; difficulty?: CognitiveGameDifficulty; digits: string }
  | { kind: "stroop"; difficulty?: CognitiveGameDifficulty; trials: { word: string; ink: string }[] }
  | { kind: "schulte"; difficulty?: CognitiveGameDifficulty; tiles: number[] };
export type CognitiveGameSession = {
  id: string;
  gameId: CognitiveGameId;
  challengeKey: string;
  challenge: CognitiveChallenge;
  startedAt: number;
  completedAt: number | null;
  score: number | null;
  correct: number | null;
  total: number | null;
  attempts?: number | null;
  cancelled?: boolean;
  durationMs: number | null;
};
export type CognitiveGameProgress = {
  active: CognitiveGameSession | null;
  last: CognitiveGameSession | null;
  bestScore: number | null;
  plays: number;
  usedChallengeKeys: string[];
  nextAvailableAt: number | null;
};
export type State = {
  version: 1;
  /** Hora do servidor, presente somente em respostas autenticadas da API. */
  serverNow?: number;
  settings: Settings;
  habits: Habit[];
  days: Record<string, Day>;
  workouts: Workout[];
  meals: Meal[];
  focus?: FocusSession | null;
  weeks?: Record<string, WeekNote>;
  cognitiveGames?: Record<CognitiveGameId, CognitiveGameProgress>;
};
export type PageId =
  | "hoje"
  | "rotina"
  | "evolucao"
  | "treinos"
  | "alimentacao"
  | "diario"
  | "foco"
  | "semana"
  | "jogos"
  | "ajustes";

export type Category =
  "corpo" | "mente" | "alimentacao" | "agua" | "sono" | "emocional";
export type Habit = {
  id: string;
  title: string;
  time: string;
  category: Category;
  description: string;
  days: number[];
  kind: "check" | "counter" | "water" | "sleep";
  target: number;
  unit: string;
  createdDate: string;
  archived: boolean;
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
};
export type State = {
  version: 1;
  settings: Settings;
  habits: Habit[];
  days: Record<string, Day>;
  workouts: Workout[];
  meals: Meal[];
};
export type PageId =
  | "hoje"
  | "rotina"
  | "evolucao"
  | "treinos"
  | "alimentacao"
  | "diario"
  | "ajustes";
export type Mutation = (
  url: string,
  body?: unknown,
  method?: string,
) => Promise<boolean>;

import { z } from "zod";
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
  category: z.enum([
    "corpo",
    "mente",
    "alimentacao",
    "agua",
    "sono",
    "emocional",
  ]),
  description: text,
  days: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  kind: z.enum(["check", "counter", "water", "sleep"]),
  target: z.number().positive().max(20000),
  unit: z.string().max(20),
  createdDate: dayKey,
  archived: z.boolean(),
  essential: z.boolean().optional(),
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

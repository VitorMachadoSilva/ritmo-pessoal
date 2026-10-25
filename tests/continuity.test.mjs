import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState, dateKey } from "../server/defaults.mjs";
import {
  activeHabits,
  allCompleted,
  completed,
  dayFor,
  score,
  xpTotal,
} from "../src/lib.ts";
import { weeklyReview, weekStart } from "../src/review-data.ts";
import { clockLabel, focusElapsed, focusRemaining } from "../src/timer.ts";
import {
  elapsedFocus,
  pauseFocus,
  resumeFocus,
  finishFocus,
} from "../server/focus.mjs";
import { stateSchema } from "../server/schema.mjs";

const session = () => ({
  id: "example",
  date: dateKey(),
  label: "Ler",
  targetMinutes: 25,
  startedAt: 1000,
  resumedAt: 1000,
  elapsedMs: 0,
  habitId: "focus",
});
test("essential mode narrows the day but preserves targets, extra work and XP", () => {
  const state = initialState("Teste"),
    date = dateKey(),
    day = dayFor(state, date);
  state.days[date] = day;
  day.habits = [
    {
      ...state.habits.find((h) => h.id === "water"),
      target: 3000,
      essential: true,
    },
    { ...state.habits[0], essential: false },
  ];
  day.water = 1500;
  day.entries[day.habits[1].id] = 1;
  assert.equal(score(day), 75);
  assert.equal(xpTotal(state), 10);
  day.mode = "essential";
  assert.equal(activeHabits(day).length, 1);
  assert.equal(score(day), 50);
  assert.equal(completed(day), 0);
  assert.equal(allCompleted(day), 1);
  assert.equal(xpTotal(state), 10);
  day.water = 3000;
  assert.equal(score(day), 100);
  assert.equal(xpTotal(state), 40);
  day.mode = "full";
  day.mode = "essential";
  assert.equal(xpTotal(state), 40);
});
test("legacy essentials get defaults without overriding explicit opt-outs", () => {
  const state = initialState("Teste"),
    day = dayFor(state, dateKey());
  day.mode = "essential";
  day.habits.forEach((h) => delete h.essential);
  assert.ok(activeHabits(day).some((h) => h.id === "water"));
  day.habits.find((h) => h.id === "water").essential = false;
  assert.ok(!activeHabits(day).some((h) => h.id === "water"));
});
test("paused time does not grow; resume, reload and completion use wall clock", () => {
  const original = session();
  const paused = pauseFocus(original, 61000);
  assert.equal(elapsedFocus(paused, 600000), 60000);
  assert.equal(focusElapsed(paused, 600000), 60000);
  assert.throws(() => pauseFocus(paused), /já está pausada/);
  const resumed = resumeFocus(JSON.parse(JSON.stringify(paused)), 700000);
  assert.equal(focusElapsed(resumed, 760000), 120000);
  assert.equal(focusRemaining(resumed, 760000), 23 * 60000);
  assert.throws(() => resumeFocus(resumed), /andamento/);
  assert.equal(elapsedFocus(resumed, 99999999), 25 * 60000);
  assert.equal(
    focusElapsed(resumed, 99999999),
    elapsedFocus(resumed, 99999999),
  );
});
test("finish requires a minute, distinguishes partial from complete and clips at target", () => {
  assert.throws(() => finishFocus(session(), 20000), /pelo menos/);
  assert.equal(finishFocus(session(), 61000).completed, false);
  assert.equal(finishFocus(session(), 61000).minutes, 1);
  const done = finishFocus(session(), 99999999);
  assert.equal(done.completed, true);
  assert.equal(done.minutes, 25);
  assert.equal(clockLabel(59999), "01:00");
  assert.equal(clockLabel(0), "00:00");
  assert.throws(
    () => resumeFocus({ ...session(), elapsedMs: 1500000, resumedAt: null }),
    /terminou/,
  );
});
test("weekly averages include missing eligible days, exclude future and report sleep sample", () => {
  const state = initialState("Teste");
  state.settings.startDate = "2026-10-19";
  state.habits = [
    {
      ...state.habits[0],
      createdDate: "2026-10-19",
      days: [0, 1, 2, 3, 4, 5, 6],
      essential: true,
    },
  ];
  const day = dayFor(state, "2026-10-19");
  day.entries[day.habits[0].id] = 1;
  day.water = 3000;
  day.sleep = 8;
  day.mode = "essential";
  day.focusSessions = [{ minutes: 25 }];
  state.days["2026-10-19"] = day;
  const result = weeklyReview(state, "2026-10-21", "2026-10-21");
  assert.equal(weekStart("2026-10-25"), "2026-10-19");
  assert.equal(result.elapsed, 3);
  assert.equal(result.average, 33);
  assert.equal(result.water, 1000);
  assert.equal(result.sleep, 8);
  assert.equal(result.sleepCount, 1);
  assert.equal(result.focus, 25);
  assert.equal(result.essential, 1);
  assert.equal(result.consistent, 1);
  assert.equal(result.days.filter((d) => !d.eligible).length, 4);
  assert.equal(
    result.byCategory.find((c) => c.category === "corpo").progress,
    null,
  );
});
test("original backup shape remains valid and gets new optional fields safely", () => {
  const legacy = initialState("Teste");
  delete legacy.focus;
  delete legacy.weeks;
  legacy.habits.forEach((h) => delete h.essential);
  const today = dateKey();
  legacy.days[today] = dayFor(legacy, today);
  delete legacy.days[today].mode;
  delete legacy.days[today].focusSessions;
  const result = stateSchema.parse(legacy);
  assert.equal(result.focus, null);
  assert.deepEqual(result.weeks, {});
  assert.equal(result.days[today].mode, "full");
  assert.deepEqual(result.days[today].focusSessions, []);
});

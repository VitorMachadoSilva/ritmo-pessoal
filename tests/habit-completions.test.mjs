import { test } from "node:test";
import assert from "node:assert/strict";
import { newlyCompletedHabits } from "../shared/habit-completions.mjs";

const habit = (id, kind, target) => ({ id, kind, target });
const day = (habits, entries = {}, water = 0, sleep = null) => ({ habits, entries, water, sleep });
const state = (days) => ({ days });

test("detects only habit transitions from incomplete to complete", () => {
  const check = habit("check", "check", 1);
  const metric = habit("metric", "counter", 3);
  const previous = state({ "2026-10-24": day([check, metric], { check: 0, metric: 2 }) });
  const next = state({ "2026-10-24": day([check, metric], { check: 1, metric: 3 }) });

  assert.deepEqual(newlyCompletedHabits(previous, next), [
    { date: "2026-10-24", habitId: "check" },
    { date: "2026-10-24", habitId: "metric" },
  ]);
});

test("water and sleep count as complete only at their targets", () => {
  const water = habit("water", "water", 2000);
  const sleep = habit("sleep", "sleep", 8);
  const previous = state({ "2026-10-24": day([water, sleep], {}, 1500, 7.5) });
  const next = state({ "2026-10-24": day([water, sleep], {}, 2000, 8) });

  assert.deepEqual(newlyCompletedHabits(previous, next), [
    { date: "2026-10-24", habitId: "water" },
    { date: "2026-10-24", habitId: "sleep" },
  ]);
});

test("does not emit events for partial progress, existing completions, or undo", () => {
  const completed = habit("check", "check", 1);
  const partial = habit("metric", "counter", 4);
  const existing = state({ "2026-10-24": day([completed, partial], { check: 1, metric: 1 }) });
  const stillPartial = state({ "2026-10-24": day([completed, partial], { check: 1, metric: 3 }) });
  const undone = state({ "2026-10-24": day([completed, partial], { check: 0, metric: 1 }) });

  assert.deepEqual(newlyCompletedHabits(existing, stillPartial), []);
  assert.deepEqual(newlyCompletedHabits(existing, undone), []);
  assert.deepEqual(newlyCompletedHabits(existing, existing), []);
});

test("a newly completed habit in a new day is detected after server confirmation", () => {
  const habitToComplete = habit("check", "check", 1);
  const previous = state({});
  const next = state({ "2026-10-24": day([habitToComplete], { check: 1 }) });

  assert.deepEqual(newlyCompletedHabits(previous, next), [
    { date: "2026-10-24", habitId: "check" },
  ]);
});

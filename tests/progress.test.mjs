import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState, dateKey } from "../server/defaults.mjs";
import {
  addDays,
  dayFor,
  score,
  completed,
  xpTotal,
  streak,
  habitsFor,
} from "../src/lib.ts";
function fixture() {
  const s = initialState("Teste");
  s.settings.startDate = addDays(dateKey(), -5);
  s.habits.forEach((h) => (h.createdDate = s.settings.startDate));
  return s;
}
function finish(d) {
  d.habits.forEach((h) => (d.entries[h.id] = h.target));
  d.water = 3000;
  d.sleep = 8;
  return d;
}
test("an empty routine has no fabricated progress or XP", () => {
  const s = fixture(),
    d = dayFor(s, dateKey());
  assert.equal(score(d), 0);
  assert.equal(xpTotal(s), 0);
  assert.equal(completed(d), 0);
});
test("partial metrics contribute without awarding full XP; near-complete is not 100%", () => {
  const s = fixture();
  const d = dayFor(s, dateKey());
  d.habits = d.habits.filter((h) => h.kind === "water");
  d.water = 1500;
  assert.equal(score(d), 50);
  assert.equal(completed(d), 0);
  d.water = 2999;
  assert.equal(score(d), 99);
  d.water = 3000;
  assert.equal(score(d), 100);
  assert.equal(completed(d), 1);
});
test("XP is derived, cannot be farmed, and is reversible", () => {
  const s = fixture(),
    date = dateKey();
  const d = dayFor(s, date);
  s.days[date] = d;
  d.entries.wake = 1;
  assert.equal(xpTotal(s), 10);
  d.entries.wake = 1;
  assert.equal(xpTotal(s), 10);
  d.entries.wake = 0;
  assert.equal(xpTotal(s), 0);
});
test("today in progress preserves yesterday’s streak, a missing past day breaks it", () => {
  const s = fixture(),
    today = dateKey(),
    yesterday = addDays(today, -1),
    twoDays = addDays(today, -2);
  s.days[yesterday] = finish(dayFor(s, yesterday));
  s.days[twoDays] = finish(dayFor(s, twoDays));
  assert.equal(streak(s, today), 2);
  s.days[today] = finish(dayFor(s, today));
  assert.equal(streak(s, today), 3);
  delete s.days[yesterday];
  assert.equal(streak(s, today), 1);
});
test("new and archived habits do not leak into unscheduled dates", () => {
  const s = fixture(),
    today = dateKey();
  s.habits[0].createdDate = today;
  assert.equal(
    habitsFor(s, addDays(today, -1)).some((h) => h.id === "wake"),
    false,
  );
  s.habits[0].archived = true;
  assert.equal(
    habitsFor(s, today).some((h) => h.id === "wake"),
    false,
  );
});

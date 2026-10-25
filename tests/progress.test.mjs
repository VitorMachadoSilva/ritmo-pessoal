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
  orderedHabits,
  habitXp,
  isPerfectDay,
  perfectDayBonus,
  perfectStreak,
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
test("below-goal sleep remains recorded without completing the habit or awarding XP", () => {
  const s = fixture();
  const date = dateKey();
  const d = dayFor(s, date);
  const sleep = d.habits.find((h) => h.kind === "sleep");
  assert.ok(sleep);
  d.habits = [sleep];
  d.sleep = Math.min(6.5, sleep.target - 0.5);
  s.days[date] = d;
  assert.equal(completed(d), 0);
  assert.equal(xpTotal(s), 0);
  assert.equal(score(d), Math.round((d.sleep / sleep.target) * 100));
  assert.equal(dayFor(s, date).sleep, d.sleep);
});
test("habit journey follows time order without changing stored order", () => {
  const d = dayFor(fixture(), dateKey());
  d.habits.reverse();
  const original = d.habits.map((h) => h.id);
  const journey = orderedHabits(d);
  assert.deepEqual(journey.map((h) => h.time), [...journey.map((h) => h.time)].sort());
  assert.deepEqual(d.habits.map((h) => h.id), original);
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
test("difficulty awards 10, 20 or 30 XP and respects historical snapshots", () => {
  const s = fixture();
  const date = dateKey();
  const d = dayFor(s, date);
  d.habits = [
    { ...s.habits.find((h) => h.id === "wake"), difficulty: "light" },
    { ...s.habits.find((h) => h.id === "focus"), difficulty: "challenging" },
    { ...s.habits.find((h) => h.id === "water"), difficulty: "moderate" },
  ];
  s.days[date] = d;
  assert.deepEqual(d.habits.map(habitXp), [10, 30, 20]);
  d.entries.wake = 1;
  d.entries.focus = 1;
  d.water = 2999;
  assert.equal(xpTotal(s), 40);
  d.water = 3000;
  assert.equal(xpTotal(s), 70); // 60 habit XP + 10 for the complete day.
  s.habits.find((h) => h.id === "wake").difficulty = "challenging";
  assert.equal(xpTotal(s), 70);
  d.entries.focus = 0;
  assert.equal(xpTotal(s), 30);
});
test("100% bonus grows with consecutive calendar days, resets on a gap and ignores essential mode", () => {
  const s = fixture();
  const today = dateKey();
  s.settings.startDate = addDays(today, -31);
  assert.deepEqual([1, 2, 3, 7, 14, 30].map(perfectDayBonus), [10, 10, 20, 30, 40, 50]);
  for (let i = 29; i >= 0; i--) {
    const key = addDays(today, -i);
    const day = dayFor(s, key);
    day.habits = [{ ...s.habits.find((h) => h.id === "wake"), essential: true }, { ...s.habits.find((h) => h.id === "focus"), essential: false }];
    day.mode = "essential";
    day.entries.wake = 1;
    day.entries.focus = 1;
    s.days[key] = day;
  }
  assert.equal(perfectStreak(s, today), 30);
  const expectedBonus = Array.from({ length: 30 }, (_, index) => perfectDayBonus(index + 1)).reduce((a, b) => a + b, 0);
  assert.equal(xpTotal(s), 30 * 40 + expectedBonus);
  s.days[addDays(today, -2)].entries.focus = 0;
  assert.equal(isPerfectDay(s.days[addDays(today, -2)]), false);
  assert.equal(perfectStreak(s, today), 2);
  assert.equal(xpTotal(s), 29 * 40 + 10 + Array.from({ length: 27 }, (_, index) => perfectDayBonus(index + 1)).reduce((a, b) => a + b, 0) + 20);
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

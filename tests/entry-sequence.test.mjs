import { test } from "node:test";
import assert from "node:assert/strict";
import { ENTRY_TIMING, entryGreeting, entryHold } from "../src/entry-sequence.ts";

test("entry copy follows the morning, afternoon and evening boundaries", () => {
  for (const hour of [0, 9, 11]) assert.equal(entryGreeting(hour), "Vamos começar com calma.");
  for (const hour of [12, 15, 17]) assert.equal(entryGreeting(hour), "Um passo de cada vez.");
  for (const hour of [18, 21, 23]) assert.equal(entryGreeting(hour), "Fechando o dia com leveza.");
});
test("entry accelerates fast data and never adds a hold after slow data", () => {
  assert.equal(120 + entryHold(120, false), ENTRY_TIMING.fast);
  assert.equal(950 + entryHold(950, false), ENTRY_TIMING.normal);
  for (const elapsed of [1800, 3000, 3800, 10000]) assert.equal(entryHold(elapsed, false), 0);
  for (let elapsed = 0; elapsed <= 5000; elapsed += 50) {
    assert.ok(entryHold(elapsed, false) + ENTRY_TIMING.dissolve < 3000);
    assert.equal(entryHold(elapsed, true), 0);
  }
  assert.equal(ENTRY_TIMING.reduced, 200);
});

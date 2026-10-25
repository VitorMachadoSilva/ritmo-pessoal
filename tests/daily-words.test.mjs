import { test } from "node:test";
import assert from "node:assert/strict";
import { dailyWords, dailyWordFor } from "../src/daily-words.ts";

test("the local collection has 200 distinct, display-ready messages", () => {
  assert.equal(dailyWords.length, 200);
  assert.equal(new Set(dailyWords).size, 200);
  for (const message of dailyWords) {
    assert.ok(message.length >= 20 && message.length <= 110);
    assert.ok(!/[“”]/.test(message), "quotation marks belong to the presentation");
  }
});

test("one real calendar day keeps one message, including across a reload", () => {
  const morning = new Date("2026-10-24T11:00:00Z");
  const evening = new Date("2026-10-25T01:00:00Z");
  assert.equal(dailyWordFor(morning, "America/Sao_Paulo"), dailyWordFor(evening, "America/Sao_Paulo"));
  assert.equal(dailyWordFor(morning, "America/Sao_Paulo"), dailyWordFor(new Date(morning.toISOString()), "America/Sao_Paulo"));
  assert.notEqual(dailyWordFor(evening, "America/Sao_Paulo"), dailyWordFor(new Date("2026-10-25T03:00:00Z"), "America/Sao_Paulo"));
});

test("the configured time zone determines midnight, not the device zone", () => {
  const instant = new Date("2026-10-25T01:30:00Z");
  assert.equal(dailyWordFor(instant, "America/Sao_Paulo"), dailyWordFor(new Date("2026-10-24T15:00:00Z"), "America/Sao_Paulo"));
  assert.equal(dailyWordFor(instant, "UTC"), dailyWordFor(new Date("2026-10-25T15:00:00Z"), "UTC"));
  assert.notEqual(dailyWordFor(instant, "America/Sao_Paulo"), dailyWordFor(instant, "UTC"));
});

test("200 consecutive dates use every message once before the cycle repeats", () => {
  const first = Date.UTC(2026, 0, 1, 12);
  const messages = Array.from({ length: 200 }, (_, index) => dailyWordFor(new Date(first + index * 86_400_000), "UTC"));
  assert.equal(new Set(messages).size, 200);
  assert.equal(dailyWordFor(new Date(first + 200 * 86_400_000), "UTC"), messages[0]);
});

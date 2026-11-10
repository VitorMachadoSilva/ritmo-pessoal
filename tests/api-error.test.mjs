import test from "node:test";
import assert from "node:assert/strict";
import { api, ApiError } from "../src/lib.ts";

test("api preserves 429 status and Retry-After seconds when the response body is not JSON", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => new Response("rate limited", { status: 429, headers: { "Retry-After": "8" } });
  await assert.rejects(api("/api/habits", { title: "Run" }, "POST"), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 429);
    assert.equal(error.retryAfterSeconds, 8);
    return true;
  });
});

test("api converts HTTP-date Retry-After to a positive number of seconds", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const retryAt = new Date(Date.now() + 60000).toUTCString();
  globalThis.fetch = async () => new Response(JSON.stringify({ error: "Rate limited" }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": retryAt },
  });
  await assert.rejects(api("/api/settings", {}, "PUT"), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 429);
    assert.ok(error.retryAfterSeconds > 0 && error.retryAfterSeconds <= 60);
    return true;
  });
});

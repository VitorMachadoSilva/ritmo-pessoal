import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { createLoginRateLimit, createRequestRateLimits, createTokenBucketLimiter } from "../server/rate-limit.mjs";

function response() {
  const res = new EventEmitter();
  res.statusCode = 200;
  res.headers = {};
  res.set = (key, value) => { res.headers[key] = value; };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}

test("API token bucket allows normal burst and returns 429 with Retry-After after exhaustion", () => {
  let now = 1000;
  const limiter = createTokenBucketLimiter({ capacity: 2, refillPerSecond: 1, now: () => now, key: () => "client" });
  const pass = () => { let nextCalled = false; const res = response(); limiter.middleware({ ip: "client" }, res, () => { nextCalled = true; }); return { res, nextCalled }; };
  assert.equal(pass().nextCalled, true);
  assert.equal(pass().nextCalled, true);
  const limited = pass();
  assert.equal(limited.res.statusCode, 429);
  assert.equal(limited.res.headers["Retry-After"], "1");
  now += 1000;
  assert.equal(pass().nextCalled, true);
});

test("login rate limit counts only failed responses, clears on success, and expires", () => {
  let now = 1000;
  const limiter = createLoginRateLimit({ maxFailures: 2, windowMs: 15000, now: () => now });
  const attempt = () => {
    const res = response();
    let nextCalled = false;
    limiter.middleware({ ip: "client" }, res, () => { nextCalled = true; });
    return { res, nextCalled };
  };
  const successful = attempt();
  successful.res.statusCode = 200;
  successful.res.emit("finish");
  const firstFailure = attempt();
  firstFailure.res.statusCode = 401;
  firstFailure.res.emit("finish");
  const secondFailure = attempt();
  secondFailure.res.statusCode = 401;
  secondFailure.res.emit("finish");
  const blocked = attempt();
  assert.equal(blocked.nextCalled, false);
  assert.equal(blocked.res.statusCode, 429);
  assert.equal(blocked.res.headers["Retry-After"], "15");
  now += 15000;
  assert.equal(attempt().nextCalled, true);
});

test("API limiter defaults to 120 requests/min and mutating limiter to 40/min with bursts", () => {
  const limits = createRequestRateLimits();
  assert.equal(limits.api.buckets.size, 0);
  assert.equal(limits.mutations.buckets.size, 0);
  for (let i = 0; i < 30; i++) limits.api.middleware({ ip: "a" }, response(), () => {});
  const apiBlocked = response();
  limits.api.middleware({ ip: "a" }, apiBlocked, () => {});
  assert.equal(apiBlocked.statusCode, 429);
  for (let i = 0; i < 10; i++) limits.mutations.middleware({ ip: "a" }, response(), () => {});
  const writeBlocked = response();
  limits.mutations.middleware({ ip: "a" }, writeBlocked, () => {});
  assert.equal(writeBlocked.statusCode, 429);
});

test("backup restore limiter prevents concurrent and repeated expensive imports", () => {
  const limits = createRequestRateLimits({ import: { intervalMs: 60000, now: () => 1000 } });
  const first = response();
  let nextCalled = false;
  limits.import.middleware({}, first, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  const concurrent = response();
  limits.import.middleware({}, concurrent, () => {});
  assert.equal(concurrent.statusCode, 429);
  first.emit("finish");
  const repeated = response();
  limits.import.middleware({}, repeated, () => {});
  assert.equal(repeated.statusCode, 429);
  assert.equal(repeated.headers["Retry-After"], "60");
});

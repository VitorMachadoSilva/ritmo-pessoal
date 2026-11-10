import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { dateKey, initialState } from "../server/defaults.mjs";
import { addDays, dayFor } from "../src/lib.ts";

const root = path.resolve(import.meta.dirname, "..");
const qaRoot = tmpdir();
const base = "http://127.0.0.1:24319";
const today = dateKey();
let child,
  testDirectory,
  cookie = "";

async function request(
  url,
  body,
  method = body === undefined ? "GET" : "POST",
) {
  const response = await fetch(base + url, {
    method,
    headers: {
      cookie,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const session = response.headers.get("set-cookie");
  if (session) cookie = session.split(";")[0];
  return { status: response.status, data: await response.json() };
}

function fixture() {
  const state = initialState("QA de regressão");
  state.settings.startDate = addDays(today, -3);
  state.habits.forEach((habit) => {
    habit.createdDate = state.settings.startDate;
  });
  state.days[today] = dayFor(state, today);
  return state;
}

before(async () => {
  testDirectory = mkdtempSync(path.join(qaRoot, "regression-"));
  child = spawn(process.execPath, ["server/index.mjs", "--production"], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: "test",
      RITMO_TEST_RATE_LIMITS: "off",
      HOST: "127.0.0.1",
      PORT: "24319",
      RITMO_DB: path.join(testDirectory, "synthetic.sqlite"),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise((resolve, reject) => {
    let diagnostics = "";
    const timeout = setTimeout(
      () => reject(new Error(`QA server did not start: ${diagnostics}`)),
      15000,
    );
    child.stderr.on("data", (data) => {
      diagnostics += data;
    });
    child.stdout.on("data", (data) => {
      if (data.toString().includes("Ritmo disponível")) {
        clearTimeout(timeout);
        resolve();
      }
    });
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`QA server exited ${code}: ${diagnostics}`));
    });
  });
  assert.equal(
    (
      await request("/api/setup", {
        username: "qa-regression",
        password: "synthetic-regression-passphrase-2026",
        name: "QA de regressão",
      })
    ).status,
    201,
  );
});

after(async () => {
  if (child && child.exitCode === null) {
    const exited = once(child, "exit");
    child.kill();
    await exited;
  }
  if (testDirectory) {
    const relative = path.relative(qaRoot, path.resolve(testDirectory));
    assert.ok(
      relative && !relative.startsWith("..") && !path.isAbsolute(relative),
    );
    rmSync(testDirectory, { recursive: true, force: true });
  }
});

test("focus actions require the exact session and stale tabs cannot alter its replacement", async () => {
  assert.equal((await request("/api/import", fixture())).status, 200);
  const first = (
    await request("/api/focus/start", { label: "Sessão A", minutes: 25 })
  ).data.focus;
  assert.equal(
    (await request("/api/focus/cancel", { sessionId: first.id })).status,
    200,
  );
  const second = (
    await request("/api/focus/start", { label: "Sessão B", minutes: 25 })
  ).data.focus;
  for (const action of ["cancel", "pause", "finish"]) {
    assert.equal(
      (await request(`/api/focus/${action}`, { sessionId: first.id })).status,
      409,
      action,
    );
    assert.deepEqual((await request("/api/state")).data.focus, second);
  }
  assert.equal((await request("/api/focus/pause", {})).status, 400);
  assert.deepEqual((await request("/api/state")).data.focus, second);
  const paused = await request("/api/focus/pause", { sessionId: second.id });
  assert.equal(paused.status, 200);
  assert.equal(paused.data.focus.resumedAt, null);
  assert.equal(
    (await request("/api/focus/resume", { sessionId: first.id })).status,
    409,
  );
  assert.deepEqual((await request("/api/state")).data.focus, paused.data.focus);
  assert.equal(
    (await request("/api/focus/resume", { sessionId: second.id })).status,
    200,
  );
  assert.equal(
    (await request("/api/focus/cancel", { sessionId: second.id })).status,
    200,
  );
});

test("invalid backup invariants are rejected without replacing valid state", async (t) => {
  const seed = fixture();
  assert.equal((await request("/api/import", seed)).status, 200);
  const before = (await request("/api/export")).data;
  const cases = [
    [
      "future day",
      (s) => {
        s.days[addDays(today, 1)] = structuredClone(s.days[today]);
      },
    ],
    [
      "day before routine start",
      (s) => {
        s.days[addDays(s.settings.startDate, -1)] = structuredClone(
          s.days[today],
        );
      },
    ],
    [
      "duplicate snapshot habit",
      (s) => {
        s.days[today].habits.push(structuredClone(s.days[today].habits[0]));
      },
    ],
    [
      "duplicate workout template",
      (s) => {
        s.workouts.push(structuredClone(s.workouts[0]));
      },
    ],
    [
      "duplicate meal",
      (s) => {
        s.meals.push(structuredClone(s.meals[0]));
      },
    ],
    [
      "duplicate exercise",
      (s) => {
        s.workouts[0].exercises.push(
          structuredClone(s.workouts[0].exercises[0]),
        );
      },
    ],
    [
      "duplicate focus log",
      (s) => {
        const log = {
          id: "duplicate-log",
          label: "Ler",
          minutes: 1,
          startedAt: Date.now() - 60000,
          finishedAt: Date.now(),
          completed: true,
          habitId: null,
        };
        s.days[today].focusSessions = [log, structuredClone(log)];
      },
    ],
  ];
  for (const [label, modify] of cases) {
    await t.test(label, async () => {
      const invalid = structuredClone(before);
      modify(invalid);
      assert.equal((await request("/api/import", invalid)).status, 400);
      assert.deepEqual((await request("/api/export")).data, before);
    });
  }
});

test("editing, archiving or unscheduling the last essential habit preserves the current day", async (t) => {
  const seed = fixture();
  seed.habits.forEach((habit) => {
    habit.essential = habit.id === "water";
  });
  delete seed.days[today];
  seed.days[today] = dayFor(seed, today);
  seed.days[today].mode = "essential";
  seed.days[today].water = 750;
  assert.equal((await request("/api/import", seed)).status, 200);
  const before = (await request("/api/export")).data;
  const water = before.habits.find((habit) => habit.id === "water");
  const weekday = new Date(`${today}T12:00:00`).getDay();
  for (const [label, patch] of [
    ["remove essential flag", { essential: false }],
    ["archive", { archived: true }],
    ["unschedule today", { days: [(weekday + 1) % 7] }],
  ]) {
    await t.test(label, async () => {
      const result = await request(
        "/api/habits/water",
        { ...water, ...patch },
        "PUT",
      );
      assert.equal(result.status, 400);
      assert.deepEqual((await request("/api/export")).data, before);
    });
  }
});

test("legacy version-one backups still restore and receive compatible defaults", async () => {
  const legacy = fixture();
  delete legacy.focus;
  delete legacy.weeks;
  legacy.habits.forEach((habit) => {
    delete habit.essential;
  });
  Object.values(legacy.days).forEach((day) => {
    delete day.mode;
    delete day.focusSessions;
    day.habits.forEach((habit) => {
      delete habit.essential;
    });
  });
  legacy.days[today].journal = "Texto fictício preservado.";
  assert.equal((await request("/api/import", legacy)).status, 200);
  const restored = (await request("/api/state")).data;
  assert.equal(restored.focus, null);
  assert.deepEqual(restored.weeks, {});
  assert.equal(restored.days[today].mode, "full");
  assert.deepEqual(restored.days[today].focusSessions, []);
  assert.equal(restored.days[today].journal, "Texto fictício preservado.");
  assert.equal(
    restored.habits.find((habit) => habit.id === "water").essential,
    true,
  );
});

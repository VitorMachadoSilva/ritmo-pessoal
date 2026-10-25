import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { initialState, dateKey } from "../server/defaults.mjs";
import { DatabaseSync } from "node:sqlite";

const dir = mkdtempSync(path.join(tmpdir(), "ritmo-test-"));
const port = 24318;
let child,
  cookie = "";
const base = `http://127.0.0.1:${port}`;
const today = dateKey();
async function req(url, body, method, authenticated = true, origin) {
  const r = await fetch(base + url, {
    method: method ?? (body === undefined ? "GET" : "POST"),
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(authenticated ? { cookie } : {}),
      ...(origin ? { origin } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const setCookie = r.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  return { status: r.status, data: await r.json(), cookie: setCookie };
}
before(async () => {
  child = spawn(process.execPath, ["server/index.mjs", "--production"], {
    cwd: path.resolve(import.meta.dirname, ".."),
    env: {
      ...process.env,
      PORT: String(port),
      HOST: "127.0.0.1",
      RITMO_DB: path.join(dir, "test.sqlite"),
    },
    stdio: "pipe",
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Server did not start")),
      15000,
    );
    child.stdout.on("data", (chunk) => {
      if (chunk.toString().includes("Ritmo disponível")) {
        clearTimeout(timeout);
        resolve();
      }
    });
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Server exited ${code}`));
    });
  });
});
after(async () => {
  if (child && !child.killed) {
    child.kill();
    await new Promise((r) => child.once("exit", r));
  }
  rmSync(dir, { recursive: true, force: true });
});

test("private application: onboarding, sessions, history, backup, validation and authorization", async (t) => {
  await t.test("health data is private before setup", async () => {
    assert.equal(
      (await req("/api/state", undefined, undefined, false)).status,
      401,
    );
    assert.deepEqual((await req("/api/auth")).data, {
      configured: false,
      authenticated: false,
    });
  });
  await t.test(
    "single account setup uses a secure session and closes registration",
    async () => {
      const r = await req("/api/setup", {
        name: "Pessoa teste",
        username: "tester",
        password: "testing-passphrase-2026",
      });
      assert.equal(r.status, 201);
      assert.match(r.cookie, /HttpOnly/i);
      assert.match(r.cookie, /SameSite=Strict/i);
      assert.doesNotMatch(r.cookie, /Max-Age|Expires=/i);
      const sessionDb = new DatabaseSync(path.join(dir, "test.sqlite"));
      const expiry = sessionDb.prepare("SELECT expires FROM sessions").get().expires;
      sessionDb.close();
      assert.ok(expiry - Date.now() > 11 * 3600000);
      assert.ok(expiry - Date.now() <= 12 * 3600000);
      assert.equal(
        (
          await req("/api/setup", {
            username: "second",
            password: "second-passphrase-2026",
          })
        ).status,
        403,
      );
    },
  );
  await t.test(
    "routine, water and metrics persist, and counters clamp safely",
    async () => {
      let r = await req(
        `/api/day/${today}`,
        { habitId: "wake", value: 1 },
        "PATCH",
      );
      assert.equal(r.status, 200);
      assert.equal(r.data.days[today].entries.wake, 1);
      await req(`/api/day/${today}`, { waterDelta: 500 }, "PATCH");
      await req(
        `/api/day/${today}`,
        { waterDelta: 250, sleep: 8, weight: 95.8, energy: 4 },
        "PATCH",
      );
      r = await req("/api/state");
      assert.equal(r.data.days[today].water, 750);
      assert.equal(r.data.days[today].sleep, 8);
      assert.equal(r.data.days[today].weight, 95.8);
      r = await req(`/api/day/${today}`, { sleep: 6.5 }, "PATCH");
      assert.equal(r.status, 200);
      assert.equal(r.data.days[today].sleep, 6.5);
      assert.equal((await req("/api/state")).data.days[today].sleep, 6.5);
      await req(`/api/day/${today}`, { waterDelta: -10000 }, "PATCH");
      assert.equal((await req("/api/state")).data.days[today].water, 0);
    },
  );
  await t.test(
    "rejects malformed data, future dates, cross-origin writes and unknown habits",
    async () => {
      assert.equal(
        (await req(`/api/day/${today}`, { sleep: 99 }, "PATCH")).status,
        400,
      );
      assert.equal(
        (await req("/api/day/2099-01-01", { energy: 3 }, "PATCH")).status,
        400,
      );
      assert.equal(
        (await req("/api/day/2026-02-30", { energy: 3 }, "PATCH")).status,
        400,
      );
      assert.equal(
        (
          await req(
            `/api/day/${today}`,
            { habitId: "unknown", value: 1 },
            "PATCH",
          )
        ).status,
        400,
      );
      assert.equal(
        (
          await req(
            `/api/day/${today}`,
            { energy: 3 },
            "PATCH",
            true,
            "https://untrusted.example",
          )
        ).status,
        403,
      );
    },
  );
  await t.test(
    "habit CRUD updates today while preserving past snapshots",
    async () => {
      const state = (await req("/api/state")).data;
      const date = new Date(`${today}T12:00:00`);
      date.setDate(date.getDate() - 1);
      const yesterday = date.toISOString().slice(0, 10);
      state.settings.startDate = yesterday;
      state.habits.forEach((h) => (h.createdDate = yesterday));
      await req("/api/import", state);
      await req(
        `/api/day/${yesterday}`,
        { habitId: "wake", value: 1 },
        "PATCH",
      );
      let r = await req("/api/habits", {
        title: "Leitura teste",
        time: "20:30",
        category: "mente",
        description: "Ler dez páginas",
        days: [0, 1, 2, 3, 4, 5, 6],
        kind: "counter",
        target: 10,
        unit: "páginas",
        difficulty: "challenging",
      });
      assert.equal(r.status, 201);
      const h = r.data.habits.at(-1);
      assert.equal(h.difficulty, "challenging");
      await req(`/api/day/${today}`, { habitId: h.id, value: 12 }, "PATCH");
      r = await req("/api/state");
      assert.equal(r.data.days[today].entries[h.id], 12);
      const wake = r.data.habits.find((h) => h.id === "wake");
      r = await req(
        "/api/habits/wake",
        { ...wake, title: "Acordar renovado", difficulty: "moderate" },
        "PUT",
      );
      assert.equal(
        r.data.days[today].habits.find((h) => h.id === "wake").title,
        "Acordar renovado",
      );
      assert.equal(
        r.data.days[yesterday].habits.find((h) => h.id === "wake").title,
        "Acordar no mesmo horário",
      );
      assert.equal(r.data.days[today].habits.find((habit) => habit.id === "wake").difficulty, "moderate");
      assert.equal(r.data.days[yesterday].habits.find((habit) => habit.id === "wake").difficulty, undefined);
      assert.equal((await req("/api/habits/wake", { ...wake, difficulty: "impossible" }, "PUT")).status, 400);
      await req(`/api/habits/${h.id}`, { ...h, archived: true }, "PUT");
      r = await req("/api/state");
      assert.equal(
        r.data.days[today].habits.some((v) => v.id === h.id),
        false,
      );
      assert.equal(r.data.habits.find((v) => v.id === h.id).archived, true);
    },
  );
  await t.test(
    "workout sets and journal survive reload, meals and settings are editable",
    async () => {
      let state = (await req("/api/state")).data;
      const w = state.workouts[0];
      const record = {
        templateId: w.id,
        name: w.name,
        completed: true,
        exercises: w.exercises.map((e) => ({
          id: e.id,
          name: e.name,
          sets: [{ weight: 20, reps: "10", done: true }],
        })),
      };
      await req(
        `/api/day/${today}`,
        {
          workout: record,
          journal: "Um dia de cada vez.",
          win: "Treinei.",
          mood: 4,
        },
        "PATCH",
      );
      state = (await req("/api/state")).data;
      assert.equal(state.days[today].workout.exercises[0].sets[0].weight, 20);
      assert.equal(state.days[today].journal, "Um dia de cada vez.");
      const m = await req("/api/meals", {
        name: "Ceia",
        time: "21:00",
        description: "Iogurte",
        calories: 120,
        protein: 10,
      });
      assert.equal(m.status, 201);
      assert.equal(
        (await req(`/api/meals/${m.data.meals.at(-1).id}`, {}, "DELETE"))
          .status,
        200,
      );
      const set = await req(
        "/api/settings",
        { ...state.settings, waterGoal: 2500 },
        "PUT",
      );
      assert.equal(
        set.data.days[today].habits.find((h) => h.id === "water").target,
        2500,
      );
    },
  );
  await t.test(
    "backup exports only app data and invalid imports do not overwrite existing data",
    async () => {
      const exported = await req("/api/export");
      assert.equal(exported.status, 200);
      assert.equal(exported.data.version, 1);
      assert.equal("hash" in exported.data, false);
      const count = exported.data.habits.length;
      assert.equal((await req("/api/import", { version: 99 })).status, 400);
      assert.equal((await req("/api/state")).data.habits.length, count);
      assert.equal((await req("/api/import", exported.data)).status, 200);
    },
  );
  await t.test(
    "essential mode persists without resetting entries and historical mode cannot be rewritten",
    async () => {
      const before = (await req("/api/state")).data;
      const changed = await req(
        `/api/day/${today}`,
        { mode: "essential" },
        "PATCH",
      );
      assert.equal(changed.status, 200);
      assert.equal(changed.data.days[today].mode, "essential");
      assert.deepEqual(
        changed.data.days[today].entries,
        before.days[today].entries,
      );
      const yesterday = new Date(`${today}T12:00:00`);
      yesterday.setDate(yesterday.getDate() - 1);
      const key = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
      assert.equal(
        (await req(`/api/day/${key}`, { mode: "essential" }, "PATCH")).status,
        400,
      );
      assert.equal(
        (await req(`/api/day/${today}`, { mode: "full" }, "PATCH")).status,
        200,
      );
    },
  );
  await t.test(
    "focus is private, singleton, pauseable, resumable and cancellable",
    async () => {
      assert.equal(
        (
          await req(
            "/api/focus/start",
            { label: "Ler", minutes: 25 },
            undefined,
            false,
          )
        ).status,
        401,
      );
      assert.equal(
        (
          await req("/api/focus/start", {
            label: "Ler",
            minutes: 25,
            habitId: "water",
          })
        ).status,
        400,
      );
      const start = await req("/api/focus/start", {
        label: "Ler",
        minutes: 25,
      });
      assert.equal(start.status, 201);
      const sessionId = start.data.focus.id;
      assert.ok(start.data.focus.resumedAt);
      assert.equal(
        (await req("/api/focus/start", { label: "Outra", minutes: 25 })).status,
        409,
      );
      assert.equal((await req("/api/focus/finish", { sessionId })).status, 400);
      assert.equal(
        (await req("/api/focus/pause", { sessionId })).data.focus.resumedAt,
        null,
      );
      assert.equal((await req("/api/focus/pause", { sessionId })).status, 409);
      assert.equal((await req("/api/focus/resume", { sessionId })).status, 200);
      assert.equal(
        (await req("/api/focus/cancel", { sessionId })).data.focus,
        null,
      );
      assert.equal((await req("/api/focus/finish", {})).status, 409);
    },
  );
  await t.test(
    "completed focus marks linked habit once and log deletion preserves habit",
    async () => {
      const state = (await req("/api/export")).data;
      const habit = state.days[today].habits.find(
        (h) => h.category === "mente" && h.kind === "check",
      );
      state.days[today].entries[habit.id] = 0;
      state.focus = {
        id: "finished-test",
        date: today,
        label: "Revisar capítulo",
        targetMinutes: 1,
        startedAt: Date.now() - 60000,
        resumedAt: null,
        elapsedMs: 60000,
        habitId: habit.id,
      };
      assert.equal((await req("/api/import", state)).status, 200);
      const result = await req("/api/focus/finish", {
        sessionId: "finished-test",
      });
      assert.equal(result.status, 200);
      assert.equal(result.data.focus, null);
      assert.equal(result.data.days[today].entries[habit.id], habit.target);
      assert.equal(result.data.days[today].focusSessions.length, 1);
      assert.equal(result.data.days[today].focusSessions[0].completed, true);
      assert.equal((await req("/api/focus/finish", {})).status, 409);
      const deleted = await req(
        `/api/focus/${today}/finished-test`,
        {},
        "DELETE",
      );
      assert.equal(deleted.status, 200);
      assert.equal(deleted.data.days[today].focusSessions.length, 0);
      assert.equal(deleted.data.days[today].entries[habit.id], habit.target);
    },
  );
  await t.test(
    "weekly reflection is editable, validates dates and persists independently of journal",
    async () => {
      const date = new Date(`${today}T12:00:00`);
      date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
      const monday = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const note = {
        worked: "Caminhar",
        adjustment: "Dormir mais cedo",
        priority: "Preparar a semana",
      };
      const result = await req(`/api/weeks/${monday}`, note, "PUT");
      assert.equal(result.status, 200);
      assert.deepEqual(result.data.weeks[monday], note);
      assert.equal(
        (await req("/api/state")).data.days[today].journal,
        "Um dia de cada vez.",
      );
      assert.equal(
        (await req("/api/weeks/2026-02-31", note, "PUT")).status,
        400,
      );
      assert.equal(
        (await req("/api/weeks/2099-01-05", note, "PUT")).status,
        400,
      );
      assert.equal(
        (
          await req(
            `/api/weeks/${monday}`,
            { ...note, worked: "x".repeat(2001) },
            "PUT",
          )
        ).status,
        400,
      );
    },
  );
  await t.test(
    "partial focus records minutes without marking a linked habit",
    async () => {
      const state = (await req("/api/export")).data;
      const habit = state.days[today].habits.find(
        (h) => h.category === "mente" && h.kind === "check",
      );
      state.days[today].entries[habit.id] = 0;
      state.focus = {
        id: "partial-test",
        date: today,
        label: "Sessão parcial",
        targetMinutes: 25,
        startedAt: Date.now() - 60000,
        resumedAt: null,
        elapsedMs: 60000,
        habitId: habit.id,
      };
      await req("/api/import", state);
      const result = await req("/api/focus/finish", {
        sessionId: "partial-test",
      });
      assert.equal(result.status, 200);
      assert.equal(result.data.days[today].entries[habit.id], 0);
      assert.equal(
        result.data.days[today].focusSessions.at(-1).completed,
        false,
      );
      assert.equal(result.data.days[today].focusSessions.at(-1).minutes, 1);
    },
  );
  await t.test(
    "legacy import fills new fields without deleting journal or changing credentials",
    async () => {
      const legacy = (await req("/api/export")).data;
      delete legacy.focus;
      delete legacy.weeks;
      legacy.habits.forEach((h) => delete h.essential);
      Object.values(legacy.days).forEach((d) => {
        delete d.mode;
        delete d.focusSessions;
        d.habits.forEach((h) => delete h.essential);
      });
      assert.equal((await req("/api/import", legacy)).status, 200);
      const state = (await req("/api/state")).data;
      assert.equal(state.focus, null);
      assert.deepEqual(state.weeks, {});
      assert.equal(state.days[today].mode, "full");
      assert.deepEqual(state.days[today].focusSessions, []);
      assert.equal(state.days[today].journal, "Um dia de cada vez.");
      assert.equal(state.habits.find((h) => h.id === "water").essential, true);
    },
  );
  await t.test(
    "logout revokes session, wrong passwords fail, changing password revokes old credentials",
    async () => {
      await req("/api/logout", {});
      assert.equal((await req("/api/state")).status, 401);
      assert.equal(
        (
          await req("/api/login", {
            username: "tester",
            password: "wrong-passphrase-123",
          })
        ).status,
        401,
      );
      assert.equal(
        (
          await req("/api/login", {
            username: "tester",
            password: "testing-passphrase-2026",
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await req("/api/password", {
            current: "testing-passphrase-2026",
            password: "new-test-passphrase-2026",
          })
        ).status,
        200,
      );
      await req("/api/logout", {});
      assert.equal(
        (
          await req("/api/login", {
            username: "tester",
            password: "testing-passphrase-2026",
          })
        ).status,
        401,
      );
      assert.equal(
        (
          await req("/api/login", {
            username: "tester",
            password: "new-test-passphrase-2026",
          })
        ).status,
        200,
      );
    },
  );
  await t.test("remember me is explicit, expires server-side, and rejects malformed values", async () => {
    await req("/api/logout", {});
    assert.equal((await req("/api/login", {
      username: "tester",
      password: "new-test-passphrase-2026",
      remember: "yes",
    })).status, 400);
    const remembered = await req("/api/login", {
      username: "tester",
      password: "new-test-passphrase-2026",
      remember: true,
    });
    assert.equal(remembered.status, 200);
    assert.match(remembered.cookie, /Max-Age=604800/i);
    assert.match(remembered.cookie, /HttpOnly/i);
    assert.match(remembered.cookie, /SameSite=Strict/i);
    const sessionDb = new DatabaseSync(path.join(dir, "test.sqlite"));
    const newest = sessionDb.prepare("SELECT hash, expires FROM sessions ORDER BY expires DESC LIMIT 1").get();
    assert.ok(newest.expires - Date.now() > 6 * 86400000);
    sessionDb.prepare("UPDATE sessions SET expires=? WHERE hash=?").run(Date.now() - 1, newest.hash);
    sessionDb.close();
    assert.equal((await req("/api/state")).status, 401);
    const ordinary = await req("/api/login", {
      username: "tester",
      password: "new-test-passphrase-2026",
      remember: false,
    });
    assert.equal(ordinary.status, 200);
    assert.doesNotMatch(ordinary.cookie, /Max-Age|Expires=/i);
  });
});

test("initial content includes all personal routine areas without fabricated logs", () => {
  const s = initialState("Teste");
  assert.equal(Object.keys(s.days).length, 0);
  assert.equal(new Set(s.habits.map((h) => h.category)).size, 6);
  assert.equal(s.workouts.length, 2);
  assert.equal(s.meals.length, 4);
});

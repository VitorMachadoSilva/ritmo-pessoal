import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { initialState, dateKey } from "../server/defaults.mjs";

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
      });
      assert.equal(r.status, 201);
      const h = r.data.habits.at(-1);
      await req(`/api/day/${today}`, { habitId: h.id, value: 12 }, "PATCH");
      r = await req("/api/state");
      assert.equal(r.data.days[today].entries[h.id], 12);
      const wake = r.data.habits.find((h) => h.id === "wake");
      r = await req(
        "/api/habits/wake",
        { ...wake, title: "Acordar renovado" },
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
});

test("initial content includes all personal routine areas without fabricated logs", () => {
  const s = initialState("Teste");
  assert.equal(Object.keys(s.days).length, 0);
  assert.equal(new Set(s.habits.map((h) => h.category)).size, 6);
  assert.equal(s.workouts.length, 2);
  assert.equal(s.meals.length, 4);
});

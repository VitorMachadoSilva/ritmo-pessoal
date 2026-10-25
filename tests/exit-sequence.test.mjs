import { test } from "node:test";
import assert from "node:assert/strict";
import { canCancelExit, EXIT_TIMING, revokeSession } from "../src/exit-sequence.ts";

test("logout cancellation is available only before the full 3s deadline", () => {
  assert.equal(EXIT_TIMING.undo, 3000);
  assert.equal(canCancelExit("closing", 2999, 3000), true);
  assert.equal(canCancelExit("closing", 3000, 3000), false);
  for (const phase of ["idle", "committing", "failed", "reveal", "returning"]) assert.equal(canCancelExit(phase, 100, 3000), false);
});
test("logout accepts revocation or an already-expired session", async () => {
  for (const status of [200, 401]) {
    const calls = [];
    await revokeSession(async (url, options) => { calls.push({url, options}); return new Response("{}", {status}); });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "/api/logout");
    assert.equal(calls[0].options.method, "POST");
    assert.equal(calls[0].options.credentials, "same-origin");
  }
});
test("lost logout response is reconciled without claiming an active session ended", async () => {
  for (const authenticated of [false, true]) {
    const request = async (url) => {
      if (url === "/api/logout") throw new Error("Network interrupted");
      return Response.json({authenticated});
    };
    if (authenticated) await assert.rejects(revokeSession(request), /Não foi possível confirmar/);
    else await revokeSession(request);
  }
  await assert.rejects(revokeSession(async()=>{throw new Error("Offline");}), /Não foi possível confirmar/);
  await assert.rejects(revokeSession(async()=>new Response("{}",{status:503})), /Não foi possível confirmar/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { errorToastForMutation, successToastForMutation } from "../src/toast-feedback.ts";

test("quiet dashboard preferences do not create success toasts", () => {
  assert.equal(successToastForMutation("/api/day/2026-10-24", { mode: "essential" }), null);
  assert.equal(successToastForMutation("/api/day/2026-10-24", { energy: 4 }), null);
});

test("quick hydration actions explain the recorded amount", () => {
  assert.deepEqual(successToastForMutation("/api/day/2026-10-24", { waterDelta: 250 }), {
    title: "Água registrada", message: "250 ml adicionados.", tone: "success",
  });
  assert.deepEqual(successToastForMutation("/api/day/2026-10-24", { waterDelta: -250 }), {
    title: "Registro de água ajustado", message: "250 ml retirados do registro.", tone: "success",
  });
});

test("earned XP is presented as a separate achievement and partial activity avoids duplicate feedback", () => {
  assert.deepEqual(successToastForMutation("/api/day/2026-10-24", { habitId: "h1", value: 1 }, "PATCH", 20), {
    title: "Pequena vitória!", message: "+20 XP registrados.", tone: "achievement",
  });
  assert.equal(successToastForMutation("/api/day/2026-10-24", { habitId: "h1", value: 0.5 }), null);
});

test("saved objects and focus sessions receive action-specific feedback", () => {
  assert.equal(successToastForMutation("/api/habits", { title: "Caminhar" }, "POST")?.title, "Hábito criado");
  assert.equal(successToastForMutation("/api/habits/h1", { archived: false, title: "Caminhar" }, "PUT")?.title, "Hábito atualizado");
  assert.equal(successToastForMutation("/api/habits/h1", { archived: false, title: "Caminhar" }, "PUT", 0, true)?.title, "Hábito restaurado");
  assert.equal(successToastForMutation("/api/focus/pause", { sessionId: "s1" })?.title, "Sessão pausada");
  assert.equal(successToastForMutation("/api/focus/finish", { sessionId: "s1" }, "POST", 10)?.tone, "achievement");
});

test("errors identify the action and tell the person whether their previous data remains", () => {
  const modeError = errorToastForMutation("/api/day/2026-10-24", new Error("Falha ao salvar"), { mode: "essential" });
  assert.equal(modeError.title, "Não foi possível mudar o ritmo do dia");
  assert.match(modeError.hint, /modo anterior foi mantido/i);
  const networkError = errorToastForMutation("/api/settings", new Error("Sem conexão com o Ritmo."));
  assert.match(networkError.hint, /conexão estão ativos/i);
  const formError = errorToastForMutation("/api/habits", new Error("Limite de itens atingido."), { title: "Novo hábito" }, "POST");
  assert.equal(formError.message, "Limite de itens atingido.");
  assert.match(formError.hint, /continuam no formulário/i);
});

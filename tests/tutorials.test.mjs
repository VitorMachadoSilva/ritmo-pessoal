import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  parseTutorialProgress,
  saveTutorialProgress,
  TUTORIAL_STORAGE_KEY,
  TUTORIAL_VERSION,
  tutorials,
} from "../src/tutorials.ts";

const pageIds = ["hoje", "rotina", "evolucao", "treinos", "alimentacao", "diario", "foco", "semana", "jogos", "ajustes"];
const source = readdirSync(new URL("../src/", import.meta.url)).filter((name) => name.endsWith(".tsx")).map((name) => readFileSync(new URL(`../src/${name}`, import.meta.url), "utf8")).join("\n");

test("cada página tem guia e todos os identificadores de guias são únicos", () => {
  const ids = tutorials.map((guide) => guide.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(tutorials.length, 20);
  for (const page of pageIds) assert.ok(tutorials.some((guide) => guide.id === `page-${page}`), `guia da página ${page}`);
  for (const page of pageIds) assert.ok(tutorials.some((guide) => guide.id.startsWith("feature-") && guide.page === page), `guia de fluxo da página ${page}`);
  for (const guide of tutorials) {
    assert.ok(guide.steps.length >= 2 && guide.steps.length <= 4, guide.id);
    assert.ok(guide.steps.every((step) => step.title && step.body && step.target), guide.id);
  }
});

test("cada passo aponta a um alvo estável existente no código", () => {
  const targetIds = new Set([...source.matchAll(/data-tutorial-target="([a-z0-9-]+)"/g)].map((match) => match[1]));
  for (const guide of tutorials) for (const step of guide.steps) assert.ok(targetIds.has(step.target), `${guide.id} → ${step.target}`);
});

test("conclusão salva e pode ser lida para reabrir o guia", () => {
  let persistedKey = "";
  let persistedValue = "";
  const storage = { setItem(key, value) { persistedKey = key; persistedValue = value; } };
  assert.equal(saveTutorialProgress(["page-hoje", "page-hoje", "unknown"], storage), true);
  assert.equal(persistedKey, TUTORIAL_STORAGE_KEY);
  assert.deepEqual(parseTutorialProgress(persistedValue), { version: TUTORIAL_VERSION, completed: ["page-hoje"] });
});

test("estado malformado, versão antiga e armazenamento indisponível não quebram os guias", () => {
  assert.deepEqual(parseTutorialProgress("{"), { version: TUTORIAL_VERSION, completed: [] });
  assert.deepEqual(parseTutorialProgress(JSON.stringify({ version: 0, completed: ["page-hoje"] })), { version: TUTORIAL_VERSION, completed: [] });
  assert.equal(saveTutorialProgress(["page-hoje"], { setItem() { throw new Error("storage blocked"); } }), false);
});

test("componente orienta sem chamar mutações ou APIs de registros", () => {
  const component = readFileSync(new URL("../src/GuidedTutorial.tsx", import.meta.url), "utf8");
  assert.match(component, /Pular/);
  assert.match(component, /Voltar/);
  assert.match(component, /Próximo/);
  assert.doesNotMatch(component, /\/api\//);
  assert.doesNotMatch(component, /localStorage/);
});

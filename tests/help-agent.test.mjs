import test from "node:test";
import assert from "node:assert/strict";
import { HELP_ENTRIES, PAGE_SUGGESTIONS } from "../src/help/knowledge.ts";
import { getPageSuggestions, normalizeHelpText, searchHelp } from "../src/help/search.ts";

test("FAQ responde perguntas exatas com conteúdo do produto", () => {
  const result = searchHelp("Como funciona o Tempo de foco?", "foco");
  assert.equal(result.type, "answer");
  assert.equal(result.entry.id, "focus-duration");
});

test("busca normaliza acentos e não inventa resposta para texto desconhecido", () => {
  assert.equal(normalizeHelpText("  ÁGUA, Refeições! "), "agua refeicoes");
  assert.equal(searchHelp("zxqv blorp 9482", "hoje").type, "none");
});

test("consulta ambígua oferece no máximo três opções", () => {
  const result = searchHelp("meta", "ajustes");
  assert.equal(result.type, "options");
  if (result.type === "options") assert.ok(result.entries.length > 0 && result.entries.length <= 3);
});

test("palavras-chave isoladas encontram respostas ou opções pertinentes à página", () => {
  for (const [query, page, id] of [
    ["carga", "treinos", "workout-plan"],
    ["backup", "ajustes", "backup"],
    ["movimento reduzido", "ajustes", "appearance"],
    ["água meta", "hoje", "partial-goal"],
  ]) {
    const result = searchHelp(query, page);
    assert.equal(result.type, "answer", query);
    assert.equal(result.entry.id, id, query);
  }
  const broad = searchHelp("treino", "treinos");
  assert.equal(broad.type, "options");
  assert.ok(broad.entries.every((entry) => entry.pages.includes("treinos")));
});

test("assuntos urgentes têm prioridade e não passam pelo ranking comum", () => {
  const result = searchHelp("quero morrer", "hoje");
  assert.equal(result.type, "answer");
  assert.equal(result.entry.id, "urgent-support");
  assert.equal(result.entry.noFeedback, true);
  assert.match(result.entry.answer, /192/);
  assert.match(result.entry.answer, /188/);
  assert.deepEqual(result.entry.links?.map(({ href }) => href), ["tel:192", "https://cvv.org.br"]);
});

test("cada página autenticada oferece exatamente três perguntas da própria base", () => {
  for (const [page, ids] of Object.entries(PAGE_SUGGESTIONS)) {
    const suggestions = getPageSuggestions(page);
    assert.equal(suggestions.length, 3, page);
    assert.deepEqual(suggestions.map(({ id }) => id), ids, page);
    assert.ok(suggestions.every(({ pages }) => pages.includes(page)), page);
  }
  assert.equal(HELP_ENTRIES.length >= 20, true);
});

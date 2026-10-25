import { HELP_ENTRIES, PAGE_SUGGESTIONS, type HelpEntry } from "./knowledge.ts";
import type { PageId } from "../types";

const STOPWORDS = new Set("a o as os um uma uns umas de do da dos das em no na nos nas por para pra com sem e ou que como qual quais quando onde eu me meu minha meus minhas voce vc tu te seu sua ao aos se ja so mais muito pode posso podem quero queria gostaria preciso ser estar esta isso esse essa aqui foi vai ter tem tenho fazer".split(" "));
const SUFFIXES = ["amentos", "imentos", "amento", "imento", "acoes", "acao", "mente", "ando", "endo", "indo", "ados", "adas", "ado", "ada", "ou", "ar", "er", "ir", "es", "s"];

export function normalizeHelpText(value: string) {
  return value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokens(value: string) {
  return normalizeHelpText(value).split(" ").filter((word) => word.length > 1 && !STOPWORDS.has(word)).map((word) => {
    for (const suffix of SUFFIXES) if (word.length - suffix.length >= 3 && word.endsWith(suffix)) return word.slice(0, -suffix.length);
    return word;
  });
}

function distanceAtMostOne(left: string, right: string) {
  if (Math.abs(left.length - right.length) > 1) return false;
  let i = 0; let j = 0; let edits = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) { i += 1; j += 1; continue; }
    edits += 1;
    if (edits > 1) return false;
    if (left.length > right.length) i += 1;
    else if (right.length > left.length) j += 1;
    else { i += 1; j += 1; }
  }
  return edits + Number(i < left.length || j < right.length) <= 1;
}

function tokenMatch(query: string, candidate: string) {
  if (query === candidate) return 1;
  const [short, long] = query.length <= candidate.length ? [query, candidate] : [candidate, query];
  if (short.length >= 3 && long.length - short.length <= 2 && long.startsWith(short)) return 0.85;
  if (short.length >= 5 && distanceAtMostOne(query, candidate)) return 0.8;
  return 0;
}

function score(entry: HelpEntry, queryTokens: string[], query: string, page: PageId) {
  if (!queryTokens.length) return 0;
  const entryTerms = new Map<string, number>();
  for (const term of tokens(entry.question)) entryTerms.set(term, 1);
  for (const keyword of entry.keywords) for (const term of tokens(keyword)) entryTerms.set(term, 2);
  let total = 0;
  for (const queryToken of queryTokens) {
    let best = 0;
    for (const [term, weight] of entryTerms) best = Math.max(best, tokenMatch(queryToken, term) * weight);
    total += best;
  }
  let result = total / (2 * queryTokens.length);
  for (const keyword of entry.keywords) if (keyword.includes(" ") && query.includes(normalizeHelpText(keyword))) result += 0.25;
  if (normalizeHelpText(entry.question) === query) result = Math.max(result, 1.5);
  if (entry.pages.includes(page)) result += 0.04;
  return result;
}

export type HelpSearchResult = { type: "answer"; entry: HelpEntry } | { type: "options"; entries: HelpEntry[] } | { type: "none" };

export function searchHelp(query: string, page: PageId, entries = HELP_ENTRIES): HelpSearchResult {
  const normalized = normalizeHelpText(query);
  if (!normalized) return { type: "none" };
  for (const entry of entries) if (entry.urgentPhrases?.some((phrase) => normalized.includes(phrase))) return { type: "answer", entry };
  const queryTokens = tokens(query);
  const ranked = entries
    .filter((entry) => !entry.urgentPhrases)
    .map((entry) => ({ entry, score: score(entry, queryTokens, normalized, page) }))
    .filter(({ score: value }) => value > 0)
    .sort((a, b) => b.score - a.score);
  const [top, second] = ranked;
  if (!top || top.score < 0.3) return { type: "none" };
  const plausible = ranked.filter(({ score: value }) => value >= 0.3);
  if (plausible.length === 1) return { type: "answer", entry: top.entry };
  if (top.score >= 0.75 && (!second || top.score - second.score >= 0.2)) return { type: "answer", entry: top.entry };
  const inPage = plausible.filter(({ entry }) => entry.pages.includes(page));
  if (queryTokens.length > 1 && inPage.length === 1 && inPage[0].entry === top.entry) return { type: "answer", entry: top.entry };
  return { type: "options", entries: (inPage.length ? inPage : plausible).slice(0, 3).map(({ entry }) => entry) };
}

export function getPageSuggestions(page: PageId) {
  return PAGE_SUGGESTIONS[page].map((id) => HELP_ENTRIES.find((entry) => entry.id === id)).filter((entry): entry is HelpEntry => Boolean(entry));
}

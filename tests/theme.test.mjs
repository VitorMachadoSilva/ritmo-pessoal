import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../public/theme.js", import.meta.url), "utf8");
function boot({ stored = null, dark = false, blocked = false } = {}) {
  const events = new EventTarget();
  const media = new EventTarget();
  media.matches = dark;
  let value = stored;
  const root = { dataset: {} };
  let chrome;
  const storage = {
    getItem: () => { if (blocked) throw new Error("disabled"); return value; },
    setItem: (_key, next) => { if (blocked) throw new Error("disabled"); value = next; },
  };
  const window = {
    matchMedia: () => media,
    addEventListener: events.addEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events),
  };
  runInNewContext(source, {
    window, Event, localStorage: storage,
    document: { documentElement: root, querySelector: () => ({ setAttribute: (_key, next) => { chrome = next; } }) },
  });
  return {
    theme: window.RitmoTheme, root, events,
    stored: () => value, chrome: () => chrome,
    system(next) { media.matches = next; media.dispatchEvent(new Event("change")); },
    storage(next, key = "ritmo.appearance") {
      const event = new Event("storage");
      Object.assign(event, { key, newValue: next }); events.dispatchEvent(event);
    },
  };
}
test("appearance follows system before React, including later OS changes", () => {
  const app = boot({ dark: true });
  assert.equal(app.theme.get(), "system");
  assert.equal(app.root.dataset.theme, "dark");
  assert.equal(app.chrome(), "#121c19");
  app.system(false);
  assert.equal(app.root.dataset.theme, "light");
});
test("explicit appearance survives reboot and ignores OS changes", () => {
  const app = boot({ stored: "dark" });
  app.system(false);
  assert.equal(app.root.dataset.theme, "dark");
  app.theme.set("light");
  assert.equal(app.stored(), "light");
  assert.equal(boot({ stored: app.stored(), dark: true }).root.dataset.theme, "light");
});
test("system can be restored and changes notify subscribers", () => {
  const app = boot({ stored: "light", dark: true });
  let count = 0; app.events.addEventListener("ritmo-theme-change", () => count++);
  app.theme.set("system");
  assert.equal(app.root.dataset.theme, "dark");
  assert.equal(app.stored(), "system");
  assert.equal(count, 1);
});
test("blocked storage does not break boot or in-page switching", () => {
  const app = boot({ blocked: true });
  app.theme.set("dark");
  assert.equal(app.root.dataset.theme, "dark");
});
test("invalid preferences fall back to system without injecting data", () => {
  const app = boot({ stored: "invalid", dark: true });
  assert.equal(app.theme.get(), "system");
  app.theme.set("<script>");
  assert.equal(app.root.dataset.theme, "dark");
});
test("other tabs sync preference, deletion and clear; unrelated keys ignored", () => {
  const app = boot();
  app.storage("dark"); assert.equal(app.root.dataset.theme, "dark");
  app.storage("light", "other"); assert.equal(app.root.dataset.theme, "dark");
  app.storage(null); assert.equal(app.theme.get(), "system");
  app.theme.set("dark"); app.storage(null, null);
  assert.equal(app.theme.get(), "system");
});
test("boot is external, synchronous and precedes application entry under CSP", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.ok(html.indexOf('src="/theme.js"') < html.indexOf('src="/src/main.tsx"'));
  assert.match(html, /<script src="\/theme.js"><\/script>/);
});

// Runs before the stylesheet/app to avoid a light flash; no account data is stored here.
(() => {
  const key = "ritmo.appearance";
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const valid = (value) => ["light", "dark", "system"].includes(value) ? value : "system";
  let preference = "system";
  try { preference = valid(localStorage.getItem(key)); } catch { /* Private/storage-disabled browser. */ }
  const resolved = () => preference === "system" ? (media.matches ? "dark" : "light") : preference;
  const apply = () => {
    document.documentElement.dataset.theme = resolved();
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolved() === "dark" ? "#121c19" : "#214e45");
    window.dispatchEvent(new Event("ritmo-theme-change"));
  };
  window.RitmoTheme = {
    get: () => preference,
    resolved,
    set(value) {
      preference = valid(value);
      try { localStorage.setItem(key, preference); } catch { /* Keep the choice for this page even without storage. */ }
      apply();
    },
  };
  media.addEventListener("change", apply);
  window.addEventListener("storage", (event) => {
    if (event.key === key || event.key === null) {
      preference = valid(event.key === null ? null : event.newValue);
      apply();
    }
  });
  apply();
})();

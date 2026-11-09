// Luma Ambient Setup — first-run companion for the Luma Ambient Spicetify theme.
//
// Spicetify themes are CSS-only, so this small extension ships beside the
// theme and asks once whether the Luma Lyrics extension is installed. The
// answer drives a narrow set of UI adjustments — for example hiding Spotify's
// native lyrics button while Luma Lyrics is active, so the playbar keeps a
// single lyrics toggle instead of two.
//
// Luma Lyrics and Luma Plus are detected automatically afterwards; the saved
// answer is corrected silently if reality changes.
//
// Console API:
//   LumaAmbientSetup.ask()    — reopen the prompt
//   LumaAmbientSetup.reset()  — forget the saved answer and reopen the prompt
//   LumaAmbientSetup.getConfig()
(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  while (!(globalThis.Spicetify && document.body)) await wait(300);
  if (globalThis.__lumaAmbientSetupLoaded) return;
  globalThis.__lumaAmbientSetupLoaded = true;

  const KEY = "luma-ambient-setup";
  const CLASS_LYRICS = "luma-with-lyrics";
  const DETECT_GRACE_MS = 3000; // how long to look for Luma Lyrics before asking
  const CONFIRM_WINDOW_MS = 30000; // how long to keep looking after a "yes"

  const loadState = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "null");
    } catch {
      return null;
    }
  };
  const saveState = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  };

  // lyrics: true (installed), false (not installed), null (not answered yet)
  let state = loadState() || { lyrics: null, plus: false, asked: false };

  const detectLyrics = () =>
    Boolean(
      globalThis.LumaLyrics ||
        document.getElementById("luma-root") ||
        document.querySelector(
          'button[aria-label="Luma Lyrics"], button[title="Luma Lyrics"]',
        ),
    );
  const detectPlus = () =>
    Boolean(globalThis.LumaPlus || document.getElementById("luma-plus-style"));

  const HIDE_RULES = `
/* Luma Ambient Setup — keep a single lyrics button on the playbar.
   Spotify's own lyrics control is hidden while Luma Lyrics provides the
   lyrics UI. Luma's own toggle is excluded from every rule. */
html.${CLASS_LYRICS} button[data-testid="lyrics-button"]:not([aria-label="Luma Lyrics"]),
html.${CLASS_LYRICS} button[data-testid="lyrics-toggle-button"]:not([aria-label="Luma Lyrics"]),
html.${CLASS_LYRICS} button[title="Lyrics"]:not([aria-label="Luma Lyrics"]),
html.${CLASS_LYRICS} button[aria-label*="lyrics" i]:not([aria-label="Luma Lyrics"]) {
  display: none !important;
}
`;

  function apply() {
    document.documentElement.classList.toggle(
      CLASS_LYRICS,
      state.lyrics === true,
    );
    let styleEl = document.getElementById("luma-ambient-setup-style");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "luma-ambient-setup-style";
      document.head.append(styleEl);
    }
    styleEl.textContent = state.lyrics === true ? HIDE_RULES : "";
    if (state.plus) applyPlus();
  }

  // Reserved for future Luma Plus-specific adjustments. Detection and the
  // saved flag are already wired; add rules here as they are needed.
  function applyPlus() {}

  const UI_CSS = `
#luma-ambient-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%) translateY(12px);opacity:0;z-index:1000002;pointer-events:none;padding:10px 14px;border-radius:999px;background:rgba(33,31,38,.92);color:#f3edf7;border:1px solid rgba(208,188,255,.25);font:600 13px/1.2 Inter,"Segoe UI",sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35);backdrop-filter:blur(14px);transition:opacity .18s ease,transform .18s ease}
#luma-ambient-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
#luma-ambient-scrim{position:fixed;inset:0;z-index:1000001;display:grid;place-items:center;background:rgba(0,0,0,.5);opacity:0;transition:opacity .18s ease}
#luma-ambient-scrim.show{opacity:1}
#luma-ambient-scrim .luma-setup{width:min(380px,calc(100vw - 48px));padding:26px 26px 22px;border-radius:16px;background:var(--spice-player,#1d1b20);border:1px solid color-mix(in srgb,var(--spice-text,#f3edf7) 12%,transparent);box-shadow:0 24px 72px rgba(0,0,0,.45);color:var(--spice-text,#f3edf7);font-family:Inter,"Segoe UI",system-ui,sans-serif;transform:translateY(8px) scale(.98);transition:transform .18s ease}
#luma-ambient-scrim.show .luma-setup{transform:none}
#luma-ambient-scrim h2{margin:0 0 8px;font-size:15px;font-weight:650;letter-spacing:-.02em}
#luma-ambient-scrim p{margin:0 0 18px;font-size:13px;line-height:1.55;color:var(--spice-subtext,#cac4d0)}
#luma-ambient-scrim .luma-setup-hint{display:none;margin:-10px 0 14px;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--spice-button,#d0bcff)}
#luma-ambient-scrim .luma-setup-hint.visible{display:block}
#luma-ambient-scrim .luma-setup-actions{display:flex;gap:8px}
#luma-ambient-scrim .luma-setup-actions button{flex:1;padding:9px 14px;border-radius:999px;font:600 13px/1 Inter,"Segoe UI",sans-serif;cursor:pointer;transition:filter .15s ease,background-color .15s ease,border-color .15s ease}
#luma-ambient-scrim .luma-setup-yes{border:1px solid transparent;background:var(--spice-button,#d0bcff);color:var(--luma-on-primary,#241a30)}
#luma-ambient-scrim .luma-setup-yes:hover{filter:brightness(1.08)}
#luma-ambient-scrim .luma-setup-no{border:1px solid color-mix(in srgb,var(--spice-text,#f3edf7) 22%,transparent);background:transparent;color:var(--spice-text,#f3edf7);font-weight:500}
#luma-ambient-scrim .luma-setup-no:hover{background:color-mix(in srgb,var(--spice-text,#f3edf7) 8%,transparent)}
#luma-ambient-scrim :where(button):focus-visible{outline:2px solid var(--spice-button,#d0bcff);outline-offset:2px}
@media (prefers-reduced-motion: reduce) {
  #luma-ambient-scrim,#luma-ambient-scrim .luma-setup,#luma-ambient-toast{transition:none}
}
`;

  let uiStyleInjected = false;
  function injectUiStyle() {
    if (uiStyleInjected) return;
    uiStyleInjected = true;
    const styleEl = document.createElement("style");
    styleEl.id = "luma-ambient-setup-ui";
    styleEl.textContent = UI_CSS;
    document.head.append(styleEl);
  }

  let toastTimer = 0;
  function showToast(message) {
    injectUiStyle();
    let toastEl = document.getElementById("luma-ambient-toast");
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.id = "luma-ambient-toast";
      document.body.append(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2400);
  }

  let previousFocus = null;
  function closeDialog() {
    const scrim = document.getElementById("luma-ambient-scrim");
    if (!scrim) return;
    scrim.classList.remove("show");
    const done = () => scrim.remove();
    scrim.addEventListener("transitionend", done, { once: true });
    setTimeout(done, 400); // reduced-motion fallback
    document.removeEventListener("keydown", onDialogKeydown, true);
    previousFocus?.focus?.();
  }

  function onDialogKeydown(e) {
    if (e.key === "Escape") {
      e.stopPropagation();
      closeDialog(); // no answer saved; the prompt returns next launch
    }
  }

  function answer(lyricsInstalled) {
    state.lyrics = lyricsInstalled;
    state.asked = true;
    if (detectPlus()) state.plus = true;
    saveState();
    apply();
    closeDialog();
    if (lyricsInstalled) watchForLyrics();
  }

  function openDialog(detected = detectLyrics()) {
    injectUiStyle();
    if (document.getElementById("luma-ambient-scrim")) return;
    previousFocus = document.activeElement;

    const scrim = document.createElement("div");
    scrim.id = "luma-ambient-scrim";
    scrim.innerHTML = `
<div class="luma-setup" role="dialog" aria-modal="true" aria-labelledby="luma-setup-title" aria-describedby="luma-setup-desc">
  <h2 id="luma-setup-title">Luma Ambient</h2>
  <p id="luma-setup-desc">Is the Luma Lyrics extension installed? The theme adapts to match — for example, keeping a single lyrics button on the playbar.</p>
  <div class="luma-setup-hint${detected ? " visible" : ""}">Luma Lyrics detected</div>
  <div class="luma-setup-actions">
    <button type="button" class="luma-setup-yes">Yes, it&rsquo;s installed</button>
    <button type="button" class="luma-setup-no">Not yet</button>
  </div>
</div>`;
    document.body.append(scrim);
    requestAnimationFrame(() => scrim.classList.add("show"));

    scrim.querySelector(".luma-setup-yes").addEventListener("click", () => answer(true));
    scrim.querySelector(".luma-setup-no").addEventListener("click", () => answer(false));
    scrim.addEventListener("click", (e) => {
      if (e.target === scrim) closeDialog(); // dismiss; asked again next launch
    });
    document.addEventListener("keydown", onDialogKeydown, true);
    scrim.querySelector(".luma-setup-yes").focus();
  }

  // Safety net for a "yes" answer: if Luma Lyrics never shows up, restore
  // Spotify's native lyrics button so lyrics stay reachable.
  function watchForLyrics() {
    let seen = detectLyrics();
    const deadline = Date.now() + CONFIRM_WINDOW_MS;
    const tick = () => {
      if (state.lyrics !== true) return;
      const found = detectLyrics();
      if (found) {
        if (!seen) showToast("Luma Lyrics connected");
        return;
      }
      if (Date.now() > deadline) {
        state.lyrics = false;
        saveState();
        apply();
        showToast("Luma Lyrics not found — native lyrics button restored");
        return;
      }
      setTimeout(tick, 1500);
    };
    setTimeout(tick, 2500);
  }

  // Keep the saved answers in step with reality: a later Luma Lyrics or
  // Luma Plus install (or removal) updates the state without re-prompting.
  let scanQueued = false;
  function queueScan() {
    if (scanQueued) return;
    scanQueued = true;
    setTimeout(() => {
      scanQueued = false;
      const lyrics = detectLyrics();
      if (lyrics && state.lyrics !== true) {
        state.lyrics = true;
        state.asked = true;
        saveState();
        apply();
        showToast("Luma Lyrics detected — Spotify's lyrics button hidden");
      }
      const plus = detectPlus();
      if (plus !== state.plus) {
        state.plus = plus;
        saveState();
        apply();
      }
    }, 600);
  }

  // First run: give extensions a moment to load, then ask. Later runs:
  // apply the saved answer quietly.
  if (state.asked) {
    apply();
  } else {
    const deadline = Date.now() + DETECT_GRACE_MS;
    let detected = detectLyrics();
    while (!detected && Date.now() < deadline) {
      await wait(300);
      detected = detectLyrics();
    }
    openDialog(detected);
  }

  new MutationObserver(queueScan).observe(document.body, {
    childList: true,
    subtree: true,
  });

  globalThis.LumaAmbientSetup = {
    version: "1.0.0",
    ask: () => openDialog(detectLyrics()),
    reset: () => {
      state = { lyrics: null, plus: false, asked: false };
      try {
        localStorage.removeItem(KEY);
      } catch {}
      apply();
      openDialog();
    },
    getConfig: () => ({
      ...state,
      detectedLyrics: detectLyrics(),
      detectedPlus: detectPlus(),
    }),
  };
  console.info(
    "[Luma Ambient Setup] Loaded. Reopen the prompt with LumaAmbientSetup.ask()",
  );
})();

/* Luma Ambient — theme script.
 *
 * Injected by Spicetify alongside user.css when `inject_theme_js` is enabled
 * (same mechanism the Comfy theme uses). It:
 *   - generates the Material 3 palette from the playing track (see engine.js),
 *   - asks once whether the Luma Lyrics extension is installed and adapts a
 *     few UI details to the answer (for example, hiding Spotify's native
 *     lyrics button so the playbar keeps a single lyrics toggle),
 *   - tags clutter sections so user.css can hide them.
 *
 * Luma Lyrics and Luma Plus are detected automatically afterwards; the saved
 * answer is corrected silently if reality changes.
 *
 * Console API (mirrors Comfy's window.Comfy):
 *   LumaAmbient.ask()      — reopen the Luma Lyrics prompt
 *   LumaAmbient.reset()    — forget the saved answer and reopen the prompt
 *   LumaAmbient.config()
 *   LumaAmbient.palette    — .open() .get() .set({...}) .reset()
 *
 * This file is built from src/ — edit the sources and run `npm run build`.
 */
import { createPaletteEngine } from "./engine.js";
import { createArtistGallery } from "./artists.js";
import { openModal, showToast } from "./ui.js";

(async function lumaAmbient() {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  while (!(globalThis.Spicetify && document.body)) {
    setTimeout(lumaAmbient, 10);
    return;
  }
  if (globalThis.__lumaAmbientThemeLoaded) return;
  globalThis.__lumaAmbientThemeLoaded = true;

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

  // Artist gallery (console: LumaAmbient.artists()).
  const artistGallery = createArtistGallery();

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
/* Luma Ambient — keep a single lyrics button on the playbar.
   Spotify's own lyrics control is hidden while Luma Lyrics provides the
   lyrics UI. Luma's own toggle is excluded from every rule. */
html.${CLASS_LYRICS} button[data-testid="lyrics-button"]:not([aria-label="Luma Lyrics"]),
html.${CLASS_LYRICS} button[data-testid="lyrics-toggle-button"]:not([aria-label="Luma Lyrics"]),
html.${CLASS_LYRICS} .main-nowPlayingBar-lyricsButton:not([aria-label="Luma Lyrics"]),
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

  /* --------------------------------------------------------------------------
     Decluttering (text-based, markup-tolerant)
     CSS cannot match elements by their heading text, and Spotify's Now Playing
     panel markup keeps shifting, so this script finds the sections by reading
     their headings and tags them with data-luma-declutter. user.css decides
     whether a tagged section is visible, which keeps one set of override
     variables for everything (see the README):

       :root { --luma-declutter-npv: block; --luma-declutter-shelves: block; }
       :root { --ambient-home-more-like: block; }   (one shelf only)

     Nothing structural is hidden — only the section that owns the heading,
     and never the lyrics, player, or panel header.
     -------------------------------------------------------------------------- */
  const TAG = "data-luma-declutter";
  // Marks wrappers that were tagged only because they were (transiently)
  // empty; revived by the scanner when real content appears inside them.
  const COLLAPSED = "data-luma-collapsed";
  const NPV_LABELS = [
    "Credits",
    "On tour",
    "Merch",
    "Next in queue",
    "Next up",
    "About the artist",
  ];
  // Matched against the shelf's aria-label/heading, case-insensitively.
  // Personalized shelves embed the artist or user name ("More like  The
  // Weeknd", "Made For  Sasha"), so prefixes — not exact labels.
  const SHELF_PREFIXES = [
    ["More like", "more-like"],
    ["For fans of", "for-fans-of"],
    ["Fans also like", "fans-also-like"],
    ["Based on your recent listening", "recent-recommendations"],
    ["Made for", "made-for-you"],
    ["Made For", "made-for-you"],
    ["Recommended Stations", "recommended-stations"],
    ["Popular with listeners", "popular-listeners"],
    ["Best of artists", "best-of-artists"],
    ["Bringing together the top songs from an artist", "best-of-artists"],
    ["Albums featuring songs you like", "albums-for-you"],
  ];

  const shelfKey = (text) => {
    text = (text || "").trim();
    if (!text) return null;
    const lower = text.toLowerCase();
    for (const [prefix, key] of SHELF_PREFIXES) {
      const p = prefix.toLowerCase();
      if (lower === p || lower.startsWith(`${p} `)) return key;
    }
    return null;
  };

  // Returns true only the first time an element receives a given tag, so each
  // section is processed (and logged) once however often the DOM changes.
  function tag(el, value) {
    if (el.getAttribute(TAG) === value) return false;
    el.setAttribute(TAG, value);
    return true;
  }

  // A node is empty if it renders no text and no media/controls, ignoring
  // nodes whose computed display is none (already-hidden decluttered items)
  // and the element we just hid. Checked recursively: a wrapper whose only
  // content is a hidden subtree still counts as empty — but NOT while
  // anything inside can still mount, see reviveCollapsed().
  function isEmptyIgnoringHidden(el, skip) {
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent.trim().length > 0) return false;
        continue;
      }
      if (node.nodeType !== Node.ELEMENT_NODE || node === skip) continue;
      if (getComputedStyle(node).display === "none") continue;
      if (node.querySelector("img, canvas, svg, video, input, button, a")) return false;
      if (node.textContent.trim().length > 0) return false;
      if (!isEmptyIgnoringHidden(node, node)) return false;
    }
    return true;
  }

  // After a section is hidden, tag the wrappers it left behind so the block
  // disappears entirely instead of leaving an empty gap. Never climbs into
  // layout roots, and stops as soon as a parent still has content. Wrappers
  // get the same tag as the section, so they follow the same override, plus
  // the collapse marker: Spotify mounts whole sections lazily, so a wrapper
  // that is empty NOW may hold visible content a moment later. The scanner
  // re-checks collapsed wrappers and revives them once content appears.
  const LAYOUT_ROOTS = "[class*='Root__right-sidebar'], .Root__right-sidebar, .Root__main-view, .Root__nav-bar, .main-nowPlayingBar-nowPlayingBar, .main-home-content, .Root__top-container, body, html";

  function collapseEmptyParents(el, value) {
    let hiddenEl = el;
    let parent = el.parentElement;
    for (let depth = 0; depth < 3 && parent; depth++) {
      if (parent.matches(LAYOUT_ROOTS)) break;
      if (!isEmptyIgnoringHidden(parent, hiddenEl)) break;
      parent.setAttribute(TAG, value);
      parent.setAttribute(COLLAPSED, "");
      hiddenEl = parent;
      parent = parent.parentElement;
    }
  }

  function reviveCollapsed() {
    for (const wrapper of document.querySelectorAll(`[${COLLAPSED}]`)) {
      if (!isEmptyIgnoringHidden(wrapper, null)) {
        wrapper.removeAttribute(TAG);
        wrapper.removeAttribute(COLLAPSED);
      }
    }
  }

  function declutter(el, value, collapse = true) {
    if (!tag(el, value)) return;
    if (collapse) collapseEmptyParents(el, value);
    console.info(`[Luma Ambient] decluttered: ${el.textContent.slice(0, 60).trim()}…`);
  }

  function declutterShelves() {
    document
      .querySelectorAll('section[data-testid="component-shelf"]')
      .forEach((shelf) => {
        const label = (shelf.getAttribute("aria-label") || "").trim();
        const heading = shelf.querySelector("h1,h2,h3,h4,[role='heading']");
        const text = heading ? heading.textContent.trim() : "";
        const key = shelfKey(label) || shelfKey(text);
        if (key) declutter(shelf, `shelf:${key}`);
      });
    // The unlabeled recommendation grid at the bottom of Home ("Based on
    // your recent listening" mixes, radios, and editorial picks). It has no
    // meaningful aria-label or testid, so it is recognized by its shape: a
    // section whose aria-label is missing or empty, holding a card grid.
    for (const section of document.querySelectorAll(
      ".main-home-content > section",
    )) {
      if (section.getAttribute("data-testid") === "component-shelf") continue;
      if ((section.getAttribute("aria-label") || "").trim()) continue;
      if (!section.querySelector(".main-gridContainer-gridContainer")) continue;
      declutter(section, "shelf:preview-grid");
    }
  }

  // Never hide a block containing the lyrics preview, cover art, or player
  // controls. Kept as data-testid hooks first — client 1.3.8+ replaces the
  // former main-nowPlayingView-* classes with obfuscated names.
  const NPV_SAFE =
    "[data-testid='lyrics-npv-section'], [data-testid='cover-art-slot'], [data-testid='cover-art'], [data-testid='NPV_Lyrics'], .main-nowPlayingView-lyricsContent, .main-nowPlayingView-playerControls, .main-nowPlayingView-header";

  // The panel that hosts the Now Playing view. Client 1.3.8+ renders it as a
  // "peek" panel (Root__right-sidebar-peek / -peekContent / -overlayWrapper)
  // instead of .Root__right-sidebar, so match the family; legacy hooks remain.
  const NPV_SCOPE = '[class*="Root__right-sidebar"], .NowPlayingView, [data-npv-root]';

  function declutterNowPlaying() {
    let scope = null;
    for (const sel of NPV_SCOPE.split(",")) {
      const el = document.querySelector(sel.trim());
      if (el) {
        scope = el;
        break;
      }
    }
    if (!scope) return;

    scope.querySelectorAll("h1,h2,h3,h4,[role='heading']").forEach((heading) => {
      const text = heading.textContent.trim();
      if (!NPV_LABELS.includes(text)) return;
      if (tagSection(heading, scope, "npv")) return;
      tagByShape(heading, scope, "npv");
    });
  }

  const NPV_LABEL_HEADINGS =
    "h1,h2,h3,h4,[role='heading']";
  const clutterHeadings = (el) =>
    [...el.querySelectorAll(NPV_LABEL_HEADINGS)].filter((h) =>
      NPV_LABELS.includes(h.textContent.trim()),
    ).length;

  // Preferred path: tag the dedicated section element (client-provided
  // section/article or a *-npv-section testid). value selects which restore
  // variable the tagged block follows ("npv" or "artist-page").
  function tagSection(heading, scope, value) {
    value = value || "npv";
    let el = heading;
    for (let depth = 0; depth < 10 && el.parentElement; depth++) {
      el = el.parentElement;
      if (el === scope) return false;
      const cls = typeof el.className === "string" ? el.className : "";
      const testid = el.getAttribute("data-testid") || "";
      const isSection =
        el.tagName === "SECTION" ||
        el.tagName === "ARTICLE" ||
        testid.endsWith("-npv-section") ||
        /nowPlayingView|npv/i.test(`${cls} ${testid}`);
      if (!isSection) continue;

      // Safety: never hide anything with lyrics, cover art, or player
      // controls inside, and never a wrapper that stacks several of the
      // clutter sections (each section is tagged separately). Other
      // headings do not count — e.g. an On tour section lists venue names.
      if (el.querySelector(NPV_SAFE) || clutterHeadings(el) > 1) return false;

      declutter(el, value);
      return true;
    }
    return false;
  }

  // Fallback for sections without a dedicated container (client 1.3.8+
  // renders On tour/Merch as nested divs/asides): tag the smallest ancestor
  // that owns exactly one clutter heading, holds real content beyond that
  // heading, and nothing protected. The heading's own container (title plus
  // expand chevron) has the heading's exact text, so climbing stops at the
  // first ancestor whose text reaches beyond it — the section boundary.
  function tagByShape(heading, scope, value) {
    value = value || "npv";
    const text = heading.textContent.replace(/\s+/g, " ").trim();
    let el = heading;
    for (let depth = 0; depth < 12 && el.parentElement; depth++) {
      el = el.parentElement;
      if (el === scope || el.matches(LAYOUT_ROOTS)) return false;
      if (el.textContent.replace(/\s+/g, " ").trim() === text) continue;
      if (clutterHeadings(el) > 1) return false;
      if (el.querySelector(NPV_SAFE)) return false;
      declutter(el, value);
      return true;
    }
    return false;
  }

  /* --------------------------------------------------------------------------
     Artist page (the /artist/ view)
     Merch, On tour, and About are removed — but the singer's world rank
     ("#2 in the world") lives inside About on client 1.3.8, so it is copied
     up into the page header as a badge first, then the sections are tagged.
     Same text-based matching as the Now Playing panel, with two extra
     guards: headings that render nowhere (Spotify keeps hidden NPV
     templates in the main view markup) are skipped, and a lost world rank
     is never invented — no About text means no badge.
     -------------------------------------------------------------------------- */
  const ARTIST_PAGE_HIDE = [
    "About",
    "About the artist",
    "On tour",
    "Merch",
    "Discovered on",
  ];
  // "Featuring <artist>" is dynamic, so it matches by prefix.
  const isArtistPageClutter = (text) =>
    ARTIST_PAGE_HIDE.includes(text) || text.startsWith("Featuring ");
  const ARTIST_PAGE_SCOPE = ".Root__main-view, .main-view-container";
  const WORLD_RANK_RE = /#\s*([\d.,]+)\s*in the world/i;

  function injectWorldRank(scope) {
    const header = scope.querySelector(".main-entityHeader-headerText");
    let badge = document.querySelector("[data-luma-world-rank]");
    let rank = null;
    for (const el of scope.querySelectorAll("div, span, p")) {
      const match = (el.textContent || "").match(WORLD_RANK_RE);
      if (match) {
        rank = match[1];
        break;
      }
    }
    if (header) {
      if (!badge) {
        if (!rank) return;
        badge = document.createElement("span");
        badge.className = "luma-artist-rank";
        badge.setAttribute("data-luma-world-rank", "");
        header.append(badge);
      }
      // Sit beside the verified badge when there is one (stable encore id),
      // otherwise fall back to the end of the header text.
      const verified = header.querySelector("[data-encore-id='verifiedBadge']");
      const anchor = verified
        ? verified.closest("button") || verified.closest("span")
        : null;
      if (anchor && anchor.nextElementSibling !== badge) {
        anchor.after(badge);
      } else if (!anchor && header.lastElementChild !== badge) {
        header.append(badge);
      }
      badge.textContent = rank ? `#${rank} in the world` : "";
      badge.hidden = !rank;
    } else if (badge) {
      badge.remove();
    }
  }

  // Artist-page sections (About, Merch, On tour) are siblings inside grid
  // containers, with no dedicated <section> wrappers and no text of their own
  // beyond the heading — so the Now Playing "shape" heuristics would climb
  // straight into the grid and then up single-child wrappers to the scroll
  // root, hiding the whole page. Tag the heading's ancestor that is a direct
  // child of a grid container (each section owns one grid child), and never
  // collapse empty parents here (grids always hold other sections).
  const ARTIST_GRID = ".main-gridContainer-gridContainer";

  function tagArtistSection(heading) {
    let el = heading;
    while (el.parentElement) {
      const parent = el.parentElement;
      if (parent.matches(ARTIST_GRID)) {
        if (el === heading) return false;
        declutter(el, "artist-page", false);
        return true;
      }
      el = parent;
    }
    return false;
  }

  function declutterArtistPage() {
    let scope = null;
    for (const sel of ARTIST_PAGE_SCOPE.split(",")) {
      const el = document.querySelector(sel.trim());
      if (el) {
        scope = el;
        break;
      }
    }
    if (!scope) return;
    const path =
      globalThis.Spicetify?.Platform?.History?.location?.pathname ||
      location.pathname;
    if (!path.startsWith("/artist/")) {
      const badge = document.querySelector("[data-luma-world-rank]");
      if (badge) badge.remove();
      return;
    }
    // The world rank must be read before About disappears underneath it.
    injectWorldRank(scope);
    // Drop tags an earlier build may have left on wrappers above a grid
    // (they hid the whole page); a real section's parent is a grid itself.
    for (const el of scope.querySelectorAll('[data-luma-declutter="artist-page"]')) {
      if (!el.parentElement?.matches(ARTIST_GRID)) {
        el.removeAttribute("data-luma-declutter");
      }
    }
    scope
      .querySelectorAll("h1, h2, h3, h4, [role='heading']")
      .forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        if (!rect.width && !rect.height) return; // hidden template
        const text = heading.textContent.trim();
        if (!isArtistPageClutter(text)) return;
        tagArtistSection(heading);
      });
  }

  function answer(lyricsInstalled, close) {
    state.lyrics = lyricsInstalled;
    state.asked = true;
    if (detectPlus()) state.plus = true;
    saveState();
    apply();
    close();
    if (lyricsInstalled) watchForLyrics();
  }

  function openDialog(detected = detectLyrics()) {
    openModal("Luma Ambient setup", (box, close) => {
      box.innerHTML = `
<h2>Luma Ambient</h2>
<p>Is the Luma Lyrics extension installed? The theme adapts to match — for example, keeping a single lyrics button on the playbar.</p>
<div class="luma-setup-hint${detected ? " visible" : ""}">Luma Lyrics detected</div>
<div class="luma-setup-actions">
  <button type="button" class="luma-setup-yes">Yes, it&rsquo;s installed</button>
  <button type="button" class="luma-setup-no">Not yet</button>
</div>`;
      const yes = box.querySelector(".luma-setup-yes");
      yes.addEventListener("click", () => answer(true, close));
      box.querySelector(".luma-setup-no").addEventListener("click", () => answer(false, close));
      yes.focus(); // dismissing leaves no answer saved; the prompt returns next launch
    });
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
      declutterShelves();
      declutterNowPlaying();
      declutterArtistPage();
      reviveCollapsed();
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

  const palette = createPaletteEngine();

  // Spotify rewrites the progress bar and time labels every second, and Luma
  // Lyrics re-renders its overlay continuously; neither can add a section we
  // care about, so mutations inside them do not trigger a scan.
  const QUIET = ".playback-bar, #luma-root, #luma-ambient-toast, #luma-ambient-scrim, #luma-artists";
  new MutationObserver((records) => {
    for (const record of records) {
      const target =
        record.target.nodeType === Node.ELEMENT_NODE
          ? record.target
          : record.target.parentElement;
      if (!target || !target.closest(QUIET)) {
        queueScan();
        return;
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

  // Catch the initial mount, then keep decluttering on DOM changes.
  setTimeout(() => {
    declutterShelves();
    declutterNowPlaying();
    declutterArtistPage();
  }, 1200);

  // The sidebar's lyrics preview plays the full Luma Lyrics view instead of
  // Spotify's own lyrics screen (only when Luma Lyrics is actually wired
  // up; otherwise Spotify's default click is left alone).
  document.addEventListener(
    "click",
    (event) => {
      if (state.lyrics !== true) return;
      const lyrics = globalThis.LumaLyrics;
      if (!lyrics || typeof lyrics.open !== "function") return;
      const preview = event.target.closest?.("[data-testid='lyrics-npv-section']");
      if (!preview) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      lyrics.open();
    },
    true,
  );

  globalThis.LumaAmbient = {
    version: __LUMA_AMBIENT_VERSION__,
    artists: () => artistGallery.open(),
    ask: () => openDialog(detectLyrics()),
    reset: () => {
      state = { lyrics: null, plus: false, asked: false };
      try {
        localStorage.removeItem(KEY);
      } catch {}
      apply();
      openDialog();
    },
    config: () => ({
      ...state,
      detectedLyrics: detectLyrics(),
      detectedPlus: detectPlus(),
      palette: palette.get(),
    }),
    palette,
  };
  console.info(
    `[Luma Ambient] theme.js ${__LUMA_AMBIENT_VERSION__} loaded. Palette: LumaAmbient.palette.open() — Luma Lyrics prompt: LumaAmbient.ask()`,
  );
})();

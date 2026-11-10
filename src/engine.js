/* Luma Ambient — Material 3 palette engine.
 *
 * Generates the full Material 3 role set from a seed color and applies it to
 * the document as --md-* variables (plus the legacy --spice-* aliases that
 * native Spotify surfaces read). The seed comes from the current track's
 * artwork, a fixed custom color, or is skipped entirely ("static") so that
 * color.ini and Luma Lyrics' Desktop colors keep working as before.
 */
import {
  DEFAULTS,
  MODES,
  ROLE_NAMES,
  VARIANTS,
  generatePalette,
  hexToRgbTriplet,
  isHex,
  normalizeConfig,
  pickSeed,
  spiceAliases,
} from "./palette.js";
import { openModal } from "./ui.js";

const CONFIG_KEY = "luma-ambient-palette";
const SEED_KEY = "luma-ambient-last-seed";
const TRANSITION = "500ms cubic-bezier(0.2, 0, 0, 1)";

// Roles that are not applied as plain colors: scrim must stay translucent, and
// shadow is only ever black.
const SKIP_ROLES = new Set(["scrim", "shadow"]);

const read = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {}
};

function loadConfig() {
  try {
    return normalizeConfig(JSON.parse(read(CONFIG_KEY) || "null"));
  } catch {
    return normalizeConfig(null);
  }
}

export function createPaletteEngine() {
  const root = document.documentElement;
  const applied = new Set(); // custom properties currently set inline
  const lightQuery = globalThis.matchMedia?.("(prefers-color-scheme: light)");

  let config = loadConfig();
  let lastSeed = isHex(read(SEED_KEY)) ? read(SEED_KEY) : DEFAULTS.seed;
  let token = 0;
  let transitionsReady = false;
  let paintedOnce = false;

  const isDark = () =>
    config.mode === "dark" || (config.mode === "auto" && !lightQuery?.matches);

  function setVar(name, value) {
    root.style.setProperty(name, value);
    applied.add(name);
  }

  function clear() {
    for (const name of applied) root.style.removeProperty(name);
    applied.clear();
    root.style.removeProperty("color-scheme");
    delete root.dataset.lumaPalette;
  }

  function paint(seed) {
    const dark = isDark();
    const roles = generatePalette(seed, {
      variant: config.variant,
      dark,
      contrast: config.contrast,
    });

    for (const name of ROLE_NAMES) {
      if (!SKIP_ROLES.has(name)) setVar(`--md-${name}`, roles[name]);
    }
    setVar("--md-scrim", `color-mix(in srgb, ${roles.scrim} 60%, transparent)`);

    for (const [key, hex] of Object.entries(spiceAliases(roles))) {
      setVar(`--spice-${key}`, hex);
      setVar(`--spice-rgb-${key}`, hexToRgbTriplet(hex));
    }

    root.style.setProperty("color-scheme", dark ? "dark" : "light");
    root.dataset.lumaPalette = `${config.variant}-${dark ? "dark" : "light"}`;

    if (!paintedOnce) {
      paintedOnce = true;
      // Enable color transitions only after the first paint, so startup does
      // not fade in from the initial value.
      requestAnimationFrame(() => requestAnimationFrame(enableTransitions));
    }
  }

  // Registering the variables as <color> lets them interpolate, so the whole
  // interface cross-fades when the track (and so the palette) changes.
  function enableTransitions() {
    if (transitionsReady) return;
    transitionsReady = true;
    const names = ROLE_NAMES.filter((name) => !SKIP_ROLES.has(name)).map(
      (name) => `--md-${name}`,
    );
    for (const name of names) {
      try {
        CSS.registerProperty({
          name,
          syntax: "<color>",
          inherits: true,
          initialValue: "#000000",
        });
      } catch {} // already registered, or unsupported
    }
    const style = document.createElement("style");
    style.id = "luma-ambient-palette-motion";
    style.textContent =
      `:root{transition:${names.map((n) => `${n} ${TRANSITION}`).join(",")}}\n` +
      "@media (prefers-reduced-motion: reduce){:root{transition:none}}";
    document.head.append(style);
  }

  async function seedFromArtwork() {
    try {
      const uri = globalThis.Spicetify?.Player?.data?.item?.uri;
      if (!uri || !globalThis.Spicetify?.colorExtractor) return null;
      return pickSeed(await globalThis.Spicetify.colorExtractor(uri));
    } catch {
      return null; // local files and podcasts may have no extractable artwork
    }
  }

  async function refresh() {
    const mine = ++token;
    if (config.source === "static") {
      clear();
      return;
    }
    let seed = config.seed;
    if (config.source === "artwork") {
      const found = await seedFromArtwork();
      if (mine !== token) return; // a newer refresh superseded this one
      if (found) {
        lastSeed = found;
        write(SEED_KEY, found);
      }
      seed = lastSeed;
    }
    paint(seed);
  }

  function set(patch) {
    const previousSource = config.source;
    config = normalizeConfig({ ...config, ...patch });
    write(CONFIG_KEY, JSON.stringify(config));
    if (previousSource !== "static" && config.source === "static") clear();
    return refresh();
  }

  function open() {
    return openModal("Luma Ambient palette", (box, close) => {
      const option = (value, label, selected) =>
        `<option value="${value}"${selected ? " selected" : ""}>${label}</option>`;
      box.innerHTML = `
<h2>Palette</h2>
<p>Choose how Luma Ambient picks its Material You colors. Changes apply immediately.</p>
<div class="luma-swatches" aria-hidden="true"></div>
<div class="luma-field"><label for="luma-pal-source">Color source</label>
  <select id="luma-pal-source">
    ${option("artwork", "Album artwork", config.source === "artwork")}
    ${option("custom", "Custom color", config.source === "custom")}
    ${option("static", "Theme scheme only (color.ini)", config.source === "static")}
  </select></div>
<div class="luma-field" data-for="custom"><label for="luma-pal-seed">Custom color</label>
  <input id="luma-pal-seed" type="color" value="${config.seed}"></div>
<div class="luma-field" data-for="generated"><label for="luma-pal-variant">Style</label>
  <select id="luma-pal-variant">
    ${Object.entries(VARIANTS)
      .map(([key, { label }]) => option(key, label, config.variant === key))
      .join("")}
  </select></div>
<div class="luma-field" data-for="generated"><label for="luma-pal-mode">Appearance</label>
  <select id="luma-pal-mode">
    ${MODES.map((m) =>
      option(m, { dark: "Dark", light: "Light", auto: "Match system" }[m], config.mode === m),
    ).join("")}
  </select></div>
<div class="luma-field" data-for="generated"><label for="luma-pal-contrast">Contrast</label>
  <input id="luma-pal-contrast" type="range" min="-1" max="1" step="0.25" value="${config.contrast}">
  <output id="luma-pal-contrast-out"></output></div>
<div class="luma-setup-actions"><button type="button" class="luma-setup-yes">Done</button></div>`;

      const $ = (id) => box.querySelector(`#luma-pal-${id}`);
      const swatches = box.querySelector(".luma-swatches");
      const contrastLabel = (v) =>
        v === 0 ? "Standard" : v < 0 ? "Reduced" : v < 1 ? "Medium" : "High";

      function sync() {
        const generated = config.source !== "static";
        box.querySelector('[data-for="custom"]').hidden = config.source !== "custom";
        for (const el of box.querySelectorAll('[data-for="generated"]')) el.hidden = !generated;
        $("contrast-out").textContent = contrastLabel(config.contrast);
        swatches.hidden = !generated;
        if (generated) {
          const seed = config.source === "custom" ? config.seed : lastSeed;
          const roles = generatePalette(seed, {
            variant: config.variant,
            dark: isDark(),
            contrast: config.contrast,
          });
          swatches.replaceChildren(
            ...["primary", "secondary", "tertiary", "primary-container", "surface-container-high"].map(
              (name) => {
                const span = document.createElement("span");
                span.style.background = roles[name];
                return span;
              },
            ),
          );
        }
      }

      let pending = 0;
      const update = (patch) => {
        clearTimeout(pending);
        pending = setTimeout(() => {
          set(patch);
          sync();
        }, 60);
      };
      $("source").addEventListener("change", (e) => update({ source: e.target.value }));
      $("seed").addEventListener("input", (e) => update({ seed: e.target.value }));
      $("variant").addEventListener("change", (e) => update({ variant: e.target.value }));
      $("mode").addEventListener("change", (e) => update({ mode: e.target.value }));
      $("contrast").addEventListener("input", (e) =>
        update({ contrast: Number(e.target.value) }),
      );
      box.querySelector(".luma-setup-yes").addEventListener("click", close);
      sync();
      $("source").focus();
    });
  }

  // Follow the playing track, and the system theme while on "Match system".
  globalThis.Spicetify?.Player?.addEventListener?.("songchange", refresh);
  lightQuery?.addEventListener?.("change", () => {
    if (config.mode === "auto") refresh();
  });

  // A menu entry (Spotify's profile menu) so the dialog needs no console.
  try {
    new globalThis.Spicetify.Menu.Item("Luma Ambient palette", false, () => open()).register();
  } catch {}

  refresh();

  return {
    get: () => ({ ...config }),
    set,
    refresh,
    open,
    reset: () => set({ ...DEFAULTS }),
    variants: () => Object.keys(VARIANTS),
  };
}

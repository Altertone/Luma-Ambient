/* Luma Ambient — Material 3 palette generation.
 *
 * Pure functions only (no DOM), so they can be unit-tested in Node. A seed
 * color goes in, the complete Material 3 role set comes out, using Google's
 * Material Color Utilities (HCT color space, Apache-2.0).
 */
import {
  Hct,
  MaterialDynamicColors,
  SchemeContent,
  SchemeExpressive,
  SchemeFidelity,
  SchemeFruitSalad,
  SchemeMonochrome,
  SchemeNeutral,
  SchemeRainbow,
  SchemeTonalSpot,
  SchemeVibrant,
  argbFromHex,
  hexFromArgb,
} from "@material/material-color-utilities";

export const VARIANTS = {
  "tonal-spot": { label: "Tonal spot", Scheme: SchemeTonalSpot },
  vibrant: { label: "Vibrant", Scheme: SchemeVibrant },
  expressive: { label: "Expressive", Scheme: SchemeExpressive },
  neutral: { label: "Neutral", Scheme: SchemeNeutral },
  monochrome: { label: "Monochrome", Scheme: SchemeMonochrome },
  fidelity: { label: "Fidelity", Scheme: SchemeFidelity },
  content: { label: "Content", Scheme: SchemeContent },
  "fruit-salad": { label: "Fruit salad", Scheme: SchemeFruitSalad },
  rainbow: { label: "Rainbow", Scheme: SchemeRainbow },
};

export const SOURCES = ["artwork", "static", "custom"];
export const MODES = ["dark", "light", "auto"];

export const DEFAULTS = Object.freeze({
  source: "artwork",
  variant: "tonal-spot",
  mode: "dark",
  contrast: 0,
  seed: "#d0bcff",
});

// Every Material 3 color role, as kebab-case names. Each maps to the
// MaterialDynamicColors member of the same name in camelCase.
export const ROLE_NAMES = [
  "background",
  "on-background",
  "surface",
  "surface-dim",
  "surface-bright",
  "surface-container-lowest",
  "surface-container-low",
  "surface-container",
  "surface-container-high",
  "surface-container-highest",
  "on-surface",
  "surface-variant",
  "on-surface-variant",
  "inverse-surface",
  "inverse-on-surface",
  "outline",
  "outline-variant",
  "shadow",
  "scrim",
  "surface-tint",
  "primary",
  "on-primary",
  "primary-container",
  "on-primary-container",
  "inverse-primary",
  "secondary",
  "on-secondary",
  "secondary-container",
  "on-secondary-container",
  "tertiary",
  "on-tertiary",
  "tertiary-container",
  "on-tertiary-container",
  "error",
  "on-error",
  "error-container",
  "on-error-container",
  "primary-fixed",
  "primary-fixed-dim",
  "on-primary-fixed",
  "on-primary-fixed-variant",
  "secondary-fixed",
  "secondary-fixed-dim",
  "on-secondary-fixed",
  "on-secondary-fixed-variant",
  "tertiary-fixed",
  "tertiary-fixed-dim",
  "on-tertiary-fixed",
  "on-tertiary-fixed-variant",
];

const camel = (name) => name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

const HEX = /^#[0-9a-f]{6}$/i;

export const isHex = (value) => typeof value === "string" && HEX.test(value);

/** Generate every Material 3 role as a `#rrggbb` string. */
export function generatePalette(seedHex, options = {}) {
  const { variant = DEFAULTS.variant, dark = true, contrast = 0 } = options;
  const seed = isHex(seedHex) ? seedHex : DEFAULTS.seed;
  const { Scheme } = VARIANTS[Object.hasOwn(VARIANTS, variant) ? variant : DEFAULTS.variant];
  const scheme = new Scheme(
    Hct.fromInt(argbFromHex(seed)),
    Boolean(dark),
    Math.max(-1, Math.min(1, Number(contrast) || 0)),
  );
  const roles = {};
  for (const name of ROLE_NAMES) {
    roles[name] = hexFromArgb(MaterialDynamicColors[camel(name)].getArgb(scheme));
  }
  return roles;
}

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

export const hexToRgbTriplet = (hex) => channels(hex).join(", ");

/** Linear blend of two hex colors; `t` is the share of `b` (0..1). */
export function mix(a, b, t) {
  const [ar, ag, ab] = channels(a);
  const [br, bg, bb] = channels(b);
  const part = (x, y) => Math.round(x + (y - x) * t);
  const hex = (n) => n.toString(16).padStart(2, "0");
  return `#${hex(part(ar, br))}${hex(part(ag, bg))}${hex(part(ab, bb))}`;
}

/**
 * Spicetify's legacy `--spice-*` keys, derived from the Material roles. Native
 * Spotify surfaces and existing user customizations read these.
 */
export function spiceAliases(r) {
  return {
    text: r["on-surface"],
    subtext: r["on-surface-variant"],
    main: r.surface,
    "main-elevated": r["surface-container"],
    highlight: r["surface-container-highest"],
    "highlight-elevated": mix(r["surface-container-highest"], r["on-surface"], 0.06),
    sidebar: r["surface-container-low"],
    player: r["surface-container"],
    card: r["surface-container-high"],
    shadow: "#000000",
    "selected-row": r["primary-container"],
    button: r.primary,
    "button-active": r["on-primary-container"],
    "button-disabled": r["outline-variant"],
    "tab-active": r["secondary-container"],
    notification: r.primary,
    "notification-error": r.error,
    equalizer: r.primary,
    misc: r.outline,
  };
}

// Preference order for the seed taken from Spotify's cover-art extractor.
const SEED_PREFERENCE = [
  "VIBRANT_NON_ALARMING",
  "VIBRANT",
  "PROMINENT",
  "LIGHT_VIBRANT",
  "DARK_VIBRANT",
  "DESATURATED",
];

/** Choose the best seed from a Spicetify.colorExtractor() result. */
export function pickSeed(colors) {
  if (!colors || typeof colors !== "object") return null;
  for (const key of SEED_PREFERENCE) {
    const value = colors[key];
    if (isHex(value)) return value.toLowerCase();
  }
  return null;
}

/** Validate stored settings; anything unrecognized falls back to defaults. */
export function normalizeConfig(raw) {
  const input = raw && typeof raw === "object" ? raw : {};
  const contrast = Number(input.contrast);
  return {
    source: SOURCES.includes(input.source) ? input.source : DEFAULTS.source,
    variant: Object.hasOwn(VARIANTS, input.variant) ? input.variant : DEFAULTS.variant,
    mode: MODES.includes(input.mode) ? input.mode : DEFAULTS.mode,
    contrast: Number.isFinite(contrast)
      ? Math.max(-1, Math.min(1, contrast))
      : DEFAULTS.contrast,
    seed: isHex(input.seed) ? input.seed.toLowerCase() : DEFAULTS.seed,
  };
}

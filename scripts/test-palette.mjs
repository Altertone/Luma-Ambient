// Unit checks for the palette module. Run with: npm test
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  DEFAULTS,
  ROLE_NAMES,
  VARIANTS,
  generatePalette,
  hexToRgbTriplet,
  isHex,
  mix,
  normalizeConfig,
  pickSeed,
  spiceAliases,
} from "../src/palette.js";

let checks = 0;
const ok = (condition, message) => {
  checks++;
  assert.ok(condition, message);
};

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// Deterministic pseudo-random seeds, plus the awkward extremes.
let state = 12345;
const rand = () => (state = (state * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const seeds = ["#000000", "#ffffff", "#808080", "#ff0000", "#00ff00", "#0000ff", "#1ed760"];
for (let i = 0; i < 60; i++) {
  seeds.push(`#${Math.floor(rand() * 0xffffff).toString(16).padStart(6, "0")}`);
}

const PAIRS = [
  ["on-primary", "primary"],
  ["on-primary-container", "primary-container"],
  ["on-secondary", "secondary"],
  ["on-secondary-container", "secondary-container"],
  ["on-tertiary", "tertiary"],
  ["on-tertiary-container", "tertiary-container"],
  ["on-error", "error"],
  ["on-error-container", "error-container"],
  ["on-surface", "surface"],
  ["on-surface", "surface-container-highest"],
  ["on-surface-variant", "surface-container"],
  ["inverse-on-surface", "inverse-surface"],
];

for (const variant of Object.keys(VARIANTS)) {
  for (const dark of [true, false]) {
    for (const seed of seeds) {
      const roles = generatePalette(seed, { variant, dark });
      for (const name of ROLE_NAMES) ok(isHex(roles[name]), `${variant}/${seed}: ${name} is a hex color`);
      for (const [fg, bg] of PAIRS) {
        const value = ratio(roles[fg], roles[bg]);
        ok(value >= 4.5, `${variant} ${dark ? "dark" : "light"} ${seed}: ${fg} on ${bg} = ${value.toFixed(2)}`);
      }
    }
  }
}

// Dark schemes have dark surfaces and light schemes the reverse.
ok(luminance(generatePalette("#6750a4", { dark: true }).surface) < 0.05, "dark surface is dark");
ok(luminance(generatePalette("#6750a4", { dark: false }).surface) > 0.5, "light surface is light");

// Higher contrast never reduces text contrast.
for (const seed of seeds.slice(0, 20)) {
  const base = generatePalette(seed, { contrast: 0 });
  const high = generatePalette(seed, { contrast: 1 });
  ok(
    ratio(high["on-primary-container"], high["primary-container"]) >=
      ratio(base["on-primary-container"], base["primary-container"]) - 0.01,
    `${seed}: contrast 1 does not weaken container text`,
  );
}

// Surface container levels step in the right direction in dark mode.
const dk = generatePalette("#1ed760", { dark: true });
const order = ["surface-container-lowest", "surface-container-low", "surface-container", "surface-container-high", "surface-container-highest"];
for (let i = 1; i < order.length; i++) {
  ok(luminance(dk[order[i]]) >= luminance(dk[order[i - 1]]), `${order[i]} is not darker than ${order[i - 1]}`);
}

// Invalid input falls back instead of throwing.
ok(isHex(generatePalette("not-a-color").primary), "bad seed falls back");
ok(isHex(generatePalette("#123456", { variant: "constructor" }).primary), "inherited variant name falls back");

// Helpers.
assert.equal(hexToRgbTriplet("#102030"), "16, 32, 48");
assert.equal(mix("#000000", "#ffffff", 0.5), "#808080");
assert.equal(mix("#102030", "#102030", 0.7), "#102030");
checks += 2;

const aliases = spiceAliases(generatePalette("#1ed760"));
for (const key of ["text", "subtext", "main", "sidebar", "player", "card", "button", "button-active", "selected-row", "tab-active", "notification", "misc"]) {
  ok(isHex(aliases[key]), `spice alias ${key}`);
}

// Seed selection.
assert.equal(pickSeed({ VIBRANT: "#AABBCC", PROMINENT: "#112233" }), "#aabbcc");
assert.equal(pickSeed({ VIBRANT_NON_ALARMING: "#010203", VIBRANT: "#aabbcc" }), "#010203");
assert.equal(pickSeed({ VIBRANT: "nope", PROMINENT: "#112233" }), "#112233");
assert.equal(pickSeed({}), null);
assert.equal(pickSeed(null), null);
checks += 5;

// Config normalization.
assert.deepEqual(normalizeConfig(null), { ...DEFAULTS });
assert.deepEqual(normalizeConfig({ source: "bad", variant: "toString", mode: 7, contrast: "x", seed: "red" }), { ...DEFAULTS });
assert.equal(normalizeConfig({ contrast: 9 }).contrast, 1);
assert.equal(normalizeConfig({ contrast: -9 }).contrast, -1);
assert.equal(normalizeConfig({ seed: "#ABCDEF" }).seed, "#abcdef");
assert.equal(normalizeConfig({ variant: "vibrant", mode: "auto", source: "custom" }).variant, "vibrant");
checks += 6;

// The committed bundle must at least parse.
try {
  execFileSync(process.execPath, ["--check", new URL("../theme.js", import.meta.url).pathname]);
  checks++;
} catch (error) {
  if (!String(error.message).includes("ENOENT")) throw error;
  console.log("theme.js not built yet; skipping syntax check");
}

console.log(`palette checks passed: ${checks}`);

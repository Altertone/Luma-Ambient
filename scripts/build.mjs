// Bundles src/theme.js (and the Material Color Utilities it imports) into the
// single theme.js that Spicetify injects. Run with: npm run build
import { readFileSync } from "node:fs";
import { build } from "esbuild";

const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

await build({
  entryPoints: [new URL("../src/theme.js", import.meta.url).pathname],
  outfile: new URL("../theme.js", import.meta.url).pathname,
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "chrome100",
  minify: true,
  legalComments: "eof", // keeps the Apache-2.0 notice of Material Color Utilities
  define: { __LUMA_AMBIENT_VERSION__: JSON.stringify(version) },
  banner: {
    js: `/* Luma Ambient ${version} — built from src/ by scripts/build.mjs. Edit the sources in src/, not this file. */`,
  },
});

console.log(`built theme.js (${version})`);

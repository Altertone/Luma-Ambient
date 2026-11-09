#!/usr/bin/env bash
# Luma Ambient installer — theme + first-run companion extension in one step.
#
# Usage:
#   ./install.sh              install (or update) and apply
#   ./install.sh --no-apply   install (or update) without running spicetify apply
#
# Safe to re-run: it simply overwrites the installed files with this copy.
set -euo pipefail

NO_APPLY=false
for arg in "$@"; do
  case "$arg" in
    --no-apply) NO_APPLY=true ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

if ! command -v spicetify >/dev/null 2>&1; then
  echo "error: spicetify CLI not found. Install Spicetify first:" >&2
  echo "  https://spicetify.app/docs/getting-started" >&2
  exit 1
fi

# Derive the config directory from Spicetify itself, so this works on every OS
# layout the CLI supports (including custom -c locations).
CONFIG_PATH="$(spicetify -c)"
CONFIG_DIR="$(dirname "$CONFIG_PATH")"
THEMES_DIR="$CONFIG_DIR/Themes"
EXTENSIONS_DIR="$CONFIG_DIR/Extensions"

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

THEME_FILES=(color.ini user.css declutter.css theme.js manifest.json preview.svg)

for file in "${THEME_FILES[@]}"; do
  if [[ ! -f "$SRC_DIR/$file" ]]; then
    echo "error: $file not found next to install.sh — run this from the theme folder." >&2
    exit 1
  fi
done

mkdir -p "$THEMES_DIR/Luma-Ambient"

for file in "${THEME_FILES[@]}"; do
  cp "$SRC_DIR/$file" "$THEMES_DIR/Luma-Ambient/$file"
done

# The theme script (first-run prompt) needs JS injection enabled.
spicetify config inject_theme_js 1

# Set the theme, but keep the user's existing color scheme if Luma Ambient
# was already the active theme (re-runs and updates shouldn't reset it).
PREVIOUS_THEME="$(spicetify config current_theme 2>/dev/null || echo "")"
spicetify config current_theme Luma-Ambient
if [[ "$PREVIOUS_THEME" != "Luma-Ambient" ]]; then
  spicetify config color_scheme ambient
fi
spicetify config extensions luma-ambient-setup.js

echo "Installed:"
echo "  $THEMES_DIR/Luma-Ambient"

if $NO_APPLY; then
  echo "Skipped spicetify apply (--no-apply). Run it manually when ready."
else
  spicetify apply
  echo "Done. The first-run prompt appears once on the next Spotify launch."
fi

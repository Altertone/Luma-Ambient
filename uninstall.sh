#!/usr/bin/env bash
# Luma Ambient uninstaller — removes the installed theme and resets Spicetify
# to its default theme.
set -euo pipefail

if ! command -v spicetify >/dev/null 2>&1; then
  echo "error: spicetify CLI not found." >&2
  exit 1
fi

CONFIG_DIR="$(dirname "$(spicetify -c)")"

spicetify config current_theme Spicetify color_scheme ""
spicetify apply

rm -rf "$CONFIG_DIR/Themes/Luma-Ambient"
echo "Removed $CONFIG_DIR/Themes/Luma-Ambient"

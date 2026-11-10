#!/usr/bin/env bash
# Luma Ambient installer — theme and theme script in one step.
#
# Usage:
#   ./install.sh              install (or update) and apply
#   ./install.sh --no-apply   install (or update) without running spicetify apply
#   curl -fsSL https://raw.githubusercontent.com/Shahisha1/Luma-Ambient/main/install.sh | bash
#
# When run from a checkout it installs that copy; when piped from curl it
# downloads the theme files first (set LUMA_AMBIENT_REF to use another branch
# or tag). Safe to re-run: it simply overwrites the installed files.
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

THEME_FILES=(color.ini user.css declutter.css theme.js manifest.json preview.svg)

# apply leaves the client dead: close whatever is left over and start a
# fresh Spotify again (close once, open once).
cleanup_spotify() {
  case "$(uname -s)" in
    Darwin) osascript -e 'tell application "Spotify" to quit' >/dev/null 2>&1 || true ;;
    Linux)
      pkill -x spotify 2>/dev/null || true
      pkill -x spotify-launcher 2>/dev/null || true ;;
    M*|C*) taskkill.exe /IM Spotify.exe /F >/dev/null 2>&1 || true ;; # MinGit CYGWIN MINGW
  esac
}

relaunch_spotify() {
  case "$(uname -s)" in
    Darwin) open -a Spotify >/dev/null 2>&1 || true ;;
    Linux)
      if command -v flatpak >/dev/null 2>&1 &&
        flatpak info com.spotify.Client >/dev/null 2>&1; then
        setsid nohup flatpak run com.spotify.Client >/dev/null 2>&1 &
      else
        for bin in spotify spotify-launcher; do
          if command -v "$bin" >/dev/null 2>&1; then
            setsid nohup "$bin" >/dev/null 2>&1 &
            break
          fi
        done
      fi ;;
    M*|C*) powershell.exe -NoProfile -Command "Start-Process 'spotify:'" >/dev/null 2>&1 || true ;;
  esac
}

restart_spotify() {
  cleanup_spotify
  sleep 2
  relaunch_spotify
  echo "Spotify closed and relaunched with the new theme."
}

# Prefer the folder this script lives in. When it is piped from curl there is
# no script file (BASH_SOURCE is empty), so download the files instead.
SRC_DIR=""
if [[ -n "${BASH_SOURCE[0]:-}" && -f "${BASH_SOURCE[0]}" ]]; then
  SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi

if [[ -z "$SRC_DIR" || ! -f "$SRC_DIR/user.css" ]]; then
  if ! command -v curl >/dev/null 2>&1; then
    echo "error: curl is required to download the theme files." >&2
    exit 1
  fi
  SRC_DIR="$(mktemp -d)"
  trap 'rm -rf "$SRC_DIR"' EXIT
  BASE_URL="https://raw.githubusercontent.com/Shahisha1/Luma-Ambient/${LUMA_AMBIENT_REF:-main}"
  echo "Downloading Luma Ambient (${LUMA_AMBIENT_REF:-main})..."
  for file in "${THEME_FILES[@]}"; do
    if ! curl -fsSL "$BASE_URL/$file" -o "$SRC_DIR/$file"; then
      echo "error: could not download $file from $BASE_URL" >&2
      exit 1
    fi
  done
fi

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

echo "Installed:"
echo "  $THEMES_DIR/Luma-Ambient"

if $NO_APPLY; then
  echo "Skipped spicetify apply (--no-apply). Run it manually when ready."
else
  # A first-time Spicetify setup has no backup yet, and apply refuses to run.
  if ! spicetify apply; then
    echo "spicetify apply failed; creating a backup and trying again..."
    spicetify backup apply
  fi
  # apply rewrites the client files and usually leaves the running Spotify
  # dead or half-alive: close it for real, then relaunch a fresh copy.
  restart_spotify
  echo "Done. The first-run prompt appears once on the next Spotify launch."
fi

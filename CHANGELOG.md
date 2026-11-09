# Changelog

## 1.2.0 — 2026-11-09

- Fixed the artwork palette integration to follow Luma Lyrics' **Desktop colors** toggle through Spotify's `--spice-*` variables, avoiding collisions with the extension's private `--luma-*` tokens.
- Applied palette colors consistently to the main surfaces, player, selected and hovered rows, and playback controls with readable accent foregrounds.
- Kept native Spotify button labels, SVG accessibility semantics, hover behavior, and click targets while adding Material Symbols glyphs.
- Narrowed sidebar rules to Now Playing panel content and added a documented CSS visibility override.
- Added reduced-motion handling for the expanded surface transitions.

## 1.1.0 — 2026-11-09

- Added an artwork-reactive Material 3 color layer that consumes Luma Lyrics desktop palette tokens, with static theme fallbacks.
- Added Material Symbols Rounded replacements for labelled playback controls.
- Simplified Spotify's Now Playing sidebar by hiding Credits, On tour, Merch, and Next in queue while retaining the player and lyrics preview.
- Expanded compatibility and manual-test documentation for the new integration.


## 1.0.0 — 2026-11-09

- Reworked the theme around consistent surface, text, border, spacing, and radius tokens.
- Kept the muted-violet palette and refined both Ambient schemes.
- Replaced broad card and universal scrollbar selectors with narrow Spotify UI selectors.
- Preserved navigation, search, playback controls, selected states, and keyboard focus.
- Added reduced-motion handling and an optional compact-spacing block.
- Added native Luma Lyrics styling scoped to its fullscreen overlay, settings, player controls, and artwork-derived accent.
- Rewrote installation, compatibility, troubleshooting, and manual test documentation.
- Corrected Marketplace metadata format and removed the unsupported MIT license claim.
## 1.2.1 — 2026-11-09

- Fixed a blank Now Playing panel: decluttering no longer hides structural containers via fragile `:has()` selectors (a Spotify markup change made them match the whole panel). Only stable concert/shop link targets are hidden now, so the panel can never go blank.
- Moved the first-run setup prompt from a separate companion extension into `theme.js`, injected by Spicetify with `inject_theme_js 1` (same mechanism as the Comfy theme). No extra extension install step.
- The setup script now hides the native lyrics button via Spotify's stable `.main-nowPlayingBar-lyricsButton` class in addition to testid/aria-label fallbacks.
- Popup and toast radii follow the theme's rounded-rectangle tokens instead of pills.
- The installer preserves the active color scheme on re-runs, enables JS injection automatically, and gained uninstallers.

## Unreleased

- Used Spotify's accessible Home shelf labels to hide selected recommendation shelves independently while preserving shortcut playlists, followed shows, and Recents. Documented per-shelf CSS overrides.
- Added text-based decluttering to `theme.js` for the Now Playing sections (Credits, On tour, Merch, Next in queue) and Home shelves (More like, Fans also like, Based on your recent listening), with `--luma-declutter-*` CSS opt-outs.
- Refined Home spacing and rounded card surfaces for a calmer, more consistent layout.

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
## Unreleased

- Used Spotify's accessible Home shelf labels to hide selected recommendation shelves independently while preserving shortcut playlists, followed shows, and Recents. Documented per-shelf CSS overrides.
- Refined Home spacing and rounded card surfaces for a calmer, more consistent layout.

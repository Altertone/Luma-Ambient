# Changelog

## 1.4.1 — 2026-11-10

- Fixed the theme script and stylesheet for Spotify client 1.3.8: the Now Playing view now renders inside the `Root__right-sidebar-peek` family instead of `.Root__right-sidebar`, so the script's panel lookup (and several stylesheet rules) found nothing and decluttering silently did nothing.
- The Now Playing sections are now recognized by their `section`/`article` element or a `-npv-section` testid, up to ten wrapper levels deep, with obfuscated client class names. New safety rails: a tagged block must not contain the lyrics preview (`lyrics-npv-section`), cover art, or player controls, and must not stack several headed sections.
- Recommendation shelves are matched by case-insensitive prefix so labels that embed a name ("More like  The Weeknd", "Made For  Sasha") still hide; "Made for you" becomes the `Made For`/`Made for` prefixes. Five more personalized shelves are hidden by default with their own restore variables: Recommended Stations, Popular with listeners, Albums featuring songs you like, Best of artists (the "This Is …" carousels), and the Made For shelves.
- Concert and shop link hiding, the right-sidebar surface color, and the sidebar scoping rule now also cover the peek-sidebar markup.
- Verified live against the running client through its DevTools protocol.

## 1.4.0 — 2026-11-10

- Added a generated Material You palette. `theme.js` now builds the complete Material 3 role set from the playing track's artwork (or a custom color) with Google's Material Color Utilities and applies it to the `--md-*` variables and the legacy `--spice-*` keys, including primary/secondary/tertiary/error containers, five surface container levels, outline, inverse and fixed roles. Text and background pairs meet 4.5:1 contrast in every style.
- Added nine palette styles (tonal spot, vibrant, expressive, neutral, monochrome, fidelity, content, fruit salad, rainbow), dark, light and match-system appearance, and a contrast control. Settings are in Spotify's profile menu (**Luma Ambient palette**) and `LumaAmbient.palette`.
- Colors now cross-fade when the track changes; disabled when reduced motion is requested.
- `color.ini` and the `--md-*` values in `user.css` remain the static fallback ("Theme scheme only"), and Luma Lyrics' Desktop colors keep working.
- Moved the theme script into `src/` with a small build (`npm run build`, `npm test`). The built `theme.js` stays committed, so installing still needs no build.
- Unified the decluttering variables. `theme.js` now tags sections and `user.css` decides visibility, so each section can be restored with its own variable or its group variable (`--luma-declutter-npv`, `--luma-declutter-shelves`). Previously restoring a shelf also required the group variable. Added `--ambient-home-fans-also-like`.
- Fixed the one-line `curl | bash` install, which exited with an error. The installers now download the theme files when piped, and create a Spicetify backup when the first apply fails.
- Fixed the compact-spacing block in `declutter.css`, which styled an element the theme hides.
- Playbar icons now match buttons by `data-testid` as well as label, and handle shuffle and repeat states, repeat-one, mute, and a filled liked heart.
- Scoped the global dialog and alert styling so extension overlays and Luma Ambient's own dialog are not restyled.
- The theme script no longer rescans on every progress-bar update or lyrics re-render, and processes each decluttered section once.
- `theme.js` reports the real version.

## 1.3.0 — 2026-11-10

- Rebuilt the theme as a full Material You (Material 3) design system: `color.ini` now defines the complete role set (surface-container levels, primary/secondary/tertiary containers, outlines, inverse roles, scrim) per scheme, mapped onto `--md-*` tokens.
- Reworked every surface with Material You principles: flat tonal elevation instead of gradients, M3 state layers for hover/pressed/selected, the M3 shape scale (4/8/12/16/28), tonal scrollbars, and M3-styled menus, dialogs, toggles, inputs, and navigation.
- The legacy `--spice-*` aliases are preserved and read first, so Luma Lyrics' Desktop colors artwork palette still drives the main surfaces.
- Removed the Now Playing sections entirely (Credits, On tour, Merch, Next in queue): the theme script now also collapses the empty wrappers they leave behind, so no gaps remain.
- Removed the Home recommendation shelves (More like, Fans also like, Based on your recent listening) entirely.
- First-run setup prompt and toasts retokened to the Material You palette.

## 1.2.1 — 2026-11-09

- Fixed a blank Now Playing panel: decluttering no longer hides structural containers via fragile `:has()` selectors (a Spotify markup change made them match the whole panel). Only stable concert/shop link targets are hidden now, so the panel can never go blank.
- Moved the first-run setup prompt from a separate companion extension into `theme.js`, injected by Spicetify with `inject_theme_js 1` (same mechanism as the Comfy theme). No extra extension install step.
- The setup script now hides the native lyrics button via Spotify's stable `.main-nowPlayingBar-lyricsButton` class in addition to testid/aria-label fallbacks.
- Popup and toast radii follow the theme's rounded-rectangle tokens instead of pills.
- The installer preserves the active color scheme on re-runs, enables JS injection automatically, and gained uninstallers.

## 1.2.0 — 2026-11-09

- Fixed the artwork palette integration to follow Luma Lyrics' **Desktop colors** toggle through Spotify's `--spice-*` variables, avoiding collisions with the extension's private `--luma-*` tokens.
- Applied palette colors consistently to the main surfaces, player, selected and hovered rows, and playback controls with readable accent foregrounds.
- Kept native Spotify button labels, SVG accessibility semantics, hover behavior, and click targets while adding Material Symbols glyphs.
- Narrowed sidebar rules to Now Playing panel content and added a documented CSS visibility override.
- Added reduced-motion handling for the expanded surface transitions.
- Used Spotify's accessible Home shelf labels to hide selected recommendation shelves independently while preserving shortcut playlists, followed shows, and Recents.

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

# Luma Ambient

A focused Spotify desktop interface for Spicetify, built around Material 3 surfaces, Material Symbols transport icons, and an artwork-reactive color system when paired with Luma Lyrics.

Luma Ambient is a standalone Spicetify theme with built-in, automatically applied CSS styling for the separate Luma Lyrics extension.

## Features

- Two coordinated fallback schemes: **Ambient** and **Ambient Soft**.
- Artwork-reactive Material 3 colors from Luma Lyrics when its **Desktop colors** setting is enabled; both Ambient schemes remain the standalone fallback.
- Material Symbols Rounded icons for labelled playback controls.
- A minimal Now Playing sidebar that preserves the player and lyrics preview and hides supported Credits, On tour, Merch, and queue sections.
- Home keeps your shortcut grid, followed shows, and Recents while hiding supported recommendation shelves by default; each shelf has an independent CSS visibility control.
- Home shortcuts and content cards use a consistent rounded surface style with quiet spacing and hover feedback.
- Consistent surface, text, border, spacing, and radius tokens.
- Calmer navigation, cards, track rows, search, and now-playing bar.
- Essential navigation, search, playback, focus indicators, and selected states remain visible.
- Reduced-motion support and no unnecessary animated effects.
- Optional compact-spacing rules in `declutter.css`.
- Native Luma Lyrics styling scoped to its fullscreen overlay, player controls, settings, and artwork-derived Material 3 palette.

## Preview

![Luma Ambient interface preview](preview.svg)

This is an illustrative theme preview, not a screenshot of Spotify. Real Spotify screenshots will be added after a manual desktop test.

## Install as a standalone theme

1. Install and configure [Spicetify](https://spicetify.app/docs/getting-started).
2. Download this repository and copy the `Luma-Ambient` folder into your Spicetify Themes directory:

   - Linux: `~/.config/spicetify/Themes/`
   - macOS: `~/.config/spicetify/Themes/`
   - Windows: `%appdata%\\spicetify\\Themes\\`

3. Apply the theme:

   ```bash
   spicetify config current_theme Luma-Ambient color_scheme ambient
   spicetify apply
   ```

4. To switch schemes:

   ```bash
   spicetify config current_theme Luma-Ambient color_scheme ambient-soft
   spicetify apply
   ```

The scheme names correspond to the sections in `color.ini`.

## First-run setup

Luma Ambient ships a tiny companion script, `luma-ambient-setup.js`. On the first launch it shows a minimal prompt asking whether the [Luma Lyrics](https://github.com/Shahisha1/Luma-Lyrics) extension is installed, and adapts the interface to your answer — for example, hiding Spotify's native lyrics button while Luma Lyrics is active so the playbar keeps a single lyrics toggle instead of two.

The theme itself stays CSS-only; the script is optional and only adjusts a few narrow, reversible UI details. Luma Lyrics and Luma Plus are detected automatically afterwards, so the setup stays correct if you install or remove them later without prompting again.

Install the companion script:

1. Copy `luma-ambient-setup.js` into your Spicetify Extensions directory:

   - Linux/macOS: `~/.config/spicetify/Extensions/`
   - Windows: `%appdata%\spicetify\Extensions\`

2. Enable it and apply:

   ```bash
   spicetify config extensions luma-ambient-setup.js
   spicetify apply
   ```

To change your answer later, open Spotify's console and run `LumaAmbientSetup.ask()`, or `LumaAmbientSetup.reset()` to forget the saved answer. Dismissing the prompt (Escape or clicking outside) leaves everything untouched and asks again on the next launch.

## Minimal Now Playing sidebar

The theme preserves the current track/player area and Spotify's lyrics preview. It hides supported Credits, On tour, Merch, and queue sections in the current Now Playing panel markup. These sections do not all have stable semantic identifiers, so the CSS uses a mix of link destinations and panel structure; Spotify can change that structure. Verify the panel after client updates.

The theme is CSS-only and has no settings interface. To show the sections again, add this rule to the end of `user.css` and run `spicetify apply`:

```css
:root { --ambient-sidebar-hidden: block; }
```

## Home recommendation visibility

Home selectors use Spotify's accessible shelf labels. The current theme hides **Your top mixes**, **Made for you**, **More like …**, and **Based on your recent listening** shelves by default. It leaves your shortcut grid, **Your shows**, and **Recents** visible.

To restore a shelf, add the matching setting at the end of `user.css` and run `spicetify apply`:

```css
:root {
  --ambient-home-top-mixes: block;
  --ambient-home-made-for-you: block;
  --ambient-home-more-like: block;
  --ambient-home-recent-recommendations: block;
}
```

Set only the variables for shelves you want to show. Remove the override to hide them again. Spotify may change its accessible shelf labels between client versions.

## Optional decluttering

For tighter spacing, append the contents of `declutter.css` to the end of your theme's `user.css`, then run `spicetify apply`.

To undo it, remove the block between the `LUMA DECLUTTER START` and `LUMA DECLUTTER END` comments from `user.css` and apply again. No essential controls or navigation items are hidden.

## Luma Lyrics compatibility

Luma Ambient includes a dedicated styling layer for your [Luma Lyrics](https://github.com/Shahisha1/Luma-Lyrics) Spicetify extension. When Luma Ambient is active, the extension's fullscreen lyrics view and settings panel automatically pick up the theme's restrained surfaces and typography.

### What the integration changes

- Styles the Luma Lyrics toolbar, player controls, settings panel, form controls, and lyric typography.
- Luma Lyrics derives a tonal palette from the current artwork and publishes it through Spotify's `--spice-*` color variables when Desktop colors is enabled. Luma Ambient uses those variables for the app surfaces, player, selection and hover states, and accent. Its selected `color.ini` scheme remains the fallback when Desktop colors is off.
- To enable the shared desktop palette, open Luma Lyrics settings and turn on **Desktop colors**. The theme follows the extension's setting rather than reading its private palette variables directly.
- Keeps the extension's own artwork backdrop, lyric timing, word-by-word highlighting, scroll behavior, translations, romanization, and player logic intact.
- Requires the Luma Lyrics **Desktop colors** setting for artwork colors to appear in Spotify; lyrics overlay styling works independently.
- Is scoped to `#luma-root`; it does not globally restyle other extensions or change their lyric interfaces.

### Install / update

1. Update Luma Ambient in your Spicetify Themes folder so its `user.css` contains the Luma Lyrics integration block.
2. Keep **Luma Ambient** selected as your active Spicetify theme.
3. Make sure `luma-lyrics.js` is installed and enabled as a Spicetify extension.
4. Apply and reload Spotify:

   ```bash
   spicetify apply
   ```

5. Open Luma Lyrics from its playbar button. The theme integration is automatic; no CSS needs to be pasted into the extension or its repository.

If you previously copied an older version of Luma Ambient into your theme folder, replace its `user.css` with the current repository version before applying.

### Compatibility boundary

This is a CSS integration with the current Luma Lyrics v2 DOM structure, not a fork or modification of the extension. If Luma Lyrics changes its `#luma-root` markup or class names in a future update, some styling may need to be refreshed. The theme does not modify the extension's JavaScript, settings storage, LRCLIB requests, or playback controls.

## Manual test matrix

The following checks are required before calling a release fully verified. They have **not** been run in a live Spotify client in this repository-editing environment.

| Area | Standalone: both schemes | Luma Ambient + Luma Lyrics |
|---|---|---|
| Home | Check spacing, cards, headings, scroll | Check Spotify shell and return from lyrics |
| Search | Check search field, results, filters | Check search and navigation remain unaffected |
| Playlists | Check headers, rows, selected/hover states | Check playlist content and controls remain unaffected |
| Library | Check navigation, filters, saved items | Check sidebar and library interactions remain unaffected |
| Playback | Check play/pause, seek, volume, queue, device controls | Check extension transport and Spotify player controls |
| Lyrics | Not a built-in Luma feature | Check overlay, word/line/gentle/static modes, translation, romanization, artwork-reactive Material 3 desktop colors, and settings |
| Now Playing sidebar | Check player and lyrics preview remain; Credits, On tour, Merch, and queue are hidden | Check the same minimal sidebar and confirm artwork palette updates |
| Accessibility | Keyboard focus, contrast, reduced motion | Check overlay focus, contrast, reduced motion, and keyboard operation |

Also verify Spotify's current client version and Spicetify version after every major Spotify UI update. Spotify's generated class names can change.

## Troubleshooting

- **Theme does not appear:** confirm the folder is named exactly `Luma-Ambient` and contains both `color.ini` and `user.css`.
- **Scheme does not change:** use the exact scheme name (`ambient` or `ambient-soft`) and run `spicetify apply`.
- **Changes do not appear:** fully reload Spotify after applying. Check the Spicetify CLI output for errors.
- **A Spotify update breaks a selector:** inspect the affected element in Spotify's developer tools and update only the corresponding narrow selector.

## Project files

- `color.ini` — Spicetify color schemes.
- `user.css` — standalone theme styling and design tokens.
- `declutter.css` — optional compact-spacing add-on.
- `luma-ambient-setup.js` — optional first-run companion extension (see "First-run setup").
- `manifest.json` — Spicetify Marketplace-style theme metadata.
- `preview.svg` — illustrative preview.

## Version

Current development version: **1.2.0**.

See [CHANGELOG.md](CHANGELOG.md) for changes.

## License and attribution

No license file was present in the original repository, so this update does not assign a new license or claim MIT licensing. Until the repository owner adds an explicit license, the source remains under the default copyright terms. Luma Lyrics remains a separate extension; this theme only supplies scoped CSS styling and does not bundle or redistribute its code.

Spotify is a trademark of Spotify AB. Spicetify is an independent community project.

# Luma Ambient

A quieter Spotify desktop interface for Spicetify. Luma Ambient keeps the existing muted-violet identity while giving the player, navigation, library, and content surfaces a more consistent hierarchy.

> **Integration model:** Luma Ambient is a standalone Spicetify theme. It also ships a separate, additive CSS layer for people who want to keep **Liquify** active. Spotify/Spicetify applies one theme at a time; the Liquify add-on is not a second theme and does not replace Liquify's files.

## Features

- Two coordinated schemes: **Ambient** and **Ambient Soft**.
- Consistent surface, text, border, spacing, and radius tokens.
- Calmer navigation, cards, track rows, search, and now-playing bar.
- Essential navigation, search, playback, focus indicators, and selected states remain visible.
- Reduced-motion support and no unnecessary animated effects.
- Optional compact-spacing rules in `declutter.css`.
- Liquify add-on scoped away from Liquify's own classes and all lyric interfaces.

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

## Optional decluttering

The core theme already reduces visual noise without hiding controls. For a slightly tighter Home layout, append the contents of `declutter.css` to the end of your theme's `user.css`, then run `spicetify apply`.

To undo it, remove the block between the `LUMA DECLUTTER START` and `LUMA DECLUTTER END` comments from `user.css` and apply again. No essential controls or navigation items are hidden.

## Luma Lyrics compatibility

Luma Ambient includes a dedicated styling layer for your [Luma Lyrics](https://github.com/Shahisha1/Luma-Lyrics) Spicetify extension. When Luma Ambient is active, the extension's fullscreen lyrics view and settings panel automatically pick up the theme's restrained surfaces and typography.

### What the integration changes

- Styles the Luma Lyrics toolbar, player controls, settings panel, form controls, and lyric typography.
- Uses Luma Lyrics' artwork-derived `--accent` and `--accent-rgb` variables for the active word, playback button, focus ring, and small accents. The highlight can therefore adapt to the current album artwork.
- Keeps the extension's own artwork backdrop, lyric timing, word-by-word highlighting, scroll behavior, translations, romanization, and player logic intact.
- Does not require enabling Luma Lyrics' optional **Desktop colors** setting. That setting remains optional and is controlled by Luma Lyrics itself.
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

| Area | Standalone: both schemes | Liquify + add-on |
|---|---|---|
| Home | Check spacing, cards, headings, scroll | Check shell styling and card layout |
| Search | Check search field, results, filters | Check search and navigation |
| Playlists | Check headers, rows, selected/hover states | Check playlist content and controls |
| Library | Check navigation, filters, saved items | Check sidebar and library interactions |
| Playback | Check play/pause, seek, volume, queue, device controls | Confirm all controls remain usable |
| Lyrics | Not a built-in Luma feature | Check Liquid Lyrics, themed lyrics, translation, romanization, fullscreen/cinema, sidebar card, sync editor |
| Accessibility | Keyboard focus, contrast, reduced motion | Repeat focus and motion checks |

Also verify Spotify's current client version and Spicetify version after every major Spotify UI update. Spotify's generated class names can change.

## Troubleshooting

- **Theme does not appear:** confirm the folder is named exactly `Luma-Ambient` and contains both `color.ini` and `user.css`.
- **Scheme does not change:** use the exact scheme name (`ambient` or `ambient-soft`) and run `spicetify apply`.
- **Changes do not appear:** fully reload Spotify after applying. Check the Spicetify CLI output for errors.
- **Liquify add-on disappears:** a Liquify update may replace its hosted/local CSS. Re-append the backed-up add-on block.
- **A Spotify update breaks a selector:** inspect the affected element in Spotify's developer tools and update only the corresponding narrow selector.

## Project files

- `color.ini` — Spicetify color schemes.
- `user.css` — standalone theme styling and design tokens.
- `declutter.css` — optional compact-spacing add-on.
- `liquify-addon.css` — additive styling for use with Liquify.
- `manifest.json` — Spicetify Marketplace-style theme metadata.
- `preview.svg` — illustrative preview.

## Version

Current development version: **1.0.0**.

See [CHANGELOG.md](CHANGELOG.md) for changes.

## License and attribution

No license file was present in the original repository, so this update does not assign a new license or claim MIT licensing. Until the repository owner adds an explicit license, the source remains under the default copyright terms. Liquify remains the property of its original author and is not bundled or redistributed here.

Spotify is a trademark of Spotify AB. Spicetify is an independent community project.

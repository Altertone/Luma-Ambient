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

## Liquify compatibility

### What is compatible

The intended project is [NMWplays/Liquify](https://github.com/NMWplays/Liquify). Its current README lists **Beautiful Lyrics**, **Spicy Lyrics**, and **Lucid Lyrics** as supported by default. However, the current main-branch V2 runtime's onboarding identifies **Liquid Lyrics** as the official and only officially supported lyrics extension, and its stylesheet includes dedicated lyric rules such as `.lyrics-lyrics-background` and `.lyrics-lyrics-contentContainer` plus a Themed Lyrics setting. Because the README and V2 runtime describe support differently, this add-on makes no compatibility claim for the other lyrics extensions: preserve Liquify's own lyric CSS and verify each extension in Spotify.

Luma Ambient's `liquify-addon.css` is deliberately additive. It styles only a small set of Spotify shell surfaces and does not target:

- `.lyrics-lyrics-background` or `.lyrics-lyrics-contentContainer`
- Liquify's `.liquify-*` runtime elements or settings UI
- Liquid Lyrics' extension-owned views, controls, fullscreen/cinema modes, romanization, translation, or sync editor

This is a non-interference design, not a claim that Luma Ambient adds lyric functionality or has been runtime-tested with every extension version.

### Use Luma Ambient styling while Liquify is active

1. Keep **Liquify** selected as your active Spicetify theme. Do not set `current_theme` to Luma Ambient.
2. Find the active Liquify theme's local `user.css` in your Spicetify Themes directory. If Liquify was installed through a manager, locate the actual local theme folder used by Spicetify.
3. Back up that file.
4. Append the contents of [`liquify-addon.css`](liquify-addon.css) to the end of Liquify's `user.css`. Do not replace Liquify's stylesheet or its `theme.js`.
5. Run:

   ```bash
   spicetify apply
   ```

6. Keep Liquify's own Liquid Lyrics integration and Themed Lyrics setting enabled/configured as desired. Luma Ambient does not modify them.

To remove the add-on, remove the appended block marked `LUMA AMBIENT LIQUIFY ADD-ON` from Liquify's `user.css`, then apply again.

**Important:** Liquify's published manifest currently points its stylesheet and JavaScript to hosted URLs. Depending on how you installed it, a local edit may be overwritten by a theme update or reinstall. Keep a backup and re-append the add-on after updating Liquify. The compatibility stylesheet is not a second active Spicetify theme.

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

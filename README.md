# Luma Ambient

A calm, decluttered Spicetify **theme** designed to pair with [Luma Lyrics](https://github.com/Shahisha1/Luma-Lyrics). It reduces visual noise in Spotify’s native UI (now-playing bar, surfaces, spacing) while keeping playback essentials clear.

## Install (Spicetify)

1. Copy this folder to your Spicetify `Themes` directory (e.g. `~/.config/spicetify/Themes/Luma-Ambient`).
2. Apply:
   ```bash
   spicetify config current_theme Luma-Ambient color_scheme ambient
   spicetify apply
   ```
3. Use alongside the **Luma Lyrics** extension — they’re independent and compatible.

## Notes
- `ambient` is the default scheme; try `ambient-soft` for a dimmer look.
- Spotify/Spicetify updates can change class names; if something looks off, update `user.css` selectors for your version.
- Luma Lyrics’ overlay (`#luma-root`) is intentionally left alone.

## License
MIT (theme files in this repo). Spotify is a trademark of Spotify AB.

# Luma Ambient installer — theme + first-run companion extension in one step.
#
# Usage:
#   .\install.ps1              install (or update) and apply
#   .\install.ps1 -NoApply     install (or update) without running spicetify apply
#
# Safe to re-run: it simply overwrites the installed files with this copy.
#Requires -Version 5
$ErrorActionPreference = "Stop"

$NoApply = $args -contains "--no-apply" -or $args -contains "-NoApply"

if (-not (Get-Command spicetify -ErrorAction SilentlyContinue)) {
  Write-Error "spicetify CLI not found. Install Spicetify first: https://spicetify.app/docs/getting-started"
  exit 1
}

# Derive the config directory from Spicetify itself, so custom -c locations work.
$configPath = (& spicetify -c).Trim()
$configDir = Split-Path $configPath -Parent
$themesDir = Join-Path $configDir "Themes"
$extensionsDir = Join-Path $configDir "Extensions"

$srcDir = $PSScriptRoot
$themeFiles = @("color.ini", "user.css", "declutter.css", "manifest.json", "preview.svg")

foreach ($file in $themeFiles) {
  if (-not (Test-Path (Join-Path $srcDir $file))) {
    Write-Error "$file not found next to install.ps1 - run this from the theme folder."
    exit 1
  }
}
if (-not (Test-Path (Join-Path $srcDir "luma-ambient-setup.js"))) {
  Write-Error "luma-ambient-setup.js not found next to install.ps1."
  exit 1
}

New-Item -ItemType Directory -Force -Path (Join-Path $themesDir "Luma-Ambient"), $extensionsDir | Out-Null

foreach ($file in $themeFiles) {
  Copy-Item (Join-Path $srcDir $file) (Join-Path $themesDir "Luma-Ambient" $file) -Force
}
Copy-Item (Join-Path $srcDir "luma-ambient-setup.js") (Join-Path $extensionsDir "luma-ambient-setup.js") -Force

spicetify config current_theme Luma-Ambient color_scheme ambient
spicetify config extensions luma-ambient-setup.js

Write-Host "Installed:"
Write-Host "  $(Join-Path $themesDir 'Luma-Ambient')"
Write-Host "  $(Join-Path $extensionsDir 'luma-ambient-setup.js')"

if ($NoApply) {
  Write-Host "Skipped spicetify apply (-NoApply). Run it manually when ready."
} else {
  spicetify apply
  Write-Host "Done. The first-run prompt appears once on the next Spotify launch."
}

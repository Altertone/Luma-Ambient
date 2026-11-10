# Luma Ambient installer — theme and theme script in one step.
#
# Usage:
#   .\install.ps1              install (or update) and apply
#   .\install.ps1 -NoApply     install (or update) without running spicetify apply
#   iwr -useb https://raw.githubusercontent.com/Shahisha1/Luma-Ambient/main/install.ps1 | iex
#
# When run from a checkout it installs that copy; when piped from the web it
# downloads the theme files first (set $env:LUMA_AMBIENT_REF to use another
# branch or tag). Safe to re-run: it simply overwrites the installed files.
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

$themeFiles = @("color.ini", "user.css", "declutter.css", "theme.js", "manifest.json", "preview.svg")

# $PSScriptRoot is empty when the script is piped into iex, so download the
# files in that case.
$srcDir = $PSScriptRoot
if (-not $srcDir -or -not (Test-Path (Join-Path $srcDir "user.css"))) {
  $ref = if ($env:LUMA_AMBIENT_REF) { $env:LUMA_AMBIENT_REF } else { "main" }
  $baseUrl = "https://raw.githubusercontent.com/Shahisha1/Luma-Ambient/$ref"
  $srcDir = Join-Path ([System.IO.Path]::GetTempPath()) ("luma-ambient-" + [System.Guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Force -Path $srcDir | Out-Null
  Write-Host "Downloading Luma Ambient ($ref)..."
  foreach ($file in $themeFiles) {
    try {
      Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/$file" -OutFile (Join-Path $srcDir $file)
    } catch {
      Write-Error "could not download $file from $baseUrl"
      exit 1
    }
  }
}

foreach ($file in $themeFiles) {
  if (-not (Test-Path (Join-Path $srcDir $file))) {
    Write-Error "$file not found next to install.ps1 - run this from the theme folder."
    exit 1
  }
}

New-Item -ItemType Directory -Force -Path (Join-Path $themesDir "Luma-Ambient") | Out-Null

foreach ($file in $themeFiles) {
  Copy-Item (Join-Path $srcDir $file) (Join-Path $themesDir "Luma-Ambient" $file) -Force
}

# The theme script (first-run prompt) needs JS injection enabled.
spicetify config inject_theme_js 1 | Out-Null

# Set the theme, but keep the user's existing color scheme if Luma Ambient
# was already the active theme (re-runs and updates shouldn't reset it).
$previousTheme = (& spicetify config current_theme 2>$null)
if ($LASTEXITCODE -ne 0) { $previousTheme = "" }
spicetify config current_theme Luma-Ambient | Out-Null
if ("$previousTheme".Trim() -ne "Luma-Ambient") {
  spicetify config color_scheme ambient | Out-Null
}

Write-Host "Installed:"
Write-Host "  $(Join-Path $themesDir 'Luma-Ambient')"

if ($NoApply) {
  Write-Host "Skipped spicetify apply (-NoApply). Run it manually when ready."
} else {
  # A first-time Spicetify setup has no backup yet, and apply refuses to run.
  spicetify apply
  if ($LASTEXITCODE -ne 0) {
    Write-Host "spicetify apply failed; creating a backup and trying again..."
    spicetify backup apply
  }
  Write-Host "Done. The first-run prompt appears once on the next Spotify launch."
}

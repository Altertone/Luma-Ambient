# Luma Ambient uninstaller — removes the installed theme and resets Spicetify
# to its default theme.
#Requires -Version 5
$ErrorActionPreference = "Stop"

if (-not (Get-Command spicetify -ErrorAction SilentlyContinue)) {
  Write-Error "spicetify CLI not found."
  exit 1
}

$configDir = Split-Path (& spicetify -c).Trim() -Parent

spicetify config current_theme Spicetify
spicetify apply

Remove-Item -Recurse -Force (Join-Path $configDir "Themes\Luma-Ambient")
Write-Host "Removed $(Join-Path $configDir 'Themes\Luma-Ambient')"

# build-extension.ps1
# Rebuilds the Chrome Web Store upload zip from the current source files,
# and (by default) bumps the patch version in manifest.json first.
#
# Usage:
#   .\build-extension.ps1            # bump patch version (1.0.0 -> 1.0.1) and build
#   .\build-extension.ps1 -NoBump    # build without changing the version

param([switch]$NoBump)

$ErrorActionPreference = 'Stop'
$repo   = $PSScriptRoot
$outDir = 'C:\Users\Travis\Desktop\Hunt Clock\submission'
$stage  = Join-Path $outDir 'hunt-clock-extension'
$zip    = Join-Path $outDir 'hunt-clock-extension.zip'

# --- 1. Optionally bump the patch version in manifest.json ---
$manifestPath = Join-Path $repo 'manifest.json'
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
if (-not $NoBump) {
    $parts = $manifest.version.Split('.')
    $parts[-1] = [int]$parts[-1] + 1
    $manifest.version = ($parts -join '.')
    ($manifest | ConvertTo-Json -Depth 10) | Set-Content $manifestPath -Encoding utf8
}
Write-Host "Building version $($manifest.version)" -ForegroundColor Cyan

# --- 2. Stage only the files that belong in the extension ---
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Force -Path $stage, "$stage\icons", "$stage\images" | Out-Null
'manifest.json','index.html','app.js','styles.css','seasons-data.js','background-images.js','texas-counties-data.js' |
    ForEach-Object { Copy-Item (Join-Path $repo $_) (Join-Path $stage $_) }
Copy-Item "$repo\icons\*"  "$stage\icons\"
Copy-Item "$repo\images\*" "$stage\images\"

# --- 3. Zip it ---
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path "$stage\*" -DestinationPath $zip

$kb = [math]::Round((Get-Item $zip).Length / 1KB)
Write-Host "Done -> $zip  ($kb KB)" -ForegroundColor Green
Write-Host "Upload this zip in the Chrome Developer Dashboard (Package -> Upload new package)." -ForegroundColor Yellow

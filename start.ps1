# Campus Hub — one-click starter (PowerShell)
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Ensure-Deps($path, $installCmd) {
  if (-not (Test-Path "$path\node_modules")) {
    Write-Host "Installing dependencies in $path..."
    Invoke-Expression $installCmd
  }
}

Ensure-Deps $Root "npm install"
Ensure-Deps "$Root\backend" "npm install --prefix backend"
Ensure-Deps "$Root\frontend" "npm install --prefix frontend --legacy-peer-deps"
Ensure-Deps "$Root\mobile-expo" "npm install --prefix mobile-expo"

Write-Host ""
Write-Host "Starting Campus Hub (API + Web + Mobile)..." -ForegroundColor Cyan
Write-Host ""
npm start

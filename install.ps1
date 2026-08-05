# Ebiki setup script.
# Installs the prerequisites (Node.js), builds the npm environment (npm install),
# and creates a Desktop + Start Menu shortcut that launches the app.
# Run it by double-clicking install.bat (which calls this with the right policy).

$ErrorActionPreference = 'Stop'
$app = $PSScriptRoot

function Section($t) { Write-Host ''; Write-Host "== $t ==" -ForegroundColor Cyan }
function Ok($t)      { Write-Host "  $t" -ForegroundColor Green }
function Warn($t)    { Write-Host "  $t" -ForegroundColor Yellow }
function Die($t)     { Write-Host "  $t" -ForegroundColor Red; Read-Host 'Press Enter to exit'; exit 1 }

Write-Host 'Ebiki installer' -ForegroundColor Magenta
Write-Host "App folder: $app"

# 1) Node.js -----------------------------------------------------------------
Section 'Checking Node.js'
function Have-Node { [bool](Get-Command node -ErrorAction SilentlyContinue) }
if (-not (Have-Node)) {
  Warn 'Node.js is not installed.'
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    Warn 'Installing Node.js LTS with winget (this may take a minute)...'
    winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    # winget updates the machine PATH, but not this already-open window; refresh it.
    $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
    if (-not (Have-Node)) { Die 'Node was installed but is not on PATH in this window. Close this window and run install.bat again.' }
  } else {
    Die 'winget is not available on this Windows version. Install Node.js LTS from https://nodejs.org then re-run install.bat.'
  }
}
Ok "Node $(node -v), npm $(npm -v)"

# 1b) Git (needed for the app's built-in update check) -----------------------
Section 'Checking Git'
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    Warn 'Installing Git with winget...'
    winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements
    $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
  } else {
    Warn 'Git not found and winget is unavailable. The app will still run, but the built-in update check needs Git (https://git-scm.com).'
  }
}
if (Get-Command git -ErrorAction SilentlyContinue) { Ok "Git $((git --version) -replace 'git version ','')" }

# 2) Dependencies (the npm environment) --------------------------------------
Section 'Installing dependencies (npm install)'
Warn 'This can take a few minutes the first time...'
Push-Location $app
& cmd /c 'npm install'
$code = $LASTEXITCODE
Pop-Location
if ($code -ne 0) { Die 'npm install failed. Check your internet connection and try again.' }
Ok 'Dependencies installed.'

# 3) Shortcuts (Desktop + Start Menu) with the Ebi icon ----------------------
Section 'Creating shortcuts'
$icon = Join-Path $app 'ebiki.ico'   # baked into the repo
$ws     = New-Object -ComObject WScript.Shell
$target = Join-Path $app 'launch-ebiki.vbs'
function New-EbikiShortcut($linkPath) {
  $sc = $ws.CreateShortcut($linkPath)
  $sc.TargetPath       = $target
  $sc.WorkingDirectory = $app
  $sc.Description       = 'Launch Ebiki'
  if ($icon -and (Test-Path $icon)) { $sc.IconLocation = $icon }
  $sc.Save()
}
New-EbikiShortcut (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Ebiki.lnk')
New-EbikiShortcut (Join-Path ([Environment]::GetFolderPath('Programs')) 'Ebiki.lnk')
Ok 'Desktop and Start Menu shortcuts created.'

Write-Host ''
Write-Host 'All set. Double-click "Ebiki" on your Desktop to start the app.' -ForegroundColor Magenta
Write-Host 'It opens at http://localhost:3000 and only ever runs one copy at a time.'
Read-Host 'Press Enter to exit'

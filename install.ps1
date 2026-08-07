# Ebiki setup script.
# Installs the prerequisites (Node.js + Git), builds the npm environment
# (npm install), and creates a Desktop + Start Menu shortcut that launches the app.
# Run it by double-clicking install.bat (which calls this with the right policy).
#
# Designed to work whether the user has NOTHING installed or already has some of
# the prerequisites. It never assumes a fixed install path and self-heals PATH so
# a freshly winget-installed tool is usable in this same run (no reboot needed).

$app = $PSScriptRoot

function Section($t) { Write-Host ''; Write-Host "== $t ==" -ForegroundColor Cyan }
function Ok($t)      { Write-Host "  $t" -ForegroundColor Green }
function Warn($t)    { Write-Host "  $t" -ForegroundColor Yellow }
function Info($t)    { Write-Host "  $t" }

# Reload PATH from the registry (machine + user), then make sure any of the given
# candidate folders that actually exist are on PATH. This is what lets a tool that
# winget JUST installed be found without opening a new window: winget writes the
# registry PATH, but the running process (and Explorer) won't see it until we do
# this. Returns the command if resolvable now, else $null.
function Resolve-Tool($cmd, $candidates) {
  $found = Get-Command $cmd -ErrorAction SilentlyContinue
  if ($found) { return $found }
  $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
  foreach ($dir in $candidates) {
    if ($dir -and (Test-Path $dir) -and ($env:Path -notlike "*$dir*")) { $env:Path = "$dir;$env:Path" }
  }
  return (Get-Command $cmd -ErrorAction SilentlyContinue)
}

$pf   = $env:ProgramFiles
$pfx  = ${env:ProgramFiles(x86)}
$lad  = $env:LOCALAPPDATA
$nodeDirs = @("$pf\nodejs", "$pfx\nodejs", "$lad\Programs\nodejs")
$gitDirs  = @("$pf\Git\cmd", "$pfx\Git\cmd", "$lad\Programs\Git\cmd")

function Have-Winget { [bool](Get-Command winget -ErrorAction SilentlyContinue) }
function Install-With-Winget($id, $label) {
  if (-not (Have-Winget)) { return $false }
  Warn "Installing $label with winget (this can take a minute; approve the Windows prompt if it appears)..."
  winget install -e --id $id --accept-source-agreements --accept-package-agreements --disable-interactivity 2>&1 | Out-Host
  # winget returns non-zero for "already installed"/"no upgrade"; that's fine.
  return $true
}

try {
  Write-Host 'Ebiki installer' -ForegroundColor Magenta
  Write-Host "App folder: $app"

  # 1) Node.js (required) ----------------------------------------------------
  Section 'Checking Node.js'
  $node = Resolve-Tool 'node' $nodeDirs
  if ($node) {
    Ok "Node already installed ($(& $node.Source -v))"
  } else {
    Warn 'Node.js is not installed.'
    if (-not (Install-With-Winget 'OpenJS.NodeJS.LTS' 'Node.js LTS')) {
      throw 'winget is not available on this Windows, so Node.js cannot be installed automatically. Install Node.js LTS from https://nodejs.org then run install.bat again.'
    }
    $node = Resolve-Tool 'node' $nodeDirs
    if (-not $node) {
      throw 'Node.js was installed but could not be found on PATH. Close this window, sign out and back in (or restart), then run install.bat again.'
    }
    Ok "Node installed ($(& $node.Source -v))"
  }
  # npm ships with Node; resolve it from the same folder so version prints work.
  $npm = Resolve-Tool 'npm' $nodeDirs
  if ($npm) { Ok "npm $(& $npm.Source -v)" } else { Warn 'npm was not found next to Node; the app may still run if npm appears after a restart.' }

  # 2) Git (needed for the built-in update check; app still runs without it) --
  Section 'Checking Git'
  $git = Resolve-Tool 'git' $gitDirs
  if ($git) {
    Ok "Git already installed ($((& $git.Source --version) -replace 'git version ',''))"
  } else {
    Warn 'Git is not installed (used for the in-app update check).'
    if (Install-With-Winget 'Git.Git' 'Git') {
      $git = Resolve-Tool 'git' $gitDirs
    }
    if ($git) { Ok "Git installed ($((& $git.Source --version) -replace 'git version ',''))" }
    else { Warn 'Could not install Git automatically. The app will still run; get Git from https://git-scm.com to enable in-app updates.' }
  }

  # 3) Dependencies (the npm environment) ------------------------------------
  Section 'Installing dependencies (npm install)'
  Warn 'This can take a few minutes the first time...'
  Push-Location $app
  # Use cmd so the freshly-resolved PATH (with node/npm) is inherited reliably.
  & cmd /c 'npm install --no-fund --no-audit'
  $code = $LASTEXITCODE
  Pop-Location
  if ($code -ne 0) { throw 'npm install failed. Check your internet connection and run install.bat again.' }
  Ok 'Dependencies installed.'

  # 4) Shortcuts (Desktop + Start Menu) with the Ebi icon --------------------
  Section 'Creating shortcuts'
  $icon   = Join-Path $app 'ebiki.ico'          # baked into the repo
  $target = Join-Path $app 'launch-ebiki.vbs'   # relative to wherever the app is
  $ws     = New-Object -ComObject WScript.Shell
  function New-EbikiShortcut($linkPath) {
    $sc = $ws.CreateShortcut($linkPath)
    $sc.TargetPath       = $target
    $sc.WorkingDirectory = $app
    $sc.Description       = 'Launch Ebiki'
    if (Test-Path $icon) { $sc.IconLocation = "$icon,0" }
    $sc.Save()
  }
  $desktop = [Environment]::GetFolderPath('Desktop')
  $programs = [Environment]::GetFolderPath('Programs')
  New-EbikiShortcut (Join-Path $desktop 'Ebiki.lnk')
  if ($programs) { New-EbikiShortcut (Join-Path $programs 'Ebiki.lnk') }
  Ok "Shortcut created on your Desktop ($desktop)."

  Write-Host ''
  Write-Host 'All set! Double-click "Ebiki" on your Desktop to start the app.' -ForegroundColor Magenta
  Write-Host 'It opens at http://localhost:3000 and only ever runs one copy at a time.'
  Write-Host 'If the shortcut ever says it cannot find Node, sign out and back in once, then use it again.'
}
catch {
  Write-Host ''
  Write-Host "Setup could not finish: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

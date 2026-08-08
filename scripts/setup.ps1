# Ebiki setup script. INTERNAL - the user never runs this directly.
# It lives in scripts/ so the app folder shows exactly ONE thing to run:
# "Install Ebiki.bat" (which calls this with the right execution policy).
#
# Installs the prerequisites (Node.js + Git), builds the npm environment
# (npm install), and creates a Desktop + Start Menu shortcut that launches the app.
#
# Designed to work whether the user has NOTHING installed or already has some of
# the prerequisites. It never assumes a fixed install path and self-heals PATH so
# a freshly winget-installed tool is usable in this same run (no reboot needed).

# scripts/ lives one level below the app folder.
$app = Split-Path $PSScriptRoot -Parent

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

# Anki does not reliably land on PATH, so look for anki.exe in the usual install
# folders, then PATH, then the registry's uninstall entries (custom folders).
function Find-Anki {
  foreach ($p in @("$pf\Anki\anki.exe", "$pfx\Anki\anki.exe", "$lad\Programs\Anki\anki.exe")) {
    if (Test-Path $p) { return $p }
  }
  $c = Get-Command anki -ErrorAction SilentlyContinue
  if ($c) { return $c.Source }
  $keys = @('HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
            'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
            'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*')
  foreach ($k in $keys) {
    $e = Get-ItemProperty $k -ErrorAction SilentlyContinue |
         Where-Object { $_.DisplayName -like 'Anki*' -and $_.InstallLocation } | Select-Object -First 1
    if ($e) {
      $exe = Join-Path $e.InstallLocation 'anki.exe'
      if (Test-Path $exe) { return $exe }
    }
  }
  return $null
}

# Find an installed AnkiConnect by its SIGNATURE, not by add-on code: several
# forks expose the same API (e.g. "Anki Connect Plus", code 2036732292) and
# Anki flags them as CONFLICTING with the original, so installing 2055492159 on
# top of one would break a working setup. Every variant ships a config.json with
# webBindPort, which is the thing Ebiki actually talks to.
function Find-AnkiConnect($base) {
  $dir = Join-Path $base 'addons21'
  if (-not (Test-Path $dir)) { return $null }
  foreach ($d in (Get-ChildItem $dir -Directory -ErrorAction SilentlyContinue)) {
    $cfg = Join-Path $d.FullName 'config.json'
    if ((Test-Path (Join-Path $d.FullName '__init__.py')) -and (Test-Path $cfg)) {
      $txt = Get-Content $cfg -Raw -ErrorAction SilentlyContinue
      if ($txt -and $txt -match 'webBindPort') { return $d }
    }
  }
  return $null
}
# meta.json holds the display name and the enabled flag Anki manages.
function Get-AddonMeta($dir) {
  try { return (Get-Content (Join-Path $dir.FullName 'meta.json') -Raw | ConvertFrom-Json) } catch { return $null }
}

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
      throw 'winget is not available on this Windows, so Node.js cannot be installed automatically. Install Node.js LTS from https://nodejs.org then run "Install Ebiki.bat" again.'
    }
    $node = Resolve-Tool 'node' $nodeDirs
    if (-not $node) {
      throw 'Node.js was installed but could not be found on PATH. Close this window, sign out and back in (or restart), then run "Install Ebiki.bat" again.'
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

  # 3) Anki + the AnkiConnect add-on (the card store Ebiki syncs with) -------
  # Ebiki reads/writes cards through AnkiConnect, so a fresh machine needs BOTH
  # Anki itself and the add-on. Fail-soft on purpose: the app still runs (chat,
  # picture, mode design) without Anki, so nothing here throws.
  Section 'Checking Anki'
  $anki = Find-Anki
  if ($anki) {
    Ok "Anki already installed ($anki)"
  } else {
    Warn 'Anki is not installed.'
    if (Install-With-Winget 'Anki.Anki' 'Anki') { $anki = Find-Anki }
    if ($anki) { Ok "Anki installed ($anki)" }
    else { Warn 'Could not install Anki automatically. Get it from https://apps.ankiweb.net, then run this installer again to add AnkiConnect.' }
  }

  # AnkiConnect lives in Anki's add-on folder as plain files, so it can be
  # installed WITHOUT driving Anki's UI: fetch the .ankiaddon (a zip) from
  # AnkiWeb and unpack it into addons21\<code>. Anki picks it up on next start.
  Section 'Checking the AnkiConnect add-on'
  $ankiBase = if ($env:ANKI_BASE) { $env:ANKI_BASE } else { Join-Path $env:APPDATA 'Anki2' }
  $addonDir = Join-Path $ankiBase 'addons21\2055492159'
  $ankiRunning = [bool](Get-Process -Name anki -ErrorAction SilentlyContinue)
  $have = Find-AnkiConnect $ankiBase
  if ($have) {
    $meta = Get-AddonMeta $have
    $label = if ($meta -and $meta.name) { $meta.name } else { $have.Name }
    Ok "$label is already installed (that is the add-on Ebiki talks to)."
    if ($meta -and $meta.disabled) { Warn 'It is currently DISABLED in Anki. Enable it under Tools > Add-ons.' }
  } elseif (-not $anki) {
    Warn 'Skipped (install Anki first, then run this installer again).'
  } else {
    try {
      Info 'Downloading AnkiConnect from AnkiWeb...'
      # Same endpoint Anki's own "Browse & Install" uses; p = client point version.
      $url = 'https://ankiweb.net/shared/download/2055492159?v=2.1&p=250600'
      $zip = Join-Path $env:TEMP 'ebiki-ankiconnect.zip'   # must end in .zip for Expand-Archive
      try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}
      Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
      New-Item -ItemType Directory -Force -Path $addonDir | Out-Null
      Expand-Archive -Path $zip -DestinationPath $addonDir -Force
      Remove-Item $zip -Force -ErrorAction SilentlyContinue
      if (-not (Test-Path (Join-Path $addonDir '__init__.py'))) { throw 'the downloaded add-on looked empty' }
      # Anki writes this itself on first load; seeding it just makes the add-on
      # list show a real name. No "config" key, so AnkiConnect's own defaults win
      # (127.0.0.1:8765 - which is exactly what Ebiki's server talks to).
      '{ "name": "AnkiConnect", "mod": 0, "disabled": false }' | Set-Content (Join-Path $addonDir 'meta.json') -Encoding UTF8
      Ok 'AnkiConnect installed.'
      if ($ankiRunning) { Warn 'Anki is running right now: close and reopen it so the add-on loads.' }
    } catch {
      Warn "Could not install AnkiConnect automatically ($($_.Exception.Message))."
      Warn 'Add it by hand in Anki: Tools > Add-ons > Get Add-ons, code 2055492159.'
    }
  }

  # 4) Dependencies (the npm environment) ------------------------------------
  Section 'Installing dependencies (npm install)'
  Warn 'This can take a few minutes the first time...'
  Push-Location $app
  # Use cmd so the freshly-resolved PATH (with node/npm) is inherited reliably.
  & cmd /c 'npm install --no-fund --no-audit'
  $code = $LASTEXITCODE
  Pop-Location
  if ($code -ne 0) { throw 'npm install failed. Check your internet connection and run "Install Ebiki.bat" again.' }
  Ok 'Dependencies installed.'

  # 5) Shortcuts (Desktop + Start Menu) with the Ebi icon --------------------
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
  Write-Host 'Open Anki too and leave it running: that is where your cards live.'
  Write-Host 'If the shortcut ever says it cannot find Node, sign out and back in once, then use it again.'
}
catch {
  Write-Host ''
  Write-Host "Setup could not finish: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

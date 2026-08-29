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

$uninstallKeys = @('HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
                   'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
                   'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*')

# WHERE anki.exe is (or $null). Anki does not reliably land on PATH, so probe the
# usual install folders, then PATH, then any uninstall entry that records its
# InstallLocation. Only used to print a path - the app never launches Anki.
function Find-Anki {
  foreach ($p in @("$pf\Anki\anki.exe", "$pfx\Anki\anki.exe", "$lad\Programs\Anki\anki.exe")) {
    if (Test-Path $p) { return $p }
  }
  $c = Get-Command anki -ErrorAction SilentlyContinue
  if ($c) { return $c.Source }
  foreach ($k in $uninstallKeys) {
    $e = Get-ItemProperty $k -ErrorAction SilentlyContinue |
         Where-Object { $_.DisplayName -like 'Anki*' -and $_.InstallLocation } | Select-Object -First 1
    if ($e) {
      $exe = Join-Path $e.InstallLocation 'anki.exe'
      if (Test-Path $exe) { return $exe }
    }
  }
  return $null
}

# WHETHER Anki is installed, which is a different question: the MSI build records
# no InstallLocation, DisplayIcon or App Paths entry, so an Anki living in a
# non-default folder is invisible to Find-Anki. Windows still lists it under
# Uninstall, and that is enough to know we must NOT reinstall it.
function Test-AnkiInstalled {
  if (Find-Anki) { return $true }
  foreach ($k in $uninstallKeys) {
    $e = Get-ItemProperty $k -ErrorAction SilentlyContinue |
         Where-Object { $_.DisplayName -match '^Anki(\s|$)' } | Select-Object -First 1
    if ($e) { return $true }
  }
  return $false
}

# Finding and installing AnkiConnect lives in ONE place, shared with the dev
# server's in-app repair button (see scripts/install-ankiconnect.ps1). Dot-sourced
# without -Install, so this only defines Find-AnkiConnect / Install-AnkiConnect.
# The installer and the repair button drifting apart is exactly how one of them
# ends up subtly broken while the other looks fine.
# Guarded: the Anki section is fail-soft on purpose (the app runs without Anki),
# so a missing helper must degrade to a warning rather than dot-sourcing at top
# level, throwing outside every try, and killing an otherwise fine install.
$acHelper = Join-Path $PSScriptRoot 'install-ankiconnect.ps1'
if (Test-Path $acHelper) {
  . $acHelper
} else {
  function Find-AnkiConnect($base) { return $null }
  function Install-AnkiConnect($addonDir) { throw 'scripts/install-ankiconnect.ps1 is missing from this copy' }
}

# meta.json holds the display name and the enabled flag Anki manages.
function Get-AddonMeta($dir) {
  try { return (Get-Content (Join-Path $dir.FullName 'meta.json') -Raw | ConvertFrom-Json) } catch { return $null }
}

# A GitHub "Download ZIP" folder has no .git, so it can never update itself: the
# launch-time check and Settings > Updates both need a repo, and the user silently
# stays on whatever the ZIP happened to contain (which is how a copy predating a
# feature keeps reinstalling itself). Turn that folder INTO a clone of the release
# branch. Only ever run on a folder with no .git, so nothing local is at risk -
# and user data (config.json, modes/, decks/, .env) is gitignored, so a checkout
# never touches it.
function Link-ToGit($dir, $repo) {
  & git -C $dir init -q 2>&1 | Out-Null
  & git -C $dir remote remove origin 2>&1 | Out-Null
  & git -C $dir remote add origin $repo 2>&1 | Out-Null
  # FULL history, not --depth 1. A shallow repo can pull, but it is a stub for
  # every other purpose: `git log` shows one commit, `git diff` against anything
  # earlier is impossible, and there is nothing to roll back to. Measured against
  # this repo it costs about 8.7 MB and one second - nothing beside the npm
  # install this same script runs - so a ZIP user gets the same real repository a
  # git user has, and can pull, log, diff and revert by hand like anyone else.
  & git -C $dir fetch origin master:refs/remotes/origin/master 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'could not reach GitHub' }
  & git -C $dir checkout -B master refs/remotes/origin/master -f 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'could not check out the release branch' }
  & git -C $dir branch --set-upstream-to=origin/master master 2>&1 | Out-Null
  # Sweep files the old ZIP had that the release no longer ships (the renamed
  # install.bat / install.ps1 / launch.ps1 would otherwise sit next to the new
  # ones - the exact "which do I run?" mess this layout was meant to end). No -x,
  # so gitignored user data (config.json, modes/, decks/, .env, logs/) is kept,
  # and a leftover tree would also leave the folder permanently dirty, which
  # breaks the `git pull --ff-only` that in-app updates rely on.
  & git -C $dir clean -fd 2>&1 | Out-Null
  return (& git -C $dir rev-parse --short HEAD)
}

# Is this a repository a person could actually use - not merely a folder with a
# .git in it? The difference matters because Link-ToGit is several steps and any
# of them can fail (no network mid-fetch, a killed installer), and what it leaves
# behind then is a .git with no commit and no upstream. The old check was a bare
# `Test-Path .git`, so that wreckage read as "already a clone" forever after: the
# folder could never re-link itself, and setup cheerfully reported it was fine.
# All three things are required for `git pull` to work with no arguments, which is
# the whole point of linking the folder in the first place.
function Test-GitHealthy($dir) {
  if (-not (Test-Path (Join-Path $dir '.git'))) { return $false }
  if (-not (& git -C $dir rev-parse HEAD 2>$null)) { return $false }              # no commit checked out
  if (-not (& git -C $dir remote get-url origin 2>$null)) { return $false }       # nowhere to pull from
  if (-not (& git -C $dir rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>$null)) { return $false }  # no upstream
  return $true
}

function Have-Winget { [bool](Get-Command winget -ErrorAction SilentlyContinue) }
function Install-With-Winget($id, $label) {
  if (-not (Have-Winget)) { return $false }
  Warn "Installing $label with winget (this can take a minute; approve the Windows prompt if it appears)..."
  winget install -e --id $id --accept-source-agreements --accept-package-agreements --disable-interactivity 2>&1 | Out-Host
  # winget returns non-zero for "already installed"/"no upgrade"; that's fine.
  return $true
}

# Keep a transcript. When setup misbehaves on someone else's machine, "it didn't
# install" is all the report you get; this file is the actual evidence. logs/ is
# gitignored, and a failed transcript must never stop the install.
$logFile = Join-Path $app 'logs\install.log'
try {
  New-Item -ItemType Directory -Force -Path (Split-Path $logFile) | Out-Null
  Start-Transcript -Path $logFile -Append | Out-Null
} catch { $logFile = $null }

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

  # 3) This copy of the app: is it updatable, and which version is it? --------
  # Printed FIRST thing that matters, so "which installer am I even running" is
  # answerable from a screenshot of this window.
  Section 'Checking this copy of the app'
  if (Test-GitHealthy $app) {
    $sha = (& git -C $app rev-parse --short HEAD 2>$null)
    # An earlier installer linked ZIP folders SHALLOW, which leaves a repo that can
    # pull but cannot show history or roll anything back. Deepen it once, so those
    # machines end up with the same real repository as everyone else. Fail-soft:
    # offline just leaves it as it was, and the next run tries again.
    if (Test-Path (Join-Path $app '.git\shallow')) {
      Info 'Filling in this copy''s history so git works normally here...'
      & git -C $app fetch --unshallow 2>&1 | Out-Null
      if ($LASTEXITCODE -eq 0) { Ok 'History restored.' } else { Warn 'Could not fetch the full history right now; updates still work.' }
    }
    if ($sha) { Ok "Version $sha. Updates work (Settings > General > Updates, and on launch)." }
    else { Ok 'Git clone. Updates work.' }
    Info "You can also update by hand from this folder: git pull"
  } elseif ($git) {
    if (Test-Path (Join-Path $app '.git')) {
      Warn 'This folder has a half-finished repository (an earlier link was interrupted). Repairing it...'
    } else {
      Warn 'This folder came from a ZIP download, so it has no version and cannot update itself.'
    }
    # Say it BEFORE doing it. This path replaces the app's own files with the
    # current release without asking - reasonable for an installer, but it is the
    # only update anywhere that is not gated on a Yes, so it must not be a surprise
    # ("I ran the installer and it updated itself"). User data is untouched.
    Warn 'This will also update the app files to the latest release. Your settings, learning modes and decks are not touched.'
    Info 'Linking it to the project so updates work from now on...'
    try {
      $sha = Link-ToGit $app 'https://github.com/cookmeafish/Ebiki-AI-Flashcards.git'
      Ok "Linked and updated to the latest release ($sha). Your settings, modes and decks were untouched."
      Ok 'This folder is now a normal git checkout: "git pull" here works by hand.'
      # START OVER with the files we just downloaded. THIS IS THE POINT OF THE WHOLE BLOCK.
      # Linking updates the FOLDER, but the script already running is still the one that came
      # out of the ZIP - so everything after this line behaved like whatever old release that
      # ZIP happened to contain, while the folder afterwards looks perfectly up to date. That is
      # how a ZIP user got no Anki/AnkiConnect step from an installer that visibly "succeeded",
      # and why re-running the installer would have fixed it (nobody re-runs an installer that
      # said it was done). Re-exec once so a ZIP install and a git install run IDENTICAL code.
      # Guarded by an environment variable rather than a parameter: the script being started is
      # the freshly downloaded one, and an env var an older copy does not know about is simply
      # ignored, whereas an unknown -Switch would make it fail to start at all.
      if ($env:EBIKI_SETUP_RELINKED -ne '1') {
        Section 'Restarting setup with the updated files'
        Info 'So this install is identical to a git one.'
        $env:EBIKI_SETUP_RELINKED = '1'
        try { Stop-Transcript | Out-Null } catch {}
        & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $app 'scripts\setup.ps1')
        exit $LASTEXITCODE
      }
    } catch {
      Warn "Could not link this folder ($($_.Exception.Message)). The app runs fine; to get updates later, clone with git instead of downloading the ZIP."
    }
  } else {
    Warn 'ZIP download and no Git, so this copy cannot update itself. The app still runs.'
  }

  # 4) Anki + the AnkiConnect add-on (the card store Ebiki syncs with) -------
  # Ebiki reads/writes cards through AnkiConnect, so a fresh machine needs BOTH
  # Anki itself and the add-on. Fail-soft on purpose: the app still runs (chat,
  # picture, mode design) without Anki, so nothing here throws.
  Section 'Checking Anki'
  $ankiOk = Test-AnkiInstalled
  if ($ankiOk) {
    # Already there -> skip entirely, never hand it to winget.
    $anki = Find-Anki
    if ($anki) { Ok "Anki already installed ($anki)" } else { Ok 'Anki already installed.' }
  } else {
    Warn 'Anki is not installed.'
    if (Install-With-Winget 'Anki.Anki' 'Anki') { $ankiOk = Test-AnkiInstalled }
    if ($ankiOk) {
      $anki = Find-Anki
      if ($anki) { Ok "Anki installed ($anki)" } else { Ok 'Anki installed.' }
    } else {
      Warn 'Could not install Anki automatically. Get it from https://apps.ankiweb.net (the add-on below is still set up, so Anki will find it).'
    }
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
  } else {
    # Installed even when Anki itself is missing. The add-on is just files in
    # %APPDATA%, and Anki reads that folder whenever it first starts, so a failed
    # or skipped Anki install must not also cost the user the add-on.
    if (-not $ankiOk) { Warn 'Anki is not here yet; installing the add-on anyway so it is ready when Anki is.' }
    try {
      $from = Install-AnkiConnect $addonDir
      Ok "AnkiConnect installed from $from into $addonDir"
      if ($ankiRunning) { Warn 'Anki is running right now: close and reopen it so the add-on loads.' }
    } catch {
      Warn "Could not install AnkiConnect automatically ($($_.Exception.Message))."
      Warn 'Ebiki can install it for you later: open Ebiki and use the button on the "Anki is not connected" notice.'
      Warn 'Or add it by hand in Anki: Tools > Add-ons > Get Add-ons, code 2055492159.'
    }
  }
  # State the end result plainly, whatever happened above. A success that was only
  # implied is what made "it did not install AnkiConnect" impossible to confirm
  # from the installer window or from logs/install.log afterwards.
  if (Find-AnkiConnect $ankiBase) { Ok 'Verified: the add-on Ebiki talks to is in place.' }
  else { Warn 'AnkiConnect is still NOT installed. Open Ebiki and use the button on the "Anki is not connected" notice to install it.' }

  # 5) Dependencies (the npm environment) ------------------------------------
  Section 'Installing dependencies (npm install)'
  Warn 'This can take a few minutes the first time...'
  Push-Location $app
  # Use cmd so the freshly-resolved PATH (with node/npm) is inherited reliably.
  & cmd /c 'npm install --no-fund --no-audit'
  $code = $LASTEXITCODE
  Pop-Location
  if ($code -ne 0) { throw 'npm install failed. Check your internet connection and run "Install Ebiki.bat" again.' }
  Ok 'Dependencies installed.'

  # 6) Shortcuts (Desktop + Start Menu) with the Ebi icon --------------------
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
  if ($logFile) { Write-Host "Details were written to $logFile" -ForegroundColor Yellow }
  try { Stop-Transcript | Out-Null } catch {}
  exit 1
}
try { Stop-Transcript | Out-Null } catch {}

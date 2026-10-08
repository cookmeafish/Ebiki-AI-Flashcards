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
# Every message below comes from the app's locale files (Tr, scripts/launcher-i18n.ps1). UTF-8 output so
# Chinese and Japanese print correctly in the console.
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}
. (Join-Path $PSScriptRoot 'launcher-i18n.ps1')
# Git never prompts here either (as in launch.ps1 and /api/update): the repository is public, so a sign-in
# request means it moved or a proxy wants credentials, and a Credential Manager window or a console prompt
# would hold the installer with no timeout. A failed fetch is reported instead (ln_inst_noGithub).
$env:GIT_TERMINAL_PROMPT = '0'; $env:GCM_INTERACTIVE = 'never'; $env:GIT_ASKPASS = 'echo'

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
  & git -C $dir -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=20 fetch origin master:refs/remotes/origin/master 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { throw (Tr 'ln_inst_noGithub') }
  & git -C $dir checkout -B master refs/remotes/origin/master -f 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { throw (Tr 'ln_inst_noCheckout') }
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
  # No git at all: calling it would throw CommandNotFoundException, and inside setup's main try
  # that is TERMINATING - a machine without Git aborted the whole install right here instead of
  # carrying on with the "app still runs without Git" path the Git section promises.
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) { return $false }
  if (-not (Test-Path (Join-Path $dir '.git'))) { return $false }
  # --verify -q: in a repo with NO commit yet (a ZIP link cut off before its fetch), plain "rev-parse HEAD"
  # still prints the word HEAD, which read as a checked-out commit, and the folder was never linked again.
  if (-not (& git -C $dir rev-parse --verify -q HEAD 2>$null)) { return $false }              # no commit checked out
  if (-not (& git -C $dir remote get-url origin 2>$null)) { return $false }       # nowhere to pull from
  if (-not (& git -C $dir rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>$null)) { return $false }  # no upstream
  return $true
}

# A REAL clone (a commit checked out) that is not fully linked - a developer's local branch, or a
# clone whose remote has another name ("git clone -o upstream") or none. Link-ToGit is for ZIP folders
# and interrupted links only: it force-checks-out master and runs `clean -fd`, which on a real clone
# destroys uncommitted changes and untracked files. Such a folder is left alone (repaired in place
# when on master). Any checked-out commit counts: requiring an "origin" sent a clone with a
# differently named remote to Link-ToGit, which wiped its work (reproduced).
function Test-RealClone($dir) {
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) { return $false }
  if (-not (Test-Path (Join-Path $dir '.git'))) { return $false }
  return [bool](& git -C $dir rev-parse --verify -q HEAD 2>$null)
}

function Have-Winget { [bool](Get-Command winget -ErrorAction SilentlyContinue) }
function Install-With-Winget($id, $label) {
  if (-not (Have-Winget)) { return $false }
  Warn (Tr 'ln_inst_winget' @{ label = $label })
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
  Write-Host (Tr 'ln_inst_intro1')
  Write-Host (Tr 'ln_inst_intro2')
  Write-Host ''
  Write-Host (Tr 'ln_inst_title') -ForegroundColor Magenta
  Write-Host (Tr 'ln_inst_appFolder' @{ path = $app })

  # 1) Node.js (required) ----------------------------------------------------
  Section (Tr 'ln_inst_checkNode')
  $node = Resolve-Tool 'node' $nodeDirs
  if ($node) {
    Ok (Tr 'ln_inst_nodeHave' @{ version = (& $node.Source -v) })
  } else {
    Warn (Tr 'ln_inst_nodeMissing')
    if (-not (Install-With-Winget 'OpenJS.NodeJS.LTS' 'Node.js LTS')) {
      throw (Tr 'ln_inst_noWinget')
    }
    $node = Resolve-Tool 'node' $nodeDirs
    if (-not $node) {
      throw (Tr 'ln_inst_nodeNotFound')
    }
    Ok (Tr 'ln_inst_nodeInstalled' @{ version = (& $node.Source -v) })
  }
  # Too OLD is as bad as missing: the dev server (vite) needs Node 18+, so an old Node passed this step,
  # "All set" was printed, and the app then failed to start on every launch with nothing to repair it.
  $nodeMajor = 0
  try { $nodeMajor = [int](((& $node.Source -v) -replace '^v', '') -split '\.')[0] } catch { $nodeMajor = 0 }
  if ($nodeMajor -gt 0 -and $nodeMajor -lt 18) {
    Warn (Tr 'ln_inst_nodeOld' @{ version = $nodeMajor })
    if (Install-With-Winget 'OpenJS.NodeJS.LTS' 'Node.js LTS') { $node = Resolve-Tool 'node' $nodeDirs }
    try { $nodeMajor = [int](((& $node.Source -v) -replace '^v', '') -split '\.')[0] } catch { $nodeMajor = 0 }
    if ($nodeMajor -gt 0 -and $nodeMajor -lt 18) {
      throw (Tr 'ln_inst_nodeTooOld')
    }
    Ok (Tr 'ln_inst_nodeUpdated' @{ version = (& $node.Source -v) })
  }
  # npm ships with Node; resolve it from the same folder so version prints work.
  $npm = Resolve-Tool 'npm' $nodeDirs
  if ($npm) { Ok "npm $(& $npm.Source -v)" } else { Warn (Tr 'ln_inst_npmMissing') }

  # 2) Git (needed for the built-in update check; app still runs without it) --
  Section (Tr 'ln_inst_checkGit')
  $git = Resolve-Tool 'git' $gitDirs
  if ($git) {
    Ok (Tr 'ln_inst_gitHave' @{ version = ((& $git.Source --version) -replace 'git version ','') })
  } else {
    Warn (Tr 'ln_inst_gitMissing')
    if (Install-With-Winget 'Git.Git' 'Git') {
      $git = Resolve-Tool 'git' $gitDirs
    }
    if ($git) { Ok (Tr 'ln_inst_gitInstalled' @{ version = ((& $git.Source --version) -replace 'git version ','') }) }
    else { Warn (Tr 'ln_inst_gitFailed') }
  }

  # 3) This copy of the app: is it updatable, and which version is it? --------
  # Printed FIRST thing that matters, so "which installer am I even running" is
  # answerable from a screenshot of this window.
  Section (Tr 'ln_inst_checkCopy')
  if (Test-GitHealthy $app) {
    $sha = (& git -C $app rev-parse --short HEAD 2>$null)
    # An earlier installer linked ZIP folders SHALLOW, which leaves a repo that can
    # pull but cannot show history or roll anything back. Deepen it once, so those
    # machines end up with the same real repository as everyone else. Fail-soft:
    # offline just leaves it as it was, and the next run tries again.
    if (Test-Path (Join-Path $app '.git\shallow')) {
      Info (Tr 'ln_inst_filling')
      & git -C $app -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=20 fetch --unshallow 2>&1 | Out-Null
      if ($LASTEXITCODE -eq 0) { Ok (Tr 'ln_inst_historyOk') } else { Warn (Tr 'ln_inst_historyFail') }
    }
    if ($sha) { Ok (Tr 'ln_inst_version' @{ sha = $sha }) }
    else { Ok (Tr 'ln_inst_gitClone') }
    Info (Tr 'ln_inst_gitPull')
  } elseif ($git -and (Test-RealClone $app)) {
    $branch = (& git -C $app rev-parse --abbrev-ref HEAD 2>$null)
    if ($branch -eq 'master') {
      & git -C $app -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=20 fetch origin master:refs/remotes/origin/master 2>&1 | Out-Null
      & git -C $app branch --set-upstream-to=origin/master master 2>&1 | Out-Null
      if ($LASTEXITCODE -eq 0) { Ok (Tr 'ln_inst_trackingFixed') }
      else { Warn (Tr 'ln_inst_trackingFail') }
    } else {
      Info (Tr 'ln_inst_otherBranch' @{ branch = $branch })
    }
  } elseif ($git) {
    if (Test-Path (Join-Path $app '.git')) {
      Warn (Tr 'ln_inst_halfRepo')
    } else {
      Warn (Tr 'ln_inst_zip')
    }
    # Say it BEFORE doing it. This path replaces the app's own files with the
    # current release without asking - reasonable for an installer, but it is the
    # only update anywhere that is not gated on a Yes, so it must not be a surprise
    # ("I ran the installer and it updated itself"). User data is untouched.
    Warn (Tr 'ln_inst_willUpdate')
    Info (Tr 'ln_inst_linking')
    try {
      $sha = Link-ToGit $app 'https://github.com/cookmeafish/Ebiki-AI-Flashcards.git'
      Ok (Tr 'ln_inst_linked' @{ sha = $sha })
      Ok (Tr 'ln_inst_normalCheckout')
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
        Section (Tr 'ln_inst_restarting')
        Info (Tr 'ln_inst_identical')
        $env:EBIKI_SETUP_RELINKED = '1'
        try { Stop-Transcript | Out-Null } catch {}
        & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $app 'scripts\setup.ps1')
        exit $LASTEXITCODE
      }
    } catch {
      Warn (Tr 'ln_inst_linkFailed' @{ error = $_.Exception.Message })
    }
  } else {
    Warn (Tr 'ln_inst_zipNoGit')
  }

  # 4) Anki + the AnkiConnect add-on (the card store Ebiki syncs with) -------
  # Ebiki reads/writes cards through AnkiConnect, so a fresh machine needs BOTH
  # Anki itself and the add-on. Fail-soft on purpose: the app still runs (chat,
  # picture, mode design) without Anki, so nothing here throws.
  Section (Tr 'ln_inst_checkAnki')
  $ankiOk = Test-AnkiInstalled
  if ($ankiOk) {
    # Already there -> skip entirely, never hand it to winget.
    $anki = Find-Anki
    if ($anki) { Ok (Tr 'ln_inst_ankiHaveAt' @{ path = $anki }) } else { Ok (Tr 'ln_inst_ankiHave') }
  } else {
    Warn (Tr 'ln_inst_ankiMissing')
    if (Install-With-Winget 'Anki.Anki' 'Anki') { $ankiOk = Test-AnkiInstalled }
    if ($ankiOk) {
      $anki = Find-Anki
      if ($anki) { Ok (Tr 'ln_inst_ankiInstalledAt' @{ path = $anki }) } else { Ok (Tr 'ln_inst_ankiInstalled') }
    } else {
      Warn (Tr 'ln_inst_ankiFailed')
    }
  }

  # AnkiConnect lives in Anki's add-on folder as plain files, so it can be
  # installed WITHOUT driving Anki's UI: fetch the .ankiaddon (a zip) from
  # AnkiWeb and unpack it into addons21\<code>. Anki picks it up on next start.
  Section (Tr 'ln_inst_checkAddon')
  $ankiBase = if ($env:ANKI_BASE) { $env:ANKI_BASE } else { Join-Path $env:APPDATA 'Anki2' }
  $addonDir = Join-Path $ankiBase 'addons21\2055492159'
  # Website installs run the real Anki as python/pythonw out of the Anki folders (same test as
  # install-ankiconnect.ps1): counting only "anki" skipped the "close and reopen Anki" advice with Anki open.
  $pyAnki = @(Get-Process -Name 'pythonw', 'python' -ErrorAction SilentlyContinue | Where-Object {
    try { $_.Path -match '[\\/](Anki|AnkiProgramFiles)[\\/]' } catch { $false }
  })
  $ankiRunning = [bool](Get-Process -Name 'anki', 'ankiw' -ErrorAction SilentlyContinue) -or ($pyAnki.Count -gt 0)
  $have = Find-AnkiConnect $ankiBase
  if ($have) {
    $meta = Get-AddonMeta $have
    $label = if ($meta -and $meta.name) { $meta.name } else { $have.Name }
    Ok (Tr 'ln_inst_addonHave' @{ label = $label })
    if ($meta -and $meta.disabled) { Warn (Tr 'ln_inst_addonDisabled') }
  } else {
    # Installed even when Anki itself is missing. The add-on is just files in
    # %APPDATA%, and Anki reads that folder whenever it first starts, so a failed
    # or skipped Anki install must not also cost the user the add-on.
    if (-not $ankiOk) { Warn (Tr 'ln_inst_addonNoAnki') }
    try {
      $from = Install-AnkiConnect $addonDir
      Ok (Tr 'ln_inst_addonInstalled' @{ from = $from; dir = $addonDir })
      if ($ankiRunning) { Warn (Tr 'ln_inst_addonReopen') }
    } catch {
      Warn (Tr 'ln_inst_addonFailed' @{ error = $_.Exception.Message })
      Warn (Tr 'ln_inst_addonLater')
      Warn (Tr 'ln_inst_addonByHand')
    }
  }
  # State the end result plainly, whatever happened above. A success that was only
  # implied is what made "it did not install AnkiConnect" impossible to confirm
  # from the installer window or from logs/install.log afterwards.
  if (Find-AnkiConnect $ankiBase) { Ok (Tr 'ln_inst_addonVerified') }
  else { Warn (Tr 'ln_inst_addonStillMissing') }

  # 5) Dependencies (the npm environment) ------------------------------------
  Section (Tr 'ln_inst_deps')
  Warn (Tr 'ln_inst_depsSlow')
  Push-Location $app
  # Use cmd so the freshly-resolved PATH (with node/npm) is inherited reliably.
  & cmd /c 'npm install --no-fund --no-audit'
  $code = $LASTEXITCODE
  Pop-Location
  if ($code -ne 0) { throw (Tr 'ln_inst_depsFailed') }
  # Record what was installed (the postinstall hook does too; this runs after npm has finished writing the lockfile).
  try { & node (Join-Path $app 'scripts\deps-fingerprint.mjs') --stamp 2>$null | Out-Null } catch { }
  Ok (Tr 'ln_inst_depsDone')

  # 6) Shortcuts (Desktop + Start Menu) with the Ebi icon --------------------
  Section (Tr 'ln_inst_shortcuts')
  $icon   = Join-Path $app 'ebiki.ico'          # baked into the repo
  $target = Join-Path $app 'launch-ebiki.vbs'   # relative to wherever the app is
  $ws     = New-Object -ComObject WScript.Shell
  function New-EbikiShortcut($linkPath) {
    $sc = $ws.CreateShortcut($linkPath)
    $sc.TargetPath       = $target
    $sc.WorkingDirectory = $app
    $sc.Description       = Tr 'ln_inst_shortcutDesc'
    if (Test-Path $icon) { $sc.IconLocation = "$icon,0" }
    $sc.Save()
  }
  $desktop = [Environment]::GetFolderPath('Desktop')
  $programs = [Environment]::GetFolderPath('Programs')
  New-EbikiShortcut (Join-Path $desktop 'Ebiki.lnk')
  if ($programs) { New-EbikiShortcut (Join-Path $programs 'Ebiki.lnk') }
  Ok (Tr 'ln_inst_shortcutDone' @{ path = $desktop })

  Write-Host ''
  Write-Host (Tr 'ln_inst_done1') -ForegroundColor Magenta
  Write-Host (Tr 'ln_inst_done2')
  Write-Host (Tr 'ln_inst_done3')
  Write-Host (Tr 'ln_inst_done4')
}
catch {
  Write-Host ''
  Write-Host (Tr 'ln_inst_failed' @{ error = $_.Exception.Message }) -ForegroundColor Red
  if ($logFile) { Write-Host (Tr 'ln_inst_details' @{ path = $logFile }) -ForegroundColor Yellow }
  try { Stop-Transcript | Out-Null } catch {}
  exit 1
}
try { Stop-Transcript | Out-Null } catch {}

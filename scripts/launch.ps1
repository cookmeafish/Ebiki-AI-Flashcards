# Ebiki launcher (invoked hidden by launch-ebiki.vbs).
# 1) Make sure Anki is up (the app reads/writes every card through AnkiConnect).
# 2) If the app is already running, just bring its window forward.
# 3) Otherwise do a QUICK update check (every launch; skipped only when offline
#    or git is missing), offer
#    to update, then start the dev server and open Ebiki as its own window
#    (Open-App below - a chrome-free Electron window when available, a plain
#    browser tab as the fallback).
# Path-relative so it works wherever the app is installed; this script lives in
# scripts/, so the app folder is one level up.
$app = Split-Path $PSScriptRoot -Parent
# Every message below comes from the app's locale files (Tr, scripts/launcher-i18n.ps1).
. (Join-Path $PSScriptRoot 'launcher-i18n.ps1')

# ── Splash handshake ────────────────────────────────────────────────────────
# launch-ebiki.vbs pops scripts/splash.hta the instant the shortcut is clicked,
# because everything this script does is INVISIBLE (hidden PowerShell, hidden
# dev server, Anki booting), so the click looked like nothing had happened at
# all until the window appeared seconds later. The splash watches for this
# marker file and closes the moment it appears, so it has to be touched exactly
# when the app is really on screen: electron/main.cjs does that from its
# ready-to-show handler, and every path here that never gets that far (no
# Electron, missing Node, a crash) does it below. The VBS deletes any leftover
# marker before showing the splash, so a stale one can not close it instantly.
$readyFile = Join-Path $app '.app-ready'
# A FOLLOWER (set by launch-ebiki.vbs when another launch is mid-way, e.g. asking about an update) owns
# no splash and must not touch the handshake files: its status line replaced the other launch's question,
# and its .app-ready closed the other splash. It waits on the launcher lock, then opens the app.
$follower = $env:EBIKI_LAUNCH_FOLLOWER -eq '1'
# Not passed on: a server or window started from here inherited it, and a relaunch it spawned ran as a silent
# follower under its own splash (no update check, handshake files never cleared).
Remove-Item Env:EBIKI_LAUNCH_FOLLOWER -ErrorAction SilentlyContinue
function Signal-AppReady {
  if ($follower) { return }
  try { New-Item -ItemType File -Path $readyFile -Force | Out-Null } catch {}
}
# The splash also SAYS what is happening. Everything this script does is
# invisible, so a launch that stops to check for an update, or that spends a
# minute running `npm install` for one, looked exactly like an app that was
# simply slow - which is how a user sat through a long start every single day
# without ever learning there was an update waiting that would have fixed his
# problem. The splash polls this file and shows whatever is in it, so a slow
# launch always says WHY it is slow. Best effort: a status that fails to write
# just leaves the generic opening line on screen.
$statusFile = Join-Path $app '.app-status'
# npm install with a HEARTBEAT on the splash: the splash gives up after 3 minutes without a NEW status, and
# a dependency-heavy update on a slow line took longer, so the splash closed mid-install and a second click
# then looked like a fresh launch. Returns npm's exit code.
# The installed-dependencies fingerprint (scripts/deps-fingerprint.mjs). Test-DepsStale is true only on a definite
# "install needed" (exit 1); no node, or a check that cannot tell, never blocks the start.
function Test-DepsStale {
  try { & node (Join-Path $app 'scripts\deps-fingerprint.mjs') --check 2>$null | Out-Null; return ($LASTEXITCODE -eq 1) } catch { return $false }
}
function Save-DepsStamp {
  try { & node (Join-Path $app 'scripts\deps-fingerprint.mjs') --stamp 2>$null | Out-Null } catch { }
}
function Invoke-NpmInstall($label) {
  try {
    $p = Start-Process -FilePath 'cmd.exe' -ArgumentList '/d', '/c', 'npm install --no-fund --no-audit' -WorkingDirectory $app -WindowStyle Hidden -PassThru
    $null = $p.Handle # keeps ExitCode readable after exit (Windows PowerShell quirk)
    $started = Get-Date
    while (-not $p.WaitForExit(10000)) {
      $secs = [int]((Get-Date) - $started).TotalSeconds
      # A ceiling: its heartbeat keeps the splash open, so a wedged install (a stuck download, a locked file)
      # held the splash and the launcher lock forever. .npm-install-pending makes the next start retry.
      if ($secs -gt 900) { & taskkill /T /F /PID $p.Id 2>&1 | Out-Null; return 1 }
      Set-Status (Tr 'ln_stillWorking' @{ label = $label; s = $secs })
    }
    return $p.ExitCode
  } catch { return 1 }
}

function Set-Status($text) {
  if ($follower) { return }
  # UTF-8: the messages are translated (Chinese, Japanese...), and the splash reads this file with
  # ADODB.Stream as UTF-8 (it skips the BOM Windows PowerShell writes).
  # RETRIED: the splash reads this file four times a second and its FileSystemObject read handle does
  # not share write access, so a write landing on a read failed ("being used by another process").
  # Measured at ~1.7% per write - enough that the update QUESTION was sometimes never shown and the
  # launch sat on "Checking for updates." for the whole answer timeout.
  for ($i = 0; $i -lt 20; $i++) {
    try { Set-Content -Path $statusFile -Value $text -Encoding UTF8 -ErrorAction Stop; return } catch { Start-Sleep -Milliseconds 25 }
  }
}
function Clear-Status {
  if ($follower) { return }
  try { Remove-Item $statusFile -Force -ErrorAction SilentlyContinue } catch {}
}

# Ask a yes/no question INSIDE the splash, instead of popping a second window.
# This is the whole fix for the missed update: a WScript.Shell popup is its own
# window in its own process, shown AFTER the splash, so it opened underneath the
# splash - the launch simply appeared to freeze for the timeout while an
# invisible question waited for an answer, and when it timed out nothing ever
# mentioned the update again. The splash is already on screen, focused and
# branded, so the question belongs there. Two files carry it: the splash writes
# .app-splash when it loads (proof there is a window to ask in), and .app-answer
# when a button is clicked.
# Returns 'yes' | 'no' | 'timeout' | 'nosplash'.
$splashMarker = Join-Path $app '.app-splash'
$answerFile = Join-Path $app '.app-answer'
# $title / $yesStatus are optional: without them the splash shows its original Ebiki-update wording
# (PROMPT|). With them it uses ASK|<title>|<status shown after Yes>|<question>, which is how the
# Anki update (scripts/anki-update.ps1) asks its own question in the same window.
function Ask-InSplash($text, $timeoutSec, $title, $yesStatus) {
  if ($follower) { return 'nosplash' } # the splash on screen belongs to the other launch (see $follower)
  try { Remove-Item $answerFile -Force -ErrorAction SilentlyContinue } catch {}
  # The splash is started a fraction of a second before this script and paints in
  # a few hundred ms, but never assume it: give it a moment to announce itself and
  # otherwise report back so the caller can use its own dialog.
  $wait = (Get-Date).AddSeconds(3)
  while (-not (Test-Path $splashMarker) -and (Get-Date) -lt $wait) { Start-Sleep -Milliseconds 150 }
  if (-not (Test-Path $splashMarker)) { return 'nosplash' }
  if ($title) { Set-Status ("ASK|{0}|{1}|{2}" -f ($title -replace '\|', '/'), ($yesStatus -replace '\|', '/'), $text) }
  else { Set-Status "PROMPT|$text" }
  $deadline = (Get-Date).AddSeconds($timeoutSec)
  while ((Get-Date) -lt $deadline) {
    if (Test-Path $answerFile) {
      $v = ''
      try { $v = (Get-Content $answerFile -Raw -ErrorAction Stop).Trim() } catch {}
      if ($v) {
        try { Remove-Item $answerFile -Force -ErrorAction SilentlyContinue } catch {}
        # Take the question back down straight away. The splash guards against
        # re-asking an answered question too, but leaving PROMPT| sitting in the
        # status file is asking for it to be shown again by some later reader.
        Set-Status (Tr 'ln_starting')
        if ($v -eq 'yes') { return 'yes' } else { return 'no' }
      }
    }
    # The splash closed meanwhile (its silence cap, Alt+F4) and took its marker with it: nobody can answer in
    # there, so the caller's own dialog asks instead of this waiting out the timeout invisibly.
    if (-not (Test-Path $splashMarker)) { Set-Status (Tr 'ln_starting'); return 'nosplash' }
    Start-Sleep -Milliseconds 200
  }
  # Nobody answered: say we moved on, so the splash takes its buttons down (a click after this
  # would otherwise read as "updating" while nothing is listening for it).
  Set-Status (Tr 'ln_starting')
  return 'timeout'
}
# Hold the splash until the window Electron just spawned actually paints (it
# writes the marker itself). Bounded by that process exiting - a second launch
# quits immediately after focusing the window that is already open - and by a
# hard cap, so the splash can never outlive the launch it belongs to.
function Wait-AppReady($proc) {
  if (-not $proc) { return }
  $start = Get-Date
  $deadline = $start.AddSeconds(45)
  while ((Get-Date) -lt $deadline) {
    if (Test-Path $readyFile) { return }
    try { if ($proc.HasExited) { return } } catch { return }
    # Belt and braces: if the marker never arrives (a future edit breaks the
    # write, the app folder turns read-only), a window that has existed for ten
    # seconds is proof enough that the app came up - better a splash that
    # retires a moment early than one that hangs for the full deadline.
    if (((Get-Date) - $start).TotalSeconds -gt 10) {
      try { $proc.Refresh(); if ($proc.MainWindowHandle -ne 0) { return } } catch {}
    }
    Start-Sleep -Milliseconds 250
  }
}

# ── Start Anki if it isn't up ───────────────────────────────────────────────
# Ebiki talks to Anki through AnkiConnect, so without Anki running the Deck / Study / Discover
# tabs sit on "Anki is not connected". Started FIRST (before the dev server) so it boots in
# parallel. The logic lives in scripts/anki-start.ps1 (shared with the in-app "Open Anki"
# button): it closes a launcher console left stuck on its own error, offers and applies Anki
# updates in the splash (scripts/anki-update.ps1), then starts Anki minimized. Fail-soft - the
# app still opens without it.
. (Join-Path $PSScriptRoot 'anki-start.ps1')
Set-Status (Tr 'ln_wakingUp')
try { $null = Start-AnkiIfNeeded } catch {}

# ── Open Ebiki as its own chrome-free window ────────────────────────────────
# electron is an OPTIONAL dependency (fail-soft, same philosophy as Anki above -
# the app still works without it), so this only ever runs when `npm install`
# actually got it. Falls back to a normal browser tab otherwise: a website-
# looking tab beats no app at all.
function Get-LaunchMode {
  # How THIS computer opens Ebiki: 'app' = the chrome-free Electron window,
  # 'browser' = an ordinary tab. Machine-local (launchmode.json, gitignored)
  # for the same reasons as datadir.json: two computers sharing one data folder
  # may legitimately want different answers, and config.json cannot serve this
  # at all - it lives inside the data folder, which may be an unreachable
  # share, and this runs BEFORE the dev server that would answer for it exists.
  # Anything missing or unreadable means 'app', today's default.
  try {
    $f = Join-Path $app 'launchmode.json'
    if (Test-Path $f) {
      $m = (Get-Content $f -Raw | ConvertFrom-Json).mode
      if ($m -eq 'browser') { return 'browser' }
    }
  } catch {}
  return 'app'
}

function Open-App {
  # The user's choice wins over what is installed - but only in the direction
  # that can actually be honored. 'browser' always works; 'app' still falls
  # back to a tab when electron is missing (it is an OPTIONAL dependency).
  if ((Get-LaunchMode) -eq 'browser') {
    # -WindowStyle Normal for the same reason as everywhere else in this script:
    # we run hidden, and a child with no style of its own inherits that.
    Start-Process 'http://localhost:3000' -WindowStyle Normal
    # No Electron window will report itself on this path, and a browser tab is
    # its own visible feedback, so the splash is retired right here.
    Signal-AppReady
    return $null
  }
  # Ebiki.exe (scripts/brand-electron-exe.mjs, runs on every `npm install` via postinstall) is a
  # COPY of electron.exe with the Ebi icon baked into its own PE resources via rcedit - preferred
  # because Windows resolves a PINNED taskbar icon from the running EXE FILE ITSELF, ignoring the
  # BrowserWindow icon option entirely for a dev-run (unpackaged) Electron app. Without this, "pin
  # to taskbar" showed the generic Electron logo instead of Ebi. Falls back to the plain
  # electron.exe (still a proper chrome-free app window, just the wrong pinned icon) if branding
  # failed for any reason - rcedit is itself optional, so this can never block the app opening.
  $brandedExe = Join-Path $app 'node_modules\electron\dist\Ebiki.exe'
  $electronExe = Join-Path $app 'node_modules\electron\dist\electron.exe'
  $exe = if (Test-Path $brandedExe) { $brandedExe } else { $electronExe }
  if (Test-Path $exe) {
    # -WindowStyle Normal is REQUIRED here for the same reason it is for Anki
    # above: this script runs hidden (via launch-ebiki.vbs), and Start-Process
    # with no style of its own hands that hidden show-state to the child - the
    # window would then genuinely open, just invisibly. No --app-window flag -
    # that's the default now (see electron/main.cjs); only --overlay switches
    # modes, and this is never how the overlay gets launched.
    # --from-launcher tells electron/main.cjs that the dev server is being taken
    # care of out here. Without it, a bare launch (the taskbar pin of the running
    # Ebiki.exe, which remembers only the exe path - no arguments, no launcher)
    # has to bootstrap the server itself. See the bare-launch branch in main.cjs.
    return Start-Process -FilePath $exe -ArgumentList ('"' + (Join-Path $app 'electron\main.cjs') + '"'), '--from-launcher' -WorkingDirectory $app -WindowStyle Normal -PassThru
  } else {
    # Nothing writes the ready marker on this path (there is no Electron
    # window to report itself) and a browser tab is its own visible feedback,
    # so the splash is retired right here.
    Start-Process 'http://localhost:3000' -WindowStyle Normal
    Signal-AppReady
  }
}

# One dev server, ever, from the shortcut. Everything from "is it already
# running?" through "start it" runs under a mutex, so double-clicking the
# shortcut - or clicking it again while the first launch is still booting - can
# never race two `npm run dev` into existence: the second launcher waits, then
# sees port 3000 answering and just opens a tab. A manual `npm run dev` is
# deliberately OUTSIDE this; it stays the way to run a second copy on purpose.
$mutex = New-Object System.Threading.Mutex($false, 'Ebiki.Launcher.SingleInstance')
$held = $false
# Wait for the other launcher as long as it can legitimately take (an update question, then fetch
# and npm install). Giving up after 2 minutes and carrying on unlocked ran a second update check,
# git and npm install in the same folder, or started the server on a half-installed node_modules.
try { $held = $mutex.WaitOne(1200000) } catch [System.Threading.AbandonedMutexException] { $held = $true }
if (-not $held) {
  # Still busy after 20 minutes: do not update or start anything. Open whatever is serving, if anything.
  try { if (Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue) { Open-App } } catch {}
  Signal-AppReady
  return
}
try {

# ── Make sure Node/Git are findable ─────────────────────────────────────────
# Right after install, Explorer's PATH can be stale (the registry has Node but
# this process inherited the old PATH), so a shortcut launch might not see npm.
# Refresh PATH from the registry and add the standard install folders if present.
function Ensure-OnPath($cmd, $candidates) {
  if (Get-Command $cmd -ErrorAction SilentlyContinue) { return $true }
  $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
  foreach ($dir in $candidates) {
    if ($dir -and (Test-Path $dir) -and ($env:Path -notlike "*$dir*")) { $env:Path = "$dir;$env:Path" }
  }
  return [bool](Get-Command $cmd -ErrorAction SilentlyContinue)
}
$pf = $env:ProgramFiles; $pfx = ${env:ProgramFiles(x86)}; $lad = $env:LOCALAPPDATA
$hasNode = Ensure-OnPath 'npm' @("$pf\nodejs", "$pfx\nodejs", "$lad\Programs\nodejs")
[void](Ensure-OnPath 'git' @("$pf\Git\cmd", "$pfx\Git\cmd", "$lad\Programs\Git\cmd"))

# NOTE ON ORDER: the PATH repair above MUST come before this branch. The update
# check needs git, and a shortcut launch inherits Explorer's PATH, which is stale
# right after an install - which is the whole reason Ensure-OnPath exists. With
# this branch running first, `Get-Command git` found nothing on exactly those
# machines and Check-Update returned in silence: "I start the app and it never
# offers the update", with nothing on screen and nothing in any log.
# Already running -> show it. If it's already open as an Electron app window,
# requestSingleInstanceLock in electron/main.cjs means this just focuses that
# window instead of opening a second one - the same "click the icon again -> it
# comes to front" behavior a real installed app has, not a fresh browser tab
# piling up next to the old one.
#
# It STILL CHECKS FOR UPDATES here, and that is the fix for "I exited the app and
# reopened it and it never offered the update". Closing the window does not stop
# the dev server immediately: it leaves on a goodbye beacon plus a grace period,
# and up to 150s of silence if that beacon never arrived. So reopening within
# that window found port 3000 still answering and took this branch, which used to
# return without checking anything at all - the one moment the user is plainly
# present and asking for the app, and it was the one path that stayed silent.
# A port that ACCEPTS a connection is not the same question as "is the server
# actually answering requests?" - a wedged Node process (measured cause: a
# synchronous filesystem check against an unreachable shared/mapped drive,
# which blocks Node's single event loop thread on the OS-level connection
# attempt instead of failing fast) still shows up here as LISTENING while
# every real request hangs forever. The old check trusted the bare listen
# state alone, so reopening Ebiki after exactly that kind of freeze just
# reconnected to the same dead service - "I closed it and reopened it and
# it's still stuck", with nothing here ever noticing or fixing it. A real
# HTTP round trip with a short timeout tells the difference.
# THREE tries before "wedged": the shared-folder backup (runBackup) is synchronous and can hold the
# event loop for several seconds on a big share, and a single 4s miss killed a perfectly healthy
# server in the middle of that, cutting whatever the open window was doing. A real wedge hangs
# forever, so it still fails all three.
function Test-ServerHealthy {
  for ($i = 0; $i -lt 3; $i++) {
    try {
      $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/alive' -Method Get -TimeoutSec 4 -UseBasicParsing -ErrorAction Stop
      if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { return $true }
    } catch {
      # Windows PowerShell THROWS on any 4xx, so the check above never saw one: a server that
      # answered at all (another app on 3000 saying 404) counted as wedged and was killed.
      # Any HTTP reply means the process is alive; only no reply is a wedge.
      try { if ($_.Exception.Response) { return $true } } catch {}
    }
    if ($i -lt 2) { Start-Sleep -Seconds 3 }
  }
  return $false
}
# Only ever the process actually holding port 3000 - never anything else on the
# machine. -T sweeps its child tree too (the vite/node process runs under the
# hidden cmd.exe wrapper this same script started it with).
function Stop-StaleServer {
  $owners = Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($ownerPid in $owners) {
    # Only OUR server: a process whose command line names this app folder. Another program that
    # happens to listen on 3000 is left alone (its port conflict is reported by npm run dev instead).
    $cmdLine = $null
    try { $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId=$ownerPid" -ErrorAction Stop).CommandLine } catch {}
    if (-not $cmdLine -or ($cmdLine.IndexOf($app, [StringComparison]::OrdinalIgnoreCase) -lt 0)) { continue }
    try { & taskkill /PID $ownerPid /T /F 2>&1 | Out-Null } catch {}
  }
  # Give Windows a moment to actually release the socket before the normal
  # fresh-start path below immediately re-checks this same port.
  $deadline = (Get-Date).AddSeconds(5)
  while ((Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue) -and (Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 200
  }
}

# ── Quick, seamless update check ────────────────────────────────────────────
# Write down every update decision. "It updated without me clicking yes" is a
# serious claim and used to be unanswerable: nothing recorded who asked, what was
# answered, or whether the checkout actually moved. This makes it evidence instead
# of an argument, and it costs one line of text. logs/ is gitignored and stays on
# this computer.
function Write-UpdateLog($text) {
  try {
    $dir = Join-Path $app 'logs'
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    Add-Content -Path (Join-Path $dir 'update.log') -Value ("{0}  {1}" -f (Get-Date).ToString('s'), $text) -Encoding UTF8
  } catch {}
}

# Is HEAD on PUBLISHED history? Published = on ANY value origin/master has had (its reflog): an earlier fetch
# (the unshallow, an attempt refused as dirty) already moved the ref, and checking only its last value refused
# forever. Plus every commit HEAD was set to FROM the remote (clone, pull, a fast-forward or reset to
# FETCH_HEAD): a clone does not log origin/master's first value. $extra: one more known remote value.
function Test-HeadPublished($app, $extra) {
  $fromRemote = @(& git -C $app reflog show --format='%H %gs' HEAD 2>$null | Select-Object -First 500 |
    Where-Object { $_ -match '^[0-9a-f]+ (clone:|reset: moving to FETCH_HEAD\s*$|(pull[^:]*|merge [0-9a-f]{7,}): Fast-forward\s*$)' } | ForEach-Object { ($_ -split ' ')[0] })
  $cands = @(& git -C $app reflog show --format=%H refs/remotes/origin/master 2>$null | Select-Object -First 200) + $fromRemote + @($extra)
  foreach ($c in ($cands | Where-Object { $_ } | Select-Object -Unique)) {
    & git -C $app merge-base --is-ancestor HEAD $c 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) { return $true }
  }
  return $false
}

function Check-Update {
  param([switch]$AlreadyRunning)
  # ALWAYS check. There is deliberately no snooze on this path any more: it used
  # to skip the check entirely for a week after a single "not now", which is how
  # someone stayed on a build with an already-fixed bug without the app ever
  # mentioning it again. Opening the shortcut is the one moment we know the user
  # is present and the app is not yet in the way, so it is the right moment to
  # ask, every time. Saying no is free (it just opens), and the check itself is a
  # refs-only lookup behind a 6s timeout, so this can never slow a launch down.
  $snooze = Join-Path $app '.update-snooze'
  # Sweep the marker older versions left behind, so nothing can silently suppress
  # a future check.
  Remove-Item $snooze -Force -ErrorAction SilentlyContinue
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Write-UpdateLog 'skipped: git is not on PATH'; return }
  # Never a sign-in window: when GitHub answers "authentication required" (the repository moved, an
  # authenticating proxy), Git Credential Manager opened a login dialog, and the foreground fetches below
  # waited on it with no timeout, so the launch hung behind the splash. /api/update sets the same.
  $env:GIT_TERMINAL_PROMPT = '0'; $env:GCM_INTERACTIVE = 'never'; $env:GIT_ASKPASS = 'echo'
  $local = (& git -C $app rev-parse HEAD 2>$null)
  if (-not $local) { Write-UpdateLog 'skipped: this folder is not a git checkout'; return }
  # The checkout must be Ebiki's OWN: a ZIP install without .git inside another repository (a home-folder
  # dotfiles repo) read THAT repo's HEAD, offered its changes as an Ebiki update, and a Yes reset it.
  # --show-cdup prints NOTHING at the top of a checkout ("../" deeper in someone else's). No path compare: git
  # prints paths as UTF-8 while this hidden console decodes with the OEM code page, so an app folder under
  # C:\Users\Jose-with-an-accent never matched and was never offered an update.
  $cdup = (& git -C $app rev-parse --show-cdup 2>$null)
  if ($LASTEXITCODE -ne 0 -or "$cdup".Trim()) { Write-UpdateLog "skipped: $app is not the top of its own git checkout"; return }
  # Updates come from master, always. A clone parked on another branch would
  # compare its HEAD against origin/master forever - offered an update on every
  # single launch that then cannot apply, because pulling master into another
  # branch is not a fast-forward. Say nothing on those; whoever checked out a
  # branch knows how to update it.
  $branch = (& git -C $app rev-parse --abbrev-ref HEAD 2>$null)
  if ($branch -and $branch -ne 'master') { Write-UpdateLog "skipped: on branch '$branch', updates track master"; return }
  # An older installer linked ZIP folders with --depth 1. That clone can pull, but
  # it has no history to diff or roll back through, and it reports "build 1" so the
  # version line has to hide the build number entirely. Deepen it once, quietly, the
  # first time we are here with a working network. Fail-soft: offline just leaves it.
  Set-Status (Tr 'ln_checkingUpdates')

  # Compare against 'master' (the release branch), whatever local branch this
  # clone is on. Look up just its remote head (fast, refs only) with a hard 6s
  # timeout so a slow or offline network can never delay the launch.
  $job = Start-Job { param($a) (& git -C $a ls-remote origin refs/heads/master 2>$null) } -ArgumentList $app
  $line = $null
  if (Wait-Job $job -Timeout 6) { $line = Receive-Job $job }
  Remove-Job $job -Force -ErrorAction SilentlyContinue
  if (-not $line) { Write-UpdateLog 'skipped: could not reach GitHub within 6s'; return }   # open normally
  # Only now that GitHub answered (offline, it cost the full network timeout on every launch), and with a
  # low-speed limit: a stalled transfer hung here with the launcher lock held.
  if (Test-Path (Join-Path $app '.git\shallow')) {
    Set-Status (Tr 'ln_fillingHistory')
    & git -C $app -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=20 fetch --unshallow 2>&1 | Out-Null
    Set-Status (Tr 'ln_checkingUpdates')
  }
  $remote = (($line | Select-Object -First 1) -split '\s+')[0]
  if (-not $remote -or $remote -eq $local) { Write-UpdateLog 'no update: already on the latest release'; return }
  # This copy has its own (never published) commits on master: an update can never apply (it is refused to keep
  # them), and every launch asked anyway. Not only when AHEAD: once master moves on, the copy has DIVERGED and was
  # asked on every launch forever. The current origin/master counts as published (an expired reflog). A retracted
  # release (HEAD published) still asks.
  $originNow = (& git -C $app rev-parse -q --verify refs/remotes/origin/master 2>$null)
  if (-not (Test-HeadPublished $app $originNow)) { Write-UpdateLog 'no update: this copy has its own commits on master'; return }

  # Update available -> ask IN THE SPLASH (see Ask-InSplash). One window, already
  # on screen and in front, so there is nothing left for the question to hide
  # behind.
  $msg = Tr 'ln_updateReady'
  $ans = Ask-InSplash $msg 90
  if ($ans -eq 'nosplash') {
    # No splash to ask in (mshta missing, or this script run on its own). Fall back
    # to a dialog - TOPMOST (4096 = MB_SYSTEMMODAL) and brought to the front
    # (65536 = MB_SETFOREGROUND) so at least it cannot end up behind something.
    $r = (New-Object -ComObject WScript.Shell).Popup(
      ("{0}`n`n{1}" -f $msg, (Tr 'ln_updateAskNow')),
      60, (Tr 'ln_updateDialogTitle'), 4 + 32 + 4096 + 65536)   # 4 = Yes/No, 32 = question icon
    $ans = if ($r -eq 6) { 'yes' } elseif ($r -eq 7) { 'no' } else { 'timeout' }
  }
  Write-UpdateLog ("launcher: update available ({0} -> {1}); answer='{2}'{3}" -f $local.Substring(0,7), $remote.Substring(0,7), $ans, $(if ($AlreadyRunning) { ' (app already running)' } else { '' }))
  if ($ans -eq 'yes') {
    Set-Status (Tr 'ln_updating')
    # MATCH master, do not merely move toward it. `pull --ff-only` is only correct
    # while master goes forwards; a maintainer who retracts a bad release moves it
    # BACKWARDS, and with the local commit ahead that pull exits 0 saying "Already
    # up to date" while changing nothing - so the launcher would offer the same
    # update at every start, report success every time, and never move a file.
    # Where master WAS before this fetch: a reset is only for a checkout that sits on published history
    # (a retracted release). Local commits on master were never published, and a reset threw them away.
    $oldOrigin = (& git -C $app rev-parse -q --verify refs/remotes/origin/master 2>$null)
    & git -C $app -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=20 fetch origin master 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
      # Ancestor = master moved forward, so fast-forward. Otherwise it was rewound
      # or rewritten, and the only way back to what master IS is to match it - which
      # is refused if any TRACKED file was modified, so nobody's edits are lost.
      & git -C $app merge-base --is-ancestor HEAD FETCH_HEAD 2>&1 | Out-Null
      if ($LASTEXITCODE -eq 0) {
        & git -C $app merge --ff-only FETCH_HEAD 2>&1 | Out-Null
      } elseif (-not (& git -C $app status --porcelain --untracked-files=no 2>$null)) {
        if (Test-HeadPublished $app $oldOrigin) { & git -C $app reset --hard FETCH_HEAD 2>&1 | Out-Null }
        else { Write-UpdateLog 'refused: this copy has commits on master that were never published (kept)' }
      } else {
        # The skip reason, not only the generic "update FAILED" below (launch.sh logs the same).
        Write-UpdateLog 'refused: tracked files have local changes (kept)'
      }
    } else {
      Write-UpdateLog 'fetch of origin master failed'
    }
    $now = (& git -C $app rev-parse HEAD 2>$null)
    if ($now -eq $local) {
      # Nothing moved: the fetch failed, a hand-edited tracked file blocked matching master, or
      # git refused the merge. Carrying on as if it worked told the user "Update installed" and
      # logged "applied" while the old version kept running.
      Set-Status (Tr 'ln_updateFailed')
      Start-Sleep -Seconds 3
      Write-UpdateLog ("launcher: update FAILED, still at {0}" -f $local.Substring(0,7))
    } else {
      Set-Status (Tr 'ln_installingUpdate')
      # A failed install (network hiccup, files locked by the running server) was never retried: HEAD
      # now matches master, so no later launch ran npm install and the new code ran on the old
      # dependencies for good. The marker makes the next fresh start install first. Written BEFORE the
      # install and cleared on success, so an install cut off midway (window closed, reboot) counts too.
      $npmMarker = Join-Path $app '.npm-install-pending'
      try { Set-Content -Path $npmMarker -Value (Get-Date).ToString('s') -Encoding ASCII } catch {}
      $npmExit = Invoke-NpmInstall (Tr 'ln_installingLabel')
      $script:npmTriedThisRun = $true   # a failure is retried on the NEXT start, not straight away (see below)
      if ($npmExit -eq 0) { Remove-Item -Force $npmMarker -ErrorAction SilentlyContinue; Save-DepsStamp }
      else { Write-UpdateLog ("launcher: npm install failed (exit {0}); will retry on the next start" -f $npmExit) }
      # When the app was already up, the running copy is still serving the OLD code
      # (the dev server cannot reload vite.config.js or new dependencies live), so
      # say the one thing that finishes the job rather than pretending it is done.
      if ($AlreadyRunning) { Set-Status (Tr 'ln_updateInstalledReopen'); Start-Sleep -Seconds 4 }
      Write-UpdateLog ("launcher: applied, now at {0}" -f (& git -C $app rev-parse --short HEAD 2>$null))
    }
  } else {
    Write-UpdateLog 'launcher: nothing changed'
  }
  # 'no' -> just open. Nothing is recorded, so the next launch asks again.
  # 'timeout' (nobody was at the computer) -> open normally. Nothing is lost
  # either way: the next launch asks again, and Settings > Data & updates
  # offers it inside the app.
  Set-Status (Tr 'ln_startingServer')
}

# ORDER: Write-UpdateLog and Check-Update MUST be defined above this branch.
# PowerShell only defines a function once execution reaches it, so when they
# sat further down, `Check-Update -AlreadyRunning` below threw "not recognized"
# and the surrounding catch swallowed it: reopening Ebiki while its server was
# still alive never offered the update and never logged why.
if (Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue) {
  if (Test-ServerHealthy) {
    # Not in a FOLLOWER (a second click while the first launch was busy): the first launch just asked, and
    # re-asking popped a second "Update now?" right after the user answered "Not now" in the splash.
    # Nor while the running app is updating itself (Settings > Data & updates): a Yes here ran a second
    # npm install in the same node_modules.
    $appUpdating = $false
    try { $appUpdating = [bool]((Invoke-RestMethod -Uri 'http://localhost:3000/api/alive' -TimeoutSec 4).updateRunning) } catch {}
    if ($appUpdating) { Write-UpdateLog 'skipped: the running app is installing an update' }
    elseif (-not $follower) { try { Check-Update -AlreadyRunning } catch {} }
    Wait-AppReady (Open-App)
    return
  }
  # Something is listening on 3000 but not actually answering: a wedged server
  # from an earlier session, not a working one. Reusing it would just reproduce
  # the exact freeze the user is trying to escape by reopening the app, so stop
  # it and fall through to the normal fresh-start path below instead of
  # returning. Logged so this decision is traceable exactly like every other one
  # on this path.
  Write-UpdateLog 'launcher: port 3000 was listening but not answering - stopped the stale server and starting fresh'
  Set-Status (Tr 'ln_serverRestart')
  Stop-StaleServer
}

if (-not $hasNode) {
  # Can't run without Node. Point the user at the installer rather than failing silently.
  # Splash down FIRST and the dialog on top (system-modal + foreground): opened under the splash with no timeout,
  # it was never seen, and it held the launcher lock, so every later click waited on it and opened nothing.
  Signal-AppReady; Clear-Status
  [void](New-Object -ComObject WScript.Shell).Popup(
    (Tr 'ln_noNode'),
    300, 'Ebiki', 16 + 4096 + 65536)   # stop icon + MB_SYSTEMMODAL + MB_SETFOREGROUND; 5 min cap
  return
}

if (-not $follower) { try { Check-Update } catch {} } # see the already-running branch

# ── Start the dev server hidden, then open the app ourselves ────────────────
# EBIKI_AUTO_EXIT marks this as a SHORTCUT launch, which changes THREE things in
# vite.config.js: the server shuts itself down once the last browser tab (or, now,
# the app window) is gone (nothing on screen says a hidden server is running, so
# closing it used to leave it alive for days, still serving code from before the
# last update); it must own port 3000 or fail rather than quietly sliding to 3001
# as a second invisible instance; and Vite's own open:true is turned OFF, since
# Open-App below opens the real app window/tab itself - leaving open:true on
# would additionally pop a plain browser tab next to it. All inherited by the
# child process via the environment.
$env:EBIKI_AUTO_EXIT = '1'
# An update whose npm install failed (here or from Settings) finishes now, before the server starts.
$pendingInstall = Join-Path $app '.npm-install-pending'
# Code that changed WITHOUT an update (a manual git pull, a branch switch, a copy from another computer) runs on
# the old node_modules: when the dependency lists differ from the last install, install first (through the pending
# marker). It compares the code as it is now, so being several updates behind is covered too.
if (-not (Test-Path $pendingInstall) -and -not $script:npmTriedThisRun -and (Test-DepsStale)) {
  Write-UpdateLog 'launcher: dependencies changed since the last install; installing'
  try { Set-Content -Path $pendingInstall -Value (Get-Date).ToString('s') -Encoding ASCII } catch {}
}
# Not when this launch's update just tried (and failed): a second 15-minute attempt held the splash and the launcher
# lock for half an hour. The marker stays, so the next start retries.
if ((Test-Path $pendingInstall) -and -not $script:npmTriedThisRun) {
  # An install started by Settings can outlive the server it took down: wait for that one (its PID is in the
  # marker) before running another in the same node_modules. Capped at 15 minutes.
  try {
    $mark = Get-Content -Raw -LiteralPath $pendingInstall -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
    if ($mark.pid) {
      $waitUntil = (Get-Date).AddMinutes(15); $t0 = Get-Date
      while ((Get-Date) -lt $waitUntil) {
        $p = Get-Process -Id ([int]$mark.pid) -ErrorAction SilentlyContinue
        if (-not $p -or @('cmd', 'node', 'npm') -notcontains $p.ProcessName.ToLower()) { break }
        # A reused PID (a reboot, days later) is a process that started AFTER the marker: not the install.
        try { if ($mark.at -and $p.StartTime -gt ([datetime]$mark.at).AddSeconds(5)) { break } } catch { break }
        Set-Status (Tr 'ln_waitingLastUpdate' @{ s = [int]((Get-Date) - $t0).TotalSeconds })
        Start-Sleep -Seconds 5
      }
    }
  } catch { }
  Set-Status (Tr 'ln_finishingUpdate')
  $npmExit = Invoke-NpmInstall ((Tr 'ln_finishingUpdate').TrimEnd('.', [char]0x3002))
  if ($npmExit -eq 0) { Remove-Item -Force $pendingInstall -ErrorAction SilentlyContinue; Save-DepsStamp; Write-UpdateLog 'launcher: finished the pending npm install' }
  else { Write-UpdateLog ("launcher: pending npm install failed again (exit {0})" -f $npmExit) }
}
Set-Status (Tr 'ln_startingServer')
Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npm run dev' -WorkingDirectory $app -WindowStyle Hidden
$deadline = (Get-Date).AddSeconds(60)
do { Start-Sleep -Milliseconds 800 } until (
  (Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue) -or ((Get-Date) -gt $deadline)
)
Set-Status (Tr 'ln_opening')
Wait-AppReady (Open-App)

}
finally {
  # Whatever happened above (an early return, the Node popup, a crash), the
  # splash must never be left sitting on screen. Idempotent - on the normal
  # path Electron already wrote the marker itself.
  Signal-AppReady
  Clear-Status
  if (-not $follower) {
    try { Remove-Item $answerFile -Force -ErrorAction SilentlyContinue } catch {}
    try { Remove-Item $splashMarker -Force -ErrorAction SilentlyContinue } catch {}
  }
  # Release only once the server is up (or gave up), so a second launcher that
  # was waiting sees a listening port rather than deciding to start its own.
  if ($held) { try { $mutex.ReleaseMutex() } catch {} }
  $mutex.Dispose()
}

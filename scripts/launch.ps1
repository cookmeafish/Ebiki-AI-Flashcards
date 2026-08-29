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
function Signal-AppReady {
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
function Set-Status($text) {
  # ASCII on purpose: the splash reads this with FileSystemObject, which would
  # render a UTF-8 BOM as visible junk at the start of the line. Every message
  # here is plain ASCII, so nothing is lost.
  try { Set-Content -Path $statusFile -Value $text -Encoding ASCII -ErrorAction Stop } catch {}
}
function Clear-Status {
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
function Ask-InSplash($text, $timeoutSec) {
  try { Remove-Item $answerFile -Force -ErrorAction SilentlyContinue } catch {}
  # The splash is started a fraction of a second before this script and paints in
  # a few hundred ms, but never assume it: give it a moment to announce itself and
  # otherwise report back so the caller can use its own dialog.
  $wait = (Get-Date).AddSeconds(3)
  while (-not (Test-Path $splashMarker) -and (Get-Date) -lt $wait) { Start-Sleep -Milliseconds 150 }
  if (-not (Test-Path $splashMarker)) { return 'nosplash' }
  Set-Status "PROMPT|$text"
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
        Set-Status 'Starting Ebiki.'
        if ($v -eq 'yes') { return 'yes' } else { return 'no' }
      }
    }
    Start-Sleep -Milliseconds 200
  }
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
# Ebiki talks to Anki through AnkiConnect on 127.0.0.1:8765, so without Anki
# running the Deck / Study / Discover tabs sit on "Anki is not connected".
# Started FIRST (before the dev server) so it boots in parallel and is usually
# ready by the time the browser opens, and MINIMIZED (see Start-AnkiIfNeeded):
# you clicked Ebiki, so Anki belongs on the taskbar, not on top of it. That used
# to be a normal window because otherwise nothing on screen said the launch was
# happening at all - the start-up splash covers that now. Fail-soft everywhere -
# the app still opens without it.
# Anki 25.x changed shape: the thing the website installs to
# %LOCALAPPDATA%\Programs\Anki\anki.exe is only a LAUNCHER. It bootstraps the
# real Anki (a uv-managed venv under %LOCALAPPDATA%\AnkiProgramFiles) and then
# EXITS. Two consequences, both of which used to break this function:
#   - "is anki.exe running?" is not the same question as "is Anki up?", because
#     the process that survives is the venv one, not the launcher.
#   - the real binary lives somewhere the old fixed path list never looked.
# So test for Anki by what Ebiki actually needs (AnkiConnect answering), and
# treat any Anki-owned process as "already starting".
function Test-AnkiUp {
  if (Get-NetTCPConnection -State Listen -LocalPort 8765 -ErrorAction SilentlyContinue) { return $true }
  # Booting but not serving yet. anki/ankiw are Anki by name; pythonw is far too
  # generic to trust, so it only counts when its image really is under Anki.
  foreach ($n in 'anki', 'ankiw') {
    if (Get-Process -Name $n -ErrorAction SilentlyContinue) { return $true }
  }
  foreach ($p in (Get-Process -Name 'pythonw' -ErrorAction SilentlyContinue)) {
    try { if ($p.Path -like '*Anki*') { return $true } } catch {}   # Path throws on denied
  }
  return $false
}

# WHERE to launch from. Ordered by preference, not just by likelihood: the
# launcher is the SUPPORTED entry point (it self-updates and picks the right
# venv), so it wins when present; the venv binary is the fallback for machines
# where only the older layout exists.
function Find-AnkiExe {
  $pf = $env:ProgramFiles; $pfx = ${env:ProgramFiles(x86)}; $lad = $env:LOCALAPPDATA
  foreach ($p in @("$lad\Programs\Anki\anki.exe",            # 25.x launcher
                   "$pf\Anki\anki.exe", "$pfx\Anki\anki.exe", # classic installs
                   "$lad\AnkiProgramFiles\.venv\Scripts\anki.exe")) {
    if ($p -and (Test-Path $p)) { return $p }
  }
  # Registered by some builds even when the folder layout is non-standard.
  foreach ($h in 'HKLM:', 'HKCU:') {
    $k = "$h\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\anki.exe"
    try {
      if (Test-Path $k) {
        $v = (Get-ItemProperty $k -ErrorAction Stop).'(default)'
        if ($v -and (Test-Path $v)) { return $v }
      }
    } catch {}
  }
  $c = Get-Command anki -ErrorAction SilentlyContinue
  if ($c) { return $c.Source }
  # Uninstall entries record where it went, even for unusual install locations.
  foreach ($k in @('HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
                   'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
                   'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*')) {
    foreach ($e in (Get-ItemProperty $k -ErrorAction SilentlyContinue |
                    Where-Object { $_.DisplayName -match '^Anki' })) {
      $dir = $e.InstallLocation
      if (-not $dir -and $e.UninstallString) { $dir = Split-Path ($e.UninstallString -replace '"', '') -Parent }
      if ($dir) {
        $exe = Join-Path $dir 'anki.exe'
        if (Test-Path $exe) { return $exe }
      }
    }
  }
  # Last resort: the Start Menu shortcut is the only thing left that knows.
  foreach ($root in @([Environment]::GetFolderPath('Programs'), [Environment]::GetFolderPath('CommonPrograms'))) {
    if (-not $root) { continue }
    $lnk = Get-ChildItem $root -Filter 'Anki.lnk' -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($lnk) { return $lnk.FullName }
  }
  return $null
}

function Start-AnkiIfNeeded {
  # Anki is single-instance; a second launch just pops a dialog at the user.
  if (Test-AnkiUp) { return }
  $exe = Find-AnkiExe
  if (-not $exe) { return }   # Anki not installed -> nothing to do
  # MINIMIZED, not hidden and not normal. Ebiki needs Anki running (every card
  # goes through AnkiConnect), but you clicked EBIKI - Anki taking the screen is
  # just in the way. It used to open Normal so the launch was visibly happening
  # at all; the start-up splash says that now, so Anki can go straight to the
  # taskbar. NEVER give this Start-Process no window style: launch-ebiki.vbs
  # runs this script through `powershell -WindowStyle Hidden`, and a child with
  # no style of its own inherits that HIDDEN state - Anki then really does start
  # and AnkiConnect answers on 8765, but no window ever appears (MainWindowHandle
  # stays 0) and the user reports that Ebiki never launched Anki.
  Start-Process -FilePath $exe -WindowStyle Minimized
  # Asking is not enough: what the website installs is a LAUNCHER that boots the
  # real Anki out of a venv and exits, and the show-state never reaches the
  # window that second process creates. minimize-anki.ps1 watches for the window
  # and puts it away. Detached (its own hidden process) so it outlives this
  # script - Anki can take longer to paint than the whole launch takes.
  $minimizer = Join-Path $PSScriptRoot 'minimize-anki.ps1'
  if (Test-Path $minimizer) {
    Start-Process -FilePath 'powershell' -WindowStyle Hidden -ArgumentList @(
      '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $minimizer)
  }
}
Set-Status 'Waking up Anki and the study server.'
try { Start-AnkiIfNeeded } catch {}

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
    return Start-Process -FilePath $exe -ArgumentList (Join-Path $app 'electron\main.cjs'), '--from-launcher' -WorkingDirectory $app -WindowStyle Normal -PassThru
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
try { $held = $mutex.WaitOne(120000) } catch [System.Threading.AbandonedMutexException] { $held = $true }
try {

# Already running -> just show it (don't disrupt or re-check). If it's already
# open as an Electron app window, requestSingleInstanceLock in electron/main.cjs
# means this just focuses that window instead of opening a second one - the
# same "click the icon again -> it comes to front" behavior a real installed
# app has, not a fresh browser tab piling up next to the old one.
if (Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue) {
  Wait-AppReady (Open-App)
  return
}

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

if (-not $hasNode) {
  # Can't run without Node. Point the user at the installer rather than failing silently.
  [void](New-Object -ComObject WScript.Shell).Popup(
    "Ebiki could not find Node.js.`n`nRun 'Install Ebiki.bat' in the Ebiki folder, then sign out and back in once.",
    0, 'Ebiki', 16)   # 16 = stop icon
  return
}

# ── Quick, seamless update check ────────────────────────────────────────────
function Check-Update {
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
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) { return }
  $local = (& git -C $app rev-parse HEAD 2>$null)
  if (-not $local) { return }
  # Updates come from master, always. A clone parked on another branch would
  # compare its HEAD against origin/master forever - offered an update on every
  # single launch that then cannot apply, because pulling master into another
  # branch is not a fast-forward. Say nothing on those; whoever checked out a
  # branch knows how to update it.
  $branch = (& git -C $app rev-parse --abbrev-ref HEAD 2>$null)
  if ($branch -and $branch -ne 'master') { return }
  Set-Status 'Checking for updates.'

  # Compare against 'master' (the release branch), whatever local branch this
  # clone is on. Look up just its remote head (fast, refs only) with a hard 6s
  # timeout so a slow or offline network can never delay the launch.
  $job = Start-Job { param($a) (& git -C $a ls-remote origin master 2>$null) } -ArgumentList $app
  $line = $null
  if (Wait-Job $job -Timeout 6) { $line = Receive-Job $job }
  Remove-Job $job -Force -ErrorAction SilentlyContinue
  if (-not $line) { return }                       # unreachable -> open normally
  $remote = (($line | Select-Object -First 1) -split '\s+')[0]
  if (-not $remote -or $remote -eq $local) { return }  # up to date -> open normally

  # Update available -> ask IN THE SPLASH (see Ask-InSplash). One window, already
  # on screen and in front, so there is nothing left for the question to hide
  # behind.
  $msg = 'A new version of Ebiki is ready. Updating usually takes under a minute, and Ebiki opens straight after.'
  $ans = Ask-InSplash $msg 90
  if ($ans -eq 'nosplash') {
    # No splash to ask in (mshta missing, or this script run on its own). Fall back
    # to a dialog - TOPMOST (4096 = MB_SYSTEMMODAL) and brought to the front
    # (65536 = MB_SETFOREGROUND) so at least it cannot end up behind something.
    $r = (New-Object -ComObject WScript.Shell).Popup(
      "$msg`n`nUpdate now?",
      60, 'Ebiki update', 4 + 32 + 4096 + 65536)   # 4 = Yes/No, 32 = question icon
    $ans = if ($r -eq 6) { 'yes' } elseif ($r -eq 7) { 'no' } else { 'timeout' }
  }
  if ($ans -eq 'yes') {
    Set-Status 'Updating Ebiki. This can take a minute, please wait.'
    # MATCH master, do not merely move toward it. `pull --ff-only` is only correct
    # while master goes forwards; a maintainer who retracts a bad release moves it
    # BACKWARDS, and with the local commit ahead that pull exits 0 saying "Already
    # up to date" while changing nothing - so the launcher would offer the same
    # update at every start, report success every time, and never move a file.
    & git -C $app fetch origin master 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
      # Ancestor = master moved forward, so fast-forward. Otherwise it was rewound
      # or rewritten, and the only way back to what master IS is to match it - which
      # is refused if any TRACKED file was modified, so nobody's edits are lost.
      & git -C $app merge-base --is-ancestor HEAD FETCH_HEAD 2>&1 | Out-Null
      if ($LASTEXITCODE -eq 0) {
        & git -C $app merge --ff-only FETCH_HEAD 2>&1 | Out-Null
      } elseif (-not (& git -C $app status --porcelain --untracked-files=no 2>$null)) {
        & git -C $app reset --hard FETCH_HEAD 2>&1 | Out-Null
      }
    }
    Set-Status 'Installing the update. Almost done.'
    & cmd /c "cd /d ""$app"" && npm install --no-fund --no-audit" 2>&1 | Out-Null
  }
  # 'no' -> just open. Nothing is recorded, so the next launch asks again.
  # 'timeout' (nobody was at the computer) -> open normally. Nothing is lost
  # either way: the app itself carries the same offer as a banner once it is up,
  # and keeps bringing it back.
  Set-Status 'Starting the study server.'
}
try { Check-Update } catch {}

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
Set-Status 'Starting the study server.'
Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npm run dev' -WorkingDirectory $app -WindowStyle Hidden
$deadline = (Get-Date).AddSeconds(60)
do { Start-Sleep -Milliseconds 800 } until (
  (Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue) -or ((Get-Date) -gt $deadline)
)
Set-Status 'Opening Ebiki.'
Wait-AppReady (Open-App)

}
finally {
  # Whatever happened above (an early return, the Node popup, a crash), the
  # splash must never be left sitting on screen. Idempotent - on the normal
  # path Electron already wrote the marker itself.
  Signal-AppReady
  Clear-Status
  try { Remove-Item $answerFile -Force -ErrorAction SilentlyContinue } catch {}
  try { Remove-Item $splashMarker -Force -ErrorAction SilentlyContinue } catch {}
  # Release only once the server is up (or gave up), so a second launcher that
  # was waiting sees a listening port rather than deciding to start its own.
  if ($held) { try { $mutex.ReleaseMutex() } catch {} }
  $mutex.Dispose()
}

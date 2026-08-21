# Ebiki launcher (invoked hidden by launch-ebiki.vbs).
# 1) Make sure Anki is up (the app reads/writes every card through AnkiConnect).
# 2) If the app is already running, just open the tab.
# 3) Otherwise do a QUICK update check (skipped when snoozed or offline), offer
#    to update, then start the dev server (which opens the browser itself).
# Path-relative so it works wherever the app is installed; this script lives in
# scripts/, so the app folder is one level up.
$app = Split-Path $PSScriptRoot -Parent

# ── Start Anki if it isn't up ───────────────────────────────────────────────
# Ebiki talks to Anki through AnkiConnect on 127.0.0.1:8765, so without Anki
# running the Deck / Study / Discover tabs sit on "Anki is not connected".
# Started FIRST (before the dev server) so it boots in parallel and is usually
# ready by the time the browser opens. Opened in a normal window so the tandem
# launch is visible: minimized, it went straight to the taskbar and people
# assumed it had not started at all. Fail-soft everywhere - the app still opens
# without it.
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
  # -WindowStyle Normal is REQUIRED, not cosmetic. launch-ebiki.vbs runs this
  # script through `powershell -WindowStyle Hidden`, and a Start-Process with no
  # style of its own passes that HIDDEN show-state down to the child. Anki then
  # really does start - AnkiConnect answers on 8765 - but its window never
  # appears (MainWindowHandle stays 0), so every deck action works while the user
  # sees no Anki at all and reports that Ebiki never launched it.
  Start-Process -FilePath $exe -WindowStyle Normal
}
try { Start-AnkiIfNeeded } catch {}

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

# Already running -> just show it (don't disrupt or re-check).
if (Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue) {
  # Normal for the same reason as Anki above: this script runs hidden, and a
  # browser that is not already open would inherit that and start invisible.
  Start-Process 'http://localhost:3000' -WindowStyle Normal
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
  $snooze = Join-Path $app '.update-snooze'
  # Snoozed (user said "not now" within the last week)? Skip silently.
  if (Test-Path $snooze) {
    try { if ([datetime]::Parse((Get-Content $snooze -Raw)) -gt (Get-Date)) { return } } catch {}
  }
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) { return }
  $local = (& git -C $app rev-parse HEAD 2>$null)
  if (-not $local) { return }

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

  # Update available -> ask. Auto-dismisses to "open normally" after 60s.
  $ans = (New-Object -ComObject WScript.Shell).Popup(
    "A new version of Ebiki is available.`n`nUpdate now? It only takes a few seconds.",
    60, 'Ebiki update', 4 + 32)   # 4 = Yes/No, 32 = question icon
  if ($ans -eq 6) {                                # Yes
    & git -C $app pull --ff-only origin master 2>&1 | Out-Null
    & cmd /c "cd /d ""$app"" && npm install --no-fund --no-audit" 2>&1 | Out-Null
    Remove-Item $snooze -Force -ErrorAction SilentlyContinue
  } elseif ($ans -eq 7) {                          # No -> don't ask again for a week
    (Get-Date).AddDays(7).ToString('o') | Set-Content $snooze
  }
  # -1 (timed out) -> just open normally, ask again next time
}
try { Check-Update } catch {}

# ── Start the dev server hidden (its own open:true opens the browser) ───────
# EBIKI_AUTO_EXIT marks this as a SHORTCUT launch, which changes two things in
# vite.config.js: the server shuts itself down once the last browser tab is gone
# (nothing on screen says a hidden server is running, so closing the tab used to
# leave it alive for days, still serving code from before the last update), and
# it must own port 3000 or fail rather than quietly sliding to 3001 as a second
# invisible instance. Inherited by the child process.
$env:EBIKI_AUTO_EXIT = '1'
Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npm run dev' -WorkingDirectory $app -WindowStyle Hidden
$deadline = (Get-Date).AddSeconds(60)
do { Start-Sleep -Milliseconds 800 } until (
  (Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue) -or ((Get-Date) -gt $deadline)
)

}
finally {
  # Release only once the server is up (or gave up), so a second launcher that
  # was waiting sees a listening port rather than deciding to start its own.
  if ($held) { try { $mutex.ReleaseMutex() } catch {} }
  $mutex.Dispose()
}

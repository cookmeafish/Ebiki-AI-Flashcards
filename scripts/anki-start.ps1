# Starting Anki for Ebiki: find it, repair/update it (scripts/anki-update.ps1), start it.
#
# ONE implementation, two callers:
#   - scripts/launch.ps1 dot-sources this file (define only) and calls Start-AnkiIfNeeded, with the
#     start-up splash available for the update question and status lines;
#   - the dev server runs it with -Start (the in-app "Open Anki" button, via /api/anki-start) when
#     Anki is not open at all. There is no splash then, so the update question falls back to a
#     topmost dialog, and status lines go nowhere.
param([switch]$Start)

if (-not $app) { $app = Split-Path $PSScriptRoot -Parent }

function Write-AnkiStartLog($text) {
  try {
    $dir = Join-Path $app 'logs'
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    Add-Content -Path (Join-Path $dir 'anki-update.log') -Value ("{0}  {1}" -f (Get-Date).ToString('s'), $text) -Encoding UTF8
  } catch {}
}

# The real Anki (the venv interpreter under AnkiProgramFiles, or a classic install's own process).
function Get-RealAnkiProcess {
  foreach ($n in 'pythonw', 'python') {
    foreach ($p in (Get-Process -Name $n -ErrorAction SilentlyContinue)) {
      try { if ($p.Path -match '[\\/](Anki|AnkiProgramFiles)[\\/]') { return $p } } catch {}   # Path throws on denied
    }
  }
  return $null
}

# Anki's LAUNCHER stuck in its terminal: `anki-console.exe` only exists when the launcher switched to
# its console (the version menu, an install, or an error waiting on "Press enter to close"). It is
# STUCK - not busy - when it has been there a while, Anki itself is not running, AnkiConnect is not
# answering, and no install is in progress (uv would be running). Measured on a real machine: a
# failed update left anki.exe + anki-console.exe waiting on "Press enter to close" for hours, and
# because an `anki` process existed, every launch decided Anki was "already starting" and never
# started it. Returns the processes to close, or an empty list.
function Get-StuckAnkiLauncher {
  $consoles = @(Get-Process -Name 'anki-console' -ErrorAction SilentlyContinue)
  if (-not $consoles.Count) { return @() }
  if (Get-NetTCPConnection -State Listen -LocalPort 8765 -ErrorAction SilentlyContinue) { return @() }
  if (Get-RealAnkiProcess) { return @() }
  if (Get-Process -Name 'uv' -ErrorAction SilentlyContinue) { return @() }        # an install is running: never interrupt it
  $young = $consoles | Where-Object { try { ((Get-Date) - $_.StartTime).TotalSeconds -lt 15 } catch { $false } }
  if ($young) { return @() }                                                    # just opened: give it a moment
  $procs = @($consoles)
  foreach ($p in (Get-Process -Name 'anki' -ErrorAction SilentlyContinue)) {
    try { if ($p.Path -like '*\Anki\anki.exe') { $procs += $p } } catch {}
  }
  return $procs
}

function Close-StuckAnkiLauncher {
  $stuck = @(Get-StuckAnkiLauncher)
  if (-not $stuck.Count) { return $false }
  Write-AnkiStartLog ("closed Anki's stuck launcher console (pids {0})" -f (($stuck | ForEach-Object { $_.Id }) -join ', '))
  foreach ($p in $stuck) { try { Stop-Process -Id $p.Id -Force -ErrorAction Stop } catch {} }
  $deadline = (Get-Date).AddSeconds(5)
  while ((Get-Process -Name 'anki-console' -ErrorAction SilentlyContinue) -and (Get-Date) -lt $deadline) { Start-Sleep -Milliseconds 200 }
  return $true
}

# Ebiki talks to Anki through AnkiConnect on 127.0.0.1:8765, so test for Anki by what Ebiki actually
# needs, and treat any Anki-owned process as "already starting". Anki 25.x changed shape: what the
# website installs to %LOCALAPPDATA%\Programs\Anki\anki.exe is only a LAUNCHER that bootstraps the
# real Anki (a uv-managed venv under %LOCALAPPDATA%\AnkiProgramFiles) and then EXITS, so "is anki.exe
# running?" is not the same question as "is Anki up?". Callers close a STUCK launcher first (above),
# so a leftover console can no longer masquerade as a starting Anki.
function Test-AnkiUp {
  if (Get-NetTCPConnection -State Listen -LocalPort 8765 -ErrorAction SilentlyContinue) { return $true }
  foreach ($n in 'anki', 'ankiw') {
    if (Get-Process -Name $n -ErrorAction SilentlyContinue) { return $true }
  }
  if (Get-RealAnkiProcess) { return $true }
  return $false
}

# WHERE to launch from. Ordered by preference, not just by likelihood: the launcher is the SUPPORTED
# entry point (it self-updates and picks the right venv), so it wins when present; the venv binary is
# the fallback for machines where only the older layout exists.
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

# Returns 'running' (already up), 'started', 'notinstalled', or 'failed'.
# ONE AT A TIME, machine-wide. Two launches arriving together (the shortcut opened twice, or a
# launch plus the in-app "Open Anki" button) used to run this whole step side by side - measured:
# both read the ONE "Update now" click, both ran the Anki install on the same folder, and both
# started Anki a second apart, so the second hit Anki's "Anki is already running" dialog. The
# launcher's own single-instance mutex only covers the dev-server part further down, and the update
# window (a question, then a download) turned a rare race into an easy one. The second caller now
# waits, then finds Anki up and does nothing. The wait is bounded by the update's own caps (a 2 min
# question + a 15 min install); a caller that still cannot get in leaves Anki to the one that is.
function Start-AnkiIfNeeded {
  $mx = New-Object System.Threading.Mutex($false, 'Ebiki.Anki.Start')
  $held = $false
  try { $held = $mx.WaitOne(1200000) } catch [System.Threading.AbandonedMutexException] { $held = $true }
  if (-not $held) { $mx.Dispose(); Write-AnkiStartLog 'another start of Anki is still running; left it to that one'; return 'running' }
  try { return (Start-AnkiIfNeededLocked) }
  finally { try { $mx.ReleaseMutex() } catch {}; $mx.Dispose() }
}

function Start-AnkiIfNeededLocked {
  # A launcher console left waiting on its own error is NOT a starting Anki: close it, then carry on.
  try { [void](Close-StuckAnkiLauncher) } catch {}
  # Anki is single-instance; a second launch just pops a dialog at the user.
  if (Test-AnkiUp) { return 'running' }
  $exe = Find-AnkiExe
  if (-not $exe) { return 'notinstalled' }
  # Anki updates are offered HERE, before Anki starts (it cannot be updated while running), instead
  # of by Anki's own console launcher - see scripts/anki-update.ps1. Fail-soft: anything that goes
  # wrong just starts Anki as it is. The same pass repairs a launcher left mid-install, which is
  # what would otherwise send this very start straight back into its console.
  $ankiUpdater = Join-Path $PSScriptRoot 'anki-update.ps1'
  if (Test-Path $ankiUpdater) {
    try { . $ankiUpdater; Update-AnkiIfOffered $exe } catch { Write-AnkiStartLog "update check failed: $($_.Exception.Message)" }
    Set-Status 'Waking up Anki and the study server.'
  }
  # Opened by hand while the update question was up (the update then skips itself): starting it again
  # popped Anki's single-instance dialog and minimized the window the user had just opened.
  if (Test-AnkiUp) { Write-AnkiStartLog 'Anki was opened meanwhile; not starting it again'; return 'running' }
  # MINIMIZED, not hidden and not normal. Ebiki needs Anki running (every card goes through
  # AnkiConnect), but you clicked EBIKI - Anki taking the screen is just in the way. NEVER give this
  # Start-Process no window style: launch-ebiki.vbs runs the launcher through
  # `powershell -WindowStyle Hidden`, and a child with no style of its own inherits that HIDDEN
  # state - Anki then really does start and AnkiConnect answers on 8765, but no window ever appears
  # and the user reports that Ebiki never launched Anki.
  # MINIMIZED only once Anki is actually set up. A first run asks for a language and creates a
  # profile, and until somebody answers that dialog it never finishes starting. Set up = some profile
  # has a collection. NOT prefs21.db: Anki creates that the moment it starts, before its first-run
  # dialog is answered (read from Anki's profiles.py; the server-side check was already fixed for
  # exactly this), so testing it started a first-run Anki minimized and hid the dialog.
  $ankiBase = if ($env:ANKI_BASE) { $env:ANKI_BASE } else { Join-Path $env:APPDATA 'Anki2' }
  $configured = [bool](Get-ChildItem $ankiBase -Directory -ErrorAction SilentlyContinue |
    Where-Object { Test-Path (Join-Path $_.FullName 'collection.anki2') } | Select-Object -First 1)
  try {
    Start-Process -FilePath $exe -WindowStyle $(if ($configured) { 'Minimized' } else { 'Normal' }) -ErrorAction Stop
  } catch {
    Write-AnkiStartLog "could not start Anki: $($_.Exception.Message)"
    return 'failed'
  }
  if (-not $configured) {
    # And do not let the watchdog put that dialog away either.
    Set-Status 'Finish setting up Anki in the window that just opened.'
    return 'started'
  }
  # Asking is not enough: the launcher boots the real Anki out of a venv and exits, and the
  # show-state never reaches the window that second process creates. minimize-anki.ps1 watches for
  # the window and puts it away. Detached (its own hidden process) so it outlives this script.
  $minimizer = Join-Path $PSScriptRoot 'minimize-anki.ps1'
  if (Test-Path $minimizer) {
    Start-Process -FilePath 'powershell' -WindowStyle Hidden -ArgumentList @(
      '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ('"' + $minimizer + '"'))   # quoted: PS 5.1 joins -ArgumentList unquoted, so a path with a space split in two
  }
  return 'started'
}

# --- Standalone mode (the in-app "Open Anki" button) ---
if ($Start) {
  # No splash here: statuses go nowhere, and the update question uses anki-update.ps1's topmost
  # dialog fallback. Defined only when the host did not already provide them.
  if (-not (Get-Command Set-Status -ErrorAction SilentlyContinue)) { function Set-Status($t) { } }
  if (-not (Get-Command Ask-InSplash -ErrorAction SilentlyContinue)) { function Ask-InSplash { 'nosplash' } }
  $r = 'failed'
  try { $r = Start-AnkiIfNeeded } catch { Write-AnkiStartLog "start failed: $($_.Exception.Message)" }
  [Console]::Out.WriteLine((ConvertTo-Json @{ ok = ($r -eq 'started' -or $r -eq 'running'); result = $r } -Compress))
}

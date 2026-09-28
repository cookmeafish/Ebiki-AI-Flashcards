# Anki updates, handled by Ebiki instead of Anki's console launcher.
#
# Dot-sourced by launch.ps1 (define only). Needs Ask-InSplash / Set-Status / Tr from there (or anki-start.ps1 -Start).
#
# WHY THIS EXISTS. What the Anki website installs (%LOCALAPPDATA%\Programs\Anki\anki.exe) is a
# LAUNCHER: the real Anki lives in a uv-managed venv under %LOCALAPPDATA%\AnkiProgramFiles, pinned by
# that folder's pyproject.toml. Whenever the launcher thinks an install is pending (no
# `.sync_complete` marker, or a `.want-launcher` trigger, which Anki's own "update available" dialog
# writes) it opens a TERMINAL menu ("1) Latest Anki (press Enter) / 2) Choose a version / ...").
# That is no place for an end user, and it can dead-end: "Latest" takes its version from the `aqt`
# package on PyPI and then pins `anki-release` to the same number, and those do not always exist
# together. Measured 2026-09: aqt/anki were at 26.9.3 while anki-release stopped at 26.5, so
# "Latest" pinned an uninstallable set, `uv sync` failed, the marker was never written, and EVERY
# later Anki start went back into the same failing console.
#
# So Ebiki does it from the start-up splash it already shows:
#   - the target is the newest version that is ACTUALLY INSTALLABLE (anki-release exists for it, and
#     so do aqt and anki), never just the newest aqt;
#   - a newer one is offered in the splash, "Update now" preselected; a version the user declined is
#     not offered again until a newer one ships;
#   - the update runs the same uv command the launcher runs, silently, with the splash saying so;
#   - ANY failure puts the working version back, so the answer to "update?" can never be "and now
#     Anki does not open";
#   - a stuck launcher (marker missing, e.g. after the failed update above) is repaired so Anki
#     opens normally instead of dropping into the console.
# Everything is fail-soft: offline, no launcher install (classic Anki), a download mirror configured,
# or anything unexpected -> it does nothing and Anki starts exactly as before.

function Write-AnkiUpdateLog($text) {
  try {
    $dir = Join-Path $app 'logs'
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    Add-Content -Path (Join-Path $dir 'anki-update.log') -Value ("{0}  {1}" -f (Get-Date).ToString('s'), $text) -Encoding UTF8
  } catch {}
}

# What the launcher install looks like on this computer, or $null when it is not a launcher install.
function Get-AnkiLauncherState($ankiExe) {
  if (-not $ankiExe -or -not (Test-Path $ankiExe)) { return $null }
  $installDir = Split-Path $ankiExe -Parent
  $uv = Join-Path $installDir 'uv.exe'
  if (-not (Test-Path $uv)) { return $null }                       # classic install: nothing to manage
  $root = if ($env:ANKI_LAUNCHER_VENV_ROOT) { $env:ANKI_LAUNCHER_VENV_ROOT } else { Join-Path $env:LOCALAPPDATA 'AnkiProgramFiles' }
  $site = Join-Path $root '.venv\Lib\site-packages'
  if (-not (Test-Path $site)) { return $null }                     # never installed yet: the launcher's own first run handles it
  $installed = $null
  $dist = Get-ChildItem $site -Directory -Filter 'aqt-*.dist-info' -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($dist -and $dist.Name -match '^aqt-(.+)\.dist-info$') { $installed = $Matches[1] }
  $pyVer = '3.13.5'
  foreach ($f in @((Join-Path $root '.python-version'), (Join-Path $installDir '.python-version'))) {
    if (Test-Path $f) { $v = (Get-Content $f -Raw -ErrorAction SilentlyContinue); if ($v -and $v.Trim()) { $pyVer = $v.Trim(); break } }
  }
  # The Python the LAUNCHER itself ships (what its "Latest" uses): an install made before 25.6 keeps "3.9" at the
  # root, and no current Anki installs on 3.9, so an update pinned to the root version failed every time.
  $launcherPy = $null
  $lpf = Join-Path $installDir '.python-version'
  if (Test-Path $lpf) { $v = (Get-Content $lpf -Raw -ErrorAction SilentlyContinue); if ($v -and $v.Trim()) { $launcherPy = $v.Trim() } }
  $pyproject = Join-Path $root 'pyproject.toml'
  $markerFile = Join-Path $root '.sync_complete'
  # The launcher opens its console when pyproject.toml is NEWER than the marker (whole seconds), not only when
  # the marker is missing: an update cut off mid-sync left an old marker and a new pyproject, and Anki opened into
  # its console on every start while this looked "not stuck".
  $pyNewer = $false
  try {
    if ((Test-Path $pyproject) -and (Test-Path $markerFile)) {
      $pyNewer = [math]::Floor((Get-Item $pyproject).LastWriteTimeUtc.Subtract([datetime]'1970-01-01').TotalSeconds) -gt [math]::Floor((Get-Item $markerFile).LastWriteTimeUtc.Subtract([datetime]'1970-01-01').TotalSeconds)
    }
  } catch {}
  # The files as they are NOW, so a failed update can put them back exactly (see Restore-AnkiInstalled).
  $origPyproject = $null; $origPyVersion = $null
  try { if (Test-Path $pyproject) { $origPyproject = [IO.File]::ReadAllBytes($pyproject) } } catch {}
  try { $rpf = Join-Path $root '.python-version'; if (Test-Path $rpf) { $origPyVersion = [IO.File]::ReadAllBytes($rpf) } } catch {}
  return [pscustomobject]@{
    Root = $root; Uv = $uv; PyVersion = $pyVer; LauncherPy = $launcherPy; Installed = $installed
    OrigPyproject = $origPyproject; OrigPyVersion = $origPyVersion; PyprojectNewer = $pyNewer
    Marker = (Test-Path $markerFile)
    WantLauncher = (Test-Path (Join-Path $root '.want-launcher'))
    Mirror = (Test-Path (Join-Path $root 'mirror'))
    NoCache = (Test-Path (Join-Path $root 'nocache'))
  }
}

# [version] needs 2-4 numeric parts; everything PyPI lists as a stable Anki release fits.
function ConvertTo-AnkiVersion($s) {
  if ($s -notmatch '^\d+(\.\d+){1,3}$') { return $null }
  try { return [version]$s } catch { return $null }
}

# Newest version that can really be installed: anki-release must exist for it (it is the package the
# launcher pins, and it pins matching anki/aqt itself), and aqt is confirmed too. $null when offline.
function Get-AnkiLatestInstallable {
  try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 } catch {}
  try {
    $rel = Invoke-RestMethod -Uri 'https://pypi.org/pypi/anki-release/json' -TimeoutSec 6 -UseBasicParsing -ErrorAction Stop
  } catch { return $null }
  $best = $null; $bestStr = $null
  foreach ($p in $rel.releases.PSObject.Properties) {
    $v = ConvertTo-AnkiVersion $p.Name
    if (-not $v -or -not $p.Value -or @($p.Value).Count -eq 0) { continue }   # pre-releases and empty releases are never offered
    if (-not $best -or $v -gt $best) { $best = $v; $bestStr = $p.Name }
  }
  if (-not $bestStr) { return $null }
  try {
    $null = Invoke-RestMethod -Uri "https://pypi.org/pypi/aqt/$bestStr/json" -TimeoutSec 6 -UseBasicParsing -ErrorAction Stop
  } catch { return $null }
  return $bestStr
}

# Same content the launcher writes, pinned to one version, with ONE deliberate difference:
# requires-python comes from the Python the launcher actually runs Anki with (.python-version,
# 3.13 here) instead of the older launcher's ">=3.9". uv resolves for EVERY Python the project
# allows, and anki 26.x needs 3.10+, so with ">=3.9" no 26.x release could ever install through
# that template (measured: "anki==26.5 depends on Python>=3.10 ... unsatisfiable"). The interpreter
# in use always satisfies its own version. UTF-8 WITHOUT a BOM: the launcher and uv both parse this
# file, and Windows PowerShell's -Encoding UTF8 would prepend one.
function Set-AnkiPin($state, $version) {
  try { Remove-Item (Join-Path $state.Root '.sync_complete') -Force -ErrorAction SilentlyContinue } catch {}
  $py = '3.10'
  if ("$($state.PyVersion)" -match '^(\d+)\.(\d+)') { $py = "$($Matches[1]).$($Matches[2])" }
  $toml = "[project]`nname = `"anki-launcher`"`nversion = `"1.0.0`"`ndescription = `"UV-based launcher for Anki.`"`nrequires-python = `">=$py`"`ndependencies = [`n  `"anki-release==$version`",`n  `"anki==$version`",`n  `"aqt==$version`",`n]`n"
  [IO.File]::WriteAllText((Join-Path $state.Root 'pyproject.toml'), $toml, (New-Object Text.UTF8Encoding $false))
}

# Tell the launcher the install is complete, so its next start goes straight to Anki. Written AFTER
# the pyproject, since the launcher treats a pyproject newer than this marker as a pending install.
function Complete-AnkiSync($state) {
  $marker = Join-Path $state.Root '.sync_complete'
  try { New-Item -ItemType File -Path $marker -Force | Out-Null; (Get-Item $marker).LastWriteTime = Get-Date } catch {}
  try { Remove-Item (Join-Path $state.Root '.want-launcher') -Force -ErrorAction SilentlyContinue } catch {}
}

# Run the launcher's own install command, silently. Returns $true on success. Long downloads keep
# the splash talking (its give-up timer measures silence), and a hard cap means a wedged download
# can never hold the launch forever.
function Invoke-AnkiSync($state, $maxSeconds) {
  $logDir = Join-Path $app 'logs'
  if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Force -Path $logDir | Out-Null }
  $out = Join-Path $logDir 'anki-update-uv.out.log'
  $err = Join-Path $logDir 'anki-update-uv.err.log'
  $saved = @{}
  # The launcher's environment (its uv_command): every inherited UV_* and VIRTUAL_ENV cleared (a developer's
  # global UV_INDEX_URL or UV_PROJECT_ENVIRONMENT sent the sync elsewhere), and the Windows certificate store
  # (UV_NATIVE_TLS): behind a TLS-inspecting proxy uv's own roots failed while PyPI answered this script fine,
  # so every update rolled back and was offered again.
  $envs = @{ UV_PYTHON_INSTALL_DIR = (Join-Path $state.Root 'python'); UV_HTTP_TIMEOUT = '180'; UV_NATIVE_TLS = '1'; VIRTUAL_ENV = $null }
  if ($state.NoCache) { $envs['UV_NO_CACHE'] = '1' } else { $envs['UV_CACHE_DIR'] = (Join-Path $state.Root 'cache') }
  foreach ($k in @(Get-ChildItem Env: | Where-Object { $_.Name -like 'UV_*' } | ForEach-Object { $_.Name })) { if (-not $envs.ContainsKey($k)) { $envs[$k] = $null } }
  foreach ($k in @($envs.Keys)) { $saved[$k] = [Environment]::GetEnvironmentVariable($k, 'Process'); [Environment]::SetEnvironmentVariable($k, $envs[$k], 'Process') }
  try {
    $p = Start-Process -FilePath $state.Uv -ArgumentList @('sync', '--upgrade', '--no-config', '--managed-python', '--python', $state.PyVersion) `
      -WorkingDirectory $state.Root -WindowStyle Hidden -PassThru -RedirectStandardOutput $out -RedirectStandardError $err
    # Windows PowerShell quirk: unless the process HANDLE is read while it is still running, ExitCode
    # comes back $null afterwards - measured: a successful install reported as a failure, which
    # would have rolled a finished update straight back.
    $null = $p.Handle
    $start = Get-Date
    while (-not $p.HasExited) {
      $secs = [int]((Get-Date) - $start).TotalSeconds
      if ($secs -gt $maxSeconds) { try { $p.Kill() } catch {}; Write-AnkiUpdateLog "uv sync stopped after ${maxSeconds}s"; return $false }
      if ($secs -ge 10 -and ($secs % 10) -eq 0) { Set-Status (Tr 'ln_ankiDownloading' @{ s = $secs }) }
      Start-Sleep -Seconds 1
    }
    $p.WaitForExit()
    return ($p.ExitCode -eq 0)
  } catch {
    Write-AnkiUpdateLog "uv sync could not run: $($_.Exception.Message)"
    return $false
  } finally {
    foreach ($k in $saved.Keys) { [Environment]::SetEnvironmentVariable($k, $saved[$k], 'Process') }
  }
}

# Put Anki back on the version that is installed and working, and make sure the launcher starts it.
function Restore-AnkiInstalled($state) {
  if (-not $state.Installed) { return }
  $vInst = ConvertTo-AnkiVersion $state.Installed
  if ($vInst -and $vInst -lt [version]'25.6' -and $state.OrigPyproject) {
    # No anki-release exists for this version (it starts at 25.6), so a fresh pin could never resolve: the files
    # the launcher itself wrote go back byte for byte instead.
    try { Remove-Item (Join-Path $state.Root '.sync_complete') -Force -ErrorAction SilentlyContinue } catch {}
    [IO.File]::WriteAllBytes((Join-Path $state.Root 'pyproject.toml'), $state.OrigPyproject)
    if ($state.OrigPyVersion) { [IO.File]::WriteAllBytes((Join-Path $state.Root '.python-version'), $state.OrigPyVersion) }
  } else {
    Set-AnkiPin $state $state.Installed
  }
  # Normally near-instant (everything is already installed and cached); it also heals a venv an
  # interrupted install left half-done. If it cannot run (offline), the venv was working before, so
  # completing the marker is still right: the launcher then starts it directly.
  $ok = Invoke-AnkiSync $state 180
  # The marker only over a venv that really holds that Anki: an update that changed Python recreated .venv
  # before failing offline, and the marker then started Anki from an empty venv. Without it the launcher
  # shows its own installer on the next start, which can repair it.
  $has = Get-ChildItem (Join-Path $state.Root '.venv\Lib\site-packages') -Directory -Filter "aqt-$($state.Installed).dist-info" -ErrorAction SilentlyContinue
  if ($has) { Complete-AnkiSync $state }
  Write-AnkiUpdateLog ("kept Anki {0} (verify sync {1}, {2})" -f $state.Installed, $(if ($ok) { 'ok' } else { 'skipped/failed' }), $(if ($has) { 'marker set' } else { 'NOT installed: marker left unset' }))
}

function Update-AnkiIfOffered($ankiExe) {
  $state = Get-AnkiLauncherState $ankiExe
  if (-not $state) { return }
  if ($state.Mirror) { Write-AnkiUpdateLog 'skipped: a download mirror is configured in the Anki launcher'; return }
  # Either one makes the launcher open its console instead of Anki: a missing marker, or the
  # .want-launcher trigger Anki's own update dialog leaves (only checking the marker let that one
  # through, so declining here still dropped the next Anki start into the console menu).
  $stuck = (-not $state.Marker) -or $state.WantLauncher -or $state.PyprojectNewer

  Set-Status (Tr 'ln_ankiChecking')
  $latest = Get-AnkiLatestInstallable
  $declinedFile = Join-Path $app '.anki-update-declined'
  $declined = $null
  try { if (Test-Path $declinedFile) { $declined = (Get-Content $declinedFile -Raw).Trim() } } catch {}

  $vLatest = ConvertTo-AnkiVersion $latest
  $vInstalled = ConvertTo-AnkiVersion $state.Installed
  $vDeclined = ConvertTo-AnkiVersion $declined
  # A .want-launcher is Anki's own "take me to the update/version menu": an earlier "not now" given in Ebiki
  # must not throw that request away (the repair below deletes the trigger on every launch).
  $offer = $vLatest -and $vInstalled -and ($vLatest -gt $vInstalled) -and ($state.WantLauncher -or -not $vDeclined -or $vLatest -gt $vDeclined)

  if ($offer) {
    # Short on purpose: the title names ANKI (asked in Ebiki's own splash, so the app being updated must
    # be unmistakable), and the body is just the versions and how long it takes.
    $msg = Tr 'ln_ankiAvailable' @{ latest = $latest; installed = $state.Installed }
    $ans = Ask-InSplash $msg 120 (Tr 'ln_ankiAskTitle') (Tr 'ln_ankiUpdating')
    if ($ans -eq 'nosplash') {
      $r = (New-Object -ComObject WScript.Shell).Popup(("{0}`n`n{1}" -f $msg, (Tr 'ln_ankiAskNow')), 60, (Tr 'ln_ankiDialogTitle'), 4 + 32 + 4096 + 65536)
      $ans = if ($r -eq 6) { 'yes' } elseif ($r -eq 7) { 'no' } else { 'timeout' }
    }
    Write-AnkiUpdateLog ("offered Anki {0} (installed {1}); answer='{2}'" -f $latest, $state.Installed, $ans)
    if ($ans -eq 'yes') {
      # Opened while the question was up: uv would replace files the running Anki has loaded (Windows refuses
      # those deletes), leaving a half-replaced install.
      if ((Get-Command Test-AnkiUp -ErrorAction SilentlyContinue) -and (Test-AnkiUp)) { Write-AnkiUpdateLog 'Anki opened meanwhile; update skipped'; Set-Status (Tr 'ln_ankiOpenSkipped'); return }
      Set-Status (Tr 'ln_ankiUpdating')
      $rootPy = $state.PyVersion
      if ($state.LauncherPy) { $state.PyVersion = $state.LauncherPy }
      Set-AnkiPin $state $latest
      $ok = Invoke-AnkiSync $state 900
      $state.PyVersion = $rootPy
      $nowDist = Get-ChildItem (Join-Path $state.Root '.venv\Lib\site-packages') -Directory -Filter "aqt-$latest.dist-info" -ErrorAction SilentlyContinue
      if ($ok -and $nowDist) {
        # The venv now runs on the launcher's Python: record it where the launcher reads it.
        if ($state.LauncherPy) { try { [IO.File]::WriteAllText((Join-Path $state.Root '.python-version'), $state.LauncherPy, (New-Object Text.UTF8Encoding $false)) } catch {} }
        Complete-AnkiSync $state
        try { Remove-Item $declinedFile -Force -ErrorAction SilentlyContinue } catch {}
        Write-AnkiUpdateLog "updated Anki to $latest"
        Set-Status (Tr 'ln_ankiUpdated' @{ version = $latest })
        return
      }
      Write-AnkiUpdateLog "update to $latest failed; restoring $($state.Installed)"
      Set-Status (Tr 'ln_ankiUpdateFailed')
      Restore-AnkiInstalled $state
      return
    }
    if ($ans -eq 'no') { try { Set-Content -Path $declinedFile -Value $latest -Encoding ASCII } catch {} }
  }

  # Declined, nothing newer, or offline: if the launcher is stuck mid-install, put it back on the
  # working version so Anki opens instead of the console.
  if ($stuck) {
    if ((Get-Command Test-AnkiUp -ErrorAction SilentlyContinue) -and (Test-AnkiUp)) { Write-AnkiUpdateLog 'Anki is open; launcher repair skipped'; return }
    Set-Status (Tr 'ln_ankiRepairing')
    Restore-AnkiInstalled $state
  }
}

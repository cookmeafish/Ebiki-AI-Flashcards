# Anki updates, handled by Ebiki instead of Anki's console launcher.
#
# Dot-sourced by launch.ps1 (define only). Needs Ask-InSplash / Set-Status from there.
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
  return [pscustomobject]@{
    Root = $root; Uv = $uv; PyVersion = $pyVer; Installed = $installed
    Marker = (Test-Path (Join-Path $root '.sync_complete'))
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
  $envs = @{ UV_CACHE_DIR = (Join-Path $state.Root 'cache'); UV_PYTHON_INSTALL_DIR = (Join-Path $state.Root 'python'); UV_HTTP_TIMEOUT = '180' }
  if ($state.NoCache) { $envs['UV_NO_CACHE'] = '1' }
  foreach ($k in $envs.Keys) { $saved[$k] = [Environment]::GetEnvironmentVariable($k, 'Process'); [Environment]::SetEnvironmentVariable($k, $envs[$k], 'Process') }
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
      if ($secs -ge 10 -and ($secs % 10) -eq 0) { Set-Status "Updating Anki. Still downloading ($secs s). Please wait." }
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
  Set-AnkiPin $state $state.Installed
  # Normally near-instant (everything is already installed and cached); it also heals a venv an
  # interrupted install left half-done. If it cannot run (offline), the venv was working before, so
  # completing the marker is still right: the launcher then starts it directly.
  $ok = Invoke-AnkiSync $state 180
  Complete-AnkiSync $state
  Write-AnkiUpdateLog ("kept Anki {0} (verify sync {1})" -f $state.Installed, $(if ($ok) { 'ok' } else { 'skipped/failed, marker set anyway' }))
}

function Update-AnkiIfOffered($ankiExe) {
  $state = Get-AnkiLauncherState $ankiExe
  if (-not $state) { return }
  if ($state.Mirror) { Write-AnkiUpdateLog 'skipped: a download mirror is configured in the Anki launcher'; return }
  $stuck = -not $state.Marker   # the launcher would open its console instead of Anki

  Set-Status 'Checking for Anki updates.'
  $latest = Get-AnkiLatestInstallable
  $declinedFile = Join-Path $app '.anki-update-declined'
  $declined = $null
  try { if (Test-Path $declinedFile) { $declined = (Get-Content $declinedFile -Raw).Trim() } } catch {}

  $vLatest = ConvertTo-AnkiVersion $latest
  $vInstalled = ConvertTo-AnkiVersion $state.Installed
  $vDeclined = ConvertTo-AnkiVersion $declined
  $offer = $vLatest -and $vInstalled -and ($vLatest -gt $vInstalled) -and (-not $vDeclined -or $vLatest -gt $vDeclined)

  if ($offer) {
    # Short on purpose: the title names ANKI (asked in Ebiki's own splash, so the app being updated must
    # be unmistakable), and the body is just the versions and how long it takes.
    $msg = "Anki $latest is available. You have $($state.Installed). It takes a minute or two."
    $ans = Ask-InSplash $msg 120 'Update Anki?' 'Updating Anki. This can take a minute or two, please wait.'
    if ($ans -eq 'nosplash') {
      $r = (New-Object -ComObject WScript.Shell).Popup("$msg`n`nUpdate Anki now?", 60, 'Anki update', 4 + 32 + 4096 + 65536)
      $ans = if ($r -eq 6) { 'yes' } elseif ($r -eq 7) { 'no' } else { 'timeout' }
    }
    Write-AnkiUpdateLog ("offered Anki {0} (installed {1}); answer='{2}'" -f $latest, $state.Installed, $ans)
    if ($ans -eq 'yes') {
      Set-Status 'Updating Anki. This can take a minute or two, please wait.'
      Set-AnkiPin $state $latest
      $ok = Invoke-AnkiSync $state 900
      $nowDist = Get-ChildItem (Join-Path $state.Root '.venv\Lib\site-packages') -Directory -Filter "aqt-$latest.dist-info" -ErrorAction SilentlyContinue
      if ($ok -and $nowDist) {
        Complete-AnkiSync $state
        try { Remove-Item $declinedFile -Force -ErrorAction SilentlyContinue } catch {}
        Write-AnkiUpdateLog "updated Anki to $latest"
        Set-Status "Anki updated to $latest. Starting it now."
        return
      }
      Write-AnkiUpdateLog "update to $latest failed; restoring $($state.Installed)"
      Set-Status 'The Anki update did not work, so your current Anki is being kept.'
      Restore-AnkiInstalled $state
      return
    }
    if ($ans -eq 'no') { try { Set-Content -Path $declinedFile -Value $latest -Encoding ASCII } catch {} }
  }

  # Declined, nothing newer, or offline: if the launcher is stuck mid-install, put it back on the
  # working version so Anki opens instead of the console.
  if ($stuck) {
    Set-Status 'Repairing the Anki launcher.'
    Restore-AnkiInstalled $state
  }
}

# Ebiki launcher (invoked hidden by launch-ebiki.vbs).
# 1) If already running, just open the tab.
# 2) Otherwise do a QUICK update check (skipped when snoozed or offline), offer
#    to update, then start the dev server (which opens the browser itself).
# Path-relative so it works wherever the app is installed; this script lives in
# scripts/, so the app folder is one level up.
$app = Split-Path $PSScriptRoot -Parent

# Already running -> just show it (don't disrupt or re-check).
if (Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue) {
  Start-Process 'http://localhost:3000'
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
Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npm run dev' -WorkingDirectory $app -WindowStyle Hidden
$deadline = (Get-Date).AddSeconds(60)
do { Start-Sleep -Milliseconds 800 } until (
  (Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue) -or ((Get-Date) -gt $deadline)
)

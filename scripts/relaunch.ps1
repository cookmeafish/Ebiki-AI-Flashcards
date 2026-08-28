# Restart Ebiki after an in-app update.
#
# An update only really lands on a restart: the dev server cannot reload
# vite.config.js or newly installed dependencies live, and "close it and open it
# again yourself" is precisely the step the people this feature exists for skip.
# So the app offers to do it, and the server hands the job here.
#
# This MUST be a separate detached process: the thing that has to die first is
# the dev server itself, so whatever starts the next one has to outlive it.
# The sequence is:
#   1. the app window closes (the client does that as soon as /api/update/restart
#      answers), so the dev server's own auto-exit sees the last page leave;
#   2. port 3000 goes quiet a few seconds later;
#   3. this script runs the ORDINARY launcher, so a restart is the exact same
#      code path as a normal shortcut click (splash, Anki check, update check).
# Path-relative like every other script here; this file lives in scripts/, so the
# app folder is one level up.
$app = Split-Path $PSScriptRoot -Parent

# Wait for the old server to let go of the port. Bounded: if it never does (a
# manual `npm run dev` without EBIKI_AUTO_EXIT, a wedged process), launch anyway
# rather than leaving the user with no window at all - the launcher handles an
# already-serving port by just opening the app against it.
$deadline = (Get-Date).AddSeconds(90)
while ((Get-Date) -lt $deadline) {
  if (-not (Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue)) { break }
  Start-Sleep -Milliseconds 500
}
# A moment for the process to actually exit after it stopped listening, so the
# launcher's own single-instance mutex is free.
Start-Sleep -Milliseconds 1200

$vbs = Join-Path $app 'launch-ebiki.vbs'
if (Test-Path $vbs) {
  # Through wscript.exe so the splash appears exactly as it does from the
  # shortcut - a restart that shows nothing would read as a crash.
  Start-Process -FilePath 'wscript.exe' -ArgumentList ('"' + $vbs + '"') -WorkingDirectory $app
}

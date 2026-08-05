# Ebiki launcher (invoked hidden by launch-ebiki.vbs).
# Starts the dev server if it isn't already running, then makes sure the browser
# is on it. Only ever one instance: if port 3000 is already serving, it just
# opens the tab instead of starting a second copy.
$app = $PSScriptRoot

$running = Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue
if ($running) {
  Start-Process 'http://localhost:3000'   # already up, just show it
  return
}

# Start the dev server hidden. It keeps running after this script exits, and its
# own config (open:true) opens the browser once it is ready.
Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npm run dev' -WorkingDirectory $app -WindowStyle Hidden

# Wait for it to come up; if it never opens a tab within the window, open one.
$deadline = (Get-Date).AddSeconds(60)
do { Start-Sleep -Milliseconds 800 } until (
  (Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue) -or ((Get-Date) -gt $deadline)
)

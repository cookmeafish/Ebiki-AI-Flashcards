# Minimize Anki's window once it appears (spawned detached by launch.ps1).
#
# Ebiki needs Anki RUNNING, not in front of you: every card read/write goes
# through AnkiConnect on 127.0.0.1:8765, and the window itself is only in the
# way when what you actually clicked was Ebiki. Start-Process -WindowStyle
# Minimized is not enough on its own - the thing the Anki website installs is a
# LAUNCHER that bootstraps the real Anki out of a uv-managed venv and exits, and
# the show-state given to the launcher does not reach the window the second
# process creates. So the show-state is asked for AND enforced here.
#
# Runs as its own hidden process rather than a background job so it cannot die
# when launch.ps1 finishes (Anki can take longer to paint a window than the rest
# of the launch takes to complete). Everything is fail-soft: this script only
# ever changes how a window is displayed, so any error just means Anki is left
# on screen, exactly as it used to be.
$ErrorActionPreference = 'SilentlyContinue'

Add-Type @'
using System;
using System.Runtime.InteropServices;
public class EbikiWin {
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
}
'@

# 7 = SW_SHOWMINNOACTIVE: minimize WITHOUT stealing focus. Plain SW_MINIMIZE
# activates the next window in the z-order, which can pull focus off the Ebiki
# window the user is looking at.
$SW_SHOWMINNOACTIVE = 7

function Get-AnkiWindows {
  $procs = @()
  foreach ($n in 'anki', 'ankiw') { $procs += Get-Process -Name $n -ErrorAction SilentlyContinue }
  # pythonw is far too generic to trust by name; it counts only when the image
  # really is Anki's (25.x runs the app out of a venv).
  foreach ($p in (Get-Process -Name 'pythonw' -ErrorAction SilentlyContinue)) {
    try { if ($p.Path -like '*Anki*') { $procs += $p } } catch {}
  }
  $procs | Where-Object { $_.MainWindowHandle -ne 0 }
}

# Anki paints more than one window on the way up (a profile picker can precede
# the main window), so keep watching for a short while after the first one is
# put away instead of exiting on the first hit. Bounded twice over: 90s to see
# anything at all, then 8s of follow-up - short enough that deliberately
# restoring Anki right afterwards is not fought for long.
$giveUp = (Get-Date).AddSeconds(90)
$stopAt = $null
while ((Get-Date) -lt $giveUp -and (-not $stopAt -or (Get-Date) -lt $stopAt)) {
  foreach ($p in (Get-AnkiWindows)) {
    try {
      if (-not [EbikiWin]::IsIconic($p.MainWindowHandle)) {
        [void][EbikiWin]::ShowWindow($p.MainWindowHandle, $SW_SHOWMINNOACTIVE)
        if (-not $stopAt) { $stopAt = (Get-Date).AddSeconds(8) }
      }
    } catch {}
  }
  Start-Sleep -Milliseconds 400
}

# Put Anki's MAIN window away once, right after launch.ps1 starts it.
#
# Ebiki needs Anki running, not in front of you: every card read/write goes
# through AnkiConnect on 127.0.0.1:8765, and the window itself is only in the
# way when what you clicked was Ebiki. `Start-Process -WindowStyle Minimized`
# usually does the whole job on its own (measured: the main window appears
# already minimized about a second after launch, no flash), but it can NOT be
# relied on alone - what the Anki website installs these days is a LAUNCHER that
# boots the real Anki out of a uv-managed venv and exits, and a show-state given
# to the launcher need not reach the window that second process creates. This is
# the fallback for exactly that case.
#
# ONE window, ONE time, and only in the first few seconds. Two rules, both
# learned from getting it wrong:
#
#   1) Only the MAIN window ("<profile> - Anki"). Anki paints transient windows
#      on the way up - a "Syncing..." progress dialog and a small "Anki" window -
#      and .NET's Process.MainWindowHandle happily hands you one of THOSE,
#      because it returns the first VISIBLE top-level window and the real main
#      window is already minimized by then. Minimizing a sync dialog is what the
#      user saw as "it flashes a screen and then minimizes".
#
#   2) Stop at the first sighting, minimized or not. Watching for longer means
#      that when the user clicks Anki BECAUSE THEY WANT ANKI, this script is
#      still running and puts it straight back down. Whether the window was
#      already minimized (the normal case) or we minimized it, the job is over.
#
# Fail-soft throughout: this only ever changes how a window is displayed, so any
# error just leaves Anki on screen, which is how it used to be.
$ErrorActionPreference = 'SilentlyContinue'

Add-Type @'
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public class EbikiWin {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr l);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowTextW(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int cmd);

  // Every VISIBLE top-level window owned by one of these processes, as
  // "handle|title". Process.MainWindowHandle is deliberately not used - see
  // rule 1 above.
  public static List<string> Windows(HashSet<uint> pids) {
    var found = new List<string>();
    EnumWindows((h, l) => {
      uint pid; GetWindowThreadProcessId(h, out pid);
      if (!pids.Contains(pid) || !IsWindowVisible(h)) return true;
      var sb = new StringBuilder(300);
      GetWindowTextW(h, sb, 300);
      found.Add(h.ToInt64() + "|" + sb.ToString());
      return true;
    }, IntPtr.Zero);
    return found;
  }
}
'@

# 7 = SW_SHOWMINNOACTIVE: minimize WITHOUT stealing focus. Plain SW_MINIMIZE
# activates the next window in the z-order, which can pull focus off the Ebiki
# window the user is actually looking at.
$SW_SHOWMINNOACTIVE = 7

function Get-AnkiPids {
  $pids = New-Object 'System.Collections.Generic.HashSet[uint32]'
  foreach ($n in 'anki', 'ankiw') {
    foreach ($p in (Get-Process -Name $n -ErrorAction SilentlyContinue)) { [void]$pids.Add([uint32]$p.Id) }
  }
  # pythonw is far too generic to trust by name; it counts only when the image
  # really is Anki's (25.x runs the app out of a venv).
  foreach ($p in (Get-Process -Name 'pythonw' -ErrorAction SilentlyContinue)) {
    try { if ($p.Path -like '*Anki*') { [void]$pids.Add([uint32]$p.Id) } } catch {}
  }
  $pids
}

# 25s is well past the ~1s the main window takes to appear even on a cold start;
# past that, assume this build names its window something else and leave it be.
$giveUp = (Get-Date).AddSeconds(25)
while ((Get-Date) -lt $giveUp) {
  foreach ($w in [EbikiWin]::Windows((Get-AnkiPids))) {
    $i = $w.IndexOf('|')
    $handle = [IntPtr][int64]$w.Substring(0, $i)
    $title = $w.Substring($i + 1)
    # The main window only: Anki titles it "<profile> - Anki". A bare "Anki",
    # "Syncing..." or "_q_titlebar" is one of the transient windows.
    if ($title -notlike '* - Anki') { continue }
    try { if (-not [EbikiWin]::IsIconic($handle)) { [void][EbikiWin]::ShowWindow($handle, $SW_SHOWMINNOACTIVE) } } catch {}
    exit    # seen it once: done, whatever state it was in
  }
  Start-Sleep -Milliseconds 150
}

# Keep Anki's sync toast from floating on top of Ebiki.
#
# Anki shows a small "Collection sync complete." popup after every sync. On Windows it is a
# FRAMELESS ALWAYS-ON-TOP tool window, so it sits over whatever you are doing - Ebiki included -
# and it does not go away when you switch apps. That is an open upstream bug
# (ankitects/anki#4188); the Anki team's own note on it is that they may fix it "as we get more of
# the UI in Svelte, as we could overlay a pop-up over the page instead of in a separate window",
# so there is nothing to wait for and no Anki setting that disables it.
#
# Measured live, which is what the matching below is built on:
#   toast:       class 'Qt691QWindowToolTipSaveBits'  title 'Anki'  169x44  ex=0x88 (TOOLWINDOW|TOPMOST)
#   main window: class 'Qt691QWindowIcon'             title 'User 1 - Anki'  TOPMOST=False
#
# Three rules keep this from becoming the kind of watchdog that fights the user (the Anki
# minimizer had to learn this the hard way - see scripts/minimize-anki.ps1):
#
#  1. IT ONLY EVER TOUCHES TOOLTIP WINDOWS. The class must contain 'QWindowToolTip' and the window
#     must be TOPMOST. Anki's real windows are a different class and are not topmost, so the main
#     window, the browser, the editor and every dialog are unreachable from here by construction.
#  2. IT DOES NOTHING WHILE YOU ARE IN ANKI. 'QWindowToolTip' also covers Anki's ordinary hover
#     tooltips, and demoting one of those while you are reading it would be a real regression. So
#     if the foreground window belongs to Anki, this loop skips entirely. The toast is only a
#     problem when Anki is in the BACKGROUND, which is exactly when the skip does not apply.
#  3. IT DEMOTES, IT DOES NOT HIDE. The popup is re-inserted directly ABOVE Anki's main window
#     rather than minimized or closed: still there, still on screen when you bring Anki up, just no
#     longer above everything else. (SetWindowPos with a non-topmost hWndInsertAfter also clears
#     WS_EX_TOPMOST, which is the part that actually matters - HWND_BOTTOM alone would leave it
#     inside the topmost band, still above Ebiki.)
#
# Started by the dev server (vite.config.js) on Windows and killed with it, so it lives exactly as
# long as Ebiki does and covers BOTH launch modes - the app window and the browser tab.
# Fail-soft throughout: any error just means the popup behaves the way it does today.

$ErrorActionPreference = 'SilentlyContinue'

$sig = @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public class AnkiToast {
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr p);
  public delegate bool EnumProc(IntPtr h, IntPtr p);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowTextW(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassNameW(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern int GetWindowLongW(IntPtr h, int i);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int cx, int cy, uint flags);
  [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr h);
  public static bool Alive(IntPtr h) { return h != IntPtr.Zero && IsWindow(h) && IsWindowVisible(h); }

  const int GWL_EXSTYLE = -20;
  const int WS_EX_TOPMOST = 0x8;
  const uint SWP_NOMOVE = 0x2, SWP_NOSIZE = 0x1, SWP_NOACTIVATE = 0x10;

  static string ClassOf(IntPtr h) { var s = new StringBuilder(256); GetClassNameW(h, s, 256); return s.ToString(); }
  static string TitleOf(IntPtr h) { var s = new StringBuilder(256); GetWindowTextW(h, s, 256); return s.ToString(); }

  // Anki's MAIN window: a Qt top-level whose title ends in "Anki" (e.g. "User 1 - Anki").
  // Matched on the version-independent part of the class name - the real one is "Qt691QWindowIcon",
  // and that 691 is the Qt version, so it changes under us on any Anki upgrade.
  public static IntPtr MainWindow() {
    IntPtr found = IntPtr.Zero;
    EnumWindows((h, p) => {
      if (!IsWindowVisible(h)) return true;
      string c = ClassOf(h);
      if (c.IndexOf("QWindowIcon", StringComparison.Ordinal) < 0) return true;
      string t = TitleOf(h);
      if (t.Length > 0 && t.EndsWith("Anki", StringComparison.Ordinal)) { found = h; return false; }
      return true;
    }, IntPtr.Zero);
    return found;
  }

  // Every TOPMOST Qt tooltip belonging to the same process as Anki's main window.
  public static System.Collections.Generic.List<IntPtr> Toasts(uint ankiPid) {
    var list = new System.Collections.Generic.List<IntPtr>();
    EnumWindows((h, p) => {
      if (!IsWindowVisible(h)) return true;
      uint pid; GetWindowThreadProcessId(h, out pid);
      if (pid != ankiPid) return true;
      if (ClassOf(h).IndexOf("QWindowToolTip", StringComparison.Ordinal) < 0) return true;
      if ((GetWindowLongW(h, GWL_EXSTYLE) & WS_EX_TOPMOST) == 0) return true;  // already demoted
      list.Add(h);
      return true;
    }, IntPtr.Zero);
    return list;
  }

  public static uint PidOf(IntPtr h) { uint pid; GetWindowThreadProcessId(h, out pid); return pid; }

  public static bool ForegroundIsPid(uint pid) {
    IntPtr fg = GetForegroundWindow();
    if (fg == IntPtr.Zero) return false;
    uint fpid; GetWindowThreadProcessId(fg, out fpid);
    return fpid == pid;
  }

  // Re-insert directly above Anki's main window. Passing a NON-topmost window as hWndInsertAfter
  // is what strips WS_EX_TOPMOST, so the popup drops out of the always-on-top band and stops
  // covering Ebiki, while staying visible in Anki's own stack. NOACTIVATE: focus never moves.
  public static bool Demote(IntPtr toast, IntPtr anchor) {
    return SetWindowPos(toast, anchor, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
  }
}
'@

try { Add-Type -TypeDefinition $sig -ErrorAction Stop } catch { exit }

# The popup is only on screen for a second or two, so the poll has to be quick or it gets demoted
# after the user has already seen it float up. 100ms puts the worst-case visible-on-top time at a
# tenth of a second (measured: it drops out of the topmost band ~80ms after appearing).
#
# Cheap enough to do ten times a second because of what is NOT in the hot path. MainWindow() reads
# a class name for every visible window on the desktop, which is the costly part, so it is resolved
# once and CACHED - re-scanned only when the handle dies or every couple of seconds, to pick Anki up
# when it starts later or restarts. The per-tick work is one EnumWindows that rejects on a cheap pid
# comparison BEFORE touching any class name, plus one GetForegroundWindow. No process-name lookups
# anywhere: Anki's pid comes from Anki's own main window.
$mainHwnd = [IntPtr]::Zero
$ankiPid = 0
$nextScan = [DateTime]::MinValue

while ($true) {
  try {
    $now = Get-Date
    if (-not [AnkiToast]::Alive($mainHwnd) -or $now -ge $nextScan) {
      $mainHwnd = [AnkiToast]::MainWindow()
      $ankiPid = if ($mainHwnd -ne [IntPtr]::Zero) { [AnkiToast]::PidOf($mainHwnd) } else { 0 }
      $nextScan = $now.AddSeconds(2)
    }
    if ($mainHwnd -ne [IntPtr]::Zero) {
      # Rule 2: hands off entirely while the user is actually in Anki.
      if (-not [AnkiToast]::ForegroundIsPid($ankiPid)) {
        foreach ($t in [AnkiToast]::Toasts($ankiPid)) { [void][AnkiToast]::Demote($t, $mainHwnd) }
      }
    }
  } catch { }
  Start-Sleep -Milliseconds 100
}

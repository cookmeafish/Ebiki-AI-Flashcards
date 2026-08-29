# What is Anki doing, and is it waiting for the user?
#
# Ebiki cannot see inside Anki, but it does not need to: Anki's own windows say
# what it is doing, and its files say how far setup has got. This reports both as
# one JSON line so the app can tell the user the ONE thing that is actually
# blocking them, instead of guessing from "the port isn't answering".
#
# The distinction that matters: Anki's MAIN window is titled "<something> - Anki",
# and it only exists once a profile is open. Its first-run dialogs (choose a
# language, pick a profile) are titled plain "Anki". So an Anki process with a
# visible plain-"Anki" window and no main window is an Anki STOPPED ON A QUESTION -
# which is exactly the state where nothing else in Ebiki can work, no add-on can
# load, and no amount of restarting or reinstalling helps.
Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class EbikiAnkiState {
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc cb, IntPtr l);
  public delegate bool EnumWindowsProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
}
"@

$pids = @()
foreach ($n in 'anki', 'ankiw') {
  foreach ($p in (Get-Process -Name $n -ErrorAction SilentlyContinue)) { $pids += [int]$p.Id }
}
# The real Anki runs out of a venv on modern installs, so the surviving process can
# be pythonw - too generic a name to trust on its own, hence the path check.
foreach ($p in (Get-Process -Name 'pythonw' -ErrorAction SilentlyContinue)) {
  try { if ($p.Path -like '*Anki*') { $pids += [int]$p.Id } } catch {}   # Path throws on denied
}

$titles = New-Object System.Collections.ArrayList
if ($pids.Count -gt 0) {
  $cb = [EbikiAnkiState+EnumWindowsProc]{
    param($h, $l)
    $procId = 0
    [void][EbikiAnkiState]::GetWindowThreadProcessId($h, [ref]$procId)
    if (($pids -contains [int]$procId) -and [EbikiAnkiState]::IsWindowVisible($h)) {
      $sb = New-Object System.Text.StringBuilder 512
      [void][EbikiAnkiState]::GetWindowText($h, $sb, 512)
      $t = $sb.ToString()
      if ($t) { [void]$titles.Add($t) }
    }
    return $true
  }
  [void][EbikiAnkiState]::EnumWindows($cb, [IntPtr]::Zero)
}

$main = @($titles | Where-Object { $_ -like '* - Anki' })
# Anything visible that is NOT the main window is a dialog Anki is showing. During
# first run that is the language/profile question; later it can be a sync or import
# dialog, which is why "waiting" is only reported when the main window is absent.
$dialogs = @($titles | Where-Object { $_ -notlike '* - Anki' })

$state = @{
  running     = ($pids.Count -gt 0)
  mainWindow  = ($main.Count -gt 0)
  dialogs     = $dialogs
  # Anki is up, showing something, and has no main window: it is stopped on a question.
  awaitingInput = (($pids.Count -gt 0) -and ($main.Count -eq 0) -and ($dialogs.Count -gt 0))
}
[Console]::Out.WriteLine((ConvertTo-Json $state -Compress))

# Bring Anki's main window to the front.
#
# Ebiki cannot sign in to AnkiWeb for the user, and deliberately does not try:
# AnkiConnect exposes no login action, and the only way to add one would be for
# Ebiki to collect an AnkiWeb password and forward it, which is exactly the thing
# a password should never be put through. Anki's own Sync button is the secure
# path. What Ebiki CAN do is remove the part people get stuck on - finding the
# Anki window at all - so "sign in" is one click here and one click there.
#
# The opposite of scripts/minimize-anki.ps1, and it follows the same hard-won
# rules: act only on the MAIN window (title "* - Anki"), never on the transient
# windows Anki paints while syncing or starting, and do the least possible.
Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class EbikiFocus {
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc cb, IntPtr l);
  public delegate bool EnumWindowsProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int cmd);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
}
"@

$pids = @()
foreach ($n in 'anki', 'ankiw') {
  foreach ($p in (Get-Process -Name $n -ErrorAction SilentlyContinue)) { $pids += [int]$p.Id }
}
# The real Anki runs out of a venv on modern installs, so the surviving process
# can be pythonw - but that name is far too generic to trust on its own.
foreach ($p in (Get-Process -Name 'pythonw' -ErrorAction SilentlyContinue)) {
  try { if ($p.Path -like '*Anki*') { $pids += [int]$p.Id } } catch {}   # Path throws on denied
}

$target = [IntPtr]::Zero
$cb = [EbikiFocus+EnumWindowsProc]{
  param($h, $l)
  if ($script:target -ne [IntPtr]::Zero) { return $true }
  $procId = 0
  [void][EbikiFocus]::GetWindowThreadProcessId($h, [ref]$procId)
  if (($pids -notcontains [int]$procId) -or -not [EbikiFocus]::IsWindowVisible($h)) { return $true }
  $sb = New-Object System.Text.StringBuilder 512
  [void][EbikiFocus]::GetWindowText($h, $sb, 512)
  # Only the MAIN window. Anki's own "Syncing..." and other transient dialogs are
  # its business, and pulling one of those forward would be worse than nothing.
  if ($sb.ToString() -like '* - Anki') { $script:target = $h }
  return $true
}
[void][EbikiFocus]::EnumWindows($cb, [IntPtr]::Zero)

if ($target -eq [IntPtr]::Zero) {
  [Console]::Out.WriteLine('{"ok":false,"reason":"no-window"}')
  exit 0
}
# 9 = SW_RESTORE, so a minimized Anki comes back at the size the user left it.
if ([EbikiFocus]::IsIconic($target)) { [void][EbikiFocus]::ShowWindow($target, 9) }
[void][EbikiFocus]::SetForegroundWindow($target)
[Console]::Out.WriteLine('{"ok":true}')

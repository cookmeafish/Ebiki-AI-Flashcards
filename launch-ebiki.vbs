' Ebiki launcher. The Desktop / Start Menu shortcut points here.
' 1) Show the splash IMMEDIATELY (scripts/splash.hta) so the click has instant
'    feedback: everything below this line is invisible (the PowerShell script
'    runs hidden, and Anki / the dev server / Electron each take seconds), so
'    without it the app just "randomly opens a little bit afterwards" with
'    nothing on screen in between. The splash closes itself as soon as the app
'    window is up (see the .app-ready marker in scripts/launch.ps1).
' 2) Run launch.ps1 completely hidden (no console window flash), which starts
'    the dev server (one instance) and opens the app window.
Set sh  = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appDir  = fso.GetParentFolderName(WScript.ScriptFullName)
sh.CurrentDirectory = appDir

' The splash watches for this file, so a leftover from the previous run would
' close it instantly. Never fatal - a splash is a nicety, the launch is not.
On Error Resume Next
readyFile = appDir & "\.app-ready"
If fso.FileExists(readyFile) Then fso.DeleteFile readyFile, True

mshta = sh.ExpandEnvironmentStrings("%SystemRoot%\System32\mshta.exe")
splash = appDir & "\scripts\splash.hta"
If fso.FileExists(mshta) And fso.FileExists(splash) Then
  sh.Run """" & mshta & """ """ & splash & """", 1, False
End If
On Error Goto 0

sh.Run "powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & appDir & "\scripts\launch.ps1""", 0, False

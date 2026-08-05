' Ebiki launcher. The Desktop / Start Menu shortcut points here.
' Runs launch.ps1 completely hidden (no console window flash), which starts the
' dev server (one instance) and opens the browser at http://localhost:3000.
Set sh  = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appDir  = fso.GetParentFolderName(WScript.ScriptFullName)
sh.CurrentDirectory = appDir
sh.Run "powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & appDir & "\launch.ps1""", 0, False

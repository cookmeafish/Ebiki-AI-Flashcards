@echo off
REM Ebiki installer. Double-click this file.
REM Installs Node.js + Git if needed, runs npm install, and makes a Desktop shortcut.
REM Works from whatever folder this file is in (%~dp0), spaces in the path are fine.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
echo.
pause

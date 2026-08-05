@echo off
REM Ebiki installer. Double-click this file.
REM It installs Node.js if needed, runs npm install, and makes a Desktop shortcut.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"

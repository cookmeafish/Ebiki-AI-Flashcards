@echo off
REM ===========================================================
REM  THIS IS THE FILE TO RUN. Just double-click it.
REM  Everything else in the folder is used by the app itself.
REM ===========================================================
REM Installs Node.js + Git if needed, runs npm install, and makes a Desktop shortcut.
REM Works from whatever folder this file is in (%~dp0), spaces in the path are fine.
title Install Ebiki
echo.
echo   Installing Ebiki. You do not need to run anything else.
echo   Leave this window open until it says it is finished.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup.ps1"
echo.
pause

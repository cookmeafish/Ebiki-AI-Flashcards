#!/usr/bin/env bash
# Ebiki launcher (Linux). Mirrors scripts/launch.ps1's behavior:
# 1) Make sure Anki is up (the app reads/writes every card through AnkiConnect).
# 2) If the app is already running, just bring its window forward.
# 3) Otherwise do a QUICK update check (skipped when snoozed or offline), offer
#    to update, then start the dev server and open Ebiki as its own window
#    (open_app below - a chrome-free Electron window when available, a plain
#    browser tab as the fallback).
# Path-relative so it works wherever the app is cloned; this script lives in
# scripts/, so the app folder is one level up.
set -u
APP="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP"

# ── Start Anki if it isn't up ───────────────────────────────────────────────
# Same reasoning as launch.ps1: without Anki running, Deck / Study / Discover
# sit on "Anki is not connected". Fail-soft - the app still opens without it.
anki_up() {
  # AnkiConnect answering is the real test (a starting-but-not-serving-yet
  # Anki still counts as "already starting", handled by pgrep below).
  (exec 3<>/dev/tcp/127.0.0.1/8765) 2>/dev/null && { exec 3>&-; return 0; }
  pgrep -x anki >/dev/null 2>&1
}
start_anki_if_needed() {
  anki_up && return
  local exe=""
  exe="$(command -v anki 2>/dev/null || true)"
  if [ -z "$exe" ] && [ -x /var/lib/flatpak/exports/bin/net.ankiweb.Anki ]; then
    exe="flatpak run net.ankiweb.Anki"
  fi
  [ -z "$exe" ] && return   # Anki not installed -> nothing to do
  nohup $exe >/dev/null 2>&1 &
  disown
}
start_anki_if_needed || true

# ── Open Ebiki as its own chrome-free window ────────────────────────────────
# electron is an OPTIONAL dependency (fail-soft, same philosophy as Anki above -
# the app still works without it), so this only ever runs when `npm install`
# actually got it. Falls back to a normal browser tab otherwise: a website-
# looking tab beats no app at all. --class=Ebiki sets the X11 WM_CLASS so
# desktop environments group/icon it using scripts/setup.sh's .desktop entry
# (StartupWMClass=Ebiki) instead of a generic "Electron" identity.
open_app() {
  local electron_bin="$APP/node_modules/electron/dist/electron"
  if [ -x "$electron_bin" ]; then
    nohup "$electron_bin" "$APP/electron/main.cjs" --app-window --class=Ebiki >/dev/null 2>&1 &
    disown
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open 'http://localhost:3000' >/dev/null 2>&1 &
    disown
  fi
}

# One dev server, ever, from the shortcut/desktop entry. flock (not a fixed
# sleep) so a launch that's mid-boot doesn't race a second one into starting
# its own `npm run dev` - the second waiter sees port 3000 answering and just
# opens/focuses the app. A manual `npm run dev` is deliberately OUTSIDE this
# lock; it stays the way to run a second copy on purpose.
LOCK_FILE="$APP/.launcher.lock"
exec 200>"$LOCK_FILE"
flock -w 120 200 || true

port_listening() {
  (exec 3<>/dev/tcp/127.0.0.1/3000) 2>/dev/null && { exec 3>&-; return 0; }
  return 1
}

# Already running -> just show it (don't disrupt or re-check). If it's already
# open as an Electron app window, requestSingleInstanceLock in electron/main.cjs
# means this just focuses that window instead of opening a second one - the
# same "click the icon again -> it comes to front" behavior a real installed
# app has, not a fresh browser tab piling up next to the old one.
if port_listening; then
  open_app
  exit 0
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Ebiki could not find Node.js/npm. Install Node.js (e.g. via your distro's package manager or nodejs.org), then run scripts/setup.sh again." >&2
  # Best-effort GUI notice too, since this may be launched from a desktop icon with no visible terminal.
  command -v zenity >/dev/null 2>&1 && zenity --error --text="Ebiki could not find Node.js.\n\nInstall Node.js, then run scripts/setup.sh again." 2>/dev/null
  exit 1
fi

# ── Quick, seamless update check ────────────────────────────────────────────
check_update() {
  local snooze="$APP/.update-snooze"
  if [ -f "$snooze" ]; then
    local until_ts
    until_ts="$(date -d "$(cat "$snooze")" +%s 2>/dev/null || echo 0)"
    [ "$until_ts" -gt "$(date +%s)" ] 2>/dev/null && return
  fi
  command -v git >/dev/null 2>&1 || return
  local local_head
  local_head="$(git -C "$APP" rev-parse HEAD 2>/dev/null)"
  [ -z "$local_head" ] && return

  local line remote
  line="$(timeout 6 git -C "$APP" ls-remote origin master 2>/dev/null | head -n1)"
  [ -z "$line" ] && return            # unreachable -> open normally
  remote="$(echo "$line" | awk '{print $1}')"
  [ -z "$remote" ] && return
  [ "$remote" = "$local_head" ] && return   # up to date -> open normally

  local answer=""
  if command -v zenity >/dev/null 2>&1; then
    zenity --question --title="Ebiki update" --text="A new version of Ebiki is available.\n\nUpdate now? It only takes a few seconds." --timeout=60 2>/dev/null
    case $? in 0) answer=yes ;; 1) answer=no ;; *) answer=timeout ;; esac
  elif command -v kdialog >/dev/null 2>&1; then
    kdialog --yesno "A new version of Ebiki is available.\n\nUpdate now?" 2>/dev/null
    [ $? -eq 0 ] && answer=yes || answer=no
  else
    return   # no GUI prompt available - never auto-update without asking
  fi

  if [ "$answer" = yes ]; then
    git -C "$APP" pull --ff-only origin master >/dev/null 2>&1
    (cd "$APP" && npm install --no-fund --no-audit >/dev/null 2>&1)
    rm -f "$snooze"
  elif [ "$answer" = no ]; then
    date -d '+7 days' -Iseconds > "$snooze" 2>/dev/null || date -v+7d -Iseconds > "$snooze" 2>/dev/null
  fi
  # timeout -> just open normally, ask again next time
}
check_update || true

# ── Start the dev server in the background, then open the app ourselves ────
# EBIKI_AUTO_EXIT marks this as a shortcut launch, which changes THREE things
# in vite.config.js: the server shuts itself down once the last browser tab
# (or, now, the app window) is gone; it must own port 3000 or fail rather
# than quietly sliding to 3001 as a second invisible instance; and Vite's own
# open:true is turned OFF, since open_app below opens the real app window/tab
# itself - leaving open:true on would additionally pop a plain browser tab
# next to it.
export EBIKI_AUTO_EXIT=1
nohup npm run dev >/tmp/ebiki-dev.log 2>&1 &
disown

deadline=$(( $(date +%s) + 60 ))
while ! port_listening; do
  [ "$(date +%s)" -gt "$deadline" ] && break
  sleep 0.8
done
open_app

flock -u 200

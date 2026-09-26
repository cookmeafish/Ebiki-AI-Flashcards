#!/usr/bin/env bash
# Ebiki launcher (Linux). Mirrors scripts/launch.ps1's behavior:
# 1) Make sure Anki is up (the app reads/writes every card through AnkiConnect).
# 2) If the app is already running, just bring its window forward.
# 3) Otherwise do a QUICK update check (every launch; skipped only when offline
#    or git is missing), offer
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
  nohup $exe >/dev/null 2>&1 200>&- &
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
# How THIS computer opens Ebiki: 'app' = the chrome-free Electron window,
# 'browser' = an ordinary tab. Machine-local (launchmode.json, gitignored) for
# the same reasons as datadir.json: two computers sharing one data folder may
# want different answers, and config.json cannot serve this - it lives inside
# the data folder, and this runs before the dev server exists. Anything missing
# or unreadable means 'app', today's default. No jq dependency: a plain grep.
launch_mode() {
  if [ -f "$APP/launchmode.json" ] && grep -q '"browser"' "$APP/launchmode.json" 2>/dev/null; then
    echo browser
  else
    echo app
  fi
}

open_app() {
  local electron_bin="$APP/node_modules/electron/dist/electron"
  # macOS installs an app bundle instead; without this, "app window" mode always opened a browser tab.
  [ -x "$electron_bin" ] || electron_bin="$APP/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron"
  # The user's choice wins, but only where it can be honored: 'browser' always
  # works, 'app' still falls back to a tab when electron is missing.
  if [ "$(launch_mode)" != browser ] && [ -x "$electron_bin" ]; then
    # --from-launcher tells electron/main.cjs the dev server is handled out here;
    # a bare launch (a dock/taskbar pin of the binary itself) has to bootstrap it.
    # 200>&- : long-lived children must not inherit the launcher lock (the window held it for its whole
    # life, so the next click, or the window's own revive, waited 20 minutes and then did nothing).
    nohup "$electron_bin" "$APP/electron/main.cjs" --class=Ebiki --from-launcher >/dev/null 2>&1 200>&- &
    disown
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open 'http://localhost:3000' >/dev/null 2>&1 &
    disown
  elif command -v open >/dev/null 2>&1; then
    open 'http://localhost:3000' >/dev/null 2>&1   # macOS has no xdg-open
  fi
}

# `timeout` is GNU coreutils: macOS has none, so the update check below found no remote and was
# silently skipped on every launch there. gtimeout (Homebrew coreutils) or a portable fallback.
run_with_timeout() {
  local secs="$1"; shift
  if command -v timeout >/dev/null 2>&1; then timeout "$secs" "$@"; return; fi
  if command -v gtimeout >/dev/null 2>&1; then gtimeout "$secs" "$@"; return; fi
  "$@" &
  local pid=$!
  # The watcher's output goes nowhere: holding the caller's $(...) pipe open would make every
  # launch wait the full timeout.
  ( sleep "$secs"; kill "$pid" 2>/dev/null ) >/dev/null 2>&1 &
  local watcher=$!
  wait "$pid"; local rc=$?
  kill "$watcher" 2>/dev/null
  return $rc
}

# Every update decision goes to logs/update.log, as on Windows (launch.ps1).
log_update() {
  mkdir -p "$APP/logs" 2>/dev/null
  printf '%s  launcher: %s\n' "$(date '+%Y-%m-%dT%H:%M:%S')" "$1" >> "$APP/logs/update.log" 2>/dev/null || true
}

# One dev server, ever, from the shortcut/desktop entry. flock (not a fixed
# sleep) so a launch that's mid-boot doesn't race a second one into starting
# its own `npm run dev` - the second waiter sees port 3000 answering and just
# opens/focuses the app. A manual `npm run dev` is deliberately OUTSIDE this
# lock; it stays the way to run a second copy on purpose.
LOCK_FILE="$APP/.launcher.lock"
exec 200>"$LOCK_FILE"
# Wait as long as a first launcher can legitimately take (an update question, then npm install);
# carrying on after 2 minutes ran a second update and npm install in the same folder. Still busy
# after 20 minutes: start nothing. (No flock at all, as on stock macOS: no lock, as before.)
if command -v flock >/dev/null 2>&1; then flock -w 1200 200 || exit 0; fi

# localhost, not 127.0.0.1: Vite binds to what localhost resolves to first, which can be IPv6 ::1
# only (macOS, current Node on Windows). bash tries every address localhost resolves to.
port_listening() {
  (exec 3<>/dev/tcp/localhost/3000) 2>/dev/null && { exec 3>&-; return 0; }
  return 1
}

# A bare TCP connect above is not the same question as "is the server actually
# ANSWERING?" - a wedged Node process (measured cause on the Windows side of
# this project: a synchronous filesystem check against an unreachable network
# mount, which blocks Node's one event-loop thread on the OS-level connection
# attempt instead of failing fast) still accepts new connections while every
# real request hangs forever. Reopening Ebiki against exactly that kind of
# freeze used to just reconnect to the same dead service - a real HTTP round
# trip with a hard timeout tells the difference. Self-contained in a subshell
# so fd 3 never leaks into the rest of the script.
# Three tries before "wedged" (see Test-ServerHealthy in launch.ps1: a synchronous backup pass on a
# big share can hold the event loop for seconds, and one miss killed a healthy server).
server_healthy() {
  server_healthy_once && return 0
  sleep 3; server_healthy_once && return 0
  sleep 3; server_healthy_once
}
server_healthy_once() {
  (
    exec 3<>/dev/tcp/localhost/3000 2>/dev/null || exit 1
    printf 'GET /api/alive HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n' >&3
    IFS= read -r -t 4 status <&3 || exit 1
    # ANY HTTP reply means the process is alive (only no reply is a wedge): a 404 from another app
    # on port 3000 used to count as wedged, and that app was killed.
    case "$status" in
      HTTP/1.?\ *) exit 0 ;;
      *) exit 1 ;;
    esac
  ) 2>/dev/null
}

# Only ever the process actually holding port 3000 - never anything else on
# the machine.
stop_stale_server() {
  local pids=""
  # lsof first: macOS ships a fuser that only takes file paths, so "fuser 3000/tcp" printed nothing
  # there and the wedged server was never stopped.
  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -ti tcp:3000 -sTCP:LISTEN 2>/dev/null)"
  fi
  if [ -z "$pids" ] && command -v fuser >/dev/null 2>&1; then
    pids="$(fuser 3000/tcp 2>/dev/null)"
  fi
  for pid in $pids; do
    # Only OUR server (its command line names this app folder); another program on 3000 is left alone.
    case "$(ps -o command= -p "$pid" 2>/dev/null)" in
      *"$APP"*) kill -9 "$pid" 2>/dev/null ;;
    esac
  done
  local deadline
  deadline=$(( $(date +%s) + 5 ))
  while port_listening && [ "$(date +%s)" -lt "$deadline" ]; do sleep 0.2; done
}

# Already running -> just show it (don't disrupt or re-check). If it's already
# open as an Electron app window, requestSingleInstanceLock in electron/main.cjs
# means this just focuses that window instead of opening a second one - the
# same "click the icon again -> it comes to front" behavior a real installed
# app has, not a fresh browser tab piling up next to the old one.
if port_listening; then
  if server_healthy; then
    flock -u 200 2>/dev/null || true # nothing left to guard; release before the window opens
    open_app
    exit 0
  fi
  # Listening but not answering: a wedged server from an earlier session, not
  # a working one. Stop it and fall through to the normal fresh-start path
  # below instead of exiting.
  mkdir -p "$APP/logs" 2>/dev/null
  printf '%s  launcher: port 3000 was listening but not answering - stopped the stale server and starting fresh\n' "$(date '+%Y-%m-%dT%H:%M:%S')" >> "$APP/logs/update.log" 2>/dev/null || true
  stop_stale_server
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Ebiki could not find Node.js/npm. Install Node.js (e.g. via your distro's package manager or nodejs.org), then run scripts/setup.sh again." >&2
  # Best-effort GUI notice too, since this may be launched from a desktop icon with no visible terminal.
  command -v zenity >/dev/null 2>&1 && zenity --error --text="Ebiki could not find Node.js.\n\nInstall Node.js, then run scripts/setup.sh again." 2>/dev/null
  exit 1
fi

# ── Quick, seamless update check ────────────────────────────────────────────
check_update() {
  # ALWAYS check - no snooze on this path. A single "not now" used to buy a week
  # of total silence, which is how an update goes unnoticed for a fortnight. The
  # check is a refs-only lookup behind a 6s timeout, so it never slows a launch.
  rm -f "$APP/.update-snooze"   # sweep the marker older versions left behind
  command -v git >/dev/null 2>&1 || return
  local local_head
  local_head="$(git -C "$APP" rev-parse HEAD 2>/dev/null)"
  [ -z "$local_head" ] && return
  # Updates come from master, always. A clone on another branch would be offered an
  # update every launch that could never apply (master into another branch is not a
  # fast-forward), so leave those alone.
  local branch
  branch="$(git -C "$APP" rev-parse --abbrev-ref HEAD 2>/dev/null)"
  [ -n "$branch" ] && [ "$branch" != master ] && return

  local line remote
  line="$(run_with_timeout 6 git -C "$APP" ls-remote origin master 2>/dev/null | head -n1)"
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
  elif command -v osascript >/dev/null 2>&1; then
    # macOS has neither zenity nor kdialog, so every update there was skipped without a word.
    local out
    out="$(osascript -e 'display dialog "A new version of Ebiki is available." & return & return & "Update now? It only takes a few seconds." buttons {"Not now", "Update now"} default button "Update now" with title "Ebiki update" giving up after 60' 2>/dev/null)"
    case "$out" in
      *"gave up:true"*) answer=timeout ;;
      *"Update now"*) answer=yes ;;
      *) answer=no ;;
    esac
  else
    log_update "update available ($local_head -> $remote) but skipped: no GUI prompt available"
    return   # no GUI prompt available - never auto-update without asking
  fi

  log_update "update offered ($local_head -> $remote), answer: $answer"
  if [ "$answer" = yes ]; then
    # MATCH master, do not merely move toward it: `pull --ff-only` is only correct
    # while master goes forwards, and with the local commit AHEAD (a retracted
    # release) it exits 0 saying "Already up to date" while changing nothing.
    if git -C "$APP" fetch origin master >/dev/null 2>&1; then
      if git -C "$APP" merge-base --is-ancestor HEAD FETCH_HEAD >/dev/null 2>&1; then
        git -C "$APP" merge --ff-only FETCH_HEAD >/dev/null 2>&1
      elif [ -z "$(git -C "$APP" status --porcelain --untracked-files=no 2>/dev/null)" ]; then
        # rewound or rewritten upstream, and nothing of ours would be lost
        git -C "$APP" reset --hard FETCH_HEAD >/dev/null 2>&1
      fi
    fi
    # Only a HEAD that actually moved is an update. A Yes that changed nothing (no network, a
    # hand-edited tracked file, a refused merge) used to run npm install and say nothing.
    local new_head
    new_head="$(git -C "$APP" rev-parse HEAD 2>/dev/null)"
    if [ -n "$new_head" ] && [ "$new_head" != "$local_head" ]; then
      log_update "update applied ($local_head -> $new_head)"
      # A failed install is retried on the next start (it was never retried: HEAD already matched master).
      # The marker goes down FIRST and is cleared on success, so an install cut off midway counts too.
      date > "$APP/.npm-install-pending"
      if (cd "$APP" && npm install --no-fund --no-audit >/dev/null 2>&1); then rm -f "$APP/.npm-install-pending"
      else log_update "npm install failed; will retry on the next start"; fi
    else
      log_update "update FAILED: HEAD did not move"
      if command -v zenity >/dev/null 2>&1; then
        zenity --warning --title="Ebiki update" --text="Ebiki could not update this time. It will open the current version and ask again next launch." --timeout=15 2>/dev/null
      elif command -v kdialog >/dev/null 2>&1; then
        kdialog --sorry "Ebiki could not update this time. It will open the current version and ask again next launch." 2>/dev/null
      fi
    fi
  fi
  # no / timeout -> just open; nothing is recorded, so the next launch asks again,
  # and Settings > General > Updates carries the offer in the meantime
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
if [ -f "$APP/.npm-install-pending" ]; then
  if (cd "$APP" && npm install --no-fund --no-audit >/dev/null 2>&1); then
    rm -f "$APP/.npm-install-pending"; log_update "finished the pending npm install"
  else
    log_update "pending npm install failed again"
  fi
fi
# In the app folder, not a shared /tmp path: a second user account on the machine could not write the first
# one's /tmp/ebiki-dev.log, and bash then never started the server.
mkdir -p "$APP/logs"
nohup npm run dev >"$APP/logs/dev.log" 2>&1 200>&- &
disown

deadline=$(( $(date +%s) + 60 ))
while ! port_listening; do
  [ "$(date +%s)" -gt "$deadline" ] && break
  sleep 0.8
done
open_app

flock -u 200

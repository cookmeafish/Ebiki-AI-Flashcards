#!/usr/bin/env bash
# Ebiki launcher (Linux and macOS). Mirrors scripts/launch.ps1's behavior:
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
# -P: the PHYSICAL path, which is what the server's command line holds (through a symlinked folder, or
# macOS's /tmp -> /private/tmp, stop_stale_server never recognised our own wedged server).
APP="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"

# Messages come from the app's locale files through scripts/launcher-i18n.cjs (the app language, else the system
# language, else English). Needs node; without it the key itself would show, so the only message that can appear
# without node (the "no Node.js" one) keeps an English text of its own.
t() { node "$APP/scripts/launcher-i18n.cjs" "$@" 2>/dev/null || printf '%s' "$1"; }
# A text safe inside an AppleScript string literal.
as_str() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'; }
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
  # An array: a path with spaces ("~/My Apps/bin/anki") was split into words and Anki never started.
  local exe=""
  local -a cmd=()
  exe="$(command -v anki 2>/dev/null || true)"
  [ -n "$exe" ] && cmd=("$exe")
  if [ -z "$exe" ] && [ -x /var/lib/flatpak/exports/bin/net.ankiweb.Anki ]; then
    exe="flatpak"; cmd=(flatpak run net.ankiweb.Anki)
  fi
  # macOS: Anki is an app bundle with no command on PATH, so it was never started there. -g keeps it in
  # the background (like launch.ps1's minimized start); `open` on an already-running Anki is harmless.
  if [ -z "$exe" ] && command -v open >/dev/null 2>&1; then
    for app in "/Applications/Anki.app" "$HOME/Applications/Anki.app"; do
      if [ -d "$app" ]; then open -g "$app" >/dev/null 2>&1 200>&- || true; return; fi
    done
  fi
  [ -z "$exe" ] && return   # Anki not installed -> nothing to do
  nohup "${cmd[@]}" >/dev/null 2>&1 200>&- &
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
  # The "mode" key only, like the other three readers (any "browser" anywhere in the file used to count).
  if [ -f "$APP/launchmode.json" ] && grep -Eq '"mode"[[:space:]]*:[[:space:]]*"browser"' "$APP/launchmode.json" 2>/dev/null; then
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
  elif [ "$(uname)" = Darwin ] && command -v open >/dev/null 2>&1; then
    open 'http://localhost:3000' >/dev/null 2>&1   # macOS has no xdg-open (on Linux `open` is openvt)
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
# No flock (stock macOS): a mkdir lock instead, so a double click can't run two updates, two npm installs
# and two servers in one folder. Stale after 20 minutes or when its owner is gone.
LOCK_DIR="$APP/.launcher.lock.d"
HAVE_MKDIR_LOCK=0
# WAITED=1: another launcher held the lock (a double click). Like launch.ps1's follower, this one then skips
# the update question: the first one just asked it, and "Not now" was followed by the same question again.
WAITED=0
if command -v flock >/dev/null 2>&1; then
  if ! flock -n 200; then WAITED=1; flock -w 1200 200 || exit 0; fi
else
  lock_deadline=$(( $(date +%s) + 1200 ))
  while ! mkdir "$LOCK_DIR" 2>/dev/null; do
    WAITED=1
    owner="$(cat "$LOCK_DIR/pid" 2>/dev/null)"
    # No pid yet may just be the owner between its mkdir and writing it: look once more before calling it stale.
    [ -z "$owner" ] && { sleep 1; owner="$(cat "$LOCK_DIR/pid" 2>/dev/null)"; }
    if [ -z "$owner" ] || ! kill -0 "$owner" 2>/dev/null || [ -n "$(find "$LOCK_DIR" -maxdepth 0 -mmin +20 2>/dev/null)" ]; then
      rm -rf "$LOCK_DIR" 2>/dev/null; continue
    fi
    [ "$(date +%s)" -gt "$lock_deadline" ] && exit 0
    sleep 1
  done
  echo $$ > "$LOCK_DIR/pid"
  HAVE_MKDIR_LOCK=1
  trap 'rm -rf "$LOCK_DIR" 2>/dev/null' EXIT
fi
release_lock() {
  flock -u 200 2>/dev/null || true
  # The EXIT trap goes too: left set, it deleted the lock a waiting launcher had taken since.
  [ "$HAVE_MKDIR_LOCK" = 1 ] && { rm -rf "$LOCK_DIR" 2>/dev/null; trap - EXIT; }
  HAVE_MKDIR_LOCK=0
}

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
# Is the running app installing an update itself (Settings > Data & updates)? Then the launcher's own check is
# skipped: a Yes ran a second npm install in the same node_modules.
server_updating() {
  (
    exec 3<>/dev/tcp/localhost/3000 2>/dev/null || exit 1
    printf 'GET /api/alive HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n' >&3
    body=''
    IFS= read -r -t 4 -d '' body <&3
    case "$body" in *'"updateRunning":true'*) exit 0 ;; *) exit 1 ;; esac
  ) 2>/dev/null
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


if ! command -v npm >/dev/null 2>&1; then
  # English on purpose: the translations are read with node, which is exactly what is missing here.
  echo "Ebiki could not find Node.js/npm. Install Node.js (e.g. via your distro's package manager or nodejs.org), then run scripts/setup.sh again." >&2
  # Best-effort GUI notice too, since this may be launched from a desktop icon with no visible terminal.
  command -v zenity >/dev/null 2>&1 && zenity --error --text="Ebiki could not find Node.js.\n\nInstall Node.js, then run scripts/setup.sh again." 2>/dev/null
  exit 1
fi

# ── Quick, seamless update check ────────────────────────────────────────────
UPDATED=0
# Is HEAD on PUBLISHED history? Published = on ANY value origin/master has had (its reflog), not only the last
# one (an earlier fetch already moved the ref, and that refused forever), plus every commit HEAD was set to FROM
# the remote (a clone does not log origin/master's first value). $1: one more known remote value (optional).
head_published() {
  local c
  for c in $( { git -C "$APP" reflog show --format=%H refs/remotes/origin/master 2>/dev/null | head -n 200
                git -C "$APP" reflog show --format='%H %gs' HEAD 2>/dev/null | head -n 500 | grep -E '^[0-9a-f]+ (clone:|reset: moving to FETCH_HEAD$|(pull[^:]*|merge [0-9a-f]{7,}): Fast-forward$)' | cut -d' ' -f1
                echo "$1"; } | awk 'NF && !seen[$0]++' ); do
    if git -C "$APP" merge-base --is-ancestor HEAD "$c" >/dev/null 2>&1; then return 0; fi
  done
  return 1
}

NPM_TRIED=0 # set by check_update's install (never inherited from the environment)
check_update() {
  # ALWAYS check - no snooze on this path. A single "not now" used to buy a week
  # of total silence, which is how an update goes unnoticed for a fortnight. The
  # check is a refs-only lookup behind a 6s timeout, so it never slows a launch.
  rm -f "$APP/.update-snooze"   # sweep the marker older versions left behind
  # Every skip is logged (as in launch.ps1): "it never updates" left no trace otherwise.
  command -v git >/dev/null 2>&1 || { log_update "skipped: git not found"; return; }
  local local_head
  # Ebiki's OWN checkout only (a copy without .git inside another repository updated THAT repository), and
  # never a credential prompt (it hung the launch; /api/update and launch.ps1 set the same).
  [ -e "$APP/.git" ] || { log_update "skipped: $APP is not its own git checkout"; return; }
  export GIT_TERMINAL_PROMPT=0 GCM_INTERACTIVE=never GIT_ASKPASS=echo
  local_head="$(git -C "$APP" rev-parse HEAD 2>/dev/null)"
  [ -z "$local_head" ] && { log_update "skipped: HEAD unreadable"; return; }
  # Updates come from master, always. A clone on another branch would be offered an
  # update every launch that could never apply (master into another branch is not a
  # fast-forward), so leave those alone.
  local branch
  branch="$(git -C "$APP" rev-parse --abbrev-ref HEAD 2>/dev/null)"
  [ -n "$branch" ] && [ "$branch" != master ] && { log_update "skipped: on branch $branch, not master"; return; }
  local line remote
  line="$(run_with_timeout 6 git -C "$APP" ls-remote origin refs/heads/master 2>/dev/null | head -n1)"
  [ -z "$line" ] && { log_update "skipped: origin unreachable (or master missing)"; return; }   # open normally
  # A shallow clone can't show its build number or be diffed: deepened once, like launch.ps1, and only once
  # the remote answered (offline, every launch spent 60s here), giving up on a stalled transfer.
  [ -f "$APP/.git/shallow" ] && run_with_timeout 60 git -C "$APP" -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=20 fetch --unshallow >/dev/null 2>&1
  remote="$(echo "$line" | awk '{print $1}')"
  [ -z "$remote" ] && return
  [ "$remote" = "$local_head" ] && { log_update "already latest ($local_head)"; return; }   # open normally
  # This copy has its own (never published) commits on master: the update is always refused (to keep them), yet
  # every launch asked. Not only when AHEAD: once master moves on the copy has DIVERGED (asked forever). The
  # current origin/master counts as published. A retracted release (HEAD published) still asks.
  if ! head_published "$(git -C "$APP" rev-parse -q --verify refs/remotes/origin/master 2>/dev/null)"; then
    log_update "no update: this copy has its own commits on master"; return
  fi

  local answer=""
  local q_title q_new q_ask b_yes b_no
  q_title="$(t ln_updateDialogTitle)"; q_new="$(t ln_updateAvailableUnix)"; q_ask="$(t ln_updateQuickUnix)"
  b_yes="$(t ln_updateNow)"; b_no="$(t ln_notNow)"
  if command -v zenity >/dev/null 2>&1; then
    zenity --question --title="$q_title" --text="$q_new\n\n$q_ask" --ok-label="$b_yes" --cancel-label="$b_no" --timeout=60 2>/dev/null
    case $? in 0) answer=yes ;; 1) answer=no ;; *) answer=timeout ;; esac
  elif command -v kdialog >/dev/null 2>&1; then
    kdialog --title "$q_title" --yes-label "$b_yes" --no-label "$b_no" --yesno "$q_new\n\n$q_ask" 2>/dev/null
    [ $? -eq 0 ] && answer=yes || answer=no
  elif command -v osascript >/dev/null 2>&1; then
    # macOS has neither zenity nor kdialog, so every update there was skipped without a word.
    local out
    out="$(osascript -e "display dialog \"$(as_str "$q_new")\" & return & return & \"$(as_str "$q_ask")\" buttons {\"$(as_str "$b_no")\", \"$(as_str "$b_yes")\"} default button \"$(as_str "$b_yes")\" with title \"$(as_str "$q_title")\" giving up after 60" 2>/dev/null)"
    case "$out" in
      *"gave up:true"*) answer=timeout ;;
      *"button returned:$b_yes"*) answer=yes ;;
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
    # Where master WAS: a reset only for a checkout on published history (never-published commits are kept).
    local old_origin
    old_origin="$(git -C "$APP" rev-parse -q --verify refs/remotes/origin/master 2>/dev/null)"
    if git -C "$APP" -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=20 fetch origin master >/dev/null 2>&1; then
      if git -C "$APP" merge-base --is-ancestor HEAD FETCH_HEAD >/dev/null 2>&1; then
        git -C "$APP" merge --ff-only FETCH_HEAD >/dev/null 2>&1
      elif [ -z "$(git -C "$APP" status --porcelain --untracked-files=no 2>/dev/null)" ]; then
        if head_published "$old_origin"; then
          # rewound or rewritten upstream, and nothing of ours would be lost
          git -C "$APP" reset --hard FETCH_HEAD >/dev/null 2>&1
        else
          log_update "refused: this copy has commits on master that were never published (kept)"
        fi
      else
        # The skip reason, not only the generic "HEAD did not move" below.
        log_update "refused: tracked files have local changes (kept)"
      fi
    else
      log_update "fetch of origin master failed"
    fi
    # Only a HEAD that actually moved is an update. A Yes that changed nothing (no network, a
    # hand-edited tracked file, a refused merge) used to run npm install and say nothing.
    local new_head
    new_head="$(git -C "$APP" rev-parse HEAD 2>/dev/null)"
    if [ -n "$new_head" ] && [ "$new_head" != "$local_head" ]; then
      log_update "update applied ($local_head -> $new_head)"
      UPDATED=1
      # A failed install is retried on the next start (it was never retried: HEAD already matched master).
      # The marker goes down FIRST and is cleared on success, so an install cut off midway counts too.
      date > "$APP/.npm-install-pending"
      NPM_TRIED=1   # a failure is retried on the NEXT start, not straight away (see the pending block)
      if (cd "$APP" && run_with_timeout 900 npm install --no-fund --no-audit >/dev/null 2>&1); then rm -f "$APP/.npm-install-pending"; node "$APP/scripts/deps-fingerprint.mjs" --stamp >/dev/null 2>&1
      else log_update "npm install failed; will retry on the next start"; fi
    else
      log_update "update FAILED: HEAD did not move"
      local f_msg f_title f_ok
      f_msg="$(t ln_updateCouldNot)"; f_title="$(t ln_updateDialogTitle)"; f_ok="$(t ln_ok)"
      if command -v zenity >/dev/null 2>&1; then
        zenity --warning --title="$f_title" --text="$f_msg" --timeout=15 2>/dev/null
      elif command -v kdialog >/dev/null 2>&1; then
        kdialog --title "$f_title" --sorry "$f_msg" 2>/dev/null
      elif command -v osascript >/dev/null 2>&1; then
        # macOS (the question above used osascript too, so the failure must be told the same way)
        osascript -e "display dialog \"$(as_str "$f_msg")\" buttons {\"$(as_str "$f_ok")\"} default button \"$(as_str "$f_ok")\" with title \"$(as_str "$f_title")\" giving up after 15" >/dev/null 2>&1
      fi
    fi
  fi
  # no / timeout -> just open; nothing is recorded, so the next launch asks again,
  # and Settings > Data & updates carries the offer in the meantime
}
# Already running -> show it. If it's already open as an Electron app window, requestSingleInstanceLock in
# electron/main.cjs means this just focuses that window instead of opening a second one. The update check
# runs here too, like launch.ps1 (Check-Update -AlreadyRunning): a server kept alive by the auto-exit grace
# (up to 150s after closing) made every quick reopen skip the offer.
if port_listening; then
  if server_healthy; then
    if server_updating; then log_update "skipped: the running app is installing an update"
    elif [ "$WAITED" != 1 ]; then check_update || true; fi
    if [ "$UPDATED" = 1 ]; then
      msg="$(t ln_updatedReopen)"; m_title="$(t ln_updateDialogTitle)"; m_ok="$(t ln_ok)"
      if command -v zenity >/dev/null 2>&1; then zenity --info --title="$m_title" --text="$msg" --timeout=30 2>/dev/null
      elif command -v kdialog >/dev/null 2>&1; then kdialog --title "$m_title" --msgbox "$msg" 2>/dev/null
      elif command -v osascript >/dev/null 2>&1; then osascript -e "display dialog \"$(as_str "$msg")\" buttons {\"$(as_str "$m_ok")\"} default button \"$(as_str "$m_ok")\" with title \"$(as_str "$m_title")\" giving up after 30" >/dev/null 2>&1
      fi
    fi
    release_lock # nothing left to guard; release before the window opens
    open_app
    exit 0
  fi
  # Listening but not answering: a wedged server from an earlier session, not
  # a working one. Stop it and fall through to the normal fresh-start path
  # below instead of exiting.
  log_update "port 3000 was listening but not answering - stopped the stale server and starting fresh"
  stop_stale_server
fi

[ "$WAITED" = 1 ] || check_update || true

# ── Start the dev server in the background, then open the app ourselves ────
# EBIKI_AUTO_EXIT marks this as a shortcut launch, which changes THREE things
# in vite.config.js: the server shuts itself down once the last browser tab
# (or, now, the app window) is gone; it must own port 3000 or fail rather
# than quietly sliding to 3001 as a second invisible instance; and Vite's own
# open:true is turned OFF, since open_app below opens the real app window/tab
# itself - leaving open:true on would additionally pop a plain browser tab
# next to it.
export EBIKI_AUTO_EXIT=1
# Code that changed WITHOUT an update (a manual git pull, a branch switch, a copy from another computer) runs on
# the old node_modules: when the dependency lists differ from the last install, install first (through the pending
# marker below). It compares the code as it is now, so being several updates behind is covered too.
if [ ! -f "$APP/.npm-install-pending" ] && [ "${NPM_TRIED:-0}" != 1 ]; then
  node "$APP/scripts/deps-fingerprint.mjs" --check >/dev/null 2>&1
  if [ $? -eq 1 ]; then log_update "dependencies changed since the last install; installing"; date > "$APP/.npm-install-pending"; fi
fi
# Not when this launch's update just tried (and failed): a second 15-minute attempt held the lock for half an hour.
if [ -f "$APP/.npm-install-pending" ] && [ "${NPM_TRIED:-0}" != 1 ]; then
  # An install started by Settings can outlive the server it took down: wait for it (PID in the marker, 15 min cap).
  npid=$(grep -o '"pid":[0-9]*' "$APP/.npm-install-pending" 2>/dev/null | grep -o '[0-9]*$')
  if [ -n "$npid" ]; then
    waited=0
    # Only the install itself: named node/npm and started no later than the marker was written (a reused PID after
    # a reboot held the launch for 15 minutes). Unknown ages (no etimes, no stat) do not wait.
    mark_t=$(stat -c %Y "$APP/.npm-install-pending" 2>/dev/null || stat -f %m "$APP/.npm-install-pending" 2>/dev/null)
    started_ok() {
      age=$(ps -p "$npid" -o etimes= 2>/dev/null | tr -d ' ')
      # macOS ps has no etimes: parse etime ([[dd-]hh:]mm:ss).
      if [ -z "$age" ]; then
        et=$(ps -p "$npid" -o etime= 2>/dev/null | tr -d ' ')
        [ -n "$et" ] && age=$(printf '%s\n' "$et" | awk -F'[-:]' '{ s = 0; if (NF == 4) s = $1 * 86400 + $2 * 3600 + $3 * 60 + $4; else if (NF == 3) s = $1 * 3600 + $2 * 60 + $3; else s = $1 * 60 + $2; print s }')
      fi
      [ -n "$age" ] && [ -n "$mark_t" ] && [ $(( $(date +%s) - age )) -le $(( mark_t + 5 )) ]
    }
    while [ "$waited" -lt 900 ] && kill -0 "$npid" 2>/dev/null && ps -p "$npid" -o comm= 2>/dev/null | sed 's#.*/##' | grep -Eq '^(node|npm)( |$)' && started_ok; do
      sleep 5; waited=$((waited + 5))
    done
  fi
  if (cd "$APP" && run_with_timeout 900 npm install --no-fund --no-audit >/dev/null 2>&1); then
    rm -f "$APP/.npm-install-pending"; node "$APP/scripts/deps-fingerprint.mjs" --stamp >/dev/null 2>&1; log_update "finished the pending npm install"
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

release_lock

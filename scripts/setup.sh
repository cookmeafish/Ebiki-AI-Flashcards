#!/usr/bin/env bash
# Ebiki setup (Linux). Mirrors the parts of scripts/setup.ps1 that make sense
# cross-distro: installs the npm dependencies and creates a proper desktop
# launcher (Start-menu/app-grid entry + optional Desktop icon) with Ebiki's
# own icon, pointing at scripts/launch.sh.
#
# Anki/AnkiConnect auto-install is intentionally NOT attempted here (unlike
# setup.ps1's winget-based install): there is no single Linux equivalent of
# winget, and package names/availability vary widely by distro. Ebiki is
# fail-soft without Anki (same as on Windows) - install it yourself from
# https://apps.ankiweb.net/ and add the AnkiConnect add-on (code 2055492159)
# via Anki's Tools > Add-ons > Get Add-ons, then re-run this script isn't
# even required; launch.sh picks Anki up automatically once it's installed.
set -u
APP="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP"
# Messages come from the app's locale files (scripts/launcher-i18n.cjs, needs node). The "no Node.js" message
# below stays English: node is what is missing there.
t() { node "$APP/scripts/launcher-i18n.cjs" "$@" 2>/dev/null || printf '%s' "$1"; }

if ! command -v npm >/dev/null 2>&1; then
  echo "== Ebiki setup =="
  echo "Node.js/npm not found. Install it first (e.g. 'sudo apt install nodejs npm', or via nodejs.org / nvm), then run this script again." >&2
  exit 1
fi

echo "== $(t ln_inst_shTitle) =="

chmod +x "$APP/scripts/launch.sh" "$APP/scripts/setup.sh" 2>/dev/null || true

# --- git link functions (mirror setup.ps1: Test-GitHealthy, Test-RealClone, Link-ToGit) ---
# Never a sign-in prompt: a moved repository or an authenticating proxy opened a credential prompt and held the
# install forever (launch.sh and /api/update set the same).
export GIT_TERMINAL_PROMPT=0 GCM_INTERACTIVE=never GIT_ASKPASS=echo
EBIKI_REPO_URL="${EBIKI_REPO_URL:-https://github.com/cookmeafish/Ebiki-AI-Flashcards.git}"

# Usable repository, not merely a folder with a .git: a commit checked out, an origin, an upstream. A link cut off
# mid-fetch leaves a .git with none of these, and a bare ".git exists" check read that wreckage as a clone forever.
# --verify -q: in a repo with no commit, plain "rev-parse HEAD" still prints the word HEAD.
git_healthy() {
  command -v git >/dev/null 2>&1 || return 1
  [ -e "$1/.git" ] || return 1
  git -C "$1" rev-parse --verify -q HEAD >/dev/null 2>&1 || return 1
  [ -n "$(git -C "$1" config --get remote.origin.url 2>/dev/null)" ] || return 1
  git -C "$1" rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1 || return 1
  return 0
}

# A REAL clone (any checked-out commit) is never linked: link_to_git force-checks-out master and runs clean -fd,
# which would destroy a developer's uncommitted work. Such a folder is only repaired in place on master.
git_real_clone() {
  command -v git >/dev/null 2>&1 || return 1
  [ -e "$1/.git" ] || return 1
  git -C "$1" rev-parse --verify -q HEAD >/dev/null 2>&1
}

# Turn a ZIP folder (or an interrupted link) INTO a clone of master. FULL history (a shallow repo cannot log, diff
# or roll back). clean -fd WITHOUT -x: drops files a release renamed, keeps gitignored user data (config.json,
# modes/, decks/, .env, logs/). Prints the short sha, or the failure reason, on stdout; returns 1 on failure.
link_to_git() {
  git -C "$1" init -q >/dev/null 2>&1
  git -C "$1" remote remove origin >/dev/null 2>&1
  git -C "$1" remote add origin "$2" >/dev/null 2>&1
  if ! git -C "$1" -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=20 fetch origin master:refs/remotes/origin/master >/dev/null 2>&1; then
    t ln_inst_noGithub; return 1
  fi
  if ! git -C "$1" checkout -B master refs/remotes/origin/master -f >/dev/null 2>&1; then
    t ln_inst_noCheckout; return 1
  fi
  git -C "$1" branch --set-upstream-to=origin/master master >/dev/null 2>&1
  git -C "$1" clean -fd >/dev/null 2>&1
  git -C "$1" rev-parse --short HEAD 2>/dev/null
}
# --- end git link functions ---

# This copy of the app: updatable? Done BEFORE npm install so a freshly linked copy installs ITS dependencies.
echo "$(t ln_inst_checkCopy)"
if git_healthy "$APP"; then
  # An older installer linked shallow; deepen once (fail-soft, the next run retries).
  if [ -f "$APP/.git/shallow" ]; then
    echo "$(t ln_inst_filling)"
    if git -C "$APP" -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=20 fetch --unshallow >/dev/null 2>&1; then
      echo "$(t ln_inst_historyOk)"
    else
      echo "$(t ln_inst_historyFail)"
    fi
  fi
  SHA="$(git -C "$APP" rev-parse --short HEAD 2>/dev/null)"
  if [ -n "$SHA" ]; then echo "$(t ln_inst_version "sha=$SHA")"; else echo "$(t ln_inst_gitClone)"; fi
  echo "$(t ln_inst_gitPull)"
elif git_real_clone "$APP"; then
  BRANCH="$(git -C "$APP" rev-parse --abbrev-ref HEAD 2>/dev/null)"
  if [ "$BRANCH" = "master" ]; then
    git -C "$APP" -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=20 fetch origin master:refs/remotes/origin/master >/dev/null 2>&1
    if git -C "$APP" branch --set-upstream-to=origin/master master >/dev/null 2>&1; then
      echo "$(t ln_inst_trackingFixed)"
    else
      echo "$(t ln_inst_trackingFail)"
    fi
  else
    echo "$(t ln_inst_otherBranch "branch=$BRANCH")"
  fi
elif command -v git >/dev/null 2>&1; then
  if [ -e "$APP/.git" ]; then echo "$(t ln_inst_halfRepo)"; else echo "$(t ln_inst_zip)"; fi
  # Said BEFORE doing it: the only update anywhere not gated on a Yes. User data is untouched.
  echo "$(t ln_inst_willUpdate)"
  echo "$(t ln_inst_linking)"
  if OUT="$(link_to_git "$APP" "$EBIKI_REPO_URL")"; then
    echo "$(t ln_inst_linked "sha=$OUT")"
    echo "$(t ln_inst_normalCheckout)"
    # Start over with the files just downloaded: the script running now is the ZIP's old copy. Once only; an env
    # var an older copy does not know is ignored, an unknown flag would stop it starting.
    if [ "${EBIKI_SETUP_RELINKED:-}" != "1" ] && [ -f "$APP/scripts/setup.sh" ]; then
      echo "== $(t ln_inst_restarting) =="
      echo "$(t ln_inst_identical)"
      export EBIKI_SETUP_RELINKED=1
      exec bash "$APP/scripts/setup.sh"
    fi
  else
    echo "$(t ln_inst_linkFailed "error=$OUT")" >&2
  fi
else
  echo "$(t ln_inst_zipNoGit)"
fi

echo "$(t ln_inst_shDeps)"
if ! (cd "$APP" && npm install --no-fund --no-audit); then
  echo "$(t ln_inst_shDepsFailed)" >&2
  exit 1
fi
node "$APP/scripts/deps-fingerprint.mjs" --stamp >/dev/null 2>&1 || true
echo "$(t ln_inst_depsDone)"

if [ "$(uname -s)" = "Darwin" ]; then
  # macOS has no use for a .desktop file (Finder and Launchpad ignore it), so none is written.
  echo "$(t ln_inst_shMacStart "cmd=$APP/scripts/launch.sh")"
else
echo "$(t ln_inst_shLauncher)"
ICON="$APP/public/assets/shrimp/6820-holeshrimp.png"   # same source art as ebiki.ico
DESKTOP_ENTRY_DIR="$HOME/.local/share/applications"
mkdir -p "$DESKTOP_ENTRY_DIR"
DESKTOP_FILE="$DESKTOP_ENTRY_DIR/ebiki.desktop"
# Desktop Entry spec: inside a quoted Exec argument, " ` $ take a backslash, a backslash becomes FOUR (the string
# escape runs before the quoting rule) and % is written %% (an app folder named like "50% done" or holding a $
# broke the launcher entry).
EXEC_PATH="$(printf '%s' "$APP/scripts/launch.sh" | sed -e 's/\\/\\\\\\\\/g' -e 's/["`$]/\\&/g' -e 's/%/%%/g')"

cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Type=Application
Name=Ebiki
Comment=$(t ln_inst_shortcutDesc)
Exec="$EXEC_PATH"
Icon=$ICON
Terminal=false
Categories=Education;
StartupWMClass=Ebiki
EOF
chmod +x "$DESKTOP_FILE"

# Best-effort so the launcher shows up immediately in app grids that cache the list.
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$DESKTOP_ENTRY_DIR" >/dev/null 2>&1 || true

if [ -d "$HOME/Desktop" ]; then
  cp "$DESKTOP_FILE" "$HOME/Desktop/ebiki.desktop"
  chmod +x "$HOME/Desktop/ebiki.desktop"
  # Most file managers refuse to "trust" a dropped-in .desktop file until this is set.
  command -v gio >/dev/null 2>&1 && gio set "$HOME/Desktop/ebiki.desktop" metadata::trusted true >/dev/null 2>&1 || true
fi
fi

echo ""
if [ "$(uname -s)" = "Darwin" ]; then echo "$(t ln_inst_shMacDone)"; else echo "$(t ln_inst_shDone1)"; fi
echo "$(t ln_inst_done2)"
echo "$(t ln_inst_shDone3)"

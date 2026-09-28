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

echo "$(t ln_inst_shDeps)"
if ! (cd "$APP" && npm install --no-fund --no-audit); then
  echo "$(t ln_inst_shDepsFailed)" >&2
  exit 1
fi
echo "$(t ln_inst_depsDone)"

echo "$(t ln_inst_shLauncher)"
ICON="$APP/public/assets/shrimp/6820-holeshrimp.png"   # same source art as ebiki.ico
DESKTOP_ENTRY_DIR="$HOME/.local/share/applications"
mkdir -p "$DESKTOP_ENTRY_DIR"
DESKTOP_FILE="$DESKTOP_ENTRY_DIR/ebiki.desktop"

cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Type=Application
Name=Ebiki
Comment=$(t ln_inst_shortcutDesc)
Exec="$APP/scripts/launch.sh"
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

echo ""
echo "$(t ln_inst_shDone1)"
echo "$(t ln_inst_done2)"
echo "$(t ln_inst_shDone3)"

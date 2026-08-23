#!/usr/bin/env bash
# THIS IS THE FILE TO RUN ON LINUX (equivalent of "Install Ebiki.bat" on Windows).
# Installs the npm dependencies and creates a desktop launcher.
# Run it from a terminal: ./install.sh
set -e
cd "$(dirname "${BASH_SOURCE[0]}")"
echo "Installing Ebiki. You do not need to run anything else."
echo ""
chmod +x scripts/setup.sh
./scripts/setup.sh

#!/bin/sh
set -eu
# Run from the repository root after wails build.
install -Dm755 build/bin/sailune-desktop "${HOME}/.local/bin/sailune-desktop"
install -Dm644 build/appicon.png "${HOME}/.local/share/icons/hicolor/512x512/apps/sailune-desktop.png"
install -Dm644 build/linux/sailune-desktop.desktop "${HOME}/.local/share/applications/sailune-desktop.desktop"
printf '%s\n' 'Installed Sailune for this user. Ensure ~/.local/bin is on PATH.'

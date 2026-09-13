#!/bin/sh
set -eu
SAILUNE_BUNDLE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
install -Dm755 "$SAILUNE_BUNDLE/sailune-desktop" "${HOME}/.local/bin/sailune-desktop"
install -Dm755 "$SAILUNE_BUNDLE/sailune" "${HOME}/.local/bin/sailune"
install -Dm644 "$SAILUNE_BUNDLE/sailune-icon.png" "${HOME}/.local/share/icons/hicolor/512x512/apps/sailune-desktop.png"
install -Dm644 "$SAILUNE_BUNDLE/sailune-desktop.desktop" "${HOME}/.local/share/applications/sailune-desktop.desktop"
printf '%s\n' 'Installed Sailune Desktop and CLI. Ensure ~/.local/bin is on PATH.'

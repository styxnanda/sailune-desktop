#!/bin/sh
# Local-only Wails test build. This script is never called by release CI.
set -eu
cd "$(dirname "$0")/.."
WAILS_COMMAND=${WAILS_COMMAND:-wails}
SAILUNE_ARCH=$(go env GOARCH)
"$WAILS_COMMAND" build -platform "darwin/$SAILUNE_ARCH"
python3 scripts/package.py --platform darwin --arch "$SAILUNE_ARCH" --version v0.9.0
printf '\n%s\n' "Open build/staging/sailune-v0.9.0-darwin-$SAILUNE_ARCH/Sailune.app to test."

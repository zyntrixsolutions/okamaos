#!/usr/bin/env bash
# Convenience wrapper around okama-pack build.
# Usage: tools/create-ok-package.sh <game_dir> [output.ok]
set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <game_dir> [output.ok]"
    exit 1
fi

GAME_DIR="$1"
OUTPUT="${2:-}"

if [ -z "$OUTPUT" ]; then
    NAME=$(basename "${GAME_DIR%/}")
    OUTPUT="${NAME}.ok"
fi

PYTHONPATH="${PYTHONPATH:-/usr/lib/okamaos}" \
    python3 "$(dirname "$0")/../usr/bin/okama-pack" build "$GAME_DIR" --output "$OUTPUT"

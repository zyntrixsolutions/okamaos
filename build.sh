#!/usr/bin/env bash
# OkamaOS build script — resumes incremental Buildroot build
set -e

PROJ="$(cd "$(dirname "$0")" && pwd)"
BR="$PROJ/buildroot"
OUT="$PROJ/output"
LOG="$PROJ/build.log"
JOBS="${BR2_JLEVEL:-4}"

echo "=== OkamaOS Build ==="
echo "Project : $PROJ"
echo "Output  : $OUT"
echo "Jobs    : $JOBS"
echo "Log     : $LOG"
echo ""

# Sanity: ensure .config exists (run defconfig if not)
if [ ! -f "$OUT/.config" ]; then
    echo ">>> No .config found — applying okamaos_x86_64_defconfig..."
    make -C "$BR" O="$OUT" BR2_EXTERNAL="$PROJ" okamaos_x86_64_defconfig
fi

# Run build
exec make -C "$BR" \
    O="$OUT" \
    BR2_EXTERNAL="$PROJ" \
    BR2_JLEVEL="$JOBS" \
    "$@" \
    2>&1 | tee "$LOG"

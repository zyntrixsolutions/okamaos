#!/usr/bin/env bash
# OkamaOS memory measurement tool.
# Prints RAM budget status and flags if idle target is exceeded.
set -euo pipefail

BUDGET_MB=250

echo "============================================"
echo "  OkamaOS Memory Budget Report"
echo "============================================"
echo ""

if [ -f /proc/meminfo ]; then
    TOTAL_KB=$(grep MemTotal     /proc/meminfo | awk '{print $2}')
    FREE_KB=$(grep  MemFree      /proc/meminfo | awk '{print $2}')
    AVAIL_KB=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
    TOTAL_MB=$((TOTAL_KB / 1024))
    FREE_MB=$((FREE_KB   / 1024))
    AVAIL_MB=$((AVAIL_KB / 1024))
    USED_MB=$((TOTAL_MB - AVAIL_MB))

    printf "  %-22s %d MB\n" "Total RAM:"     "$TOTAL_MB"
    printf "  %-22s %d MB\n" "Used RAM:"      "$USED_MB"
    printf "  %-22s %d MB\n" "Free (raw):"    "$FREE_MB"
    printf "  %-22s %d MB\n" "Available:"     "$AVAIL_MB"
    printf "  %-22s %d MB\n" "Budget target:" "$BUDGET_MB"
    echo ""
else
    echo "  /proc/meminfo not available (running on host?)"
    USED_MB=0
    TOTAL_MB=0
    echo ""
fi

echo "--- Top processes by memory (RSS) ---"
if which ps >/dev/null 2>&1; then
    ps aux --sort=-%mem 2>/dev/null | head -16 || \
    ps -eo pid,comm,rss --sort=-rss 2>/dev/null | head -16 || true
fi
echo ""

echo "--- Bluetooth memory cost ---"
BT_PID=$(pgrep bluetoothd 2>/dev/null || true)
if [ -n "$BT_PID" ]; then
    BT_RSS_KB=$(cat /proc/"$BT_PID"/status 2>/dev/null | grep VmRSS | awk '{print $2}' || echo "0")
    BT_RSS_MB=$((BT_RSS_KB / 1024))
    echo "  bluetoothd RSS: ${BT_RSS_MB} MB (PID $BT_PID)"
else
    echo "  bluetoothd: not running"
fi
echo ""

echo "--- OkamaOS Idle Budget Result ---"

# Only enforce budget when actually running on an OkamaOS target.
# On a dev desktop the host's own processes (IDE, browser, etc.) would
# trivially exceed 250 MB, producing a meaningless FAIL.
IS_TARGET=no
if [ -f /etc/okamaos/okama.conf ] || [ "$(hostname 2>/dev/null)" = "okamaos" ]; then
    IS_TARGET=yes
fi

if [ "$USED_MB" -eq 0 ]; then
    echo "  SKIP: Cannot measure (no /proc/meminfo)"
    EXIT=0
elif [ "$IS_TARGET" = "no" ]; then
    echo "  SKIP: Not running on OkamaOS target (dev host detected)."
    echo "  Run this script inside QEMU or on real hardware to enforce the budget."
    EXIT=0
elif [ "$USED_MB" -le "$BUDGET_MB" ]; then
    echo "  PASS: Used ${USED_MB} MB ≤ budget ${BUDGET_MB} MB"
    EXIT=0
else
    echo "  FAIL: Used ${USED_MB} MB > budget ${BUDGET_MB} MB"
    echo "  Reduce services or check for memory leaks."
    EXIT=1
fi

echo "============================================"
exit $EXIT

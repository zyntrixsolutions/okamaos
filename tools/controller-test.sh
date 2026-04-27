#!/usr/bin/env bash
# OkamaOS controller test — enumerate evdev gamepad devices and optionally
# run okama-inputd in --test mode to stream live button presses to stdout.
set -euo pipefail

echo "============================================"
echo "  OkamaOS Controller Test"
echo "============================================"
echo ""

echo "--- evdev devices (/dev/input/event*) ---"
FOUND=0
for dev in /dev/input/event*; do
    [ -e "$dev" ] || continue
    # Try to read the device name via evtest or a Python one-liner
    if which evtest >/dev/null 2>&1; then
        NAME=$(evtest --query "$dev" EV_KEY 2>/dev/null || true)
        INFO=$(evtest --info "$dev" 2>/dev/null | grep "Input device name" | head -1 || true)
    else
        INFO=$(python3 -c "
import fcntl, struct, sys
EVIOCGNAME=0x80ff4506
buf=bytearray(256)
try:
    fd=open('$dev','rb')
    fcntl.ioctl(fd,EVIOCGNAME,buf)
    print('  $dev :', buf.decode(errors='replace').rstrip(chr(0)).strip())
except Exception as e:
    print('  $dev : (cannot read:', e, ')')
" 2>/dev/null || echo "  $dev : (no access)")
    fi
    echo "${INFO:-  $dev}"
    FOUND=$((FOUND + 1))
done

if [ "$FOUND" -eq 0 ]; then
    echo "  No /dev/input/event* devices found."
fi
echo ""

echo "--- Joystick devices (/dev/input/js*) ---"
JS_FOUND=0
for js in /dev/input/js*; do
    [ -e "$js" ] || continue
    echo "  $js"
    JS_FOUND=$((JS_FOUND + 1))
done
[ "$JS_FOUND" -eq 0 ] && echo "  None found."
echo ""

echo "--- Bluetooth connected devices ---"
if which bluetoothctl >/dev/null 2>&1; then
    bluetoothctl devices Connected 2>/dev/null || echo "  (none or bluetoothctl unavailable)"
else
    echo "  bluetoothctl not found."
fi
echo ""

echo "--- Live input test ---"
if [ -x /usr/bin/okama-inputd ]; then
    echo "  Running okama-inputd --test for 10 s. Press buttons on your controller."
    echo "  (Ctrl-C to stop early)"
    timeout 10 /usr/bin/okama-inputd --test || true
else
    echo "  okama-inputd not found — skipping live test."
fi

echo ""
echo "============================================"
echo "  Controller test complete."
echo "============================================"

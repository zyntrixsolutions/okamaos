# OkamaOS Bluetooth Controller Support

## Stack

OkamaOS uses **BlueZ 5** (`bluetoothd`) for Bluetooth HID controller support.
BlueZ is started only when:

- `BLUETOOTH_ENABLED=yes` in `/etc/okamaos/okama.conf`, **or**
- Paired controller `.json` files exist in `/var/okamaos/controllers/`

This prevents the ~30 MB Bluetooth stack from loading on systems with no
Bluetooth hardware or no paired controllers.

## Buildroot Config Requirements

```
BR2_PACKAGE_BLUEZ5_UTILS=y
BR2_PACKAGE_BLUEZ5_UTILS_CLIENT=y
```

Kernel options required:

```
CONFIG_BT=y
CONFIG_BT_BREDR=y
CONFIG_BT_LE=y
CONFIG_BT_HIDP=y
CONFIG_BT_HCIBTUSB=y      # USB Bluetooth dongles
CONFIG_BT_HCIUART=y       # UART Bluetooth (some laptops)
```

For specific controllers:

```
CONFIG_HID_PLAYSTATION=y  # DualSense / DualShock 4 (kernel ≥ 5.16)
CONFIG_HID_SONY=y         # DualShock 3/4 fallback (older kernels)
CONFIG_HID_MICROSOFT=y    # Xbox One S / Series X Bluetooth
CONFIG_HID_NINTENDO=y     # Switch Pro Controller (kernel ≥ 5.16)
CONFIG_NEW_LEDS=y         # Sony/PlayStation lightbar dependency
CONFIG_LEDS_CLASS=y
CONFIG_LEDS_CLASS_MULTICOLOR=y
```

## Pairing Flow

### via okama-cli (developer / setup)

```bash
okama-cli bluetooth status           # check adapter power state
okama-cli bluetooth scan             # scan 15 s, list found devices
okama-cli bluetooth pair <mac>       # pair; prompts for name; auto-trusts
okama-cli bluetooth connect <mac>    # connect immediately
```

Paired controller profiles are saved to `/var/okamaos/controllers/<mac>.json`.
On next boot, `S25okama-bluetooth` reads these profiles and auto-connects.

### via okama-shell Settings (v1 target)

The Settings → Bluetooth screen will guide the user through pairing entirely
with a controller (if one is already connected via USB or another BT device).
For the initial pair with no controller, a keyboard may be used only if no
controller is available.

## Controller Pairing States

```
idle        ← no scan active
scanning    ← bluetoothctl scan on
found       ← device appeared in scan
pairing     ← bluetoothctl pair <mac> in progress
connected   ← connection established; events flowing
failed      ← pairing or connection error
low battery ← reported via HID battery level (v1)
```

## Auto-Reconnect

On boot, `S25okama-bluetooth` iterates over `*.json` files in
`/var/okamaos/controllers/` and calls `bluetoothctl connect <mac>` for each.
Connection attempts are non-blocking; a missing controller does not delay boot.

## CLI Reference

```bash
okama-cli bluetooth status
okama-cli bluetooth scan
okama-cli bluetooth pair     <mac>
okama-cli bluetooth trust    <mac>
okama-cli bluetooth connect  <mac>
okama-cli bluetooth disconnect <mac>
okama-cli bluetooth forget   <mac>

okama-cli controllers list           # show paired BT controllers
okama-cli controllers test           # stream live input events
okama-cli controllers default <id>   # set preferred controller
```

## USB Fallback

If Bluetooth connection fails on boot, `okama-inputd` will still detect any
USB HID gamepads automatically. The system never blocks on Bluetooth.

## Memory Optimisations

- `bluetoothd` is started with minimal plugins: `--noplugin=*`
  (v1 — enable only hid, battery)
- Discovery scan runs for `BT_SCAN_TIMEOUT` seconds (default 30) then stops
- No continuous RSSI polling in normal mode
- Bluetooth disabled entirely if no paired controllers and `BLUETOOTH_ENABLED=no`

## Troubleshooting

```bash
# Check adapter
hciconfig -a
hcitools dev

# Check connected devices
bluetoothctl devices Connected

# Check kernel HID modules
lsmod | grep hid
lsmod | grep bt

# Check evdev device created for BT controller
ls -la /dev/input/

# Stream raw events
evtest /dev/input/eventN

# Check okama-inputd sees it
okama-inputd --test
```

## Known Limitations (MVP)

- Battery level reporting not yet surfaced in the shell UI
- Pairing UI in `okama-shell` is Settings stub only — use `okama-cli` for now
- `bluetoothctl` is interactive; the non-interactive wrappers in
  `okamaos/bluetooth.py` cover the most common flows
- Controllers that require authentication PIN codes may need manual
  `bluetoothctl` interaction

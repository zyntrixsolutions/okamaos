# OkamaOS Controller Input System

## Overview

`okama-inputd` is the central controller daemon. It:

1. Scans `/dev/input/event*` every 2 seconds for new gamepads
2. Spawns one reader thread per device
3. Translates raw evdev events through `controller-profiles.json`
4. Broadcasts unified JSON events over a Unix socket: `/run/okama-inputd.sock`

All consumers — `okama-shell`, games via `okamaos.input_protocol.InputClient` —
read from this single socket. The kernel's evdev device is never accessed directly
by application code.

## Unified Button Protocol

Every event is a JSON object terminated by `\n`:

```json
{"type": "button", "button": "A",       "state": "pressed",  "controller": 0}
{"type": "button", "button": "DPAD_UP", "state": "released", "controller": 0}
{"type": "axis",   "axis":  "LSTICK_X", "value": -0.87,      "controller": 0}
{"type": "connect",    "controller": 0, "name": "Xbox Controller", "bus": "usb"}
{"type": "disconnect", "controller": 0}
```

### Canonical Button Names

| Okama Name   | Xbox equivalent  | PlayStation equivalent |
|--------------|------------------|------------------------|
| `A`          | A                | Cross                  |
| `B`          | B                | Circle                 |
| `X`          | X                | Square                 |
| `Y`          | Y                | Triangle               |
| `L1`         | LB               | L1                     |
| `R1`         | RB               | R1                     |
| `L2`         | LT               | L2                     |
| `R2`         | RT               | R2                     |
| `L3`         | LS (click)       | L3                     |
| `R3`         | RS (click)       | R3                     |
| `START`      | Start/Menu       | Options                |
| `SELECT`     | Back/View        | Share/Create           |
| `HOME`       | Guide (Xbox)     | PS button              |
| `DPAD_UP`    | D-pad up         | D-pad up               |
| `DPAD_DOWN`  | D-pad down       | D-pad down             |
| `DPAD_LEFT`  | D-pad left       | D-pad left             |
| `DPAD_RIGHT` | D-pad right      | D-pad right            |

### Canonical Axis Names

| Okama Name   | Description                    | Range      |
|--------------|--------------------------------|------------|
| `LSTICK_X`   | Left stick horizontal          | –1.0..1.0  |
| `LSTICK_Y`   | Left stick vertical            | –1.0..1.0  |
| `RSTICK_X`   | Right stick horizontal         | –1.0..1.0  |
| `RSTICK_Y`   | Right stick vertical           | –1.0..1.0  |
| `L2_AXIS`    | Left trigger analog            | 0.0..1.0   |
| `R2_AXIS`    | Right trigger analog           | 0.0..1.0   |

Axis values below `±0.08` are zeroed (dead zone).

## Navigation Conventions (UI Shell)

| UI Action      | Controller input         |
|----------------|--------------------------|
| Move cursor    | D-pad or LSTICK          |
| Select / OK    | A                        |
| Back           | B                        |
| Home           | START or HOME            |
| Quick menu     | SELECT                   |
| Tab left/right | L1 / R1                  |
| Page up/down   | L2 / R2                  |

## Keyboard Fallback

The keyboard is **never required** in normal mode.

| Situation                  | Keyboard allowed?                   |
|----------------------------|-------------------------------------|
| Normal navigation          | No — controller only                |
| Text entry (name/search)   | Yes — physical keyboard shown       |
| Emergency navigation       | Yes — arrow keys, Enter, Esc        |
| Developer mode debugging   | Yes — full keyboard access          |

Keyboard events are read from `pygame.event` in `okama-shell` and `okama-run`
as a secondary source only. The UI always shows **controller button hints**,
never keyboard hints.

## Adding a Game Controller

### USB HID (automatic)
Plug in. `eudev` creates `/dev/input/eventN`. `okama-inputd` detects it within
2 seconds via its scan loop and spawns a reader thread. No configuration needed
for standard HID gamepads.

### Required kernel config for common controllers

```
CONFIG_USB_HID=y            # generic USB HID (most controllers)
CONFIG_HID_GENERIC=y        # HID generic fallback
CONFIG_JOYSTICK_XPAD=y      # Xbox USB controllers
CONFIG_HID_PLAYSTATION=y    # DualShock 4, DualSense (kernel ≥ 5.16)
CONFIG_HID_SONY=y           # fallback Sony HID (older kernels)
CONFIG_HID_NINTENDO=y       # Switch Pro Controller (kernel ≥ 5.16)
CONFIG_HID_MICROSOFT=y      # Xbox One Bluetooth
CONFIG_INPUT_EVDEV=y        # evdev interface
CONFIG_INPUT_JOYDEV=y       # joystick interface
```

## Controller Profiles (`/etc/okamaos/controller-profiles.json`)

Profiles map raw evdev button/axis codes to Okama canonical names. The
`generic-usb-hid` profile matches any USB HID gamepad as a fallback. Vendor-
specific profiles (e.g. `dualshock4-bt`) extend the generic profile and
override specific mappings.

Profile lookup order:
1. Exact vendor+product match
2. Bus-type match (usb / bluetooth)
3. `generic-usb-hid` fallback

## Testing Controllers

```bash
# Check enumerated devices
make controller-test
# or directly:
tools/controller-test.sh

# Stream live events
okama-inputd --test

# List USB devices
lsusb | grep -i hid

# Raw evdev dump (if evtest installed)
evtest /dev/input/event0
```

## Controller Test Command

```bash
okama-cli controllers test
okama-cli controllers list
okama-cli controllers default 0
```

## okama-inputd Socket Protocol (for game developers)

```python
from okamaos.input_protocol import InputClient

client = InputClient()
if not client.connect():
    # okama-inputd not running — use pygame.joystick as fallback
    pass

while game_running:
    for event in client.poll():
        if event["type"] == "button" and event["state"] == "pressed":
            if event["button"] == "A":
                do_select()
        elif event["type"] == "axis":
            move_player(event["axis"], event["value"])
```

`InputClient.poll()` is non-blocking; call it every frame.

# OkamaOS Architecture v2.0.0

## System Overview

OkamaOS is a controller-first console Linux OS built on Buildroot for x86_64
low-cost PCs. It replaces the entire conventional Linux desktop stack with a
single-purpose game console loop. Version 2.0.0 adds cyberpunk retro UI,
full keyboard support, network status monitoring, and Bluetooth plug-and-play.

## Boot Sequence

```
UEFI/BIOS firmware
       ↓
  SYSLINUX/GRUB (hidden, no menu in normal mode)
       ↓
  Linux 6.6 kernel (quiet, loglevel=0)
       ↓
  BusyBox init  →  /etc/inittab  →  /etc/init.d/rcS
       ↓
  S10okama-mounts   (proc, sys, devtmpfs, tmpfs /run)
  S20okama-devices  (eudev or mdev)
  S25okama-bluetooth (v2.0.0: auto-pair agent, auto-reconnect)
  S30okama-inputd   (controller daemon → /run/okama-inputd.sock)
  S35okama-audio    (ALSA init, master unmute)
  S40okama-network  (v2.0.0: WiFi/Ethernet auto-detect, status monitoring)
  S99okama-shell    (okama-shell on tty1, respawn on crash)
       ↓
  okama-shell  (fullscreen SDL2/Pygame with cyberpunk animated UI)
       ↓
  [user selects game via controller OR keyboard]  →  okama-run  →  game process
       ↓
  [game exits / crashes]  →  okama-run recovers  →  okama-shell resumes
```

## Component Map

```
┌─────────────────────────────────────────────┐
│                 okama-shell                 │  ← fullscreen SDL2 UI
│   Play | Settings | Power                  │
│   controller-first, no keyboard in normal  │
└──────────┬────────────────┬────────────────┘
           │                │
           ▼                ▼
      okama-run        okama-cli
  (game lifecycle)   (admin / debug CLI)
           │
           ▼
  one .ok game process
  (fullscreen, max priority)

┌─────────────────────────────────────────────┐
│               okama-inputd                  │  ← socket: /run/okama-inputd.sock
│  evdev reader threads per /dev/input/event* │
│  normalises → Okama unified protocol        │
│  fans out JSON events to all socket clients │
└─────────────────────────────────────────────┘

┌───────────────────────────────────────┐
│         Support services              │
│  bluetoothd (optional, BlueZ)         │
│  ALSA / snd_hda_intel                 │
│  eudev (device hot-plug)              │
│  dhcpcd / wpa_supplicant (optional)   │
└───────────────────────────────────────┘
```

## .ok Game Lifecycle

```
1. okama-shell selects game
2. okama-run acquires /var/run/okama-game.lock
3. okama-run suspends non-essential services
4. okama-run validates manifest, checks controller requirement
5. okama-run launches: python3 <entry> (SDL2 fullscreen)
6. Game runs — okama-inputd continues, audio continues
7. Game exits (clean or crash)
8. okama-run logs exit, saves crash log if needed
9. okama-run releases lock, resumes services
10. okama-shell returns to foreground
```

## Process Table (Idle — Target)

| Process            | Est. RSS  | Notes                         |
|--------------------|-----------|-------------------------------|
| kernel + drivers   | ~60 MB    | HID, DRM, ALSA, USB, BT       |
| BusyBox init       | <1 MB     |                               |
| eudev              | ~4 MB     |                               |
| okama-inputd       | ~12 MB    | Python + evdev threads        |
| ALSA daemons       | ~5 MB     |                               |
| okama-shell        | ~70 MB    | Python + pygame               |
| bluetoothd (if on) | ~30 MB    | started only when needed      |
| dhcpcd             | ~3 MB     |                               |
| **Total idle**     | **~185 MB** | well under 250 MB budget    |

## Key Invariants

- **One game at a time** — `LOCK_FILE=/var/run/okama-game.lock`
- **No desktop** — no X11, no Wayland, no compositor, no WM
- **No terminal in normal mode** — tty2 getty only in developer mode
- **Controller is primary** — keyboard only for text entry + emergency nav
- **Games get priority** — non-essential services suspended on launch
- **Read-only root planned for v1** — data partition at `/var/okamaos`

## Filesystem Layout

```
/                          read-only rootfs (v1 target)
├── etc/okamaos/           OS config (okama.conf, parent.conf, devmode.conf)
├── usr/bin/               okama-* binaries (Python scripts)
├── usr/lib/okamaos/       shared Python library
├── usr/share/okamaos/     themes, templates, assets, controller-icons
└── var/okamaos/           read-write data partition
    ├── games/             installed .ok packages (extracted)
    ├── saves/             per-game save_state.json
    ├── logs/              shell, game, crash logs
    ├── cache/             download cache
    ├── controllers/       paired Bluetooth controller profiles
    └── updates/           staged OTA update bundles
```

## Data Flow: Input Events

```
Hardware (USB HID / BT HID)
  → kernel evdev (/dev/input/eventN)
    → okama-inputd thread (per device)
      → normalize via controller-profiles.json
        → JSON event on /run/okama-inputd.sock
          → okama-shell InputClient.poll()
          → game InputClient.poll()
```

## Security Boundaries

| Capability                    | Normal | Dev Mode | Parent PIN |
|-------------------------------|--------|----------|------------|
| Install signed .ok            | ✓      | ✓        | —          |
| Install unsigned .ok          | ✗      | ✓        | required   |
| Enable developer mode         | ✗      | —        | required   |
| Access tty2 shell             | ✗      | ✓        | —          |
| Factory reset                 | ✗      | ✗        | required   |
| Bluetooth pair (if restricted)| ✗      | ✓        | required   |
| Run arbitrary scripts         | ✗      | ✓        | —          |

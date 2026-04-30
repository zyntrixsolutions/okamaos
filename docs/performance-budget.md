# OkamaOS Performance Budget

## Idle RAM Target: <250 MB

OkamaOS must keep total used RAM under 250 MB at idle (shell showing, no game
running) on the target hardware: 2 GB DDR3, Pentium Dual Core 3.0 GHz,
integrated graphics.

## Budget Breakdown

| Component                     | Target RSS  | Notes                              |
|-------------------------------|-------------|------------------------------------|
| Kernel + drivers              | ≤80 MB      | HID, DRM, ALSA, USB, BT modules   |
| BusyBox init                  | <1 MB       |                                    |
| eudev                         | ~4 MB       |                                    |
| okama-inputd                  | ≤15 MB      | Python + 2–4 evdev reader threads  |
| okama-shell (idle)            | ≤75 MB      | Python + pygame loaded             |
| ALSA daemons (alsactl)        | ~3 MB       |                                    |
| dhcpcd (if network enabled)   | ~3 MB       |                                    |
| bluetoothd (when active)      | ≤35 MB      | only started when needed           |
| **Total idle (BT off)**       | **≤181 MB** | ✓ well within budget               |
| **Total idle (BT on)**        | **≤216 MB** | ✓ within budget                    |

## During Gameplay

When a game is running:

- `S40okama-network` is stopped (saves ~3 MB + avoids background I/O)
- `okama-shell` is `execv`-replaced by `okama-run` which then launches the game
  — shell RSS is freed during gameplay
- Available RAM for a game: ~1.8 GB out of 2 GB
- `okama-inputd` stays active (~15 MB) for controller events
- Audio stack stays active (~3 MB)

| Component during gameplay     | RSS         |
|-------------------------------|-------------|
| Kernel + drivers              | ≤80 MB      |
| okama-inputd                  | ≤15 MB      |
| okama-run (launcher process)  | ~20 MB      |
| Audio                         | ~3 MB       |
| Active game                   | up to 1.8 GB|

## Measurement Tool

```bash
make memory-test
# or directly:
tools/measure-memory.sh
```

Output includes:
- Total / used / available RAM
- Top processes by RSS
- Bluetooth daemon cost
- Pass / Fail result vs. 250 MB budget

## Optimisation Techniques Applied

### Kernel
- Minimal driver set — only what OkamaOS hardware needs
- `CONFIG_PREEMPT=y` for lower input latency
- No NFS, no CIFS, no unused filesystems compiled in
- `loglevel=0` — no scrolling boot noise (saves framebuffer redraws)

### Userland
- BusyBox replaces most GNU utilities (~1 MB vs. ~50 MB for full coreutils)
- Python started once per service; no per-request interpreter launch
- pygame display initialized lazily (only when shell starts drawing)
- SDL2 video driver: `kmsdrm` — no X11 server, saves ~20 MB
- No compositor — DRM/KMS direct shell and game startup
- tmpfs at `/run` — kernel handles, no daemon needed

### Services
- Bluetooth off by default; started only when controllers are paired or config forces it
- Network stack started only if `NETWORK_ENABLED=yes`
- No cron, no print spooler, no dbus session (system dbus only for BlueZ)
- No fontconfig cache daemon
- No D-Bus activation for unused services

### Storage
- tmpfs for `/run`, `/tmp` — no disk I/O on boot-critical paths
- Read-only rootfs planned for v1 — removes need for journaling

## If Budget Is Exceeded

If `tools/measure-memory.sh` reports FAIL:

1. Check `ps aux --sort=-%mem` output in the report
2. Identify the largest non-essential process
3. Downgrade path options:

| Bloat source          | Fix                                              |
|-----------------------|--------------------------------------------------|
| bluetoothd too large  | Start with `--noplugin=*`, load only hid plugin  |
| okama-shell too large | Split into launcher + lazy-load pygame on demand |
| Network stack idle    | Disable network until game or update needs it    |
| Kernel modules        | `modprobe -r` unused drivers after boot          |
| Python overhead       | Use PyPy or compile critical paths as C extension|

## v1 Performance Goals

| Metric              | MVP target | v1 target           |
|---------------------|------------|---------------------|
| Idle RAM            | <250 MB    | <200 MB             |
| Boot to shell       | <15 s      | <8 s                |
| Game launch time    | <3 s       | <2 s                |
| Input latency       | <50 ms     | <16 ms              |
| Frame time (30 fps) | <33 ms     | <33 ms              |
| Crash recovery      | <3 s       | <2 s                |

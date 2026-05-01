# OkamaOS Roadmap

## Milestones

### v0.1 — Buildroot Foundation ✅
- [x] `okamaos_x86_64_defconfig` with Python3, SDL2, BusyBox, BlueZ, ALSA, Dropbear
- [x] `okama-runtime` BR2_EXTERNAL package
- [x] Kernel config fragment (`linux.config`)
- [x] Custom BusyBox config
- [x] `rootfs-overlay` (inittab, init scripts)
- [x] `okama-shell`, `okama-run`, `okama-cli`, `okama-inputd` userland tools
- [x] `okamaos` Python library (config, games, input_protocol, bluetooth)
- [x] `build.sh` + Makefile build targets

### v0.2 — Bootable System ✅
- [x] GRUB2-based bootable ISO generation (`gen-iso.sh`)
- [x] Kernel boots in QEMU with virtio-blk (`CONFIG_PCI=y`, `CONFIG_VIRTIO_*`)
- [x] Kernel boots in VirtualBox with SATA (`CONFIG_ATA`, `CONFIG_SATA_AHCI`)
- [x] initramfs boot fixed (`rdinit=`, `/init` symlink in cpio)
- [x] OkamaOS Shell launches on tty1 at boot
- [x] Text-mode fallback shell functional (Power off / Reboot / Launch game)
- [x] pygame 2.6.1 installed into rootfs (manylinux wheel)
- [x] ALSA utils (amixer, aplay, alsactl) included

### v0.3 — Pygame Shell ✅
- [x] `/dev/fb0` framebuffer created at boot (GRUB gfxmode + kernel SYSFB/DRM_SIMPLEDRM/FB_VESA)
- [x] pygame fullscreen shell renders on framebuffer (`kmsdrm` primary, `offscreen`+`FbWriter` fallback)
- [x] Controller D-pad navigation in pygame shell
- [x] Keyboard navigation (Arrow/WASD/Tab/Enter/Space/Esc/Home)
- [x] Mouse hover + click navigation (PS/2 + USB HID)
- [x] Play / Settings / Power sections functional
- [x] Game launch via `okama-run`
- [x] Silent boot: kernel `quiet loglevel=0`, init.d output redirected to boot log
- [x] Modern UI: gradient bg, section colors, pulsing logo, hover effects, live clock
- [x] **v0.3.1** Boot display fixed: SDL2 kmsdrm/offscreen driver chain, FbWriter wired + BGRX pixel format, axis normalisation, PS/2+USB input kernel config, dynamic Python path

### v0.4 — Game Runtime & Full UI ✅
- [x] `.ok` package install via UI (Install Game browser in Play section — no terminal needed)
- [x] Games list populated from `/var/okamaos/games/`
- [x] `okama-run` launches game, returns to shell on exit
- [x] Settings > Controllers: lists USB joysticks + paired BT controllers, "Pair New" action
- [x] Settings > Bluetooth: power toggle, scan, pair/trust/connect from UI
- [x] Settings > Audio: interactive volume slider, saves to config + calls `amixer`
- [x] Settings > Network: live interface/IP display, Wi-Fi toggle persisted to config
- [x] Settings > Storage Info: disk usage and per-game install sizes
- [ ] Per-game controller button overlay from `controller.json`

### v0.5 — System Services & UI Polish ✅
- [x] **Header overlap fix**: clock and back hint no longer overlap — embedded in a unified polished header bar with left accent stripe, vertical separator, and correct layout
- [x] **UI polish**: semi-transparent header background, bottom hint bar background, separator lines drawn after content to stay on top
- [x] **PGDrive preinstalled game** (`com.okamaos.pgdrive`): manifest + entry point packaged, preinstalled stub in rootfs-overlay
- [ ] ALSA audio device selection (multi-device support)
- [x] Network: DHCP on boot, Wi-Fi via `wpa_supplicant` UI
- [ ] SSH access via Dropbear
- [ ] OTA update system via Install Game browser (from network URL)

### v0.7.0 — PGDrive Pygame Rewrite ✅
- [x] **PGDrive rewritten as pure-pygame top-down driving game** (`com.okamaos.pgdrive` v0.2.0): self-contained, no panda3d/gym/Cython, starts instantly, 30 fps on framebuffer
- [x] Procedurally generated road network (seeded 12×12 grid graph, 85% edge density)
- [x] Arcade car physics (acceleration, friction, speed-dependent steering, reverse)
- [x] 10 NPC cars with autonomous road navigation
- [x] Smooth camera follow, minimap, HUD (speed bar, gear, timer), help overlay
- [x] okama-inputd (`InputClient`) + pygame keyboard/joystick dual-input stack
- [x] `games/pgdrive-pkg/` lean packaging source; `output/com.okamaos.pgdrive.ok` (6 KB)
- [x] rootfs-overlay stub synced to v0.2.0 for first-boot pre-install

### v0.6.1 — Auto-pack Agent ✅
- [x] **`okama-agent auto-pack`** subcommand: analyze any game directory, auto-detect entry point/runtime/deps, generate manifest, bundle deps, build .ok — one-command packaging
- [x] **`_detect_game_info()`**: scans for main.py/index.html/game.py, parses requirements.txt/pyproject.toml/setup.py, infers runtime from pygame/sdl2 deps
- [x] **`_generate_manifest()`**: creates sensible manifest defaults based on detected info

### v0.6 — Game Store & Standalone Packages ✅
- [x] **Game Store UI** (`game_store` state): browse remote catalog, view size/version/category, one-press download+install with live progress bar
- [x] **`okamaos.store` module**: `fetch_catalog()`, `download_game()` with SHA-256 checksum, `format_size()`
- [x] **Standalone .ok packages**: `okama-run` prepends `site-packages/` and `lib/` from game dir; games run without system-wide installs
- [x] **`okama-pack bundle`**: pip-installs `python_deps` from manifest into game's `site-packages/` for self-contained packaging
- [x] **`okamaos.updates` module**: `current_version()`, `fetch_release_info()`, `is_newer()`, `find_local_updates()`
- [x] **Settings > Updates** sub-screen: OS version display, remote update check (async), local `.ok-update` file scanner
- [x] **Polished game library** (`_draw_play`): two-line cards with ID/version sub-line + size badge; footer pills (Store + Install .ok)
- [x] **`manifest.py`** relaxed: `keyboard_usage="supported"` valid; `controller_required=false` unrestricted

### v0.8.0 — VOID STRIKER Triple-A Showcase ✅
- [x] **VOID STRIKER** (`com.okamaos.voidstriker` v1.0.0): self-contained `.ok` vertical shoot-em-up
- [x] Procedural enemy waves (Drone / Tank / Bomber) with per-wave difficulty scaling
- [x] Multi-phase Boss every 5 waves (entry animation, 3 attack phases, breakable shield)
- [x] Full particle system: per-kill explosions, engine trail, muzzle sparks
- [x] Screen-shake system with calibrated per-event intensity and frame decay
- [x] 3 weapons (LASER / SPREAD / BEAM) with cyclic pickup + RB hotkey
- [x] Rechargeable shield mechanic (X button)
- [x] Score combo multiplier with 95-frame window
- [x] Power-up drops: weapon, shield, extra life
- [x] 3-layer parallax starfield at 60 fps
- [x] High-score save state (`save_state.json`)
- [x] `okama-inputd` InputClient + keyboard fallback; `--windowed` dev flag
- [x] rootfs-overlay preinstalled stub for first-boot appearance in Play screen

### v0.9.0 — Dev Console, Live Network & Cyber UI ✅
- [x] **Secret Dev Console**: type "zyntrix" in Settings to unlock hidden terminal
- [x] **Live WiFi Management**: scan, connect, DHCP renew without reboot
- [x] **Live Bluetooth Control**: start/stop bluetoothd dynamically
- [x] **Root password**: 'zyntrix' (configurable via password.conf)
- [x] **Cyber UI overhaul**: ultra-dark palette with neon cyan accents
- [x] **Game runtime hardening**: CPU governor, SDL tuning in okama-run
- [x] Network/BT init scripts support `restart|reload` for live apply

### v0.9.1 — Dev Console Keyboard Fix ✅
- [x] Process dev console and WiFi password text input independently from navigation/action dispatch
- [x] Keep Space, `q`, WASD, `x`, and `y` as typed characters in text-entry states
- [x] Drain evdev/offscreen keyboard characters into text-entry buffers
- [x] Track Shift in evdev fallback for command symbols and uppercase input
- [x] Keep Enter, Backspace, Esc, and F10 as active text-entry controls

### v0.9.2 — Game Launch Runtime Path Fix ✅
- [x] Resolve `okama-run` from an override, repo-local sibling script, or installed OS path
- [x] Allow `okama-run` lock, log, and save directories to fall back to writable host locations
- [x] Pass the correct OkamaOS library parent path to launched games via `PYTHONPATH`
- [x] Pass the same resolved library parent path to save/restore hooks
- [x] Align README, build guide, profile, and shell launcher `PYTHONPATH` examples with the runtime import path
- [x] Preserve `/var/run` and `/var/okamaos` runtime paths for the built OkamaOS image

### v0.9.3 — Console Runtime Readiness ✅
- [x] Add shared pygame display helper with framebuffer presentation fallback
- [x] Update preinstalled games and demo to render through the display helper
- [x] Stop forcing unavailable `kmsdrm` in `okama-run`
- [x] Fix target pygame font library resolution and runner subprocess paths/env
- [x] Broadcast keyboard fallback events through `okama-inputd` for offscreen game control
- [x] Run reliable `udhcpc` DHCP on every wired interface and enable QEMU user networking
- [x] Include CA certificates for HTTPS store/update requests
- [x] Resync rootfs overlay during incremental post-builds

### v0.9.4 — Keyboard Game Control ✅
- [x] Strip inline comments from OkamaOS config values before runtime checks
- [x] Ensure `KEYBOARD_FALLBACK=yes` enables keyboard events in `okama-inputd`
- [x] Validate QEMU keyboard events reach the input socket for launched games

### v0.9.5 — Stable Keyboard Input ✅
- [x] Ignore keyboard repeat events in shell and game input fallback paths
- [x] Emit one keyboard press and one release per physical key transition
- [x] Auto-release stale keyboard buttons when a device misses release events
- [x] Use one keyboard fallback source to prevent duplicate menu/game events
- [x] Validate QEMU keyboard press/release events through the input socket

### v0.9.6 — Clean Keyboard Routing ✅
- [x] Keep shell keyboard handling on its direct SDL/evdev path
- [x] Ignore `okama-inputd` keyboard fallback events in shell menus
- [x] Preserve daemon keyboard fallback events for launched games
- [x] Shorten stale game key release timing for missed release events
- [x] Validate shell ignores daemon keyboard events while games still receive them

### v0.9.7 — Beta Hardware & Cyber Red Polish ✅
- [x] Correct shell and game framebuffer output on 15/16-bit RGB modes
- [x] Prefer framebuffer-safe shell presentation unless KMSDRM is explicitly requested
- [x] Add GRUB 32-bit graphics priority and a safe graphics boot option
- [x] Enable common GPU, wired NIC, USB Ethernet, Wi-Fi, Bluetooth, and firmware support
- [x] Start Bluetooth in beta-ready mode with D-Bus, rfkill, HCI bring-up, and trusted controller reconnects
- [x] Harden network boot discovery for wired DHCP and Wi-Fi UI scanning
- [x] Refresh the shell/default theme with Okama-red cyberpunk visuals and cyan secondary accents
- [x] Bump version metadata to `0.9.7`

### v0.9.8 — Network & Store Polish ✅
- [x] Fix network status detection to show actual connectivity (Online/Local/Limited/No IP/Offline)
- [x] Add connectivity check via ping and route verification in Settings > Network
- [x] Update Game Store URL to zyntrixsolutions.github.io GitHub Pages
- [x] Add Zyntrix Solutions technical partner contact information
- [x] Bump version metadata to `0.9.8`

### v0.9.9 — Demo Device Management & Ship Readiness ✅
- [x] Parse network interfaces correctly without trailing `ip addr` colons and skip loopback in Settings > Network
- [x] Add refresh, DHCP connect/renew, Wi-Fi scan/connect, and disconnect actions to network settings
- [x] Persist Wi-Fi profiles per interface and reconnect saved Wi-Fi during boot networking
- [x] Add Bluetooth connect/disconnect and forget actions for known and scanned devices
- [x] Route game catalog and OS update checks through GitHub Pages
- [x] Add in-shell support screen with Zyntrix Solutions technical partner contacts
- [x] Harden laptop framebuffer output by honoring framebuffer offsets and using a safer default ISO graphics mode
- [x] Bump version metadata to `0.9.9`

### v0.9.10 — Default Safe Boot & Startup Splash ✅
- [x] Boot generated ISOs directly into safe graphics mode by default
- [x] Hide the GRUB menu unless the user explicitly reveals it with Shift or Esc
- [x] Keep standard and debug GRUB entries available for explicit recovery/dev access
- [x] Show an OkamaOS splash on tty1 before the shell UI starts
- [x] Bump version metadata to `0.9.10`

### v1.0.0 — First Wave Beta Release ✅
- [x] OkamaLabs First Wave branded home shell, top bar, status tiles, and pre-UI splash
- [x] Route game catalog and OS update checks through `https://zyntrixsolutions.github.io/okamaos/`
- [x] Periodic shell update notifications for system and installed game updates
- [x] Safe `.okupdate` apply with whitelisted targets, backups, user-data preservation, and rollback
- [x] Safe game package replacement with game backups and common save-data preservation
- [x] `okama-install` hard-drive migration with packaged kernel and Extlinux boot assets
- [x] Live USB persistence through an `OKAMA_DATA` partition mounted at `/var/okamaos`
- [x] Version metadata bumped to `1.0.0`

### v1.1.0 — UX, Updates, Media, and Dev Console Polish ✅
- [x] Premium First Wave home polish with cleaner header/status metadata
- [x] Live Bluetooth status on Home and `BT:` header labeling
- [x] South African time defaults and subtle OS version labels in shell headers
- [x] Responsive Settings layout so all main options stay visible
- [x] Downloads-first OS update flow with in-shell apply and rollback
- [x] Game Store and game-update downloads staged in the downloads folder before install
- [x] USB/media automount with recursive `.ok` and `.okupdate` discovery
- [x] Persistent Dev Console shell with Up/Down command history and fixed Shift/Caps text input
- [x] Version metadata bumped to `1.1.0`

### v1.1.1 — Home UI Tightening ✅
- [x] Remove duplicate home branding at 800x600
- [x] Replace crowded header separators with compact status pills
- [x] Compact menu cards and bottom status tiles for the VirtualBox beta viewport
- [x] Prevent home header text clipping around version/status metadata
- [x] Version metadata bumped to `1.1.1`

### v1.1.2 — Header Cleanup and Home Polish ✅
- [x] Remove `FIRST WAVE` and version text from the top header
- [x] Keep header status as compact live pills only
- [x] Reduce header/card/status visual weight for the 800x600 home screen
- [x] Preserve hero version visibility outside the top header
- [x] Version metadata bumped to `1.1.2`

### v1.1.3 — Dev Console Interactive Terminal ✅
- [x] Route Dev Console through a persistent PTY-backed shell session
- [x] Send Enter input to the active shell so confirmation prompts can continue
- [x] Stream command output and logs while long-running operations stay open
- [x] Version metadata bumped to `1.1.3`

### v1.1.4 — Installed Boot Framebuffer Recovery ✅
- [x] Write safe framebuffer kernel arguments into installed Extlinux entries
- [x] Keep a debug text Extlinux entry on installed systems
- [x] Fall back to text shell instead of invisible offscreen graphics when `/dev/fb0` is unavailable
- [x] Show installed-boot framebuffer diagnostics on tty1
- [x] Version metadata bumped to `1.1.4`

### v1.1.5 — Installed Polish and Controller Smoothness ✅
- [x] Prefer 24/32-bit installed framebuffer mode to fix color quality
- [x] Remove Python per-pixel framebuffer conversion from packed fallback modes
- [x] Dedupe controller button, hat, and axis events before shell broadcast
- [x] Fix input daemon controller event dispatch reliability
- [x] Preload Xbox, Microsoft HID, Sony HID, and PlayStation controller drivers during boot
- [x] Enable kernel joystick and LED-class dependencies for Xbox and PlayStation controller drivers
- [x] Add button-based d-pad support for Xbox and PlayStation controllers
- [x] Version metadata bumped to `1.1.5`

### v1.x — Console Polish
- [x] Silent boot (`quiet loglevel=0`, boot log redirect) — completed in v0.3
- [ ] Boot time < 8 seconds
- [ ] Controller rumble via evdev FF API
- [ ] Battery level on HUD
- [x] OTA update checks from GitHub Pages (`zyntrixsolutions.github.io/okamaos`)
- [x] OTA package apply via `okama-update apply`

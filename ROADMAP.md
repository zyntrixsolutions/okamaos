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
- [ ] Network: DHCP on boot, Wi-Fi via `wpa_supplicant` UI
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

### v1.0 — Console Polish
- [x] Silent boot (`quiet loglevel=0`, boot log redirect) — completed in v0.3
- [ ] Boot time < 8 seconds
- [ ] Controller rumble via evdev FF API
- [ ] Battery level on HUD
- [ ] OTA update system via `okama-cli update`

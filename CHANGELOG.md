# Changelog

All notable changes to OkamaOS are documented here.
Format: [Semantic Versioning](https://semver.org/)

---

## [1.1.5] - 2026-05-01

### Fixed
- **Installed boot color and performance**: hard-drive Extlinux boot now prefers VESA mode `vga=789` so installed systems use a 24/32-bit framebuffer instead of the 16-bit mode that made colors look wrong and forced slow per-pixel conversion.
- **Framebuffer pacing**: 15/16-bit framebuffer fallback now uses a Pygame conversion surface instead of a Python pixel loop, keeping the shell usable even if firmware falls back to a packed pixel mode.
- **Input choppiness**: controller axis, hat, and button events are deduplicated before broadcast, reducing event floods that could make shell input feel laggy or frozen.
- **Controller event dispatch**: fixed the input daemon controller event handler name collision with Python thread internals so controller events are processed reliably.

### Added
- **Xbox and PlayStation controller support**: kernel config now enables the joystick and LED-class dependencies needed for Xbox, Sony HID, and PlayStation HID support; installed boots also load those drivers before `okama-inputd`, and the daemon supports button-based d-pads used by common Xbox and PlayStation controllers.

### Changed
- **Version metadata**: bumped runtime, root config, shell-visible metadata, package metadata, installer metadata, docs, and roadmap tracking to `1.1.5`.

## [1.1.4] - 2026-05-01

### Fixed
- **Installed boot framebuffer**: `okama-install` now writes safe Extlinux kernel arguments for hard-drive installs, including serial diagnostics, hidden cursor, `nomodeset`, VESA mode `vga=788`, and `video=vesafb:mtrr:3`, so installed boots can create `/dev/fb0` like the live ISO safe path.
- **Graphics failure fallback**: the shell no longer runs an invisible offscreen UI when framebuffer setup fails; it now reports the graphics failure and falls back to text mode.

### Changed
- **Boot diagnostics**: the shell launcher prints the kernel command line on tty1 when `/dev/fb0` is not created, making installed-boot failures inspectable without serial access.
- **Version metadata**: bumped runtime, root config, shell-visible metadata, package metadata, installer metadata, docs, and roadmap tracking to `1.1.4`.

## [1.1.3] - 2026-05-01

### Fixed
- **Dev Console interactive commands**: Dev Console now uses a PTY-backed persistent shell session so commands that prompt for confirmation, including `okama-install`, can receive follow-up input instead of being blocked by a stale "command still running" state.
- **Dev Console logs**: shell output now streams through a background reader while the session remains open, keeping long-running command progress and prompts visible in the console history.

### Changed
- **Version metadata**: bumped runtime, root config, shell-visible metadata, package metadata, installer metadata, docs, and roadmap tracking to `1.1.3`.

## [1.1.2] - 2026-05-01

### Fixed
- **Home header cleanup**: removed `FIRST WAVE` and version text from the top header, leaving only the OkamaLabs brand and compact live status pills.
- **Home UI polish**: reduced header height, softened borders, tightened menu/status spacing, and reduced visual weight for the 800x600 beta viewport.

### Changed
- **Version metadata**: bumped runtime, root config, shell-visible metadata, package metadata, installer metadata, docs, and roadmap tracking to `1.1.2`.

## [1.1.1] - 2026-05-01

### Fixed
- **Home screen polish**: simplified the 800x600 First Wave home layout by removing duplicate hero branding, compacting menu cards, replacing noisy header separators with status pills, and tightening the bottom status row.
- **Header clipping**: replaced the long tagline in the home header with concise release/version metadata so text no longer collides with status items.

### Changed
- **Version metadata**: bumped runtime, root config, shell-visible metadata, package metadata, installer metadata, docs, and roadmap tracking to `1.1.1`.

## [1.1.0] - 2026-05-01

### Added
- **Downloads-first updates**: Settings > Updates can download OS bundles into `/var/okamaos/updates/downloads`, apply the newest downloaded `.okupdate`, run rollback, and download/install available game updates from the same UI.
- **USB/media automount**: added `okama-mount-media` and boot-time `/media` mounting so `.ok` games and `.okupdate` bundles are discovered recursively from attached storage and downloads folders.
- **Persistent dev shell**: Dev Console now keeps a long-lived `/bin/sh` session with command history recall on Up/Down, preserving working directory and exported environment between commands.

### Changed
- **Premium home polish**: refined the First Wave home layout, status tiles, header metadata, and responsive sizing for lower framebuffers.
- **SAST clock and version header**: shell headers now show South African time by default and include a subtle OkamaOS version label.
- **Game downloads**: Game Store downloads are staged in the persistent downloads folder before install instead of transient `/tmp` cleanup.
- **Version metadata**: bumped runtime, root config, shell-visible metadata, package metadata, installer metadata, docs, and roadmap tracking to `1.1.0`.

### Fixed
- **Bluetooth status accuracy**: home status now uses live Bluetooth controller state instead of the saved config toggle, and the header labels it as `BT:`.
- **Settings layout overlap**: Settings and sub-screen option rows now scale to the framebuffer height so all main Settings options remain visible above the hint bar.
- **Dev console text input**: evdev fallback now handles Caps Lock plus Shift correctly for uppercase and shifted symbols.

## [1.0.0] - 2026-05-01

### Added
- **First Wave branded shell**: home screen now uses the OkamaLabs-inspired top bar, logo mark, horizon grid background, vertical Play/Settings/Power cards, and live status tiles for games, network, Bluetooth, input, and updates.
- **Update notifications**: shell periodically checks GitHub Pages for OS and installed-game updates, persists update state, shows a home/status badge, and exposes game update notices in Settings > Updates.
- **Safe system updates**: `okama-update` now checks the live feed, downloads URL bundles, verifies optional SHA-256 hashes, applies whitelisted `.okupdate` overlays with backups, preserves user data paths, and supports rollback.
- **Safe game updates**: local and store `.ok` installs now back up existing game directories and preserve common save-data files during replacement.
- **Install and persistence tooling**: `okama-install` can migrate the running system to a hard drive with Extlinux boot assets and can format a live USB persistence partition labelled `OKAMA_DATA`.

### Changed
- **GitHub Pages update channels**: game catalog and system update defaults now point to `https://zyntrixsolutions.github.io/okamaos/`.
- **Live boot persistence**: early boot mounts an `OKAMA_DATA` partition at `/var/okamaos` before services create games, saves, controller profiles, logs, and update state.
- **Version metadata**: bumped runtime, root config, shell-visible metadata, package metadata, library metadata, docs, and roadmap tracking to `1.0.0`.

### Fixed
- **Installer boot assets**: build packaging now carries the kernel and legacy BIOS Syslinux pieces into the live rootfs so hard-drive migration has the files it needs.

## [0.9.10] - 2026-04-29

### Fixed
- **Build failure**: Post-build script now uses relaxed pip platform constraints for pygame installation and continues gracefully if download fails, preventing build failures when pygame wheels are unavailable.

### Changed
- **Default safe boot**: generated ISOs now boot directly into the safe graphics entry with `nomodeset` and an 800x600x32 framebuffer payload.
- **Hidden GRUB menu**: GRUB now uses a hidden zero-second timeout by default; hold Shift or press Esc during boot to show standard and debug entries explicitly.
- **Version metadata**: bumped runtime, shell badge, rootfs profile, config defaults, package metadata, and library metadata to `0.9.10`.

### Added
- **Pre-UI splash**: tty1 now shows an OkamaOS startup splash while the launcher prepares framebuffer ownership and starts the shell.

## [0.9.9] - 2026-04-29

### Fixed
- **Network device status**: Settings > Network now parses interface names without `ip addr` trailing colons, skips loopback, falls back to sysfs discovery, and reports Online/Local/Connected/Ready states from IPs, default route, carrier, and connectivity checks.
- **Wi-Fi persistence and scanning**: Wi-Fi scans handle decimal signal values, fall back to `iwlist`, persist per-interface `wpa_supplicant` profiles, and boot networking now reuses saved Wi-Fi profiles.
- **Laptop framebuffer corruption**: shell and game framebuffer writers now honor framebuffer x/y offsets before writing rows, and the ISO defaults to a more broadly compatible 1024x768x32 graphics mode with an 800x600 safe mode.

### Added
- **Settings device management**: Network settings now includes refresh, wired DHCP connect/renew, Wi-Fi scan/connect, and disconnect actions; Bluetooth settings can connect/disconnect known devices and forget devices.
- **Support screen**: Settings now exposes the Zyntrix Solutions technical partner email, website, game catalog URL, and OS update URL.

### Changed
- **GitHub Pages updates**: OS update checks defaulted to the then-current GitHub Pages game catalog.
- **Version metadata**: bumped runtime, shell badge, rootfs profile, config defaults, package metadata, and library metadata to `0.9.9`.

## [0.9.8] - 2026-04-29

### Fixed
- **Network status detection**: Settings > Network now shows actual connectivity status (Online/Local/Limited/No IP/Offline) instead of just interface state; uses ping and route checks to verify internet connectivity.

### Changed
- **Game Store URL**: Default catalog and download URLs moved from `store.okamaos.io` to GitHub Pages.

### Added
- **Technical Partner Info**: Added Zyntrix Solutions contact information (team@zyntrix.solutions, https://okamaos.zyntrix.solutions) to README.md.

## [0.9.7] - 2026-04-29

### Added
- **Beta hardware driver pack**: enabled common Intel/AMD/NVIDIA/VMware/QXL DRM paths, USB Ethernet, wired NIC, Wi-Fi, Bluetooth, and matching firmware selections for broader PC compatibility.
- **Safe graphics boot option**: ISO GRUB menu now includes a fallback graphics entry and prioritizes 32-bit framebuffer modes before 16-bit modes.

### Fixed
- **Glitched framebuffer output**: shell and game framebuffer writers now correctly pack 15/16-bit RGB framebuffer formats instead of treating them as 24-bit RGB rows.
- **Shell graphics backend selection**: framebuffer mode now uses the offscreen framebuffer presenter by default and only tries KMSDRM when explicitly requested.
- **Bluetooth and network readiness**: Bluetooth startup now prepares D-Bus, rfkill, and HCI devices; network startup waits for udev and brings wired/Wi-Fi interfaces up more reliably.

### Changed
- **Cyberpunk UI refresh**: shifted the shell and default theme to an Okama-red cyber palette with cyan secondary accents and a pre-rendered grid/scanline background.
- **Version metadata**: bumped runtime, shell, rootfs profile, config defaults, and package metadata to `0.9.7`.

## [0.9.6] - 2026-04-29

### Fixed
- **Shell keyboard double input**: `okama-shell` now ignores `okama-inputd` keyboard fallback events (`controller == -1`) because the shell already reads keyboard directly through SDL/evdev, preventing menu skips and accidental auto-selection.
- **Game key release latency**: shortened stale keyboard auto-release timing so launched games recover quickly when an evdev device misses a release event.
- **Version metadata**: bumped runtime, shell, rootfs profile, config defaults, and package metadata to `0.9.6`.

## [0.9.5] - 2026-04-29

### Fixed
- **Keyboard repeat and stuck controls**: keyboard fallback now ignores repeat spam, refreshes held keys from repeat events, auto-releases stale keys when a device misses release events, and uses a single keyboard source so menu navigation no longer skips or auto-selects and games no longer keep steering after a key is released.
- **Version metadata**: bumped runtime, shell, rootfs profile, config defaults, and package metadata to `0.9.5`.

## [0.9.4] - 2026-04-29

### Fixed
- **Keyboard game control**: inline comments in `okama.conf` values are now stripped by the config parser, so `KEYBOARD_FALLBACK=yes          # ...` correctly enables `okama-inputd` keyboard events for launched games.
- **Version metadata**: bumped runtime, shell, rootfs profile, config defaults, and package metadata to `0.9.4`.

## [0.9.3] - 2026-04-29

### Added
- **Game framebuffer display helper**: added `okamaos.display.open_display()` so pygame games can fall back from unavailable KMSDRM to SDL offscreen rendering with direct `/dev/fb0` presentation.
- **Keyboard fallback through `okama-inputd`**: keyboard devices now broadcast Okama button events when `KEYBOARD_FALLBACK=yes`, keeping games playable when SDL offscreen cannot emit keyboard events.

### Fixed
- **VM/console game launch**: `okama-run` no longer forces `kmsdrm` just because `/dev/dri/card0` exists; it now prefers host windows, then framebuffer-backed offscreen rendering, and keeps explicit driver overrides.
- **Preinstalled game rendering**: PGDrive, VOID STRIKER, and the demo game now use the shared display helper and present frames correctly on framebuffer-only consoles.
- **Target pygame font loading**: the pygame TTF shim now uses a relative symlink to Buildroot's SDL2_ttf library, so target-runtime checks and the installed image resolve fonts consistently.
- **Runner subprocess environment**: `okama-run` now resolves a real Python executable even when Buildroot leaves `sys.executable` empty, injects Pygame's bundled SDL library directory for child games, preserves inherited Python paths, and normalizes path lists before changing into the game directory.
- **Network startup**: wired DHCP now runs against every non-loopback, non-wireless interface, skips pseudo devices, and prefers BusyBox `udhcpc` so QEMU/console boots receive IPv4 routes reliably; WiFi startup scans all wireless interfaces when enabled.
- **QEMU networking**: the QEMU run target now attaches a virtio user-network device so the console has an internet path in local VM runs.

### Changed
- Version metadata updated to `0.9.3` across the root `VERSION`, runtime package version, shell badge, config defaults, rootfs profile, and OkamaOS library metadata.
- Buildroot defconfig now includes CA certificates for HTTPS-backed store/update requests.
- Post-build synchronization now reapplies the rootfs overlay so preinstalled games, init scripts, and profile changes are refreshed in incremental builds.

## [0.9.2] - 2026-04-29

### Fixed
- **Game launch from host development shell**: `okama-shell` now resolves `okama-run` from `OKAMA_RUN`, the repo-local sibling script, or the installed `/usr/bin/okama-run` path instead of always hard-coding `/usr/bin/okama-run`.
- **Unprivileged host runtime state**: `okama-run` now falls back to writable user/tmp locations for the game lock, logs, and saves when `/var/run` or `/var/okamaos` are not writable.
- **Game imports during launch**: launched games now receive the correct OkamaOS library parent path in `PYTHONPATH`, so `from okamaos...` imports resolve in both the ISO and repo-local host runs.
- **Save hook imports**: `okama-snapshot` now passes the resolved OkamaOS library parent path to game save/restore hooks.
- **Host-dev launch docs and boot exports**: README, build guide, rootfs profile, and shell launcher now use the correct `/usr/lib` parent path for OkamaOS imports.

### Changed
- Version metadata updated to `0.9.2` across the root `VERSION`, runtime package version, shell badge, config defaults, rootfs profile, and OkamaOS library metadata.

## [0.9.1] - 2026-04-29

### Fixed
- **Dev Console keyboard typing**: text-entry states now process typed characters every frame instead of only when a navigation action is dispatched.
- **Offscreen/evdev keyboard fallback**: dev console and WiFi password entry now drain evdev character input, suppress navigation/action mappings while typing, and support shifted command symbols such as `|`, `_`, `:`, and `?`.
- **Control-key separation**: Space, `q`, WASD, `x`, and `y` no longer submit, quit, or navigate while typing commands in the dev console; Enter, Backspace, Esc, and F10 remain active controls.

### Changed
- Version metadata updated to `0.9.1` across the root `VERSION`, runtime package version, shell badge, config defaults, rootfs profile, and OkamaOS library metadata.

---

## [0.9.0] - 2026-04-28

### Added
- **Secret Dev Console**: In Settings, type "zyntrix" to unlock a hidden terminal
  - Execute system commands directly from the UI (`ip`, `ps`, `dmesg`, `cat`, etc.)
  - Full shell command execution via `/bin/sh`
  - Dev console UI with scrollback history and blink cursor
- **Live WiFi Management** (no reboot required)
  - Settings > Network shows all interfaces (eth*, wlan*, wlp*) with live IP/status
  - `[A]` on wireless interface → scan for available networks
  - WiFi network browser with signal strength display (dBm)
  - Password entry screen for WPA2-PSK connections
  - Auto-generates wpa_supplicant.conf and connects immediately
  - `[A]` on wired interface → renew DHCP live
- **Live Bluetooth Control** (no reboot required)
  - Bluetooth init script now supports `restart|reload` actions
  - Power toggle starts/stops bluetoothd dynamically
- **Root Password Initialization** (`S90okama-password`)
  - Sets root password to 'zyntrix' on boot (configurable via `/etc/okamaos/password.conf`)
- **Game Runtime Performance Hardening**
  - `okama-run` sets CPU performance governor at game launch
  - SDL environment tuning: `SDL_HIGHDPI_DISABLED=1`, `PYTHONDONTWRITEBYTECODE=1`

### Changed
- **UI Overhaul**: Darker futuristic cyber theme
  - Color palette shifted to ultra-dark with neon cyan accents (`COL_ACCENT = (0,190,255)`)
  - Deep space backgrounds, neon borders, cyberpunk aesthetic
- **Settings > Network** completely redesigned
  - Shows live IP addresses per interface
  - Per-interface context actions (renew DHCP / scan WiFi)
- **Network init script** (`S40okama-network`): added `restart|reload` actions for live apply

---

## [0.8.0] - 2026-04-28

### Added
- **VOID STRIKER** (`com.okamaos.voidstriker` v1.0.0): Triple-A vertical shoot-em-up packaged as a self-contained `.ok` bundle — zero extra dependencies, pure pygame, 60 fps on framebuffer
  - Procedural enemy waves scaling with wave number: Drone (zigzag attacker), Tank (armoured, 3-way burst), Bomber (spread drop)
  - Multi-phase Boss every 5 waves: entry animation, phase-1 aimed burst → phase-2 spiral → phase-3 full-spiral + aimed; breakable energy shield on wave ≥ 3; per-phase colour core; HP bar with phase pips
  - Particle system: ~20-45 particle explosion per kill/hit; engine trail on movement; muzzle spark on fire
  - Screen-shake: calibrated per-event intensity (hit=12, kill=3/7, boss=7); decays each frame
  - 3 selectable weapons: **LASER** (rapid single, dmg 1), **SPREAD** (3-way, dmg 1), **BEAM** (dual high-speed, dmg 2); cycle with RB/Tab
  - Rechargeable shield (X button when bar full, 130-frame duration, absorbs one hit pattern)
  - Combo multiplier system: combo × (combo//3) score bonus, 95-frame window, resets on player hit
  - Power-ups: Weapon cycle (W), Shield recharge (S), Extra life (+); 28% drop chance on enemy kill
  - Scrolling 3-layer parallax starfield (130/55/22 stars at 0.35×/0.9×/2.0× speed)
  - High-score persistence via `save_state.json` (saved on death or menu exit)
  - Full `okamaos.input_protocol.InputClient` integration; keyboard fallback (WASD/arrows/Space/Tab)
  - `--windowed` CLI flag for dev/testing
- **`games/voidstriker-pkg/`**: lean packaging source (`main.py` + `manifest.ok.json`)
- **rootfs-overlay stub** (`board/okamaos/rootfs-overlay/var/okamaos/games/com.okamaos.voidstriker/`): preinstalled so the game appears in Play screen on first ISO boot

---

## [0.7.2] - 2026-04-28

### Fixed
- **PGDrive crash on launch**: Removed `DOUBLEBUF` flag from pygame display initialization and used `pygame.FULLSCREEN` directly (matching the demo game pattern). The original implementation caused the game to crash immediately and return to the home screen on OkamaOS. Also added `--windowed` flag support for development testing.

---

## [0.7.1] - 2026-04-28

### Fixed
- **Keyboard navigation on Play screen**: Y and X keys were not mapped to Game Store and Install .ok actions respectively. Added SDL keyboard mappings (`pygame.K_y` → "Y", `pygame.K_x` → "X") and evdev fallback mappings (keycodes 21 and 45) so keyboard users can now access the footer buttons without a controller.

---

## [0.7.0] - 2026-04-28

### Changed
- **PGDrive rewrite** (`com.okamaos.pgdrive` v0.2.0): replaced the panda3d/gym-based wrapper (which required OpenGL, Cython extensions, and 512 MB RAM) with a self-contained **pygame top-down driving simulator**. The new implementation has zero additional dependencies (only pygame, already on OkamaOS), starts instantly, and runs smoothly at 30 fps on the framebuffer.
  - Procedurally generated road network via seeded grid graph (12×12 nodes, configurable density)
  - Arcade-physics car model: acceleration, braking, friction, speed-dependent steering
  - 10 NPC cars that navigate the road graph autonomously
  - Smooth camera follow with configurable lerp
  - Minimap with road network, NPC dots, viewport indicator, and player blip
  - HUD: speed bar (km/h), D/N/R gear indicator, elapsed timer, control hints
  - Help overlay (H / X) listing all keyboard and controller bindings
  - `--seed=N` CLI argument for reproducible maps
  - Full `okamaos.input_protocol.InputClient` integration (okama-inputd): `LSTICK_X` steer, `R2_AXIS` gas, `L2_AXIS` brake, `DPAD` digital fallback, `Y` new map, `START` quit
  - pygame joystick fallback when okama-inputd socket is unavailable
  - `min_ram_mb` reduced from 512 → 64; `permissions` trimmed to `["controller"]`
- **`games/pgdrive-pkg/`**: lean packaging source (only `main.py` + `manifest.ok.json`) used to build `output/com.okamaos.pgdrive.ok`; avoids bundling the upstream panda3d source tree into the installable package
- **rootfs-overlay stub** (`board/okamaos/rootfs-overlay/var/okamaos/games/com.okamaos.pgdrive/`): synced to v0.2.0 `main.py` and manifest so the game works correctly on first boot from the pre-installed ISO

---

## [0.6.1] - 2026-04-28

### Added
- **`okama-agent auto-pack`** subcommand: intelligently analyze any game directory, auto-detect entry point (main.py/index.html/game.py), runtime type (okama-python/okama-sdl2/okama-lite), and Python dependencies (from requirements.txt, pyproject.toml, setup.py); generate manifest.ok.json if missing, validate it, optionally bundle deps via `okamaos.package.bundle_deps()`, and build the .ok package — all in one command
- **`_detect_game_info()`**: analyzes directory structure and dependency files to infer game metadata
- **`_generate_manifest()`**: creates sensible manifest defaults based on detected info (runtime, permissions, python_deps)

---

## [0.6.0] - 2026-04-28

### Added
- **Game Store** (`game_store` state): browse a remote catalog from `store.okamaos.io`, see size/version/category per game, one-press download+verify+install with live percentage progress bar; Y or Refresh button fetches catalog in a background thread
- **Standalone .ok packages** (self-contained): `okama-run` now prepends `<game_dir>/site-packages/` to `PYTHONPATH` and `<game_dir>/lib/` to `LD_LIBRARY_PATH` so games with bundled deps run without any system-wide pip installs
- **`okama-pack bundle`** subcommand: `pip install --target site-packages/ <python_deps>` directly from manifest `python_deps` list or `--deps` override; prepares self-contained game directories before `okama-pack build`
- **`okamaos.store`** module: `fetch_catalog()`, `download_game()` with streaming progress callback + SHA-256 checksum verification, `format_size()` helper
- **`okamaos.updates`** module: `current_version()`, `fetch_release_info()`, `is_newer()`, `find_local_updates()` for both remote and USB-based OS updates
- **Settings > Updates** sub-screen: shows installed version, "Check for OS Updates" (async), "Apply Local Update" (scans USB/media for `.ok-update` files); status shown with color coding (green=ok, red=error)

### Changed
- **Game Library UI** (`_draw_play`): polished card layout — name + ID/version sub-line on left, size badge or launch hint on right; two footer pills: `✦ Game Store` (purple) + `+ Install .ok` (green); sub-header row shows count and action hints; empty state updated
- **`_play_input`**: Y → Game Store, X → Install .ok, empty-state A → Game Store instead of Install
- **`manifest.py`**: added `"supported"` as valid `keyboard_usage` value; removed dev-mode-only restriction on `controller_required=false`; `controller_required` is now purely informational
- **`SETTINGS_OPTIONS`**: added `"Updates"` entry
- Home screen version badge: `v0.5.0` → `v0.6.0`
- pgdrive `manifest.ok.json`: `keyboard_usage` corrected to `"full"` (now unrestricted)

---

## [0.5.0] - 2026-04-28

### Fixed
- **Header text overlap**: `_draw_section_header` and `_draw_clock` both rendered to the same top-right region, causing the clock digits to paint over the "Esc / B → Back" hint. Fixed by embedding the clock directly inside `_draw_section_header` with precise left-of-clock placement, and guarding `_draw_clock` to only render on the home screen.

### Changed
- **`_draw_section_header` — polished header bar**: now draws a subtle semi-transparent background panel, a 4 px left accent stripe in the section colour, the title vertically centred in the 56 px band, a thin vertical separator, and the clock on the far right — all within a single cohesive row with no overlap.
- **Bottom hint bar**: `_draw_hints` now blits a matching semi-transparent background behind the hint text for better legibility.
- **Separator draw order**: header and footer separator lines are now drawn *after* the state-specific content so they sit on top of any background panels painted by sub-screens.
- **Home screen version badge**: updated to `v0.5.0` (later bumped to `v0.6.0`).

### Added
- **PGDrive preinstalled game** (`com.okamaos.pgdrive`): packaged the `games/pgdrive` open-ended driving simulator as an OkamaOS `.ok`-compatible game with `manifest.ok.json` and `main.py` entry point; the game stub is placed in `board/okamaos/rootfs-overlay/var/okamaos/games/com.okamaos.pgdrive/` so it appears in the Play screen on first boot. Supports joystick (default) and keyboard (pass `--keyboard`); auto-resets on destination arrival or crash.

---

## [0.4.0] - 2026-04-28

### Added
- **Settings > Controllers sub-screen**: lists connected USB joysticks (reads device name from `/sys/class/input/js*/device/name`) and trusted Bluetooth controllers; "Pair New Bluetooth Controller" action launches the Bluetooth screen
- **Settings > Bluetooth sub-screen**: interactive panel with power On/Off toggle, "Scan for Devices" (10-second background scan via `bluetoothctl`), discovered device list with one-click pair+trust+connect; pairing runs in a daemon thread so the UI stays responsive
- **Settings > Audio sub-screen**: real-time volume slider (0–100 %, step 5); D-pad Left/Right adjusts volume, Enter saves and calls `amixer sset Master <vol>%`; value persisted to `DEFAULT_VOLUME` in `okama.conf`
- **Settings > Network sub-screen**: reads live interface/IP data via `ip addr`; shows each interface with state, IPv4, and IPv6; Wi-Fi toggle (persists `WIFI_ENABLED` in `okama.conf` with reboot notice)
- **Settings > Storage Info sub-screen**: shows total/used/free disk space (`os.statvfs /`) and per-game install sizes
- **Play > Install Game**: replaces the terminal-only install hint with a UI file browser that scans `/mnt`, `/media`, `/var/okamaos/updates`, `/tmp` for `.ok` packages; select and press Enter/A to verify, extract, and install without touching a terminal; install button visible in both the empty-state and game-list footer
- **Shared `_draw_subscreen_list` + `_subscreen_rects`**: reusable renderer for all sub-screens with hover/selection highlighting
- `shutil` and `pathlib.Path` imports added to `okama-shell`
- `okamaos.package` and `okamaos.manifest` imported in `okama-shell` for in-shell install

### Changed
- `_settings_select` now transitions to dedicated sub-state screens instead of showing toast messages
- Play screen empty-state copy updated to mention the Install Game button (no terminal reference)
- Home screen version badge updated to `v0.4.0`

---

## [0.3.3] - 2026-04-28

### Fixed
- **Keyboard not working on offscreen SDL driver**: When `kmsdrm` is unavailable (e.g. VirtualBox VMSVGA), SDL falls back to `offscreen` which generates no keyboard events. Added `_EvdevKeyboardReader` that reads `/dev/input/event*` directly via evdev in a background thread, feeding key-press codes into `_collect_events()` as a fallback when `SDL_VIDEODRIVER=offscreen`

---

## [0.3.2] - 2026-04-28

### Fixed
- **Input not working**: `InputClient.poll()` did not detect EOF when `okama-inputd` server closes connection; empty `chunk` from `recv()` now properly sets `_connected = False` so clients can detect disconnection and reconnect

---

## [0.3.1] - 2026-04-28

### Fixed
- **Blank screen (primary bug)**: `SDL_VIDEODRIVER=fbcon` is not a valid SDL2 backend and caused `pygame.display.init()` to fail silently; replaced with a priority-ordered driver chain: `kmsdrm` (when `/dev/dri/card0` exists) → `offscreen` + `FbWriter` → text-mode fallback
- **FbWriter never called**: `shell.run()` was invoked without `fb=` argument in all non-windowed paths; `FbWriter` is now instantiated and passed when using `offscreen` backend
- **Wrong pixel format in FbWriter**: `pygame.image.tostring(surface, "RGBX")` produces R,G,B,X but the Linux 32bpp framebuffer is XRGB8888 (LE) = B,G,R,X in memory; changed to `"BGRX"` for 32bpp or `"RGB"` for 24bpp
- **`offscreen` + `FULLSCREEN` conflict**: `set_mode((0,0), FULLSCREEN)` with offscreen backend creates a 0×0 surface; now uses `set_mode((W,H), DOUBLEBUF)` with actual framebuffer dimensions pre-populated from `FbWriter`
- **`okama-run` same fbcon bug**: `SDL_VIDEODRIVER=fbcon` also set for game launches; fixed to match `okama-shell` driver selection logic
- **Axis normalisation broken**: `normalise_axis()` mapped center 0 to −1.0 and max 32767 to 258 for standard −32768..32767 gamepads; replaced with range-aware formula `(raw − center) / half_range`; per-device min/max read at connect time via `EVIOCGABS` ioctl and cached in `ControllerThread._axis_ranges`
- **Hardcoded `python3.11` in LD_LIBRARY_PATH**: `S99okama-shell` dynamically detects the installed Python version at boot instead of hardcoding `python3.11` for `pygame.libs` path
- **vtcon unbind incomplete**: only `vtcon1` was unbound; now iterates all `/sys/class/vtconsole/vtcon*` entries to release the framebuffer console before SDL takes over
- **Missing kernel VT/TTY options**: added `CONFIG_TTY`, `CONFIG_VT`, `CONFIG_VT_CONSOLE`, `CONFIG_HW_CONSOLE`, `CONFIG_VT_HW_CONSOLE_BINDING`, `CONFIG_UNIX98_PTYS` to `linux.config`
- **Missing PS/2 + USB input drivers**: added `CONFIG_SERIO`, `CONFIG_SERIO_I8042`, `CONFIG_KEYBOARD_ATKBD`, `CONFIG_MOUSE_PS2`, `CONFIG_INPUT_MOUSEDEV`, `CONFIG_USB_MOUSE`, `CONFIG_USB_KBD` — enables keyboard and mouse in VirtualBox BIOS and EFI modes
- **Missing ACPI + EFI stub**: added `CONFIG_ACPI`, `CONFIG_ACPI_BUTTON`, `CONFIG_EFI_STUB` for clean poweroff/reboot and UEFI boot
- **`/dev/fb0` not in device table**: added `fb0`, `tty`, `tty1`, `tty2`, and `input/event*` static device nodes to `device_table.txt` so devices exist before eudev settles

---

## [0.3.0] - 2026-04-28

### Added
- **Silent boot**: kernel cmdline now includes `quiet loglevel=0 vt.global_cursor_default=0 printk.devkmsg=off`; serial console (`ttyS0`) removed from cmdline so no output leaks to screen
- **Custom `rcS`** in rootfs-overlay: all init.d output redirected to `/var/okamaos/logs/boot.log`; screen stays blank during boot
- `S99okama-shell`: `exec >> boot.log 2>&1` at start, tty1 cleared with ANSI escape (`\033[2J`) and cursor hidden (`\033[?25l`) before pygame takes over
- **Keyboard navigation** in `okama-shell`: Arrow keys, WASD, Tab (cycle section), Space (select), Home (go home) — full parity with controller
- **Mouse support** in `okama-shell`: hover highlights all interactive elements (cards, buttons); left-click selects; `pygame.mouse.set_visible(True)` toggled on movement
- **Modern UI redesign**:
  - Deep-space gradient background (`COL_BG` → `COL_BG2`) pre-rendered at startup
  - Section-specific accent colors: Play (green), Settings (blue), Power (red)
  - Home screen: large pulsing animated logo with glow, icon + label cards with colored top-bar indicator on selection
  - Per-section colored left accent bar on selected list items
  - Section header rendered in section color with back-hint on right
  - Message toasts: pill-shaped with border, rendered above hint bar
  - Live clock (`HH:MM`) in top-right corner
  - FPS bumped to 60 for smooth animations
  - Extended font stack with bold variant (`font_mdb`) for labels
  - Version badge next to logo

### Changed
- `okama-shell` `_dispatch` now accepts `ev` dict so mouse click position is available at every handler
- `_input_cooldown` recalculated as `FPS // 8` (~125 ms) instead of hardcoded `4` frames
- Mouse `CLICK` events bypass cooldown; keyboard/controller events respect it
- Power menu buttons widened to 320×68; vertically centred with 90 px stride
- Settings menu items now show `›` arrow when selected
- Play list: double-click-select pattern — first click selects item, second click (or Enter) launches

---

## [0.2.10] - 2026-04-28

### Fixed
- `touch: /var/lock/subsys/dbus-daemon` persisted — root cause confirmed: Buildroot FHS skeleton has `/var/lock -> ../run/lock` (symlink); `S10okama-mounts` was creating `/run/lock/subsys` then mounting a **fresh** tmpfs on `/run`, wiping the dirs before `S30dbus` ran; `S30dbus` then hit a dangling symlink and `mkdir -p` failed; fixed by mounting `/run` tmpfs **first** then creating dirs directly under `/run/lock`
- `/dev/fb0` still missing despite kernel rebuild — root cause: GRUB `set gfxmode=1024x768x32` alone only sets a variable; `terminal_output gfxterm` is required to actually switch GRUB into graphics mode; without it `gfxpayload=keep` silently keeps VGA text mode and `screen_info` contains no framebuffer → `DRM_SIMPLEDRM`/`SYSFB_SIMPLEFB` have nothing to attach to; added `insmod all_video`, `insmod vbe`, `insmod gfxterm`, `terminal_output gfxterm` to GRUB config

---

## [0.2.9] - 2026-04-28

### Fixed
- `touch: /var/lock/subsys/dbus-daemon: No such file or directory` — `S10okama-mounts` now creates `/var/lock/subsys/`
- `S99okama-shell: line 27: can't create /sys/class/vtconsole/vtcon1/bind` — busybox sh leaks redirect-open errors to pre-redirect stderr; replaced bare redirect with `[ -d /sys/class/vtconsole/vtcon1 ] && echo 0 > ...` guard
- `WARNING: cannot open framebuffer: /dev/fb0` (blank screen hang) — root cause: `set gfxmode` missing from GRUB config so `gfxpayload=keep` kept VGA text mode and passed no framebuffer to kernel; added `set gfxmode=1024x768x32` in `gen-iso.sh`
- `linux.config`: added `CONFIG_SYSFB=y`, `CONFIG_SYSFB_SIMPLEFB=y`, `CONFIG_DRM_SIMPLEDRM=y`, `CONFIG_FB_SIMPLE=y`, `CONFIG_FB_VESA=y`, `CONFIG_VGASTATE=y`, `CONFIG_FB_EFI=y` so kernel attaches to the GRUB-provided framebuffer and creates `/dev/fb0`
- `UserWarning: 'fc-list' is missing` — added `BR2_PACKAGE_FONTCONFIG=y` to `okamaos_x86_64_defconfig`
- `okama-shell`: no longer runs headlessly when `FbWriter` fails; instead falls back to text mode shell so the user always gets a usable console

---

## [0.2.8] - 2026-04-28

### Fixed
- `/dev/fb0` not created — `nomodeset` kernel param was preventing `bochs-drm` from activating KMS, so `DRM_FBDEV_EMULATION` never created `/dev/fb0`
- `gen-iso.sh`: removed `nomodeset`, changed `gfxpayload=text` to `gfxpayload=keep`
- `S99okama-shell`: unbind fbcon from `/dev/fb0` before shell starts (`/sys/class/vtconsole/vtcon1/bind`), then `chvt 1` to own the VT

---

## [0.2.7] - 2026-04-28

### Fixed
- `libSDL2_ttf-2-e6bdbc24.0.so.0.2000.1: cannot open shared object file` — pygame `font.so` NEEDED entry is the hash-named bundled library
- `post-build.sh`: instead of removing `libSDL2_ttf` from `pygame.libs/`, create symlink `libSDL2_ttf-2-e6bdbc24.0.so.0.2000.1` → `/usr/lib/libSDL2_ttf-2.0.so.0` so the linker resolves the exact name using the system (page-aligned) library
- Symlink chain in ISO: `pygame.libs/libSDL2_ttf-2-e6bdbc24.0.so.0.2000.1` → `/usr/lib/libSDL2_ttf-2.0.so.0` → `libSDL2_ttf-2.0.so.0.2200.0`

---

## [0.2.6] - 2026-04-28

### Fixed
- `libSDL2-2-...: cannot open shared object file` — `$ORIGIN` RPATH expansion not working in initramfs environment
- `S99okama-shell`: export `LD_LIBRARY_PATH=/usr/lib/python3.11/site-packages/pygame.libs:/usr/lib` so linker finds bundled SDL2 explicitly

---

## [0.2.5] - 2026-04-28

### Fixed
- `except ImportError` → `except Exception` for pygame import — `OSError` from missing `.so` was not being caught, silently hiding the real error
- Text-mode shell now prints the actual pygame import error on screen: `Reason: <error>`

---

## [0.2.4] - 2026-04-28

### Fixed
- `Pygame not found` regression — removing all of `pygame.libs/` broke `import pygame` because pygame `.so` modules use RPATH `$ORIGIN/../pygame.libs` to find `libSDL2`, `libSDL2_image`, `libSDL2_mixer`
- `post-build.sh`: restore `pygame.libs/` copy, but remove **only** `libSDL2_ttf` from it; pygame falls back to system `/usr/lib/libSDL2_ttf` (Buildroot-built, page-aligned)

---

## [0.2.3] - 2026-04-28

### Fixed
- `NotImplementedError: font module not available` — manylinux `pygame.libs/` bundled `libSDL2_ttf` is ELF-misaligned on Buildroot kernel; removed `pygame.libs/` so pygame uses system SDL2_ttf
- `post-build.sh`: no longer copies `pygame.libs/` from manylinux wheel
- `okama-shell._init_fonts()`: wrapped `pygame.font.init()` in try/except so font failure degrades to default font instead of crashing

---

## [0.2.2] - 2026-04-28

### Fixed
- `pygame.error: fbdev not available` — SDL2 2.28.x dropped fbdev driver entirely
- SDL2 rebuilt with `--enable-video-offscreen` replacing the previously disabled offscreen driver
- `okama-shell`: use `SDL_VIDEODRIVER=offscreen` + new `FbWriter` class that blits pygame surface directly to `/dev/fb0` via `mmap` each frame
- `S99okama-shell`: removed hardcoded SDL env vars, now managed by okama-shell

---

## [0.2.1] - 2026-04-28

### Fixed
- `pygame.error: fbcon not available` — SDL2 framebuffer driver is `fbdev`, not `fbcon` (kernel console name)
- `S99okama-shell` now exports `SDL_VIDEODRIVER=fbdev`, `SDL_FBDEV=/dev/fb0`, `SDL_AUDIODRIVER=alsa`

---

## [0.2.0] - 2026-04-28

### Added
- GRUB2-based bootable ISO generation (`board/okamaos/gen-iso.sh`)
- `board/okamaos/post-image.sh` auto-invokes ISO generation after build
- `CONFIG_PCI=y`, `CONFIG_PCI_DIRECT=y` in kernel config — required for VirtIO device discovery in QEMU
- `CONFIG_VIRTIO=y`, `CONFIG_VIRTIO_PCI=y`, `CONFIG_VIRTIO_BLK=y`, `CONFIG_VIRTIO_NET=y` for QEMU block/network
- `CONFIG_BLK_DEV_INITRD=y` for initramfs support
- `CONFIG_ATA`, `CONFIG_SATA_AHCI`, `CONFIG_SCSI`, `CONFIG_BLK_DEV_SD` for VirtualBox SATA compatibility
- `/init` symlink in ISO initramfs so kernel finds BusyBox init (`rdinit=`)
- `BR2_ROOTFS_DEVICE_TABLE` pointing to `board/okamaos/device_table.txt`
- `board/okamaos/device_table.txt` for `/dev/console` creation
- pygame 2.6.1 (manylinux wheel) installed into `python3.11/site-packages` via `post-build.sh`
- `make okamaos-run-qemu` Makefile target for direct QEMU boot

### Fixed
- Kernel panic `VFS: Cannot open root device` — root cause: missing `CONFIG_PCI`
- ISO boot kernel panic `mount_root_generic` — root cause: missing `/init` in initramfs; fixed with `rdinit=` and `/init -> /sbin/init` symlink
- Pygame not found at runtime — wrong install path (`python3/dist-packages` → `python3.11/site-packages`)
- Buildroot zlib 404 download — overrode `LIBZLIB_SITE` to GitHub releases mirror
- `okama-runtime` rsync infinite loop — removed `SITE_METHOD=local`
- `BR2_LEGACY` error — removed deprecated defconfig options
- `gen-iso.sh` tar extraction — ignore device node mknod errors in user space
- `amixer` missing at runtime — added `BR2_PACKAGE_ALSA_UTILS_AMIXER/APLAY/ALSACTL`

### Changed
- Bootloader switched from isolinux to GRUB2 for 64-bit kernel compatibility
- Rootfs converted from ext2 to cpio.gz initramfs for ISO boot
- GRUB config uses `set gfxpayload=text`, `nomodeset`, `rdinit=/sbin/init`
- `BR2_TARGET_ROOTFS_EXT2_SIZE` increased to `512M`

---

## [0.1.0] - 2026-04-27

### Added
- Initial Buildroot-based OkamaOS for x86_64
- `configs/okamaos_x86_64_defconfig` with Python3, SDL2, BusyBox, BlueZ, ALSA, Dropbear
- `package/okama-runtime` BR2_EXTERNAL package
- `board/okamaos/linux.config` custom kernel config fragment
- `board/okamaos/busybox.config` custom BusyBox config
- `board/okamaos/rootfs-overlay/` for etc/inittab, init scripts
- `usr/bin/okama-shell`, `okama-run`, `okama-cli`, `okama-inputd` userland tools
- `usr/lib/okamaos/` Python library (config, games, input_protocol, bluetooth modules)
- `build.sh` wrapper for Buildroot build
- `Makefile` with `okamaos-build`, `okamaos-run-qemu`, `okamaos-iso` targets

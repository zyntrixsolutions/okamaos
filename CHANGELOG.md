# Changelog

## [2.0.0] - 2026-04-30 - MAJOR UPDATE

### Added

- **Cyberpunk Retro UI**: Animated checkered net/fence background with perspective grid, CRT scanlines, and neon cyan/magenta accents
- **Full Keyboard Support**: Complete keyboard navigation alongside controllers (arrows, WASD, Enter, Space, Esc, Tab, number keys for sections)
- **Network Status Monitor**: Real-time WiFi/Ethernet connectivity detection with online/offline indicators in the UI
- **Update Badge System**: Visual notification badge showing available OS and game updates on home screen
- **Generic Controller Drivers**: Expanded HID button mappings for Logitech, ZeroPlus, Zydacron, generic USB gamepads
- **Bluetooth Plug-and-Play**: Auto-pairing agent support with `BT_AUTO_PAIR` config option for seamless controller pairing
- **WiFi Interface Auto-Detection**: Automatic detection of common WiFi interfaces (wlan0, wlp2s0, wlo1, etc.)
- **EFI Boot Detection**: Installer auto-detects EFI mode and supports `--efi` option for EFI bootloader installation
- **Network Status Command**: `S40okama-network status` subcommand for debugging connectivity

### Changed

- **FPS increased to 60** from 30 for smoother UI animations
- **Default Bluetooth enabled** (`BLUETOOTH_ENABLED=yes`) with auto-pair support
- **Shell version** bumped to 2.0.0 with new title and features
- **Input daemon** expanded button mappings for generic controllers
- **Network init** rewritten with better interface detection and status reporting
- **Bluetooth init** rewritten with agent support and auto-reconnect improvements
- **Kernel config** expanded with more HID drivers (Logitech, ZeroPlus, Retrode, etc.)

### Fixed

- Network connectivity now properly detected via DNS probe (8.8.8.8:53)
- Bluetooth pairing agent now handles controllers without PIN codes automatically
- Generic USB controllers now recognized through expanded button map
- WiFi country code configuration support added
- Settings menu now fully functional with Network, Audio, Storage Info, and System Updates options

## [1.0.6] - 2026-04-30

### Fixed

- Restored GUI-first ISO startup after the v0.9.10 boot path; text mode is now a fallback only when the pygame GUI cannot initialize.
- Enabled SDL2 KMS/DRM video support with Mesa GBM/EGL/GLES so pygame has a visible console graphics backend instead of rendering offscreen.
- Added QEMU and VirtualBox-friendly DRM/Mesa support for virtio, SVGA, and software rendering paths.
- Restored the default GRUB entry to the GUI/KMS path and kept `nomodeset` as a separate safe graphics fallback.

### Changed

- Bumped runtime, installer, and package version tracking to `1.0.6`.

## [1.0.5] - 2026-04-30

### Fixed

- Enabled kernel initrd support required by the GRUB ISO live root filesystem.
- Removed automatic panic reboot behavior from ISO boot entries so boot failures stay visible instead of silently looping.
- Enabled the standard 8250 serial console and early serial printk for boot diagnostics.
- Enabled VESA, EFI, simple framebuffer, and simpledrm support required by the safe graphics ISO path.
- Stopped mirroring the ISO into `output/images`; the build now leaves a single ISO at `output/okamaos.iso`.
- Updated the boot splash version text and shell module path bootstrap for packaged Python runtime modules.
- Added a temporary text-mode ISO shell fallback while framebuffer pygame startup was being stabilized.

### Changed

- Bumped runtime, installer, and package version tracking to `1.0.5`.

## [1.0.4] - 2026-04-30

### Fixed

- Restored the normal `make okamaos-build` ISO generation path through the Buildroot post-image hook.
- Restored the canonical `output/okamaos.iso` artifact while keeping an `output/images/okamaos.iso` mirror for image-directory tooling.
- Replaced the broken ISOLINUX-only ISO staging path with the GRUB2 hybrid ISO generator so VirtualBox no longer fails on a missing `ldlinux.c32`.

### Changed

- Bumped runtime and package version tracking to `1.0.4`.

## [1.0.3] - 2026-04-29

### Added

- Added `okama-install` for installing a live OkamaOS system to a local hard drive or VM disk.
- Added destructive-write safeguards with disk listing, root-disk refusal, dry-run checks, and typed confirmation.
- Added hard-drive boot packaging for the installer kernel, Extlinux installer, Syslinux MBR, and `ldlinux.c32` assets.
- Added hard-drive installer documentation for device and QEMU workflows.

### Changed

- Bumped runtime and package version tracking to `1.0.3`.

## [1.0.2] - 2026-04-29

### Added

- Added real `.okupdate` bundle apply support for system/runtime files.
- Added safe update backups under `/var/okamaos/updates/backups`.
- Added rollback support for the latest system update backup.
- Added preserved-data guards for games, saves, logs, cache, controllers, update history, and parent/developer config.
- Added an update bundle builder for publishing repo-hosted system updates.
- Added a downloadable `pages/updates/okamaos-v1.0.2.okupdate` system update bundle.

### Changed

- Bumped runtime and package version tracking to `1.0.2`.
- Updated the public feed to point at an installable system update bundle instead of metadata-only update notes.

## [1.0.1] - 2026-04-29

### Added

- Added OS update notification checks against the public update feed.
- Added installed-game update checks against the public app catalog.
- Added home-screen update notification banners in `okama-shell`.
- Added update notice output to `okama-update check`.
- Added downloadable `pages/updates/okamaos-v1.0.1.okupdate` metadata.
- Added `0.1.1` demo game catalog/package metadata for game-update detection.

### Changed

- Bumped runtime and package version tracking to `1.0.1`.

## [1.0.0] - 2026-04-29

### Added

- Added an early OkamaOS boot splash init script for tty1 before the shell starts.
- Added shared OkamaOS logo assets for runtime branding and Pages branding.
- Added a downloadable `pages/updates/okamaos-v1.0.0.okupdate` manifest for the public update channel.

### Changed

- Replaced the shell home text wordmark with a logo treatment.
- Replaced the Pages header and hero text branding with the OkamaOS logo asset.
- Updated the public update feed to advertise `1.0.0 First Wave`.
- Bumped runtime and package version tracking to `1.0.0`.

## [0.1.1] - 2026-04-29

### Added

- Added a GitHub Pages-ready public portal under `pages/` for the OkamaOS landing page, app catalog, and update feed.
- Added a static app catalog with one downloadable demo `.ok` package generated from `games/demo`.
- Added public update metadata that can point current users to release notes and future OS update artifacts.
- Added a GitHub Actions workflow to deploy the `pages/` directory through GitHub Pages.
- Added root project version, changelog, roadmap, and package version tracking files.

### Changed

- Bumped OkamaOS runtime tracking from `0.1.0` to `0.1.1`.
- Documented the public portal in the root README.

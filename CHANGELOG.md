# Changelog

## [1.1.1] - 2026-04-30

### Fixed

- Restored reliable home-screen keyboard navigation by adding shell-level evdev keyboard reading and reconnecting to `okama-inputd` when the daemon socket appears after shell startup.
- Broadened keyboard detection and accepted key-repeat events for arrows, WASD, keypad navigation, Enter, Space, Esc, Backspace, Tab, and Home.

### Changed

- Removed the horizontal yellow cyber-grid line and refined the home screen into larger, clearer action rows with live status tiles.
- Bumped runtime, installer, package, and shell-visible version tracking to `1.1.1`.

## [1.1.0] - 2026-04-30

### Added

- Added first-class keyboard support for shell navigation, daemon input events, and developer terminal workflows.
- Added live network status plumbing for Ethernet/Wi-Fi link, IP, default route, and internet reachability.
- Added shell status badges for online state, OS/game update availability, Bluetooth, version, and input devices.
- Added a cached cyber checkered fence/grid shell background for the retro-futuristic UI refresh.
- Added Bluetooth readiness handling that powers adapters, registers the default agent, and reports connected devices.
- Added SHA-256 verification for downloaded `.okupdate` bundles when feed metadata provides a hash.

### Fixed

- Broadened generic HID controller detection beyond one narrow evdev shape so common USB/Bluetooth controllers are picked up more reliably.
- Updated network startup to try all wired interfaces and optional `wl*`/`wlan*` Wi-Fi devices instead of only `eth0`/`wlan0`.
- Enabled kernel and Buildroot pieces needed for full keyboard terminals, generic HID input, Bluetooth DBus startup, HTTPS update checks, and CA validation.

### Changed

- Bumped runtime, installer, package, and shell-visible version tracking to `1.1.0`.

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

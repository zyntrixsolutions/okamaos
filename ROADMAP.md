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

### v1.0 — Console Polish
- [x] Silent boot (`quiet loglevel=0`, boot log redirect) — completed in v0.3
- [ ] Boot time < 8 seconds
- [ ] Controller rumble via evdev FF API
- [ ] Battery level on HUD
- [ ] OTA update system via `okama-cli update`

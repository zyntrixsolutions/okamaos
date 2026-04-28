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

### v0.3 — Pygame Shell ⏳
- [x] `/dev/fb0` framebuffer created at boot (GRUB gfxmode + kernel SYSFB/DRM_SIMPLEDRM/FB_VESA)
- [ ] pygame fullscreen shell renders on framebuffer (SDL_VIDEODRIVER=fbcon)
- [ ] Controller D-pad navigation in pygame shell
- [ ] Play / Settings / Power sections functional
- [ ] Game launch via `okama-run` with fade-to-black transition

### v0.4 — Game Runtime
- [ ] `.ok` package install via `okama-cli install <file.ok>`
- [ ] Games list populated from `/var/okamaos/games/`
- [ ] `okama-run` launches game, returns to shell on exit
- [ ] Per-game controller button overlay from `controller.json`

### v0.5 — System Services
- [ ] Bluetooth controller pairing via shell Settings menu
- [ ] ALSA audio working (amixer / aplay)
- [ ] Network: DHCP on boot, Wi-Fi via `wpa_supplicant`
- [ ] SSH access via Dropbear

### v1.0 — Console Polish
- [ ] Silent boot (`quiet loglevel=0`, framebuffer splash)
- [ ] Boot time < 8 seconds
- [ ] Controller rumble via evdev FF API
- [ ] Battery level on HUD
- [ ] OTA update system via `okama-cli update`

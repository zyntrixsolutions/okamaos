# Changelog

All notable changes to OkamaOS are documented here.
Format: [Semantic Versioning](https://semver.org/)

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

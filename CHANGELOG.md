# Changelog

All notable changes to OkamaOS are documented here.
Format: [Semantic Versioning](https://semver.org/)

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

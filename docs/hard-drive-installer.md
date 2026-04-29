# OkamaOS Hard Drive Installer

`okama-install` installs the running live OkamaOS system to a local hard drive,
SSD, USB disk, or QEMU disk. It is intentionally a developer/operator command:
normal console users should not run destructive disk actions from the main shell.

## Safety Model

- The target must be a whole block device such as `/dev/sdb`, `/dev/vdb`, or
  `/dev/nvme0n1`.
- The installer refuses the disk that backs the currently running root
  filesystem.
- Any mounted filesystem on the target disk blocks the install.
- Interactive installs require typing `ERASE /dev/...` before partitioning.
- `--dry-run` validates tools and boot assets without changing the disk.

## Live Install

Boot OkamaOS from the live image, enter developer mode, then run:

```bash
okama-install --list-disks
okama-install --target /dev/sdX --dry-run
okama-install --target /dev/sdX
```

Replace `/dev/sdX` with the actual target disk. The installer erases that disk,
creates one Linux partition, formats it, copies the live root filesystem, writes
`/boot/extlinux/extlinux.conf`, installs Extlinux, and writes the Syslinux MBR.

After completion, remove the live media, set the installed disk as the boot
device, and reboot.

## QEMU Install Test

Create a blank disk and boot the live rootfs with the blank disk attached:

```bash
qemu-img create -f raw /tmp/okamaos-installed.raw 4G
qemu-system-x86_64 -m 2048 -smp 2 \
  -kernel output/images/bzImage \
  -drive file=output/images/rootfs.ext4,if=virtio,format=raw \
  -drive file=/tmp/okamaos-installed.raw,if=virtio,format=raw \
  -append "root=/dev/vda rw quiet loglevel=0 console=tty1" \
  -device usb-ehci -device usb-kbd -device usb-mouse \
  -vga std -serial mon:stdio
```

Inside OkamaOS:

```bash
okama-install --list-disks
okama-install --target /dev/vdb
```

Then boot the installed disk directly:

```bash
qemu-system-x86_64 -m 2048 -smp 2 \
  -drive file=/tmp/okamaos-installed.raw,if=virtio,format=raw \
  -device usb-ehci -device usb-kbd -device usb-mouse \
  -vga std -serial mon:stdio
```

## Boot Mode

The first installer milestone supports legacy BIOS boot through
Syslinux/Extlinux. UEFI support is tracked separately in the roadmap.

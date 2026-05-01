# OkamaOS Hard Drive Installer

`okama-install` migrates the running live system onto a selected whole disk.
It creates one Linux partition, copies the current root filesystem, installs a
legacy BIOS Extlinux bootloader, and writes an installed-system `fstab`.

List candidate disks:

```bash
okama-install --list-disks
```

Run a non-destructive plan:

```bash
okama-install --target /dev/sdX --dry-run
```

Install:

```bash
okama-install --target /dev/sdX --yes
```

Without `--yes`, the installer requires a typed confirmation in the form
`ERASE /dev/sdX`. It refuses unsupported block devices, mounted target disks,
partitions passed as whole-disk targets, disks smaller than 1 GiB, and the
current root disk when it can identify it.

The live image packages these boot assets for migration:

- `/boot/okamaos/vmlinuz`
- `/usr/sbin/extlinux`
- `/usr/share/okamaos/boot/mbr.bin`
- `/usr/share/okamaos/boot/ldlinux.c32`

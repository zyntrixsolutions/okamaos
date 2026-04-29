#!/usr/bin/env bash
# Buildroot post-build hook for OkamaOS.
#
# Runs after the rootfs is assembled but before image creation. We use it to:
#   1. Make sure inittab points to okama-shell (overlay already does this).
#   2. Disable the login getty on tty1 in normal mode.
#   3. Ensure /var/okamaos directories exist.
#   4. Mark all okama-* binaries executable.
set -euo pipefail

TARGET_DIR="$1"

echo ">> okamaos post-build: $TARGET_DIR"

# Ensure okama-* tools are executable
if [ -d "$TARGET_DIR/usr/bin" ]; then
    chmod 0755 "$TARGET_DIR"/usr/bin/okama-* 2>/dev/null || true
fi

# Ensure init.d scripts are executable
if [ -d "$TARGET_DIR/etc/init.d" ]; then
    chmod 0755 "$TARGET_DIR"/etc/init.d/S* 2>/dev/null || true
fi

# Ensure runtime dirs exist
mkdir -p "$TARGET_DIR/var/okamaos/games" \
         "$TARGET_DIR/var/okamaos/saves" \
         "$TARGET_DIR/var/okamaos/logs" \
         "$TARGET_DIR/var/okamaos/cache" \
         "$TARGET_DIR/var/okamaos/controllers" \
         "$TARGET_DIR/var/okamaos/updates" \
         "$TARGET_DIR/var/okamaos/updates/backups" \
         "$TARGET_DIR/var/okamaos/updates/history"

# Package the kernel and legacy-BIOS bootloader pieces needed by okama-install.
BOOT_DIR="$TARGET_DIR/boot/okamaos"
BOOT_ASSET_DIR="$TARGET_DIR/usr/share/okamaos/boot"
mkdir -p "$BOOT_DIR" "$BOOT_ASSET_DIR" "$TARGET_DIR/usr/sbin"

if [ -n "${BINARIES_DIR:-}" ] && [ -f "$BINARIES_DIR/bzImage" ]; then
    install -m 0644 "$BINARIES_DIR/bzImage" "$BOOT_DIR/vmlinuz"
else
    echo ">> okamaos post-build: warning: bzImage not found for hard-drive installer"
fi

if [ -n "${HOST_DIR:-}" ] && [ -x "$HOST_DIR/sbin/extlinux" ]; then
    install -m 0755 "$HOST_DIR/sbin/extlinux" "$TARGET_DIR/usr/sbin/extlinux"
else
    echo ">> okamaos post-build: warning: extlinux installer not found"
fi

for asset in mbr.bin ldlinux.c32; do
    copied="no"
    for src in \
        "${BINARIES_DIR:-}/syslinux/$asset" \
        "${HOST_DIR:-}/share/syslinux/$asset"; do
        if [ -f "$src" ]; then
            install -m 0644 "$src" "$BOOT_ASSET_DIR/$asset"
            copied="yes"
            break
        fi
    done
    if [ "$copied" != "yes" ]; then
        echo ">> okamaos post-build: warning: $asset not found for hard-drive installer"
    fi
done

# Quiet boot: silence motd and issue file in normal mode
mkdir -p "$TARGET_DIR/etc"
echo "OkamaOS" > "$TARGET_DIR/etc/issue"
: > "$TARGET_DIR/etc/motd"

echo ">> okamaos post-build: done"

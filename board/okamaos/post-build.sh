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

# Quiet boot: silence motd and issue file in normal mode
echo "OkamaOS" > "$TARGET_DIR/etc/issue"
: > "$TARGET_DIR/etc/motd"

echo ">> okamaos post-build: done"

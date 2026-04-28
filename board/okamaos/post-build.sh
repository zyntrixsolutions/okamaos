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

# Install pygame into target rootfs (dropped from Buildroot 2024.02)
# Uses system pip3 to download/install the correct manylinux wheel for the target Python version
PYVER=$(ls "$TARGET_DIR/usr/lib/" | grep -E '^python3\.[0-9]+$' | head -1)
SITE="$TARGET_DIR/usr/lib/$PYVER/site-packages"
if [ -n "$PYVER" ] && [ ! -d "$SITE/pygame" ]; then
    echo ">> Installing pygame into $SITE..."
    pip3 download \
        --only-binary=:all: \
        --python-version "${PYVER#python}" \
        --platform manylinux_2_17_x86_64 \
        --abi "cp${PYVER#python}" \
        -d /tmp/pygame-wheel-dl \
        pygame 2>&1 || true
    WHL=$(ls /tmp/pygame-wheel-dl/pygame-*.whl 2>/dev/null | head -1)
    if [ -n "$WHL" ]; then
        mkdir -p /tmp/pg-whl-extract
        unzip -q -o "$WHL" -d /tmp/pg-whl-extract
        cp -r /tmp/pg-whl-extract/pygame "$SITE/" 2>/dev/null || true
        cp -r /tmp/pg-whl-extract/pygame.libs "$SITE/" 2>/dev/null || true
        rm -rf /tmp/pg-whl-extract /tmp/pygame-wheel-dl
        echo ">> pygame installed from $WHL"
    else
        echo ">> WARNING: pygame wheel download failed, skipping"
    fi
fi

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
         "$TARGET_DIR/var/okamaos/updates"

# Quiet boot: silence motd and issue file in normal mode
echo "OkamaOS" > "$TARGET_DIR/etc/issue"
: > "$TARGET_DIR/etc/motd"

echo ">> okamaos post-build: done"

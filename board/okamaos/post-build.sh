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
    # Try to download pygame wheel with relaxed platform constraints
    if pip3 download \
        --only-binary=:all: \
        --python-version "${PYVER#python}" \
        -d /tmp/pygame-wheel-dl \
        pygame 2>/dev/null; then
        WHL=$(ls /tmp/pygame-wheel-dl/pygame-*.whl 2>/dev/null | head -1)
        if [ -n "$WHL" ]; then
            mkdir -p /tmp/pg-whl-extract
            unzip -q -o "$WHL" -d /tmp/pg-whl-extract
            cp -r /tmp/pg-whl-extract/pygame "$SITE/" 2>/dev/null || true
            # Keep pygame.libs (needed by pygame .so RPATH for SDL2, SDL2_image, SDL2_mixer)
            cp -r /tmp/pg-whl-extract/pygame.libs "$SITE/" 2>/dev/null || true
            rm -rf /tmp/pg-whl-extract /tmp/pygame-wheel-dl
            echo ">> pygame installed from $WHL"
        else
            echo ">> WARNING: pygame wheel download failed, skipping"
            rm -rf /tmp/pygame-wheel-dl
        fi
    else
        echo ">> WARNING: pygame pip download failed, skipping (pygame not required for base build)"
        rm -rf /tmp/pygame-wheel-dl
    fi
fi
if [ -d "$SITE/pygame.libs" ]; then
    # Replace bundled (ELF-misaligned) libSDL2_ttf with a relative symlink to
    # the system Buildroot-built libSDL2_ttf.  The relative link works both in
    # the installed image and in output/target runtime smoke tests.
    rm -f "$SITE/pygame.libs/libSDL2_ttf"*.so* 2>/dev/null || true
    ln -sf ../../../libSDL2_ttf-2.0.so.0 \
        "$SITE/pygame.libs/libSDL2_ttf-2-e6bdbc24.0.so.0.2000.1" 2>/dev/null || true
fi

# Sync okama-* binaries and libs from source tree into target
# (Buildroot overlay only runs at first build; this ensures every build gets latest)
REPO_DIR="$(dirname "$(readlink -f "$0")")/../.."
if [ -d "$REPO_DIR/board/okamaos/rootfs-overlay" ]; then
    cp -a "$REPO_DIR/board/okamaos/rootfs-overlay"/. "$TARGET_DIR"/ 2>/dev/null || true
fi
if [ -d "$REPO_DIR/usr/bin" ]; then
    cp -a "$REPO_DIR/usr/bin"/okama-* "$TARGET_DIR/usr/bin/" 2>/dev/null || true
fi
if [ -d "$REPO_DIR/usr/lib/okamaos" ]; then
    mkdir -p "$TARGET_DIR/usr/lib/okamaos"
    cp -a "$REPO_DIR/usr/lib/okamaos"/. "$TARGET_DIR/usr/lib/okamaos/" 2>/dev/null || true
fi
if [ -f "$REPO_DIR/VERSION" ]; then
    mkdir -p "$TARGET_DIR/usr/lib/okamaos" "$TARGET_DIR/etc/okamaos"
    cp -f "$REPO_DIR/VERSION" "$TARGET_DIR/usr/lib/okamaos/VERSION" 2>/dev/null || true
    cp -f "$REPO_DIR/VERSION" "$TARGET_DIR/etc/okamaos/VERSION" 2>/dev/null || true
fi
if [ -d "$REPO_DIR/usr/share/okamaos" ]; then
    mkdir -p "$TARGET_DIR/usr/share/okamaos"
    cp -a "$REPO_DIR/usr/share/okamaos"/. "$TARGET_DIR/usr/share/okamaos/" 2>/dev/null || true
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
         "$TARGET_DIR/var/okamaos/updates" \
         "$TARGET_DIR/var/okamaos/updates/backups" \
         "$TARGET_DIR/var/okamaos/updates/downloads" \
         "$TARGET_DIR/var/okamaos/updates/history" \
         "$TARGET_DIR/var/okamaos/updates/game-backups"

# Package the kernel and legacy-BIOS bootloader pieces needed by okama-install.
BOOT_DIR="$TARGET_DIR/boot/okamaos"
BOOT_ASSET_DIR="$TARGET_DIR/usr/share/okamaos/boot"
mkdir -p "$BOOT_DIR" "$BOOT_ASSET_DIR" "$TARGET_DIR/usr/sbin"

if [ -n "${BINARIES_DIR:-}" ] && [ -f "$BINARIES_DIR/bzImage" ]; then
    install -m 0644 "$BINARIES_DIR/bzImage" "$BOOT_DIR/vmlinuz"
elif [ -f "$REPO_DIR/output/images/bzImage" ]; then
    install -m 0644 "$REPO_DIR/output/images/bzImage" "$BOOT_DIR/vmlinuz"
else
    echo ">> okamaos post-build: warning: bzImage not found for hard-drive installer"
fi

if [ -n "${HOST_DIR:-}" ] && [ -x "$HOST_DIR/sbin/extlinux" ]; then
    install -m 0755 "$HOST_DIR/sbin/extlinux" "$TARGET_DIR/usr/sbin/extlinux"
elif [ -x "$REPO_DIR/output/host/sbin/extlinux" ]; then
    install -m 0755 "$REPO_DIR/output/host/sbin/extlinux" "$TARGET_DIR/usr/sbin/extlinux"
else
    echo ">> okamaos post-build: warning: extlinux installer not found"
fi

for asset in mbr.bin ldlinux.c32; do
    copied="no"
    for src in \
        "${BINARIES_DIR:-}/syslinux/$asset" \
        "${HOST_DIR:-}/share/syslinux/$asset" \
        "$REPO_DIR/output/images/syslinux/$asset" \
        "$REPO_DIR/output/host/share/syslinux/$asset"; do
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

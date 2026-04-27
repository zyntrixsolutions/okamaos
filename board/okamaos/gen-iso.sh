#!/usr/bin/env bash
# Generate a bootable OkamaOS ISO image
# Usage: ./gen-iso.sh [images_dir] [output_iso]

set -euo pipefail

IMAGES_DIR="${1:-$(dirname "$0")/../../../output/images}"
OUTPUT_ISO="${2:-$(dirname "$0")/../../../output/okamaos.iso}"

if [ ! -f "$IMAGES_DIR/bzImage" ]; then
    echo "ERROR: kernel not found: $IMAGES_DIR/bzImage"
    echo "Run: make okamaos-build"
    exit 1
fi

if [ ! -f "$IMAGES_DIR/rootfs.tar" ]; then
    echo "ERROR: rootfs.tar not found: $IMAGES_DIR/rootfs.tar"
    echo "Run: make okamaos-build"
    exit 1
fi

echo ">>> OkamaOS ISO Generator"
echo "    Kernel : $IMAGES_DIR/bzImage"
echo "    Rootfs : $IMAGES_DIR/rootfs.tar"
echo "    Output : $OUTPUT_ISO"

# Create temporary directories
ISO_WORK=$(mktemp -d)
ROOTFS_WORK=$(mktemp -d)
trap "rm -rf $ISO_WORK $ROOTFS_WORK" EXIT

# Create isolinux directory first
mkdir -p "$ISO_WORK/isolinux"

# Build a proper cpio.gz initramfs from rootfs.tar
# (512MB ext2 is too large for isolinux; cpio.gz is the standard initramfs format)
echo ">>> Building initramfs from rootfs.tar..."
tar -C "$ROOTFS_WORK" -xf "$IMAGES_DIR/rootfs.tar"
(cd "$ROOTFS_WORK" && find . | cpio -o -H newc 2>/dev/null | gzip -9) \
    > "$ISO_WORK/isolinux/rootfs.cpio.gz" || \
    { echo "ERROR: failed to build initramfs"; exit 1; }
INITRD_SIZE=$(du -sh "$ISO_WORK/isolinux/rootfs.cpio.gz" | cut -f1)
echo "    Initramfs size: $INITRD_SIZE"

# Copy kernel
cp "$IMAGES_DIR/bzImage" "$ISO_WORK/isolinux/bzImage"

# Create isolinux.cfg (paths are relative to the isolinux/ directory)
cat > "$ISO_WORK/isolinux/isolinux.cfg" << 'EOF'
DEFAULT okamaos
PROMPT 0
TIMEOUT 10

LABEL okamaos
  MENU LABEL OkamaOS
  LINUX bzImage
  INITRD rootfs.cpio.gz
  APPEND rw quiet loglevel=3 console=tty1
EOF

# Locate syslinux BIOS modules directory
SYSLINUX_BIOS=""
for d in /usr/lib/syslinux/modules/bios /usr/lib/syslinux/bios /usr/share/syslinux; do
    if [ -d "$d" ] && [ -f "$d/ldlinux.c32" ]; then
        SYSLINUX_BIOS="$d"
        break
    fi
done

# Copy isolinux.bin
if [ -f "$IMAGES_DIR/syslinux/isolinux.bin" ]; then
    cp "$IMAGES_DIR/syslinux/isolinux.bin" "$ISO_WORK/isolinux/"
elif [ -n "$SYSLINUX_BIOS" ] && [ -f "$SYSLINUX_BIOS/../isolinux.bin" ]; then
    cp "$SYSLINUX_BIOS/../isolinux.bin" "$ISO_WORK/isolinux/"
else
    # Try common locations for isolinux.bin
    ISOLINUX_BIN=$(find /usr -name isolinux.bin 2>/dev/null | head -1)
    if [ -z "$ISOLINUX_BIN" ]; then
        echo "ERROR: isolinux.bin not found. Install: sudo apt-get install isolinux"
        exit 1
    fi
    cp "$ISOLINUX_BIN" "$ISO_WORK/isolinux/"
fi

# Copy required .c32 modules (ldlinux.c32 is mandatory, others for menu support)
if [ -n "$SYSLINUX_BIOS" ]; then
    for mod in ldlinux.c32 libcom32.c32 libutil.c32 menu.c32; do
        [ -f "$SYSLINUX_BIOS/$mod" ] && cp "$SYSLINUX_BIOS/$mod" "$ISO_WORK/isolinux/" || true
    done
else
    echo "WARNING: syslinux BIOS modules not found — boot may fail"
    echo "Install: sudo apt-get install syslinux-common"
fi

# Check for ISO creation tool
if command -v xorriso &> /dev/null; then
    echo ">>> Using xorriso"
    xorriso -as mkisofs \
        -o "$OUTPUT_ISO" \
        -b isolinux/isolinux.bin \
        -c isolinux/boot.cat \
        -no-emul-boot \
        -boot-load-size 4 \
        -boot-info-table \
        -J -R -V "OkamaOS" \
        "$ISO_WORK"
elif command -v genisoimage &> /dev/null; then
    echo ">>> Using genisoimage"
    genisoimage \
        -o "$OUTPUT_ISO" \
        -b isolinux/isolinux.bin \
        -c isolinux/boot.cat \
        -no-emul-boot \
        -boot-load-size 4 \
        -boot-info-table \
        -J -R -V "OkamaOS" \
        "$ISO_WORK"
else
    echo "ERROR: No ISO creation tool found (xorriso or genisoimage)"
    echo "Install: sudo apt-get install xorriso"
    exit 1
fi

echo ">>> ISO created: $OUTPUT_ISO"
ls -lh "$OUTPUT_ISO"

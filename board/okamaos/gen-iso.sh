#!/usr/bin/env bash
# Generate a bootable OkamaOS ISO image using GRUB2
# Usage: ./gen-iso.sh [images_dir] [output_iso]

set -euo pipefail

IMAGES_DIR="${1:-$(dirname "$0")/../../../output/images}"
OUTPUT_ISO="${2:-$(dirname "$0")/../../../output/okamaos.iso}"
# Resolve to absolute paths
IMAGES_DIR="$(realpath "$IMAGES_DIR")"
OUTPUT_ISO="$(realpath -m "$OUTPUT_ISO")"

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

# Require grub-mkrescue
if ! command -v grub-mkrescue &>/dev/null; then
    echo "ERROR: grub-mkrescue not found"
    echo "Install: sudo apt-get install grub-pc-bin grub-efi-amd64-bin mtools xorriso"
    exit 1
fi

echo ">>> OkamaOS ISO Generator (GRUB2)"
echo "    Kernel : $IMAGES_DIR/bzImage"
echo "    Rootfs : $IMAGES_DIR/rootfs.tar"
echo "    Output : $OUTPUT_ISO"

# Create temporary directories
ISO_WORK=$(mktemp -d)
ROOTFS_WORK=$(mktemp -d)
trap "rm -rf $ISO_WORK $ROOTFS_WORK" EXIT

mkdir -p "$ISO_WORK/boot/grub"

# Copy kernel
cp "$IMAGES_DIR/bzImage" "$ISO_WORK/boot/bzImage"

# Build cpio.gz initramfs from rootfs.tar
echo ">>> Building initramfs (~30s)..."
tar -C "$ROOTFS_WORK" -xf "$IMAGES_DIR/rootfs.tar" 2>/dev/null || \
    tar -C "$ROOTFS_WORK" --warning=no-unknown-keyword -xf "$IMAGES_DIR/rootfs.tar" 2>/dev/null || true
# /init is the initramfs entry point the kernel looks for first
[ ! -e "$ROOTFS_WORK/init" ] && ln -s /sbin/init "$ROOTFS_WORK/init"
(cd "$ROOTFS_WORK" && find . | cpio -o -H newc 2>/dev/null | gzip -9) \
    > "$ISO_WORK/boot/rootfs.cpio.gz"
INITRD_SIZE=$(du -sh "$ISO_WORK/boot/rootfs.cpio.gz" | cut -f1)
echo "    Initramfs: $INITRD_SIZE"

# GRUB2 config
cat > "$ISO_WORK/boot/grub/grub.cfg" << 'EOF'
set default=0
set timeout=3

# Load video drivers and activate gfxterm so gfxpayload=keep passes a real
# framebuffer to the kernel (screen_info -> SYSFB_SIMPLEFB -> DRM_SIMPLEDRM
# -> /dev/fb0).  Without terminal_output gfxterm, set gfxmode only sets a
# variable and gfxpayload=keep silently keeps VGA text mode.
insmod all_video
insmod vbe
insmod gfxterm
set gfxmode=1024x768x32,1280x720x32,800x600x32,1024x768x16,800x600x16,auto
terminal_output gfxterm

menuentry "OkamaOS" {
    set gfxpayload=keep
    linux  /boot/bzImage rw quiet loglevel=0 console=ttyS0,115200 console=tty1 rdinit=/sbin/init panic=10 rd.systemd.show_status=false printk.devkmsg=off vt.global_cursor_default=0
    initrd /boot/rootfs.cpio.gz
}

menuentry "OkamaOS (safe graphics)" {
    set gfxpayload=800x600x32
    linux  /boot/bzImage rw quiet loglevel=0 console=ttyS0,115200 console=tty1 rdinit=/sbin/init panic=10 rd.systemd.show_status=false printk.devkmsg=off vt.global_cursor_default=0 nomodeset video=vesafb:mtrr:3
    initrd /boot/rootfs.cpio.gz
}

menuentry "OkamaOS (debug — verbose)" {
    set gfxpayload=keep
    linux  /boot/bzImage rw loglevel=7 console=ttyS0,115200 console=tty1 rdinit=/sbin/init panic=30 vt.global_cursor_default=0
    initrd /boot/rootfs.cpio.gz
}
EOF

# Build the hybrid ISO (BIOS + EFI)
echo ">>> Running grub-mkrescue..."
grub-mkrescue -o "$OUTPUT_ISO" "$ISO_WORK" -- -volid OkamaOS 2>&1

echo ">>> ISO created: $OUTPUT_ISO"
ls -lh "$OUTPUT_ISO"

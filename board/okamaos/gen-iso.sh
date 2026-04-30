#!/usr/bin/env bash
# Generate a bootable OkamaOS ISO image using GRUB2.
# Usage: ./gen-iso.sh [images_dir] [output_iso]
set -euo pipefail

IMAGES_DIR="${1:-$(dirname "$0")/../../../output/images}"
OUTPUT_ISO="${2:-$(dirname "$0")/../../../output/okamaos.iso}"

IMAGES_DIR="$(realpath "$IMAGES_DIR")"
OUTPUT_ISO="$(realpath -m "$OUTPUT_ISO")"
OUTPUT_DIR="$(dirname "$OUTPUT_ISO")"

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

if ! command -v grub-mkrescue >/dev/null 2>&1; then
    echo "ERROR: grub-mkrescue not found"
    echo "Install: sudo apt-get install grub-pc-bin grub-efi-amd64-bin mtools xorriso"
    exit 1
fi

echo ">>> OkamaOS ISO Generator (GRUB2)"
echo "    Kernel : $IMAGES_DIR/bzImage"
echo "    Rootfs : $IMAGES_DIR/rootfs.tar"
echo "    Output : $OUTPUT_ISO"

mkdir -p "$OUTPUT_DIR"

ISO_WORK="$(mktemp -d)"
ROOTFS_WORK="$(mktemp -d)"
trap 'rm -rf "$ISO_WORK" "$ROOTFS_WORK"' EXIT

mkdir -p "$ISO_WORK/boot/grub"

cp "$IMAGES_DIR/bzImage" "$ISO_WORK/boot/bzImage"

echo ">>> Building initramfs..."
tar -C "$ROOTFS_WORK" -xf "$IMAGES_DIR/rootfs.tar" 2>/dev/null || \
    tar -C "$ROOTFS_WORK" --warning=no-unknown-keyword -xf "$IMAGES_DIR/rootfs.tar"

if [ ! -e "$ROOTFS_WORK/init" ]; then
    ln -s /sbin/init "$ROOTFS_WORK/init"
fi

(cd "$ROOTFS_WORK" && find . | cpio -o -H newc 2>/dev/null | gzip -9) \
    > "$ISO_WORK/boot/rootfs.cpio.gz"

INITRD_SIZE="$(du -sh "$ISO_WORK/boot/rootfs.cpio.gz" | cut -f1)"
echo "    Initramfs: $INITRD_SIZE"

cat > "$ISO_WORK/boot/grub/grub.cfg" << 'EOF'
set default=0
set timeout=0
set timeout_style=hidden

insmod all_video
insmod vbe
insmod gfxterm
set gfxmode=1024x768x32,1280x720x32,800x600x32,1024x768x16,800x600x16,auto
terminal_output gfxterm

menuentry "OkamaOS (GUI default)" {
    set gfxpayload=keep
    linux  /boot/bzImage rw quiet loglevel=3 console=tty1 console=ttyS0,115200 earlyprintk=serial,ttyS0,115200 rdinit=/sbin/init rd.systemd.show_status=false vt.global_cursor_default=0
    initrd /boot/rootfs.cpio.gz
}

menuentry "OkamaOS (safe graphics)" {
    set gfxpayload=800x600x32
    linux  /boot/bzImage rw quiet loglevel=3 console=tty1 console=ttyS0,115200 earlyprintk=serial,ttyS0,115200 rdinit=/sbin/init rd.systemd.show_status=false vt.global_cursor_default=0 nomodeset video=vesafb:mtrr:3
    initrd /boot/rootfs.cpio.gz
}

menuentry "OkamaOS (debug - verbose)" {
    set gfxpayload=keep
    linux  /boot/bzImage rw loglevel=7 console=tty1 console=ttyS0,115200 earlyprintk=serial,ttyS0,115200 rdinit=/sbin/init vt.global_cursor_default=0
    initrd /boot/rootfs.cpio.gz
}
EOF

echo ">>> Running grub-mkrescue..."
grub-mkrescue -o "$OUTPUT_ISO" "$ISO_WORK" -- -volid OkamaOS

echo ">>> ISO created: $OUTPUT_ISO"
ls -lh "$OUTPUT_ISO"

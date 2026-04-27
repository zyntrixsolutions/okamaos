#!/usr/bin/env bash
# Flash a built OkamaOS image to a USB drive or SD card.
# DANGEROUS: writes directly to a block device.
#
# Usage: tools/flash-image.sh <rootfs.img> <device>
# Example: tools/flash-image.sh output/images/rootfs.ext4 /dev/sdb
set -euo pipefail

IMAGE="${1:-}"
DEVICE="${2:-}"

if [ -z "$IMAGE" ] || [ -z "$DEVICE" ]; then
    echo "Usage: $0 <image_file> <target_device>"
    echo "Example: $0 output/images/rootfs.ext4 /dev/sdb"
    exit 1
fi

if [ ! -f "$IMAGE" ]; then
    echo "ERROR: image not found: $IMAGE"
    exit 1
fi

if [ ! -b "$DEVICE" ]; then
    echo "ERROR: not a block device: $DEVICE"
    exit 1
fi

echo "WARNING: This will ERASE all data on $DEVICE"
echo "Image : $IMAGE  ($(du -h "$IMAGE" | cut -f1))"
echo "Target: $DEVICE"
read -rp "Type YES to confirm: " CONFIRM

if [ "$CONFIRM" != "YES" ]; then
    echo "Aborted."
    exit 1
fi

echo "Flashing..."
dd if="$IMAGE" of="$DEVICE" bs=4M status=progress conv=fsync
sync
echo "Flash complete. Eject $DEVICE safely."

#!/usr/bin/env bash
# Buildroot post-image hook. Assembles bootable ISO from kernel + rootfs.
set -euo pipefail

IMAGES_DIR="$1"
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"

echo ">> okamaos post-image: $IMAGES_DIR"
ls -lh "$IMAGES_DIR" || true

# Generate bootable ISO if xorriso/genisoimage is available
if command -v xorriso &> /dev/null || command -v genisoimage &> /dev/null; then
    "$SCRIPT_DIR/gen-iso.sh" "$IMAGES_DIR" "$IMAGES_DIR/../okamaos.iso"
else
    echo ">> WARNING: xorriso/genisoimage not found, skipping ISO generation"
    echo ">> Install: sudo apt-get install xorriso"
fi

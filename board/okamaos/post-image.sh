#!/usr/bin/env bash
# Buildroot post-image hook. Assembles the bootable OkamaOS ISO after
# Buildroot has emitted the kernel and root filesystem images.
set -euo pipefail

IMAGES_DIR="$(realpath "$1")"
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
OUTPUT_ISO="$(realpath -m "$IMAGES_DIR/../okamaos.iso")"

echo ">> okamaos post-image: $IMAGES_DIR"
ls -lh "$IMAGES_DIR" || true

"$SCRIPT_DIR/gen-iso.sh" "$IMAGES_DIR" "$OUTPUT_ISO"

# Keep a copy beside the Buildroot image set for tools that scan
# output/images, while keeping output/okamaos.iso as the canonical artifact.
cp -f "$OUTPUT_ISO" "$IMAGES_DIR/okamaos.iso"
echo ">> okamaos post-image: canonical ISO $OUTPUT_ISO"

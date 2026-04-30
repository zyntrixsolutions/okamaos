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

# Keep a single ISO artifact in output/ so operators do not have to guess
# which image is current.
rm -f "$IMAGES_DIR/okamaos.iso"
echo ">> okamaos post-image: canonical ISO $OUTPUT_ISO"

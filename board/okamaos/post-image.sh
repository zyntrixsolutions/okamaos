#!/usr/bin/env bash
# Buildroot post-image hook. Used to assemble bootable artifacts (e.g. a
# bootable ISO via syslinux/isolinux) once the rootfs.ext4 and bzImage are
# in place. For the MVP we simply log artifact sizes so CI can flag bloat.
set -euo pipefail

IMAGES_DIR="$1"

echo ">> okamaos post-image: $IMAGES_DIR"
ls -lh "$IMAGES_DIR" || true

# TODO(v1): build a hybrid USB/ISO image with isolinux that boots straight
# into the okama-shell with a branded splash and no boot menu. Today we just
# emit kernel + rootfs and let `make okamaos-run-qemu` glue them together.

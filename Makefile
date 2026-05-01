# OkamaOS root Makefile
#
# This Makefile drives both host-side tooling (naming check, packaging the
# demo, memory tests, controller tests) and the Buildroot integration that
# produces a bootable OkamaOS image.
#
# Buildroot is treated as an external tree. We expect it under ./buildroot
# (cloned by `make setup`). Our defconfig lives in configs/ and our board
# files live under board/okamaos/.

SHELL              := /bin/bash
TOPDIR             := $(CURDIR)
BR_DIR             ?= $(TOPDIR)/buildroot
BR_VERSION         ?= 2024.02.10
BR_GIT             ?= https://github.com/buildroot/buildroot.git
BR_OUTPUT          ?= $(TOPDIR)/output
DEFCONFIG          ?= okamaos_x86_64_defconfig
BUILD_DIR          ?= $(TOPDIR)/build

OK_CLI             := $(TOPDIR)/usr/bin/okama-cli
OK_PACK            := $(TOPDIR)/usr/bin/okama-pack

QEMU               ?= qemu-system-x86_64
QEMU_RAM_MB        ?= 2048
QEMU_KERNEL        ?= $(BR_OUTPUT)/images/bzImage
QEMU_ROOTFS        ?= $(BR_OUTPUT)/images/rootfs.ext4

.PHONY: help setup buildroot okamaos-build okamaos-run-qemu okamaos-clean \
        package-demo memory-test controller-test naming-check defconfig \
        all clean

help:
	@echo "OkamaOS build targets:"
	@echo "  make setup            - clone Buildroot $(BR_VERSION) into ./buildroot"
	@echo "  make buildroot        - configure Buildroot with $(DEFCONFIG)"
	@echo "  make okamaos-build    - build the full OkamaOS image"
	@echo "  make okamaos-run-qemu - boot the built image in QEMU"
	@echo "  make okamaos-clean    - clean Buildroot output"
	@echo "  make package-demo     - build games/demo into a .ok package"
	@echo "  make memory-test      - run tools/measure-memory.sh"
	@echo "  make controller-test  - run tools/controller-test.sh"
	@echo "  make naming-check     - fail if 'akama' appears anywhere"

all: naming-check package-demo

setup:
	@if [ ! -d "$(BR_DIR)" ]; then \
	    echo ">> cloning Buildroot $(BR_VERSION) into $(BR_DIR)"; \
	    git clone --depth 1 --branch $(BR_VERSION) $(BR_GIT) $(BR_DIR); \
	else \
	    echo ">> Buildroot already present at $(BR_DIR)"; \
	fi
	@mkdir -p $(BUILD_DIR) $(BR_OUTPUT)

defconfig: setup
	@cp $(TOPDIR)/configs/$(DEFCONFIG) $(BR_DIR)/configs/$(DEFCONFIG)
	$(MAKE) -C $(BR_DIR) O=$(BR_OUTPUT) BR2_EXTERNAL=$(TOPDIR) $(DEFCONFIG)

buildroot: defconfig

okamaos-build: defconfig
	$(MAKE) -C $(BR_DIR) O=$(BR_OUTPUT) BR2_EXTERNAL=$(TOPDIR)

okamaos-run-qemu:
	@test -f $(QEMU_KERNEL) || (echo "missing kernel: $(QEMU_KERNEL); run make okamaos-build" && exit 1)
	@test -f $(QEMU_ROOTFS) || (echo "missing rootfs: $(QEMU_ROOTFS); run make okamaos-build" && exit 1)
	$(QEMU) -m $(QEMU_RAM_MB) -smp 2 \
	    -kernel $(QEMU_KERNEL) \
	    -drive file=$(QEMU_ROOTFS),if=virtio,format=raw \
	    -append "root=/dev/vda rw rootwait quiet loglevel=0 console=ttyS0,115200 console=tty1 vt.global_cursor_default=0 nomodeset vga=788 video=vesafb:mtrr:3" \
	    -nic user,model=virtio-net-pci \
	    -device usb-ehci -device usb-kbd -device usb-mouse \
	    -vga std -serial mon:stdio

okamaos-clean:
	$(MAKE) -C $(BR_DIR) O=$(BR_OUTPUT) clean || true
	rm -rf $(BUILD_DIR)

package-demo:
	@mkdir -p $(BUILD_DIR)
	OKAMA_CONF=$(TOPDIR)/board/okamaos/rootfs-overlay/etc/okamaos/okama.conf \
	    $(OK_PACK) build $(TOPDIR)/games/demo --output $(BUILD_DIR)/demo.ok
	@echo ">> built $(BUILD_DIR)/demo.ok"

memory-test:
	@bash $(TOPDIR)/tools/measure-memory.sh

controller-test:
	@bash $(TOPDIR)/tools/controller-test.sh

naming-check:
	@bash $(TOPDIR)/tools/check-naming.sh

clean: okamaos-clean

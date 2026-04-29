################################################################################
# okama-runtime
#
# Installs all OkamaOS userland binaries (Python scripts) and the okamaos
# Python library into the target rootfs. Source lives in the BR2_EXTERNAL
# tree under usr/bin and usr/lib/okamaos.
################################################################################

OKAMA_RUNTIME_VERSION = 0.1.1
OKAMA_RUNTIME_SOURCE =
# No SITE/SITE_METHOD — this is an install-only meta-package that copies files directly
OKAMA_RUNTIME_LICENSE = Proprietary
OKAMA_RUNTIME_DEPENDENCIES = python3 python-pip sdl2

define OKAMA_RUNTIME_INSTALL_PYGAME_CMDS
	# pygame dropped from Buildroot 2024.02 — install from PyPI into target
	$(HOST_DIR)/bin/pip3 install --target=$(TARGET_DIR)/usr/lib/python3/dist-packages \
		--no-deps --ignore-requires-python pygame==2.5.2 || true
endef

OKAMA_RUNTIME_POST_INSTALL_TARGET_HOOKS += OKAMA_RUNTIME_INSTALL_PYGAME_CMDS

define OKAMA_RUNTIME_INSTALL_TARGET_CMDS
	mkdir -p $(TARGET_DIR)/usr/bin
	mkdir -p $(TARGET_DIR)/usr/lib/okamaos
	mkdir -p $(TARGET_DIR)/usr/share/okamaos
	mkdir -p $(TARGET_DIR)/var/okamaos/games
	mkdir -p $(TARGET_DIR)/var/okamaos/saves
	mkdir -p $(TARGET_DIR)/var/okamaos/logs
	mkdir -p $(TARGET_DIR)/var/okamaos/cache
	mkdir -p $(TARGET_DIR)/var/okamaos/controllers
	mkdir -p $(TARGET_DIR)/var/okamaos/updates
	cp -a $(BR2_EXTERNAL_OKAMAOS_PATH)/usr/bin/. $(TARGET_DIR)/usr/bin/
	cp -a $(BR2_EXTERNAL_OKAMAOS_PATH)/usr/lib/okamaos/. $(TARGET_DIR)/usr/lib/okamaos/
	cp -a $(BR2_EXTERNAL_OKAMAOS_PATH)/usr/share/okamaos/. $(TARGET_DIR)/usr/share/okamaos/ 2>/dev/null || true
	chmod 0755 $(TARGET_DIR)/usr/bin/okama-*
	# games dir + lib must be root-owned executable
	chmod 0755 $(TARGET_DIR)/usr/lib/okamaos/*.py 2>/dev/null || true
endef

$(eval $(generic-package))

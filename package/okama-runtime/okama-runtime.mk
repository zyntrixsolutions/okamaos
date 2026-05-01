################################################################################
# okama-runtime
#
# Installs all OkamaOS userland binaries (Python scripts) and the okamaos
# Python library into the target rootfs. Source lives in the BR2_EXTERNAL
# tree under usr/bin and usr/lib/okamaos.
################################################################################

OKAMA_RUNTIME_VERSION = 1.1.1
OKAMA_RUNTIME_SOURCE =
# No SITE/SITE_METHOD — this is an install-only meta-package that copies files directly
OKAMA_RUNTIME_LICENSE = Proprietary
OKAMA_RUNTIME_DEPENDENCIES = python3 python-pip sdl2


define OKAMA_RUNTIME_INSTALL_TARGET_CMDS
	mkdir -p $(TARGET_DIR)/usr/bin
	mkdir -p $(TARGET_DIR)/usr/lib/okamaos
	mkdir -p $(TARGET_DIR)/etc/okamaos
	mkdir -p $(TARGET_DIR)/usr/share/okamaos
	mkdir -p $(TARGET_DIR)/var/okamaos/games
	mkdir -p $(TARGET_DIR)/var/okamaos/saves
	mkdir -p $(TARGET_DIR)/var/okamaos/logs
	mkdir -p $(TARGET_DIR)/var/okamaos/cache
	mkdir -p $(TARGET_DIR)/var/okamaos/controllers
	mkdir -p $(TARGET_DIR)/var/okamaos/downloads
	mkdir -p $(TARGET_DIR)/var/okamaos/updates
	mkdir -p $(TARGET_DIR)/var/okamaos/updates/backups
	mkdir -p $(TARGET_DIR)/var/okamaos/updates/downloads
	mkdir -p $(TARGET_DIR)/var/okamaos/updates/game-backups
	mkdir -p $(TARGET_DIR)/var/okamaos/updates/history
	mkdir -p $(TARGET_DIR)/boot/okamaos
	cp -a $(BR2_EXTERNAL_OKAMAOS_PATH)/usr/bin/. $(TARGET_DIR)/usr/bin/
	cp -a $(BR2_EXTERNAL_OKAMAOS_PATH)/usr/lib/okamaos/. $(TARGET_DIR)/usr/lib/okamaos/
	cp -f $(BR2_EXTERNAL_OKAMAOS_PATH)/VERSION $(TARGET_DIR)/usr/lib/okamaos/VERSION
	cp -f $(BR2_EXTERNAL_OKAMAOS_PATH)/VERSION $(TARGET_DIR)/etc/okamaos/VERSION
	cp -a $(BR2_EXTERNAL_OKAMAOS_PATH)/usr/share/okamaos/. $(TARGET_DIR)/usr/share/okamaos/ 2>/dev/null || true
	chmod 0755 $(TARGET_DIR)/usr/bin/okama-*
	# games dir + lib must be root-owned executable
	chmod 0755 $(TARGET_DIR)/usr/lib/okamaos/*.py 2>/dev/null || true
endef

$(eval $(generic-package))

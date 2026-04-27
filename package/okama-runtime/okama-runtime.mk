################################################################################
# okama-runtime
#
# Installs all OkamaOS userland binaries (Python scripts) and the okamaos
# Python library into the target rootfs. Source lives in the BR2_EXTERNAL
# tree under usr/bin and usr/lib/okamaos.
################################################################################

OKAMA_RUNTIME_VERSION = 0.1.0
OKAMA_RUNTIME_SITE = $(BR2_EXTERNAL_OKAMAOS_PATH)
OKAMA_RUNTIME_SITE_METHOD = local
OKAMA_RUNTIME_LICENSE = Proprietary
OKAMA_RUNTIME_DEPENDENCIES = python3

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
endef

$(eval $(generic-package))

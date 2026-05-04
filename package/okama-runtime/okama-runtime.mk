################################################################################
# okama-runtime
#
# Installs all OkamaOS userland binaries (Python scripts) and the okamaos
# Python library into the target rootfs. Source lives in the BR2_EXTERNAL
# tree under usr/bin and usr/lib/okamaos.
################################################################################

OKAMA_RUNTIME_VERSION = 2.2.2
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
	# Install wallet Python dependencies into the target rootfs.
	# Detects the site-packages path at install time via shell glob.
	PY_SITE=$$(ls -d $(TARGET_DIR)/usr/lib/python3.*/site-packages 2>/dev/null | head -1); \
	[ -z "$$PY_SITE" ] && PY_SITE="$(TARGET_DIR)/usr/lib/python$(PYTHON3_VERSION_MAJOR)/site-packages"; \
	mkdir -p "$$PY_SITE"; \
	$(HOST_DIR)/bin/pip3 install --no-cache-dir --target="$$PY_SITE" \
		eth-account==0.13.5 mnemonic==0.21 argon2-cffi==23.1.0 2>/dev/null || \
	$(HOST_DIR)/bin/pip3 install --no-cache-dir --target="$$PY_SITE" \
		eth-account mnemonic argon2-cffi 2>/dev/null || true
endef

$(eval $(generic-package))

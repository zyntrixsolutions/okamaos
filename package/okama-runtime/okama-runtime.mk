################################################################################
# okama-runtime
#
# Installs all OkamaOS userland binaries (Python scripts) and the okamaos
# Python library into the target rootfs. Source lives in the BR2_EXTERNAL
# tree under usr/bin and usr/lib/okamaos.
################################################################################

OKAMA_RUNTIME_VERSION = 2.0.2
OKAMA_RUNTIME_SOURCE =
# No SITE/SITE_METHOD — this is an install-only meta-package that copies files directly
OKAMA_RUNTIME_LICENSE = Proprietary
OKAMA_RUNTIME_DEPENDENCIES = python3 python-pip sdl2 sdl2_image sdl2_mixer sdl2_ttf

define OKAMA_RUNTIME_INSTALL_PYGAME_CMDS
	# pygame dropped from Buildroot 2024.02 — install from PyPI into target
	rm -rf $(TARGET_DIR)/usr/lib/python3.11/site-packages/pygame \
		$(TARGET_DIR)/usr/lib/python3.11/site-packages/pygame.libs \
		$(TARGET_DIR)/usr/lib/python3.11/site-packages/pygame-*.data \
		$(TARGET_DIR)/usr/lib/python3.11/site-packages/pygame-*.dist-info
	rm -rf $(@D)/pygame-wheel
	mkdir -p $(@D)/pygame-wheel $(TARGET_DIR)/usr/lib/python3.11/site-packages
	python3 -m pip download --dest $(@D)/pygame-wheel \
		--only-binary=:all: --no-deps --implementation cp \
		--python-version 311 --abi cp311 --platform manylinux_2_17_x86_64 \
		pygame==2.6.1
	unzip -oq $(@D)/pygame-wheel/pygame-2.6.1-cp311-*.whl \
		-d $(TARGET_DIR)/usr/lib/python3.11/site-packages
	# Pygame wheels bundle SDL2 without OkamaOS' KMSDRM backend. Keep the
	# Python modules from the wheel, but bind SDL runtime libraries to the
	# Buildroot SDL2 stack configured for direct GUI boot. The bundled ttf
	# library is also replaced because some VM/live-boot loaders reject the
	# manylinux wheel's ELF segment layout during pygame.font initialization.
	if [ -d "$(TARGET_DIR)/usr/lib/python3.11/site-packages/pygame.libs" ]; then \
		rm -f $(TARGET_DIR)/usr/lib/python3.11/site-packages/pygame.libs/libSDL2-2-*.so*; \
		ln -sf ../../../libSDL2-2.0.so.0 \
			$(TARGET_DIR)/usr/lib/python3.11/site-packages/pygame.libs/libSDL2-2-1667c208.0.so.0.2800.4; \
		rm -f $(TARGET_DIR)/usr/lib/python3.11/site-packages/pygame.libs/libSDL2_image-2-*.so*; \
		ln -sf ../../../libSDL2_image-2.0.so.0 \
			$(TARGET_DIR)/usr/lib/python3.11/site-packages/pygame.libs/libSDL2_image-2-6bbdaa8d.0.so.0.2.3; \
		rm -f $(TARGET_DIR)/usr/lib/python3.11/site-packages/pygame.libs/libSDL2_mixer-2-*.so*; \
		ln -sf ../../../libSDL2_mixer-2.0.so.0 \
			$(TARGET_DIR)/usr/lib/python3.11/site-packages/pygame.libs/libSDL2_mixer-2-673d03d7.0.so.0.600.3; \
		rm -f $(TARGET_DIR)/usr/lib/python3.11/site-packages/pygame.libs/libSDL2_ttf-2-*.so*; \
		ln -sf ../../../libSDL2_ttf-2.0.so.0 \
			$(TARGET_DIR)/usr/lib/python3.11/site-packages/pygame.libs/libSDL2_ttf-2-e6bdbc24.0.so.0.2000.1; \
		for lib in $(TARGET_DIR)/usr/lib/python3.11/site-packages/pygame.libs/*.so*; do \
			ln -sf python3.11/site-packages/pygame.libs/$$(basename $$lib) \
				$(TARGET_DIR)/usr/lib/$$(basename $$lib); \
		done; \
	fi
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

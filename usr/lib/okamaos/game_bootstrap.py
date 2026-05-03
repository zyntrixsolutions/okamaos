"""Runtime bootstrap for OkamaOS pygame games.

Imported by okama-run before a game's entrypoint. It keeps plain pygame games
that call ``pygame.display.set_mode()`` and ``pygame.display.flip()`` visible on
framebuffer/offscreen boots by mirroring frames to /dev/fb0.
"""

from __future__ import annotations

import os
import time


def _enabled() -> bool:
    return os.environ.get("GAME_AUTO_FB_PRESENT", os.environ.get("OKAMA_GAME_AUTO_FB_PRESENT", "yes")).lower() != "no"


def _touch_heartbeat() -> None:
    path = os.environ.get("OKAMA_GAME_HEARTBEAT", "")
    if not path:
        return
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(str(time.time()))
    except OSError:
        pass


def install() -> None:
    if not _enabled():
        return
    try:
        import pygame
        from okamaos.display import FbWriter
    except Exception:
        return

    display = pygame.display
    if getattr(display, "_okama_bootstrap_installed", False):
        return

    original_set_mode = display.set_mode
    original_flip = display.flip
    original_update = display.update
    original_quit = display.quit
    fb = {"writer": None}

    def _ensure_writer():
        if fb["writer"] is not None:
            return fb["writer"]
        fb_dev = (
            os.environ.get("OKAMA_FRAMEBUFFER_DEVICE")
            or os.environ.get("SDL_FBDEV")
            or "/dev/fb0"
        )
        if os.environ.get("SDL_VIDEODRIVER") != "offscreen" or not os.path.exists(fb_dev):
            return None
        try:
            fb["writer"] = FbWriter(fb_dev)
        except Exception as exc:
            print(f"WARNING: OkamaOS framebuffer bootstrap disabled: {exc}")
            fb["writer"] = False
        return fb["writer"] if fb["writer"] is not False else None

    def _present():
        _touch_heartbeat()
        writer = _ensure_writer()
        if writer is None:
            return
        surface = display.get_surface()
        if surface is not None:
            writer.present(pygame, surface)

    def set_mode(*args, **kwargs):
        surface = original_set_mode(*args, **kwargs)
        _ensure_writer()
        return surface

    def flip(*args, **kwargs):
        _present()
        return original_flip(*args, **kwargs)

    def update(*args, **kwargs):
        _present()
        return original_update(*args, **kwargs)

    def quit(*args, **kwargs):
        writer = fb.get("writer")
        if writer not in (None, False):
            try:
                writer.close()
            except Exception:
                pass
        fb["writer"] = None
        return original_quit(*args, **kwargs)

    display.set_mode = set_mode
    display.flip = flip
    display.update = update
    display.quit = quit
    display._okama_bootstrap_installed = True


install()

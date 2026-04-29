"""Display helpers for OkamaOS pygame games.

The pygame wheel used by the MVP bundles SDL2 without a usable kmsdrm backend
on several VM/host setups.  Games therefore need the same fallback path as the
shell: render to SDL's offscreen surface, then blit frames to /dev/fb0.
"""

from __future__ import annotations

import os
import sys


class FbWriter:
    """Write pygame surfaces directly to the Linux framebuffer."""

    FBIOGET_VSCREENINFO = 0x4600
    FBIOGET_FSCREENINFO = 0x4602

    def __init__(self, fb_path: str = "/dev/fb0"):
        import fcntl
        import mmap
        import struct

        with open(fb_path, "rb+") as probe:
            vbuf = bytearray(160)
            fcntl.ioctl(probe, self.FBIOGET_VSCREENINFO, vbuf)
            self.w = struct.unpack_from("=I", vbuf, 0)[0]
            self.h = struct.unpack_from("=I", vbuf, 4)[0]
            self.bpp = struct.unpack_from("=I", vbuf, 24)[0]
            red_off = struct.unpack_from("=I", vbuf, 32)[0]
            blue_off = struct.unpack_from("=I", vbuf, 48)[0]

            fbuf = bytearray(68)
            fcntl.ioctl(probe, self.FBIOGET_FSCREENINFO, fbuf)
            self.stride = struct.unpack_from("=I", fbuf, 32)[0]

        if self.bpp == 32:
            self._fmt = "BGRX" if blue_off == 0 else "RGBX"
        elif self.bpp == 24:
            self._fmt = "BGR" if blue_off == 0 else "RGB"
        else:
            self._fmt = "RGB"

        if self.w == 0 or self.h == 0:
            self.w, self.h = 1280, 720
        if self.stride == 0:
            self.stride = self.w * (self.bpp // 8)

        self._fb = open(fb_path, "rb+")
        self._mm = mmap.mmap(self._fb.fileno(), self.stride * self.h)
        self._ok = True

    def present(self, pygame, surface) -> None:
        if not self._ok:
            return
        try:
            if (surface.get_width(), surface.get_height()) != (self.w, self.h):
                surface = pygame.transform.scale(surface, (self.w, self.h))
            raw = pygame.image.tostring(surface, self._fmt)
            row_bytes = self.w * (self.bpp // 8)
            if self.stride == row_bytes:
                self._mm.seek(0)
                self._mm.write(raw)
            else:
                for y in range(self.h):
                    src = y * row_bytes
                    self._mm.seek(y * self.stride)
                    self._mm.write(raw[src:src + row_bytes])
        except Exception as exc:
            print(f"WARNING: framebuffer present failed: {exc}", file=sys.stderr)
            self._ok = False

    def close(self) -> None:
        try:
            self._mm.close()
            self._fb.close()
        except Exception:
            pass


class DisplayHandle:
    def __init__(self, pygame, fb: FbWriter | None = None):
        self._pygame = pygame
        self._fb = fb

    def flip(self, surface=None) -> None:
        if surface is None:
            surface = self._pygame.display.get_surface()
        if self._fb is not None and surface is not None:
            self._fb.present(self._pygame, surface)
        self._pygame.display.flip()

    def close(self) -> None:
        if self._fb is not None:
            self._fb.close()


def _driver_candidates() -> list[str]:
    explicit = os.environ.get("SDL_VIDEODRIVER")
    candidates = []
    if explicit:
        candidates.append(explicit)
    if os.environ.get("DISPLAY"):
        candidates.append("x11")
    if os.environ.get("WAYLAND_DISPLAY"):
        candidates.append("wayland")
    if os.environ.get("OKAMA_ALLOW_KMSDRM") == "yes" and (
        os.path.exists("/dev/dri/card0") or os.path.exists("/dev/dri/card1")
    ):
        candidates.append("kmsdrm")
    candidates.extend(["offscreen", "dummy"])

    seen = set()
    result = []
    for drv in candidates:
        if drv not in seen:
            seen.add(drv)
            result.append(drv)
    return result


def open_display(pygame, width: int, height: int, flags: int, caption: str = ""):
    """Open a pygame display with framebuffer fallback.

    Returns ``(screen, display_handle)``.  Call ``display_handle.flip(screen)``
    instead of ``pygame.display.flip()`` so offscreen frames are copied to fb0.
    """
    fb_dev = os.environ.get("OKAMA_FRAMEBUFFER_DEVICE") or os.environ.get("SDL_FBDEV") or "/dev/fb0"
    last_err = ""

    for drv in _driver_candidates():
        os.environ["SDL_VIDEODRIVER"] = drv
        if drv == "offscreen":
            os.environ["SDL_FBDEV"] = fb_dev
        try:
            pygame.display.quit()
            pygame.display.init()
            mode_flags = 0 if drv in ("offscreen", "dummy") else flags
            screen = pygame.display.set_mode((width, height), mode_flags)
            if caption:
                pygame.display.set_caption(caption)
            fb = None
            if drv == "offscreen" and os.path.exists(fb_dev):
                try:
                    fb = FbWriter(fb_dev)
                except Exception as exc:
                    print(f"WARNING: framebuffer disabled: {exc}", file=sys.stderr)
            print(f"OkamaOS display driver: {drv}", file=sys.stderr)
            return screen, DisplayHandle(pygame, fb)
        except Exception as exc:
            last_err = f"{drv}: {exc}"
            print(f"SDL driver '{drv}' failed: {exc}", file=sys.stderr)

    raise RuntimeError(f"no usable SDL display driver ({last_err})")

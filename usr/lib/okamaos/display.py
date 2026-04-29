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
            self.vw = struct.unpack_from("=I", vbuf, 8)[0]
            self.vh = struct.unpack_from("=I", vbuf, 12)[0]
            self.xoff = struct.unpack_from("=I", vbuf, 16)[0]
            self.yoff = struct.unpack_from("=I", vbuf, 20)[0]
            self.bpp = struct.unpack_from("=I", vbuf, 24)[0]
            red_off = struct.unpack_from("=I", vbuf, 32)[0]
            red_len = struct.unpack_from("=I", vbuf, 36)[0]
            green_off = struct.unpack_from("=I", vbuf, 40)[0]
            green_len = struct.unpack_from("=I", vbuf, 44)[0]
            blue_off = struct.unpack_from("=I", vbuf, 48)[0]
            blue_len = struct.unpack_from("=I", vbuf, 52)[0]

            fbuf = bytearray(68)
            fcntl.ioctl(probe, self.FBIOGET_FSCREENINFO, fbuf)
            self.mem_len = struct.unpack_from("=I", fbuf, 20)[0]
            self.stride = struct.unpack_from("=I", fbuf, 32)[0]

        self.bytes_pp = max(1, self.bpp // 8)
        if self.bpp == 32:
            self._fmt = "BGRX" if blue_off == 0 else "RGBX"
            self._packed = False
        elif self.bpp == 24:
            self._fmt = "BGR" if blue_off == 0 else "RGB"
            self._packed = False
        elif self.bpp in (15, 16):
            if not (red_len and green_len and blue_len):
                red_len, green_len, blue_len = (5, 6, 5) if self.bpp == 16 else (5, 5, 5)
            self._fmt = "RGB"
            self._packed = True
            self._chan = (
                (red_off, red_len, 8 - red_len),
                (green_off, green_len, 8 - green_len),
                (blue_off, blue_len, 8 - blue_len),
            )
        else:
            raise RuntimeError(f"unsupported framebuffer depth: {self.bpp} bpp")

        if self.w == 0 or self.h == 0:
            self.w, self.h = 1280, 720
        if self.vw == 0:
            self.vw = self.w
        if self.vh == 0:
            self.vh = self.h
        if self.stride == 0:
            self.stride = self.w * self.bytes_pp

        self._fb = open(fb_path, "rb+")
        map_len = self.mem_len or (self.stride * self.h)
        self._mm = mmap.mmap(self._fb.fileno(), map_len)
        self._base_offset = self.yoff * self.stride + self.xoff * self.bytes_pp
        self._ok = True

    def _pack_rgb(self, pygame, surface) -> bytes:
        raw = pygame.image.tostring(surface, "RGB")
        out = bytearray(self.w * self.h * self.bytes_pp)
        red, green, blue = self._chan
        ri = 0
        oi = 0
        for _ in range(self.w * self.h):
            pixel = 0
            for value, channel in ((raw[ri], red), (raw[ri + 1], green), (raw[ri + 2], blue)):
                off, bits, drop = channel
                if drop >= 0:
                    value >>= drop
                else:
                    value <<= -drop
                pixel |= (value & ((1 << bits) - 1)) << off
            for byte_idx in range(self.bytes_pp):
                out[oi + byte_idx] = (pixel >> (byte_idx * 8)) & 0xff
            ri += 3
            oi += self.bytes_pp
        return bytes(out)

    def present(self, pygame, surface) -> None:
        if not self._ok:
            return
        try:
            if (surface.get_width(), surface.get_height()) != (self.w, self.h):
                surface = pygame.transform.scale(surface, (self.w, self.h))
            raw = self._pack_rgb(pygame, surface) if self._packed else pygame.image.tostring(surface, self._fmt)
            row_bytes = self.w * self.bytes_pp
            if self.stride == row_bytes:
                self._mm.seek(self._base_offset)
                self._mm.write(raw)
            else:
                for y in range(self.h):
                    src = y * row_bytes
                    self._mm.seek(self._base_offset + y * self.stride)
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

#!/usr/bin/env python3
"""Host-side boot readiness checks for OkamaOS release builds."""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class CheckRunner:
    def __init__(self) -> None:
        self.failures: list[str] = []

    def ok(self, message: str) -> None:
        print(f"OK   {message}")

    def fail(self, message: str) -> None:
        print(f"FAIL {message}")
        self.failures.append(message)

    def require(self, condition: bool, message: str) -> None:
        if condition:
            self.ok(message)
        else:
            self.fail(message)


def read_text(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def read_version() -> str:
    version = read_text("VERSION").strip()
    if not re.fullmatch(r"\d+\.\d+\.\d+", version):
        raise ValueError(f"VERSION must be semantic x.y.z, got {version!r}")
    return version


def contains(path: str, needle: str) -> bool:
    return needle in read_text(path)


def file_is_executable(path: str) -> bool:
    return os.access(ROOT / path, os.X_OK)


def check_versions(runner: CheckRunner, version: str) -> None:
    exact_files = {
        "package/okama-runtime/VERSION": version,
    }
    for path, expected in exact_files.items():
        runner.require(read_text(path).strip() == expected,
                       f"{path} tracks VERSION {version}")

    version_markers = {
        "package/okama-runtime/okama-runtime.mk":
            f"OKAMA_RUNTIME_VERSION = {version}",
        "usr/lib/okamaos/__init__.py":
            f'VERSION = "{version}"',
        "usr/lib/okamaos/config.py":
            f'"VERSION": "{version}"',
        "board/okamaos/rootfs-overlay/etc/okamaos/okama.conf":
            f"VERSION={version}",
        "board/okamaos/rootfs-overlay/etc/profile":
            f'OKAMAOS_VERSION="{version}"',
        "board/okamaos/rootfs-overlay/etc/init.d/S01okama-boot-splash":
            f"Booting OkamaOS {version}",
        "usr/bin/okama-install":
            f'VERSION="{version}"',
        "usr/bin/okama-shell":
            f"OkamaOS v{version}",
    }
    for path, marker in version_markers.items():
        runner.require(contains(path, marker), f"{path} contains {marker}")


def check_runtime_packaging(runner: CheckRunner) -> None:
    recipe = "package/okama-runtime/okama-runtime.mk"
    defconfig = "configs/okamaos_x86_64_defconfig"
    for dependency in ("sdl2", "sdl2_image", "sdl2_mixer", "sdl2_ttf"):
        runner.require(contains(recipe, dependency),
                       f"okama-runtime depends on {dependency}")
    runner.require(contains(recipe, "libSDL2_ttf-2-e6bdbc24.0.so.0.2000.1"),
                   "pygame bundled SDL2_ttf name is rebound")
    runner.require(contains(recipe, "../../../libSDL2_ttf-2.0.so.0"),
                   "pygame SDL2_ttf resolves to Buildroot library")
    for option in (
        "BR2_PACKAGE_SDL2_TTF=y",
        "BR2_PACKAGE_SDL2_KMSDRM=y",
        "BR2_PACKAGE_MESA3D_GALLIUM_DRIVER_SWRAST=y",
    ):
        runner.require(contains(defconfig, option), f"defconfig enables {option}")


def check_startup_scripts(runner: CheckRunner) -> None:
    init_scripts = (
        "S01okama-boot-splash",
        "S10okama-mounts",
        "S20okama-devices",
        "S25okama-bluetooth",
        "S30okama-inputd",
        "S35okama-audio",
        "S40okama-network",
        "S99okama-shell",
    )
    for name in init_scripts:
        path = f"board/okamaos/rootfs-overlay/etc/init.d/{name}"
        runner.require((ROOT / path).is_file(), f"{name} is present")
        runner.require(file_is_executable(path), f"{name} is executable")

    for path in sorted((ROOT / "usr/bin").glob("okama-*")):
        runner.require(os.access(path, os.X_OK),
                       f"{path.relative_to(ROOT)} is executable")


def check_shell_and_game_runtime(runner: CheckRunner) -> None:
    shell = "usr/bin/okama-shell"
    run = "usr/bin/okama-run"
    runner.require(contains(shell, "PYGAME_HIDE_SUPPORT_PROMPT"),
                   "shell hides pygame startup banner")
    runner.require(contains(shell, "pygame.display.init()"),
                   "shell initializes display without initializing audio")
    runner.require(not contains(shell, "pygame.init()"),
                   "shell avoids full pygame.init audio startup")
    runner.require(contains(shell, "SDL_AUDIODRIVER") and contains(shell, '"dummy"'),
                   "shell uses silent SDL fallback when ALSA is absent")
    runner.require(contains(shell, "MESA_LOADER_DRIVER_OVERRIDE"),
                   "shell pins software Mesa driver for VM startup")
    runner.require(contains(shell, 'ev.get("controller") == -1'),
                   "shell ignores duplicate keyboard fallback controller events")

    runner.require(not contains(run, '"fbcon"'),
                   "game launcher does not force obsolete SDL fbcon driver")
    runner.require(contains(run, '"kmsdrm"'),
                   "game launcher uses SDL2 KMS/DRM video")
    runner.require(contains(run, "select_sdl_audio_driver"),
                   "game launcher chooses ALSA or silent SDL audio")


def main() -> int:
    runner = CheckRunner()
    try:
        version = read_version()
    except ValueError as exc:
        runner.fail(str(exc))
        version = "unknown"

    check_versions(runner, version)
    check_runtime_packaging(runner)
    check_startup_scripts(runner)
    check_shell_and_game_runtime(runner)

    if runner.failures:
        print(f"\nBoot readiness check failed: {len(runner.failures)} issue(s).")
        return 1
    print("\nBoot readiness check passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

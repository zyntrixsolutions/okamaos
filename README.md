# OkamaOS

A controller-first, console-grade Linux OS for low-cost x86_64 PCs, built in
partnership with **OkamaLabs**. OkamaOS boots straight into a fullscreen
controller-driven shell, runs one game at a time, and is designed to feel like
a dedicated console — not a PC.

> Version: **2.0.2 UI Recovery**. Public download and update portal files live in
> `pages/` and deploy through GitHub Pages.

> Status: **Release Candidate**. Full controller/keyboard support, animated cyberpunk UI,
> WiFi/Ethernet status monitoring, Bluetooth plug-and-play, generic HID drivers,
> hard disk installation with EFI support, and a boot-readiness check for release builds.

## v2.0.2 Highlights

- **Cyberpunk Retro UI** — Animated checkered net/fence background with neon accents
- **Full Keyboard + Controller Support** — Navigate with keyboard or any gamepad
- **Network Status** — Real-time WiFi/Ethernet indicators with online/offline status
- **Bluetooth Plug-and-Play** — Auto-pairing agents for seamless wireless controllers
- **Generic HID Drivers** — Support for Logitech, 8bitdo, and generic USB gamepads
- **Update Notifications** — Visual badge when OS/game updates are available
- **EFI Support** — Hard disk installer supports both BIOS and EFI boot
- **Boot Readiness Check** — Release checks validate version, init, and SDL runtime contracts
- **VirtualBox UI Recovery** — Boot shell text rendering avoids the SDL_ttf crash path

## Highlights

- Buildroot-based, x86_64, BusyBox userland
- No desktop, no window manager, no terminal in normal mode
- Controller-first input via `okama-inputd` (USB + Bluetooth via BlueZ)
- `.ok` package format with manifest validation
- One-active-game lifecycle via `okama-run`
- Live-to-disk installation via `okama-install`
- Idle RAM target: **<250MB**
- Parent mode (PIN-gated risky actions) and Developer mode (off by default)
- AI game-creation foundation via `okama-agent` (templates today, LLM later)

## Public portal

The GitHub Pages portal in `pages/` is the public-facing OkamaOS hub for:

- launch marketing and community momentum
- downloadable `.ok` games
- static app catalog metadata
- static update-feed metadata for current and future OS builds
- release notes that non-developers can understand

The included Pages workflow publishes `pages/` as a static site when changes
land on `main`. See `pages/README.md` for catalog and update feed contracts.

## Quick start (host dev, no Buildroot needed for tooling)

```bash
make naming-check        # verify no "akama" misspellings
make boot-readiness-check # verify boot/runtime release contracts
make package-demo        # build games/demo into a .ok file
./usr/bin/okama-cli status
./usr/bin/okama-cli verify build/demo.ok
```

To run the shell on a host with Pygame:

```bash
pip install pygame
PYTHONPATH=usr/lib/okamaos ./usr/bin/okama-shell --windowed
```

## Full build (Buildroot)

See `docs/build-guide.md`. Short version:

```bash
make setup
make buildroot
make okamaos-build
make okamaos-run-qemu
```

Inside a live OkamaOS boot, install to a VM disk or hard drive from developer
mode:

```bash
okama-install --list-disks
okama-install --target /dev/vdX
```

## Repo layout

See the tree in `docs/architecture.md`. Key directories:

- `configs/` — Buildroot defconfig
- `board/okamaos/` — kernel/busybox config, post-build, rootfs overlay
- `package/okama-runtime/` — Buildroot package recipe for OkamaOS userland
- `games/demo/` — reference `.ok` game
- `tools/` — host-side helpers (packing, flashing, memory, naming, controllers)
- `docs/` — architecture, package format, controller, bluetooth, performance,
  AI roadmap, console-grade roadmap, build guide

## Naming

Always **OkamaOS** / **OkamaLabs**. The string `akama` (without the leading "Ok")
must never appear. `make naming-check` enforces this in CI.

## License

TBD by OkamaLabs. Treat as proprietary until specified.

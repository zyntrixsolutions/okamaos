# OkamaOS

A controller-first, console-grade Linux OS for low-cost x86_64 PCs, built in
partnership with **OkamaLabs**. OkamaOS boots straight into a fullscreen
controller-driven shell, runs one game at a time, and is designed to feel like
a dedicated console — not a PC.

> Version: **1.1.0 Cyber Hardware Readiness**. Public download and update portal files live in
> `pages/` and deploy through GitHub Pages.

> Status: **MVP foundation**. Buildable rootfs overlay, working CLI tooling,
> `.ok` package format, demo game, controller daemon stub, and a Pygame-based
> shell. Buildroot integration is wired via `configs/okamaos_x86_64_defconfig`
> and `board/okamaos/`.

## Highlights

- Buildroot-based, x86_64, BusyBox userland
- No desktop, no window manager, no terminal in normal mode
- Full keyboard input plus generic USB/Bluetooth controller input via `okama-inputd`
- Live shell indicators for online state and OS/game update availability
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
make package-demo        # build games/demo into a .ok file
./usr/bin/okama-cli status
./usr/bin/okama-cli network status
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

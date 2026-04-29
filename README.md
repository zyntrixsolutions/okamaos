# OkamaOS

A controller-first, console-grade Linux OS for low-cost x86_64 PCs, built in
partnership with **OkamaLabs**. OkamaOS boots straight into a fullscreen
controller-driven shell, runs one game at a time, and is designed to feel like
a dedicated console — not a PC.

> Status: **MVP foundation**. Buildable rootfs overlay, working CLI tooling,
> `.ok` package format, demo game, controller daemon stub, and a Pygame-based
> shell. Buildroot integration is wired via `configs/okamaos_x86_64_defconfig`
> and `board/okamaos/`.

## Highlights

- Buildroot-based, x86_64, BusyBox userland
- No desktop, no window manager, no terminal in normal mode
- Controller-first input via `okama-inputd` (USB + Bluetooth via BlueZ)
- `.ok` package format with manifest validation
- One-active-game lifecycle via `okama-run`
- Idle RAM target: **<250MB**
- Parent mode (PIN-gated risky actions) and Developer mode (off by default)
- AI game-creation foundation via `okama-agent` (templates today, LLM later)

## Quick start (host dev, no Buildroot needed for tooling)

```bash
make naming-check        # verify no "akama" misspellings
make package-demo        # build games/demo into a .ok file
./usr/bin/okama-cli status
./usr/bin/okama-cli verify build/demo.ok
```

To run the shell on a host with Pygame:

```bash
pip install pygame
PYTHONPATH=usr/lib ./usr/bin/okama-shell --windowed
```

## Full build (Buildroot)

See `docs/build-guide.md`. Short version:

```bash
make setup
make buildroot
make okamaos-build
make okamaos-run-qemu
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

## Technical Partner

OkamaOS is developed in partnership with **Zyntrix Solutions**.

- **Email:** team@zyntrix.solutions  
- **Website:** https://okamaos.zyntrix.solutions
- **Game catalog:** https://zyntrixsolutions.github.io/okamaos-store/catalog.json
- **OS updates:** https://zyntrixsolutions.github.io/okamaos-store/updates/latest.json

## License

TBD by OkamaLabs. Treat as proprietary until specified.

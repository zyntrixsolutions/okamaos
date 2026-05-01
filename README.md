# OkamaOS

A controller-first, console-grade Linux OS for low-cost x86_64 PCs, built in
partnership with **OkamaLabs**. OkamaOS boots straight into a fullscreen
controller-driven shell, runs one game at a time, and is designed to feel like
a dedicated console — not a PC.

> Status: **v1.1.1 patch update**. Buildable ISO, polished First Wave shell,
> live Bluetooth/update status, rollback-capable OTA bundle apply from
> downloads, USB/media package discovery, live USB persistence, hard-drive
> migration tooling, `.ok` package format, and Pygame-based games.

## Highlights

- Buildroot-based, x86_64, BusyBox userland
- No desktop, no window manager, no terminal in normal mode
- Controller-first input via `okama-inputd` (USB + Bluetooth via BlueZ)
- `.ok` package format with manifest validation
- GitHub Pages game/system update feeds with periodic shell notifications
- Downloads-folder update/game staging with in-shell apply and rollback actions
- USB/media automount and recursive package/update discovery
- Safe game replacement with local backups and save-data preservation
- Safe `.okupdate` system apply with backup/rollback guardrails
- `okama-install` hard-drive migration and live USB persistence setup
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
./usr/bin/okama-update check
./usr/bin/okama-install --list-disks
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

## Updates and install

The beta update channels are hosted from:

- Game catalog: `https://zyntrixsolutions.github.io/okamaos/catalog/apps.json`
- OS updates: `https://zyntrixsolutions.github.io/okamaos/updates/feed.json`

Runtime update checks are available from Settings > Updates and from
`okama-update check`. Local `.okupdate` bundles are applied with
`okama-update apply <bundle>`; the tool verifies optional SHA-256 input,
backs up touched files, refuses to overwrite user data paths, and supports
`okama-update rollback`.

Disk and USB persistence setup is handled by `okama-install`:

```bash
okama-install --list-disks
okama-install --target /dev/sdX --dry-run
okama-install --target /dev/sdX --yes
okama-install --make-persistence /dev/sdXN --yes
```

Live USB persistence uses a partition labelled `OKAMA_DATA` and mounts it at
`/var/okamaos` during boot.

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
- **Game catalog:** https://zyntrixsolutions.github.io/okamaos/catalog/apps.json
- **OS updates:** https://zyntrixsolutions.github.io/okamaos/updates/feed.json

## License

TBD by OkamaLabs. Treat as proprietary until specified.

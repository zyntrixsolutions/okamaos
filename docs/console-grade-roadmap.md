# OkamaOS Console-Grade Roadmap

This document maps the gap between the current MVP and the Xbox/PlayStation-
level polish OkamaOS targets. Each item has a concrete implementation path,
not just a description.

---

## Boot Polish

| MVP State                         | v1 Target                                     |
|-----------------------------------|-----------------------------------------------|
| Linux boot messages visible       | Silent boot: `quiet loglevel=0 splash`        |
| tty1 launcher splash active       | Plymouth or custom framebuffer splash         |
| Boot: ~15 s                       | Boot: <8 s (optimise init order, ramdisk)    |
| GRUB menu hidden by default       | Recovery menu only via explicit hold key      |
| tty2 getty always running         | tty2 getty spawned only when dev mode active  |

**Implementation path:**
1. Replace the tty1 launcher splash with a framebuffer/initrd splash if deeper boot polish is needed
2. Use `bootchart` to identify slowest boot services; parallelize where safe
3. Freeze the rootfs as a squashfs on a fast partition; overlay `/var`
4. Keep GRUB hidden by default with a zero-second timeout and recovery entries available via Shift/Esc

---

## Controller-First Navigation

| MVP State                         | v1 Target                                     |
|-----------------------------------|-----------------------------------------------|
| Basic D-pad nav in shell          | Smooth animated transitions (slide, fade)     |
| No rumble support                 | Rumble on confirm/error (via evdev FF API)    |
| No battery indicator              | Battery level shown on shell HUD              |
| No controller icon per game       | Per-game controller button overlay            |
| Static button hints               | Context-aware button hint bar                 |

**Implementation path:**
1. Add `ff_rumble` ioctl calls to `okama-inputd` via a `rumble(strength, ms)` event type
2. Read HID battery level via `/sys/class/power_supply/`; push to shell every 30 s
3. Render transitions as surface blits with alpha fade; pygame can do 30 fps easily
4. Load `controller.json` from `.ok` packages for per-game button hint overrides

---

## Game Launch Experience

| MVP State                         | v1 Target                                     |
|-----------------------------------|-----------------------------------------------|
| Instant launch (no animation)     | Fade-to-black → game logo → gameplay          |
| Shell visible until exec          | Shell renders "Launching…" full screen first  |
| No loading screen standard        | Game manifest declares `loading_screen: true` |
| No launch time feedback           | Progress spinner during asset load            |

**Implementation path:**
1. `okama-run` renders a black screen with game name + OkamaLabs badge via pygame before exec
2. Games optionally implement `OKAMA_LOADING=1` env var and draw their own loader
3. `okama-shell` transitions to black before calling `okama-run`

---

## Crash Recovery

| MVP State                         | v1 Target                                     |
|-----------------------------------|-----------------------------------------------|
| Shell respawns after crash        | Friendly "Oops" screen, not raw text          |
| Crash log in /var/okamaos/logs    | Crash reported to OkamaLabs (opt-in)          |
| No auto save on crash             | Hook: SIGTERM sent 500 ms before kill for save|

**Implementation path:**
1. `okama-run`: on non-zero exit, render a full-screen "Something went wrong" pygame screen
2. Give game 500 ms with SIGTERM before SIGKILL — games can catch this to flush save state
3. Opt-in crash reporting: POST anonymized crash log to OkamaLabs endpoint

---

## Stable Game Lifecycle

| MVP State                         | v1 Target                                     |
|-----------------------------------|-----------------------------------------------|
| Lock file prevents double launch  | Watchdog process monitors game health         |
| No OOM handling                   | cgroups limit game to MAX_GAME_RAM_MB         |
| No GPU memory limits              | DRM render node ownership per game            |

**Implementation path:**
1. Create cgroup `okama_game` with `memory.max = $(MAX_GAME_RAM_MB)M` before `execv`
2. Watchdog thread in `okama-run`: if game process disappears unexpectedly, trigger recovery
3. Use DRM render node `/dev/dri/renderD128` leased to game process

---

## Parent Controls

| MVP State                         | v1 Target                                     |
|-----------------------------------|-----------------------------------------------|
| PIN stored as SHA-256             | PIN stored as Argon2id (timing-safe)          |
| Age filter config only            | Age filter enforced at install + runtime      |
| No time limits                    | Session time limits with countdown warning    |
| No spending controls              | Spending PIN gate for all purchases           |

**Implementation path:**
1. Replace SHA-256 with `argon2-cffi` or `bcrypt` in `okamaos/parent.py`
2. Age filter check during `okama-cli install` and in `okama-shell` game list render
3. `parent.conf: SESSION_LIMIT_MINUTES=120` → shell shows countdown, then politely ends session

---

## Safe Updates

| MVP State                         | v1 Target                                     |
|-----------------------------------|-----------------------------------------------|
| OTA stubbed                       | A/B root partition swap                       |
| No rollback                       | Automatic rollback if new partition won't boot|
| No update during gameplay         | Update blocked by game.lock check             |

**Implementation path:**
1. Partition layout: EFI | rootfs-A | rootfs-B | data
2. Bootloader (SYSLINUX or GRUB) reads active slot from NVRAM / flag file
3. `okama-update apply`: extracts to inactive partition, marks it as next boot
4. Boot slot confirms OK within 60 s or auto-reverts

---

## Clean Power Handling

| MVP State                         | v1 Target                                     |
|-----------------------------------|-----------------------------------------------|
| Basic poweroff/reboot             | Animated shutdown screen                      |
| No power button handling          | ACPI power button → graceful shutdown         |
| No suspend                        | Suspend-to-RAM on lid close / power button    |

**Implementation path:**
1. `acpid` listens for power button event → calls `okama-cli poweroff`
2. Shutdown: SIGTERM all services → game SIGTERM → shell renders "Shutting down…" → systemd or init halt
3. Suspend: `echo mem > /sys/power/state` after saving controller state

---

## UI Polish

| MVP State                         | v1 Target                                     |
|-----------------------------------|-----------------------------------------------|
| Basic pygame rects                | Smooth animations, rounded cards, shadows     |
| No sound effects                  | UI sound effects (navigate, select, back)     |
| No theme support                  | Theme packs in `/usr/share/okamaos/themes/`   |
| No game artwork                   | `icon.png` + `banner.png` shown in Play       |
| No store integration              | Store tab connects to OkamaLabs store API     |

**Implementation path:**
1. UI sound: ALSA one-shot WAV playback via `pygame.mixer` for UI events (tiny WAVs, <10 KB each)
2. Game artwork: `okama-shell` looks for `icon.png` in installed game directory
3. Theme: load colour palette + font from `/usr/share/okamaos/themes/<name>/theme.json`

---

## Summary Milestones

| Milestone | Key deliverables                                                  |
|-----------|-------------------------------------------------------------------|
| MVP       | Boots, shell, controller nav, .ok install, game launch, crash recover |
| v0.5      | Silent boot, friendly crash screen, battery level, rumble        |
| v1.0      | A/B OTA, cgroups, age filter enforced, Argon2 PIN, store tab     |
| v1.5      | Suspend, offline AI agent, theme support, game artwork           |
| v2.0      | Connected AI creation, parent dashboard, full store launch       |

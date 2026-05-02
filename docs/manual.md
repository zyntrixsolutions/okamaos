# OkamaOS Beginner Manual

OkamaOS is a controller-first Linux console for low-cost x86_64 PCs. It boots
into the OkamaOS shell, installs games as `.ok` packages, applies system
updates as `.okupdate` bundles, and keeps user data under `/var/okamaos`.

This manual is written for first-time users. If you only need command
reference, see [commands.md](commands.md). If you are building games, start
with [studio.md](studio.md) and [packages.md](packages.md).

## What You Can Do

- Download ISO images from the GitHub Releases page.
- Boot OkamaOS from USB or install it to a hard drive.
- Navigate the shell with a controller, keyboard, or mouse.
- Install `.ok` games from USB, local storage, or the public catalog.
- Check for OS and game updates from Settings or `okama-update`.
- Preserve games, saves, controllers, Wi-Fi profiles, and update history across
  safe updates.
- Open the Dev Console for maintenance and advanced commands.
- Build games in Okama Studio and export `.ok` packages.

## Hardware Baseline

OkamaOS targets low-cost x86_64 PCs. The planning baseline is a machine with at
least 2 GB RAM, but the OS shell and simple games are designed to stay much
lighter than that.

Recommended for beginners:

- x86_64 PC or laptop
- 2 GB RAM or more
- USB flash drive for the live ISO
- USB keyboard for setup and recovery
- USB or Bluetooth controller for normal play
- Wired Ethernet for first update checks when Wi-Fi is not configured yet

## Download an ISO

ISO images should be downloaded from:

<https://github.com/zyntrixsolutions/okamaos/releases>

Use the latest release that includes an `.iso` asset. The Pages update feed is
for smaller `.okupdate` runtime bundles; the GitHub Releases page is the
authoritative place for full bootable ISO images.

Beginner flow:

1. Open the GitHub Releases page.
2. Choose the newest release marked for public preview or stable use.
3. Download the `.iso` file.
4. Download the matching checksum file if one is provided.
5. Flash the ISO to a USB drive with your preferred imaging tool.
6. Boot the target PC from USB.

See [releases.md](releases.md) for release and verification details.

## First Boot

OkamaOS starts directly in the shell. The shell is the main console interface,
not a desktop environment.

On first boot:

1. Wait for the OkamaOS shell to appear.
2. Use D-pad, arrow keys, WASD, or mouse movement to navigate.
3. Open Settings and confirm Network status.
4. Open Settings > Controllers or Bluetooth if you need to pair a controller.
5. Open Settings > Updates to check for update notices.
6. Open Play to launch installed games or install a `.ok` package.

If graphics fail, use the recovery or safe graphics boot option when available.
If you can reach Dev Console, use `okama-cli status` and `okama-update check`
to inspect the system.

## Shell Navigation

Common controls:

| Action | Controller | Keyboard |
| --- | --- | --- |
| Move selection | D-pad or left stick | Arrow keys, WASD, Tab |
| Confirm | A / Start | Enter or Space |
| Back | B | Esc |
| Store custom URL | X in Game Store | X |
| Dev Console | F10 | F10 |

The shell includes:

- Home status for network, Bluetooth, input, games, and updates
- Play screen for installed games and package install
- Game Store for catalog downloads and custom development store URLs
- Settings for network, Bluetooth, audio, storage, updates, support, and power
- Power actions for reboot and shutdown
- Hidden Dev Console for maintenance

## Installing Games

Games install as `.ok` packages.

Beginner USB install:

1. Copy a `.ok` file to a USB drive.
2. Plug the USB drive into the OkamaOS machine.
3. Open Play > Install Game.
4. Select the package.
5. Confirm install.
6. Return to Play and launch the game.

Command install:

```bash
okama-cli verify /media/USB/mygame.ok
okama-cli install /media/USB/mygame.ok
okama-cli run com.publisher.mygame
```

Installed games live under `/var/okamaos/games/<game_id>/`. Saves live under
`/var/okamaos/saves/<game_id>/`.

## Updating OkamaOS

Settings > Updates is the beginner path. It can check the feed, download update
bundles, apply downloaded bundles, install game updates, and roll back the last
system update.

Command path:

```bash
okama-update check
okama-update apply --dry-run /var/okamaos/updates/downloads/update.okupdate
okama-update apply /var/okamaos/updates/downloads/update.okupdate
okama-update rollback
```

Safe updates preserve:

- games
- saves
- controller profiles
- update backups and history
- logs and cache
- parent and developer mode config
- Wi-Fi and Dropbear config

## Installing to a Hard Drive

Use `okama-install` from Dev Console. This is an advanced action because disk
install erases the selected target disk.

Begin with:

```bash
okama-install --list-disks
okama-install --target /dev/sdX --dry-run
```

Only run the real install after confirming the target is correct:

```bash
okama-install --target /dev/sdX --yes
```

For live USB persistence instead of full install:

```bash
okama-install --make-persistence /dev/sdXN --dry-run
okama-install --make-persistence /dev/sdXN --yes
okama-install --persistence-status
```

## Developer Mode and Dev Console

The Dev Console is a persistent `/bin/sh` terminal inside the shell. Press F10
to open it. It supports `help`, `clear`, `exit`, command history, and normal
BusyBox/Linux commands.

Useful first commands:

```bash
help
okama-cli status
okama-cli list
okama-update check
ip addr
df -h
ps
ls /var/okamaos
cat /etc/okamaos/okama.conf
```

Full Dev Console reference: [dev-console.md](dev-console.md).

## Build Games with Okama Studio

Okama Studio is the creator side of the ecosystem. Use it to write or generate
games, preview them in the browser, export `.ok` packages, and host a local
dev-store URL that OkamaOS can install from.

Studio flow:

1. Open Okama Studio.
2. Create or import a game.
3. Preview in the browser.
4. Export a `.ok` package.
5. Copy it to USB or publish it to the Studio dev server.
6. Install it in OkamaOS.

Start here: [studio.md](studio.md).

## Troubleshooting

Use these checks first:

```bash
okama-cli status
okama-cli list
okama-update check
ip route
ip addr
df -h
ps
ls /var/okamaos/logs
```

Common problems:

| Problem | First check |
| --- | --- |
| No network | Settings > Network, then `ip addr` and `ip route` |
| Bluetooth controller will not pair | Settings > Bluetooth, then `okama-cli bluetooth scan` |
| Game does not appear | `okama-cli list`, verify manifest id and install path |
| Game crashes | `/var/okamaos/logs/crash_<game_id>_*.log` |
| Update fails | Run `okama-update apply --dry-run` and check SHA-256 |
| Disk install target unclear | Stop and run `okama-install --list-disks` again |

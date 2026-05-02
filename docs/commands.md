# OkamaOS Command Reference

Most users can stay in the shell UI. These commands are for Dev Console,
recovery, support, and creators who want exact control.

Open Dev Console with F10, or use a normal shell on a development build.

## okama-cli

System, game, Bluetooth, controller, parent mode, and power helper.

```bash
okama-cli status
okama-cli list
okama-cli install <path.ok>
okama-cli uninstall <game_id>
okama-cli run <game_id>
okama-cli verify <path.ok>
okama-cli memory
okama-cli dev enable
okama-cli dev disable
okama-cli parent set-pin
okama-cli poweroff
okama-cli reboot
okama-cli bluetooth status
okama-cli bluetooth scan
okama-cli bluetooth pair <mac>
okama-cli bluetooth trust <mac>
okama-cli bluetooth connect <mac>
okama-cli bluetooth disconnect <mac>
okama-cli bluetooth forget <mac>
okama-cli controllers list
okama-cli controllers test
okama-cli controllers default <id>
```

Examples:

```bash
okama-cli status
okama-cli verify /media/USB/com.example.game.ok
okama-cli install /media/USB/com.example.game.ok
okama-cli run com.example.game
okama-cli bluetooth scan
okama-cli bluetooth pair AA:BB:CC:DD:EE:FF
```

## okama-update

Safe system update manager.

```bash
okama-update check
okama-update apply --dry-run <path-or-url.okupdate>
okama-update apply --sha256 <hex> <path-or-url.okupdate>
okama-update rollback
```

Examples:

```bash
okama-update check
okama-update apply --dry-run /var/okamaos/updates/downloads/okamaos-v1.3.0.okupdate
okama-update apply https://zyntrixsolutions.github.io/okamaos/updates/okamaos-v1.3.0.okupdate
okama-update rollback
```

## okama-pack

Build, inspect, verify, and dependency-bundle `.ok` game packages.

```bash
okama-pack build <game_dir> [--output path.ok]
okama-pack inspect <file.ok>
okama-pack verify <file.ok>
okama-pack bundle <game_dir> [--deps PKG ...] [--extra-index URL]
```

Examples:

```bash
okama-pack build ./my-game --output my-game.ok
okama-pack inspect my-game.ok
okama-pack verify my-game.ok
okama-pack bundle ./my-game --deps pygame
```

## okama-agent

Creator helper for templates and automatic packaging.

```bash
okama-agent new-game
okama-agent template list
okama-agent template create <name>
okama-agent auto-pack <game-dir> [--output file.ok] [--bundle] [--skip-bundle]
```

Examples:

```bash
okama-agent template list
okama-agent new-game
okama-agent auto-pack ./my-game --output my-game.ok --bundle
```

## okama-install

Disk install and live USB persistence tool. These commands can erase disks, so
start with list and dry-run.

```bash
okama-install --list-disks
okama-install --target /dev/sdX --dry-run
okama-install --target /dev/sdX --yes
okama-install --make-persistence /dev/sdXN --yes
okama-install --persistence-status
```

## okama-run

Strict game launcher. The shell calls this when you launch a game.

```bash
okama-run <game_id>
okama-run <game_id> --no-suspend
```

It validates the game manifest, creates a single-game lock, runs the entry
script, writes crash logs, and returns control to the shell.

## okama-snapshot

Save-state helper for games that provide hooks.

```bash
okama-snapshot save <game_id>
okama-snapshot restore <game_id>
okama-snapshot list
okama-snapshot delete <game_id>
```

## okama-store

Store client placeholder and endpoint helper.

```bash
okama-store browse
okama-store featured
okama-store search <query>
okama-store download <game_id>
```

Current MVP output points at the public catalog endpoint. The shell Game Store
is the normal user-facing path.

## okama-mount-media

Mount removable media under `/media` so package and update scanners can find
`.ok` and `.okupdate` files.

```bash
okama-mount-media
```

It skips the persistence partition labelled `OKAMA_DATA`.

## okama-inputd

Input daemon used by the shell and games. It broadcasts controller and keyboard
events to clients. Most users should not run it manually; init scripts start it.

Useful support checks:

```bash
ps | grep okama-inputd
ls /dev/input
```

## BusyBox and Linux Commands

The Dev Console runs `/bin/sh`. These common commands are safe for inspection:

```bash
help
clear
exit
ip addr
ip route
df -h
mount
ps
ls
cat <file>
dmesg
reboot
poweroff
```

Avoid destructive commands such as `rm -rf`, `dd`, `mkfs`, and disk install
commands unless you are intentionally changing storage.

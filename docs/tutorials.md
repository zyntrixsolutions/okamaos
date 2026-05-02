# OkamaOS Tutorials

These tutorials are beginner-first. They assume you can boot OkamaOS, navigate
the shell, and open Dev Console with F10 when needed.

## Tutorial 1: Install Your First Game

1. Download a `.ok` package from the catalog or copy one from Okama Studio.
2. Put the file on a USB drive.
3. Boot OkamaOS.
4. Plug in the USB drive.
5. Open Play > Install Game.
6. Choose the `.ok` file.
7. Return to Play and launch it.

Command check:

```bash
okama-cli list
```

## Tutorial 2: Check for Updates

1. Open Settings > Updates.
2. Select check for updates.
3. Read the available update summary.
4. Download the update if one is available.
5. Apply the downloaded bundle.
6. Reboot if the update asks for it.

Command equivalent:

```bash
okama-update check
```

## Tutorial 3: Pair a Bluetooth Controller

1. Open Settings > Bluetooth.
2. Turn Bluetooth on.
3. Put the controller in pairing mode.
4. Scan for devices.
5. Select the controller.
6. Pair, trust, and connect.

Command equivalent:

```bash
okama-cli bluetooth scan
okama-cli bluetooth pair <mac>
okama-cli bluetooth trust <mac>
okama-cli bluetooth connect <mac>
okama-cli controllers list
```

## Tutorial 4: Create a Persistent Live USB

This keeps games, saves, updates, Wi-Fi profiles, and controller profiles across
live USB reboots.

1. Boot OkamaOS from USB.
2. Open Dev Console with F10.
3. List disks and partitions.
4. Choose the partition that should become persistent storage.
5. Run a dry-run first.
6. Format the persistence partition.
7. Reboot.

Commands:

```bash
okama-install --list-disks
okama-install --make-persistence /dev/sdXN --dry-run
okama-install --make-persistence /dev/sdXN --yes
okama-install --persistence-status
```

## Tutorial 5: Build a Game in Okama Studio

1. Open Okama Studio.
2. Create a new game.
3. Add assets or ask the AI agent to scaffold mechanics.
4. Preview the game in the browser.
5. Export a `.ok` package.
6. Install it on OkamaOS from USB or the Studio dev server.

See [studio.md](studio.md) for the ecosystem workflow.

## Tutorial 6: Package a Local Game Folder

If you already have a Python/Pygame game folder:

```bash
okama-agent auto-pack ./my-game --output my-game.ok --bundle
okama-pack verify my-game.ok
```

If auto-pack cannot detect the game, add `manifest.ok.json` manually and run:

```bash
okama-pack build ./my-game --output my-game.ok
```

## Tutorial 7: Recover from a Bad Update

1. Open Dev Console with F10.
2. Check update state.
3. Roll back the latest system update.
4. Reboot.

Commands:

```bash
okama-update check
okama-update rollback
reboot
```

Rollback restores files from the latest update backup under
`/var/okamaos/updates/backups/`.

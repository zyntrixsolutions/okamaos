# OkamaOS Updates, Rollback, and Persistence

OkamaOS v1.1.1 uses GitHub Pages as the beta update source:

- Game catalog: `https://zyntrixsolutions.github.io/okamaos/catalog/apps.json`
- OS update feed: `https://zyntrixsolutions.github.io/okamaos/updates/feed.json`

## Update checks

The shell periodically checks for OS and installed-game updates when
`UPDATE_NOTIFICATIONS=yes` in `/etc/okamaos/okama.conf`.

Manual checks:

```bash
okama-update check
```

The shell Settings > Updates screen can download OS update bundles into
`/var/okamaos/updates/downloads`, apply the newest downloaded `.okupdate`, and
run rollback without dropping to the developer console. Game Store downloads and
available game updates are also staged in the downloads folder before install.

## Safe system update apply

System bundles use the `.okupdate` extension and must contain a
`manifest.okupdate.json` or `manifest.json` file plus an optional `files/`
overlay. The updater only allows OS-owned targets such as `usr/bin/okama-*`,
`usr/lib/okamaos/`, `usr/share/okamaos/`, `etc/init.d/S*`, and boot assets.

Protected user data is refused:

- `/var/okamaos/games`
- `/var/okamaos/saves`
- `/var/okamaos/controllers`
- `/var/okamaos/updates`
- parent, developer, Wi-Fi, and Dropbear local config

Apply with a dry run first:

```bash
okama-update apply --dry-run update.okupdate
okama-update apply --sha256 <hex> update.okupdate
```

Every non-dry run writes a backup under `/var/okamaos/updates/backups/`.
Rollback restores the latest backup:

```bash
okama-update rollback
```

## Safe game updates

Installing or replacing a `.ok` package backs up the existing game directory
under `/var/okamaos/updates/game-backups/`. Common local save files and save
directories are copied into the new install when the new package did not
provide them.

## Live USB persistence

A live USB can be used long-term by adding an ext partition labelled
`OKAMA_DATA`. Early boot mounts that partition at `/var/okamaos` before the
shell and services start.

Other attached storage is mounted under `/media` by `okama-mount-media`.
Package and update discovery scans `/media`, `/mnt`, `/run/media`,
`/var/okamaos/updates`, and the downloads folders recursively.

Prepare a partition:

```bash
okama-install --make-persistence /dev/sdXN --dry-run
okama-install --make-persistence /dev/sdXN --yes
```

Check current status:

```bash
okama-install --persistence-status
```

# OkamaOS System Updates

OkamaOS system updates are distributed as `.okupdate` bundles. A bundle is a
gzip-compressed tar archive with:

- `manifest.okupdate.json`
- `files/` containing the rootfs-relative files to install

The updater is intentionally conservative. It can update runtime-owned files
such as:

- `/usr/bin/okama-*`
- `/usr/lib/okamaos/*`
- `/usr/share/okamaos/*`
- `/etc/init.d/S*`
- `/etc/profile`

It refuses to overwrite user data paths:

- `/var/okamaos/games`
- `/var/okamaos/saves`
- `/var/okamaos/logs`
- `/var/okamaos/cache`
- `/var/okamaos/controllers`
- `/var/okamaos/updates`
- `/etc/okamaos/parent.conf`
- `/etc/okamaos/devmode.conf`

`/etc/okamaos/okama.conf` is merged. Version fields are updated, new defaults
are added, and existing local values such as custom feed URLs are preserved.

## Apply

```bash
okama-update check
okama-update apply https://zyntrixsolutions.github.io/okamaos/updates/okamaos-v1.0.2.okupdate
reboot
```

Before replacing files, `okama-update apply` creates a backup in
`/var/okamaos/updates/backups`.

## Rollback

```bash
okama-update rollback
reboot
```

Rollback restores the latest file backup. It does not delete games, saves, or
other preserved user data.

## Build A Bundle

```bash
python3 tools/create-okupdate-package.py \
  --version 1.0.2 \
  --codename "Safe System Update" \
  --summary "Runtime update with preserved games, saves, settings, and update history." \
  --output pages/updates/okamaos-v1.0.2.okupdate
```

After building, update `pages/updates/feed.json` with the artifact URL,
SHA-256, and byte size.

# ISO Releases and Updates

OkamaOS uses two release surfaces:

- Full bootable ISO images are published on GitHub Releases.
- Smaller system update bundles are published through the Pages update feed.

## Download ISO Images

GitHub Releases:

<https://github.com/zyntrixsolutions/okamaos/releases>

Use this page for:

- first installs
- fresh USB images
- recovery media
- full OS rebuilds
- release notes tied to large boot artifacts

When a release includes multiple assets, choose the `.iso` file for booting.
Download the checksum file when available and verify the ISO before flashing.

Example verification:

```bash
sha256sum okamaos.iso
```

Compare the output with the release checksum.

## Update Bundles

The public preview update feed is:

<https://zyntrixsolutions.github.io/okamaos/updates/feed.json>

The current feed can point to `.okupdate` bundles hosted under this Pages site.
These bundles are for runtime and shell updates, not first-time boot media.

Use Settings > Updates when possible. Advanced users can run:

```bash
okama-update check
okama-update apply --dry-run updates/okamaos-v1.3.0.okupdate
okama-update apply --sha256 <hex> updates/okamaos-v1.3.0.okupdate
```

## Which Download Should I Use?

| Need | Use |
| --- | --- |
| New machine or blank USB | GitHub Releases `.iso` |
| Recovery boot media | GitHub Releases `.iso` |
| Existing OkamaOS runtime update | Pages `.okupdate` feed |
| Game install | `.ok` package from catalog, USB, or Studio |
| Game development test | Okama Studio dev server or exported `.ok` |

## Release Channels

`public-preview` is the fast-moving channel for early users and creators.
`stable` is reserved for validated production images after the release process
is split.

The feed exposes metadata that OS clients can read:

- `version`
- `codename`
- `date`
- `download_url`
- `sha256`
- `size_bytes`
- `release_notes_url`
- `artifact_status`

## Data Preservation

`.okupdate` bundles are designed to preserve user data. They refuse to overwrite
the protected paths used for games, saves, controller profiles, Wi-Fi settings,
developer mode state, update backups, and local logs.

Full ISO reinstalls are different. If you install over a disk, back up anything
important first.

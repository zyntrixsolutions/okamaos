# OkamaOS Public Portal

This repository is the GitHub Pages-ready public hub for OkamaOS.

It serves four audiences:

- beginners who need ISO downloads, first-boot help, and tutorials
- players who need game downloads, release notes, and update links
- creators who need the `.ok` package contract and Studio workflow
- developers who need Dev Console and command documentation

## Public Entry Points

- Homepage: `index.html`
- Beginner manual: `docs/manual.md`
- ISO release guide: `docs/releases.md`
- Command reference: `docs/commands.md`
- Dev Console manual: `docs/dev-console.md`
- Package docs: `docs/packages.md`
- Tutorials: `docs/tutorials.md`
- Studio ecosystem guide: `docs/studio.md`
- Update feed: `updates/feed.json`
- App catalog: `catalog/apps.json`

## ISO Releases

Full bootable ISO images are distributed through GitHub Releases:

<https://github.com/zyntrixsolutions/okamaos/releases>

The Pages site should link users there for fresh installs, recovery media, and
full image downloads. The `updates/feed.json` feed is for `.okupdate` bundles
that update an already-running OkamaOS install.

## Local Preview

The site is static:

```bash
python3 -m http.server 8000 --directory .
```

Then open:

```text
http://localhost:8000
```

Opening `index.html` directly also works for layout checks, but the JSON feed
rendering is best tested over HTTP.

## Catalog Feed

`catalog/apps.json` is the app/game catalog consumed by the page and suitable
for in-OS store clients.

Required app fields:

- `id`: reverse-DNS app id
- `name`: display name
- `version`: semver game version
- `runtime`: OkamaOS runtime id
- `status`: `available`, `preview`, or `coming-soon`
- `download_url`: relative Pages URL or full release asset URL
- `sha256`: SHA-256 of the `.ok` package when downloadable
- `size_bytes`: package size in bytes

Small `.ok` files can live in `downloads/games/`. Larger games should use
GitHub Releases and set `download_url` to the release asset.

## Update Feed

`updates/feed.json` describes the public update channel. Installable
`.okupdate` bundles live in `updates/` and can replace OkamaOS runtime files
while preserving user data. OS images ship through GitHub Releases.

Current builds can use the feed as both a human-readable update source and a
machine-readable update contract.

## Version and Roadmap Tracking

- Portal version: `VERSION`
- Portal changelog: `CHANGELOG.md`
- Portal roadmap: `ROADMAP.md`

Update all three when changing public docs, downloads, feed shape, visible copy,
or ecosystem workflow.

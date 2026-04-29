# OkamaOS Public Portal

This directory is a GitHub Pages-ready static portal for OkamaOS.

It is designed for two audiences:

- players who want games, release notes, and update links
- creators who want a clear path to ship `.ok` packages into the catalog

## Deploy

The repository includes `.github/workflows/pages.yml`. Enable GitHub Pages with
the source set to GitHub Actions, then merge changes to `main`.

## Local preview

The site is static. Open `pages/index.html` directly, or preview it over HTTP:

```bash
python3 -m http.server 8000 --directory pages
```

## Catalog feed

`catalog/apps.json` is the app/game catalog consumed by the page and suitable
for future in-OS store clients.

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

## Update feed

`updates/feed.json` describes the public update channel. Installable
`.okupdate` bundles live in `updates/` and can replace OkamaOS runtime files
while preserving user data. OS images can still ship through GitHub Releases;
this feed should point to the exact asset URL and include `sha256` plus byte
size when artifacts are final.

Current builds can use the feed as both a human-readable update source and a
machine-readable update contract.

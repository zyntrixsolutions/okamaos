# OkamaOS Roadmap

## Public Launch Portal

- [x] Create a GitHub Pages-ready landing page for OkamaOS.
- [x] Publish a static app catalog feed for downloadable games.
- [x] Publish a static update feed for release and OS update metadata.
- [x] Include at least one real `.ok` package download in the portal.
- [x] Add Pages deployment automation.
- [ ] Attach production OS image artifacts to GitHub Releases and update `pages/updates/feed.json` with signed asset URLs and hashes.
- [ ] Add creator submission workflow for community `.ok` game drops.
- [ ] Wire in-OS store/update clients to the public catalog and update feed URLs.

## Runtime And Distribution

- [x] Maintain version tracking through root `VERSION`, package version files, and runtime config.
- [ ] Add signed update verification before automatic OS updates.
- [ ] Publish a stable public release channel after hardware validation.

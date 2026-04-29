# Changelog

## [1.0.1] - 2026-04-29

### Added

- Added OS update notification checks against the public update feed.
- Added installed-game update checks against the public app catalog.
- Added home-screen update notification banners in `okama-shell`.
- Added update notice output to `okama-update check`.
- Added downloadable `pages/updates/okamaos-v1.0.1.okupdate` metadata.
- Added `0.1.1` demo game catalog/package metadata for game-update detection.

### Changed

- Bumped runtime and package version tracking to `1.0.1`.

## [1.0.0] - 2026-04-29

### Added

- Added an early OkamaOS boot splash init script for tty1 before the shell starts.
- Added shared OkamaOS logo assets for runtime branding and Pages branding.
- Added a downloadable `pages/updates/okamaos-v1.0.0.okupdate` manifest for the public update channel.

### Changed

- Replaced the shell home text wordmark with a logo treatment.
- Replaced the Pages header and hero text branding with the OkamaOS logo asset.
- Updated the public update feed to advertise `1.0.0 First Wave`.
- Bumped runtime and package version tracking to `1.0.0`.

## [0.1.1] - 2026-04-29

### Added

- Added a GitHub Pages-ready public portal under `pages/` for the OkamaOS landing page, app catalog, and update feed.
- Added a static app catalog with one downloadable demo `.ok` package generated from `games/demo`.
- Added public update metadata that can point current users to release notes and future OS update artifacts.
- Added a GitHub Actions workflow to deploy the `pages/` directory through GitHub Pages.
- Added root project version, changelog, roadmap, and package version tracking files.

### Changed

- Bumped OkamaOS runtime tracking from `0.1.0` to `0.1.1`.
- Documented the public portal in the root README.

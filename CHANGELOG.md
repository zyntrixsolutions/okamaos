# OkamaOS Portal Changelog

## 2026-05-02 - Manuals and ecosystem docs (portal v1.3.1)

- Added a beginner manual covering ISO downloads, first boot, shell navigation, games, updates, persistence, disk install, Dev Console, Studio, and troubleshooting.
- Added dedicated docs for GitHub Releases ISO downloads, command reference, Dev Console usage, package formats, tutorials, and Studio-to-OkamaOS workflow.
- Updated the homepage into a documentation hub with direct paths to ISO releases, update feed, app catalog, manual, commands, tutorials, and Studio.
- Updated the public update feed metadata with release, ISO releases, documentation, and Studio documentation URLs while keeping the current OS update at `1.3.0`.
- Corrected the demo game catalog entry to point at the committed `com.okamalabs.demo-0.1.0.ok` package and matching SHA-256 until a newer artifact is published.
- Added `VERSION` and `ROADMAP.md` for portal version control and milestone tracking.

## 2026-05-02 - devlink (v1.3.0)

- Published `okamaos-v1.3.0.okupdate` system update bundle.
- Updated `feed.json` to point at v1.3.0 with SHA-256 and size metadata.
- Fixes: ZIP `.ok` package install (Okama Studio builds), key-hold navigation repeat, dev console ANSI escape codes, dev console command tail-scroll.
- Feature: Game Store custom server URL entry (X button) for dev-server wireless game hosting.
- Previous v1.0.2 archived in `previous` array in feed.json.

## 2026-04-29 - Safe System Update

- Published a real `okamaos-v1.0.2.okupdate` system update bundle.
- Updated the feed to point at an installable runtime update artifact.
- Added safe-upgrade notes for preserving games, saves, settings, and update history.

## 2026-04-29 - First Wave Notify

- Added a downloadable `okamaos-v1.0.1.okupdate` manifest to the public update channel.
- Updated the feed with OS and game update notification release notes.
- Updated the demo game catalog entry to `0.1.1` so installed `0.1.0` demo games can receive update notices.

## 2026-04-29 - First Wave v1

- Added a downloadable `okamaos-v1.0.0.okupdate` manifest to the public update channel.
- Updated the portal update feed to point current users at the v1 download.
- Replaced homepage text branding with the OkamaOS logo asset.
- Added boot-screen and runtime-logo notes for the v1 release.

## 2026-04-29 - Launch Hub

- Published the first OkamaOS public portal design.
- Added the app catalog section with a real demo `.ok` download.
- Added the public update feed section for OS release metadata.
- Added creator-facing copy for early game drops.
- Added static JSON feeds for catalog and update clients.

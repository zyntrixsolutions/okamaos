# OkamaOS Roadmap

## Public Launch Portal

- [x] Create a GitHub Pages-ready landing page for OkamaOS.
- [x] Publish a static app catalog feed for downloadable games.
- [x] Publish a static update feed for release and OS update metadata.
- [x] Include at least one real `.ok` package download in the portal.
- [x] Add Pages deployment automation.
- [x] Publish a downloadable v1 `.okupdate` manifest from the repo.
- [x] Add branded boot and home logo treatment for v1.
- [x] Add in-OS notifications for OS updates.
- [x] Add in-OS notifications for installed game updates.
- [x] Add real `.okupdate` system bundle apply support.
- [x] Preserve games, saves, settings, and update backups during major system upgrades.
- [ ] Attach production OS image artifacts to GitHub Releases and update `pages/updates/feed.json` with signed asset URLs and hashes.
- [ ] Add creator submission workflow for community `.ok` game drops.
- [ ] Wire in-OS store/update clients to the public catalog and update feed URLs.

## Runtime And Distribution

- [x] Maintain version tracking through root `VERSION`, package version files, and runtime config.
- [x] Add a guided hard-drive installer for live images and VM disks.
- [x] Package bootloader and kernel assets needed by installed-disk boots.
- [x] Restore the normal Buildroot post-image ISO build path and canonical `output/okamaos.iso` artifact.
- [x] Enable ISO initrd boot support and remove duplicate ISO output artifacts.
- [x] Enable serial boot diagnostics for ISO startup failures.
- [x] Enable framebuffer drivers required by the safe graphics ISO boot path.
- [x] Restore GUI-first ISO boot and keep text mode as a genuine failure fallback only.
- [x] Enable SDL2 KMS/DRM and Mesa GBM/EGL support for visible pygame startup.
- [x] Keep safe graphics as an explicit fallback instead of making it the default GUI path.
- [x] Add boot-readiness checks for version alignment, init-script permissions, SDL2_ttf packaging, and shell/game SDL startup contracts.
- [x] Rebind pygame SDL2_ttf to the Buildroot library so GUI font loading works on VM/live boots.
- [ ] Add signed update verification before automatic OS updates.
- [ ] Publish a stable public release channel after hardware validation.

## Installer And Hardware Setup

- [x] Provide `okama-install --list-disks` for operator-safe disk discovery.
- [x] Refuse installation over the currently running root disk.
- [x] Require explicit confirmation before partitioning and formatting a target disk.
- [x] Copy the live root filesystem to a new target partition.
- [x] Install a legacy BIOS Extlinux boot path for local disks.
- [ ] Add UEFI boot support for newer hardware.
- [ ] Add controller-driven installer access from Settings after hardware validation.

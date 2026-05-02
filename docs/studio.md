# Okama Studio and OkamaOS Ecosystem

Okama Studio is the creator surface. OkamaOS is the console surface. The Pages
site connects both:

- Players download ISO images, updates, games, and manuals here.
- Creators build games in Studio and export `.ok` packages.
- Studio points creators back to this Pages site for OS downloads and update
  instructions.
- OkamaOS can install games exported from Studio by USB or dev-store URL.

## Player Path

1. Download an OkamaOS ISO from GitHub Releases.
2. Boot OkamaOS.
3. Install games from the catalog, USB, or Studio dev server.
4. Use Settings > Updates to stay current.

## Creator Path

1. Open Okama Studio.
2. Create a project or open the demo game.
3. Use AI assistance or edit the code directly.
4. Preview the game in the browser.
5. Export a `.ok` package.
6. Publish to the Studio dev server or copy to USB.
7. Install on OkamaOS.

## Studio to OkamaOS Download Link

Studio should keep a visible "OS Downloads" or "Download OkamaOS" action that
opens:

<https://zyntrixsolutions.github.io/okamaos/#downloads>

That gives creators a direct path to the ISO releases, update feed, and manual
without leaving the ecosystem.

## OkamaOS to Studio Link

The Pages site should keep a visible "Build in Okama Studio" action near the
downloads and creator sections. If Studio is running locally, the default local
development URL is:

<http://localhost:3000>

For a deployed Studio instance, replace that local URL with the hosted Studio
URL in the site and Studio docs.

## Wireless Dev-Store Loop

The v1.3.0 devlink update supports a custom store URL flow:

1. Start Okama Studio on a machine connected to the same LAN as OkamaOS.
2. Open the Studio dev server panel.
3. Publish a game to the dev store.
4. Copy the LAN catalog URL shown by Studio.
5. On OkamaOS, open Game Store.
6. Press X to enter a custom store URL.
7. Paste or type the Studio LAN URL.
8. Install the game wirelessly.

This makes Studio the build station and OkamaOS the test console.

## Package Contract

Studio exports `.ok` packages. OkamaOS validates them with the same package
rules documented in [packages.md](packages.md):

- reverse-DNS app id
- semantic version
- supported runtime id
- safe relative entry path
- valid age rating
- valid permissions
- controller-first defaults for normal installs

Use `okama-pack verify exported-game.ok` when debugging a package outside the
browser.

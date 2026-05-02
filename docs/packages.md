# OkamaOS Packages

OkamaOS games install as `.ok` packages. System runtime updates install as
`.okupdate` packages. Full bootable OS images are ISO files from GitHub
Releases.

## Package Types

| Type | Purpose | Installed by |
| --- | --- | --- |
| `.iso` | Full bootable OS image | USB imaging tool or release workflow |
| `.ok` | Game package | Shell Play install, Game Store, or `okama-cli install` |
| `.okupdate` | System runtime update | Settings > Updates or `okama-update apply` |

## `.ok` Structure

```text
game.ok
|-- manifest.ok.json
|-- main.py
|-- assets/
|-- icon.png
|-- banner.png
|-- controller.json
|-- save_hook.py
`-- other game files
```

Required manifest fields:

```json
{
  "name": "Example Game",
  "id": "com.publisher.example",
  "version": "0.1.0",
  "runtime": "okama-sdl2",
  "entry": "main.py"
}
```

Recommended fields:

```json
{
  "min_ram_mb": 128,
  "target_fps": 30,
  "permissions": ["controller", "audio", "save_data"],
  "age_rating": "Everyone",
  "supports_save_state": true,
  "controller_required": true,
  "keyboard_usage": "none",
  "description": "Short store description"
}
```

## Runtime IDs

| Runtime | Use |
| --- | --- |
| `okama-lite` | Simple Python or logic-only programs |
| `okama-python` | Python game using the standard launch path |
| `okama-sdl2` | Pygame/SDL2 game with controller-first presentation |

## Build a Game Package

From a game folder that contains `manifest.ok.json`:

```bash
okama-pack build ./my-game --output my-game.ok
okama-pack inspect my-game.ok
okama-pack verify my-game.ok
```

Auto-detect and package a folder:

```bash
okama-agent auto-pack ./my-game --output my-game.ok --bundle
```

## Install a Game Package

```bash
okama-cli verify /media/USB/my-game.ok
okama-cli install /media/USB/my-game.ok
okama-cli run com.publisher.example
```

The shell UI can also install `.ok` files from attached media.

## Dev Server Packages from Okama Studio

Okama Studio can export `.ok` packages and publish them to a local dev-store
server. On OkamaOS, open Game Store and use the custom store URL entry to point
the console at the Studio machine's LAN URL.

Typical loop:

1. Build or edit a game in Studio.
2. Preview in browser.
3. Export or publish to dev server.
4. On OkamaOS, open Game Store.
5. Enter the Studio dev-store URL.
6. Install the game wirelessly.

## `.okupdate` System Bundles

`.okupdate` bundles are restricted system overlays. They are allowed to update
OkamaOS-owned runtime files and are refused if they try to overwrite protected
user data.

Allowed targets include:

- `/usr/bin/okama-*`
- `/usr/lib/okamaos/`
- `/usr/share/okamaos/`
- `/etc/init.d/S*`
- `/boot/okamaos/`
- `/boot/extlinux/`
- `/etc/profile`
- `/etc/issue`
- `/etc/motd`

Protected targets include:

- `/var/okamaos/games`
- `/var/okamaos/saves`
- `/var/okamaos/controllers`
- `/var/okamaos/updates`
- parent, developer, Wi-Fi, and Dropbear local config

## Signing Direction

Unsigned packages are for developer mode and early preview testing. The v1
signing direction is:

- `MANIFEST.sha256` with hashes for every file
- `SIGNATURE` signed by a publisher key
- `CERTIFICATE.pem` chaining to an OkamaLabs root certificate

Until signed packages are enforced, verify source and SHA-256 before sharing
packages broadly.

# OkamaOS .ok Package Format

## Overview

`.ok` files are **tar + gzip** archives (`.tar.gz` under the hood) with the
`.ok` extension. zstd compression is the v1 target for faster decompression on
low-end hardware.

## Internal Structure

```
game.ok
├── manifest.ok.json        ← required
├── main.py                 ← or whatever entry specifies
├── assets/                 ← optional (images, sounds)
├── icon.png                ← optional (128×128 game icon)
├── banner.png              ← optional (460×215 store banner)
├── controller.json         ← optional (extra controller hints)
├── save_hook.py            ← optional (called by okama-snapshot)
└── ...
```

## manifest.ok.json — Full Schema

```json
{
  "name":              "string   — display name",
  "id":                "string   — reverse-DNS: com.publisher.game",
  "version":           "string   — semver: 0.1.0",
  "runtime":           "string   — okama-lite | okama-python | okama-sdl2",
  "entry":             "string   — relative path to main script",
  "min_ram_mb":        "integer  — minimum RAM required (MB)",
  "target_fps":        "integer  — intended frame rate",
  "permissions":       ["controller","audio","save_data","network","camera"],
  "age_rating":        "string   — Everyone | Teen | Mature",
  "supports_save_state": "bool",
  "controller_required": "bool   — must be true for normal install",
  "keyboard_usage":    "string   — none | text_only | full",
  "description":       "string   — optional short description"
}
```

## Runtime IDs

| Runtime        | Description                                    |
|----------------|------------------------------------------------|
| `okama-lite`   | Python 3, no graphics (logic/CLI games)        |
| `okama-python` | Python 3 + pygame, standard launch             |
| `okama-sdl2`   | Python 3 + pygame + SDL2 full feature set      |

v1 will add `okama-native` for compiled C/C++/Rust games.

## Validation Rules (`okamaos.manifest.validate`)

| Rule                                              | Effect on failure   |
|---------------------------------------------------|---------------------|
| Missing required field                            | Reject              |
| ID not reverse-DNS (lowercase, dots)              | Reject              |
| Runtime not in supported list                     | Reject              |
| Age rating not in {Everyone, Teen, Mature}        | Reject              |
| Unknown permission name                           | Reject              |
| `keyboard_usage = full` outside dev mode          | Reject              |
| `controller_required = false` outside dev mode    | Reject              |
| Entry path contains `..` or starts with `/`       | Reject              |
| Path traversal in tar members                     | Reject on extract   |
| `min_ram_mb` negative                             | Reject              |

## Building a Package

```bash
# Host (dev machine)
okama-pack build ./games/mygame
# or explicitly:
okama-pack build ./games/mygame --output mygame.ok

# Inspect contents
okama-pack inspect mygame.ok

# Validate manifest
okama-pack verify mygame.ok
```

## Installing

```bash
okama-cli install /path/to/mygame.ok
# Extracted to /var/okamaos/games/<game_id>/
```

## v1 Signing Design

```
.ok bundle
├── manifest.ok.json
├── MANIFEST.sha256          ← SHA-256 of every file, signed
├── SIGNATURE                ← Ed25519 signature by publisher key
└── CERTIFICATE.pem          ← publisher cert chain to OkamaLabs root CA
```

Verification steps (v1):
1. Verify `SIGNATURE` against OkamaLabs root CA
2. Verify all file hashes in `MANIFEST.sha256`
3. Only then extract and install

Unsigned packages:
- Allowed only in developer mode
- Require parent PIN confirmation
- Logged with a warning in `/var/okamaos/logs/install.log`

## save_hook.py Interface

```python
# Called by: okama-snapshot save <game_id>   → save_hook.py save <save_dir>
# Called by: okama-snapshot restore <game_id> → save_hook.py restore <save_dir>
import sys

def main():
    action   = sys.argv[1]   # "save" or "restore"
    save_dir = sys.argv[2]   # /var/okamaos/saves/<game_id>
    if action == "save":
        # write game-specific state files into save_dir
        pass
    elif action == "restore":
        # read state files from save_dir and apply
        pass

if __name__ == "__main__":
    main()
```

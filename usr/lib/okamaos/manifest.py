"""Validate and parse .ok package manifests."""

import json
import re
from typing import Any

REQUIRED_FIELDS = ["name", "id", "version", "runtime", "entry"]
SUPPORTED_RUNTIMES = {"okama-lite", "okama-python", "okama-sdl2"}
VALID_AGE_RATINGS = {"Everyone", "Teen", "Mature"}
VALID_PERMISSIONS = {"controller", "audio", "save_data", "network", "camera"}
VALID_KEYBOARD_USAGE = {"none", "text_only", "full", "supported"}
ID_RE = re.compile(r"^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$")


class ManifestError(ValueError):
    pass


def load(path: str) -> dict:
    try:
        with open(path) as f:
            return json.load(f)
    except FileNotFoundError:
        raise ManifestError(f"Manifest not found: {path}")
    except json.JSONDecodeError as e:
        raise ManifestError(f"Invalid JSON in manifest: {e}")


def validate(manifest: dict, dev_mode: bool = False) -> None:
    """Raise ManifestError if the manifest is invalid."""
    for field in REQUIRED_FIELDS:
        if field not in manifest:
            raise ManifestError(f"Missing required field: '{field}'")

    pkg_id: str = manifest["id"]
    if not ID_RE.match(pkg_id):
        raise ManifestError(
            f"Invalid package ID '{pkg_id}'. "
            "Must be reverse-DNS: com.publisher.game (lowercase, dots)"
        )

    runtime: str = manifest["runtime"]
    if runtime not in SUPPORTED_RUNTIMES:
        raise ManifestError(
            f"Unsupported runtime '{runtime}'. "
            f"Supported: {sorted(SUPPORTED_RUNTIMES)}"
        )

    age = manifest.get("age_rating", "Everyone")
    if age not in VALID_AGE_RATINGS:
        raise ManifestError(
            f"Invalid age_rating '{age}'. Valid: {sorted(VALID_AGE_RATINGS)}"
        )

    perms = manifest.get("permissions", [])
    for p in perms:
        if p not in VALID_PERMISSIONS:
            raise ManifestError(f"Unknown permission '{p}'.")

    kb = manifest.get("keyboard_usage", "none")
    if kb not in VALID_KEYBOARD_USAGE:
        raise ManifestError(
            f"Invalid keyboard_usage '{kb}'. Valid: {sorted(VALID_KEYBOARD_USAGE)}"
        )

    ctrl_required = manifest.get("controller_required", True)
    if not isinstance(ctrl_required, bool):
        raise ManifestError("controller_required must be a boolean.")

    entry: str = manifest["entry"]
    if ".." in entry or entry.startswith("/"):
        raise ManifestError(
            f"Dangerous entry path '{entry}'. Must be a relative path."
        )

    ram = manifest.get("min_ram_mb", 0)
    if not isinstance(ram, (int, float)) or ram < 0:
        raise ManifestError("min_ram_mb must be a non-negative number.")


def load_and_validate(path: str, dev_mode: bool = False) -> dict:
    m = load(path)
    validate(m, dev_mode=dev_mode)
    return m

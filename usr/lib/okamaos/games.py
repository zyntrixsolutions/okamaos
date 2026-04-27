"""Game registry — list and query installed .ok games."""

import os
import json
from pathlib import Path

GAMES_DIR = os.environ.get("OKAMA_GAMES", "/var/okamaos/games")


def list_installed() -> list:
    """Return list of manifest dicts for all installed games."""
    installed = []
    try:
        for d in sorted(Path(GAMES_DIR).iterdir()):
            if not d.is_dir():
                continue
            mf = d / "manifest.ok.json"
            if mf.exists():
                try:
                    with open(mf) as f:
                        installed.append(json.load(f))
                except (json.JSONDecodeError, OSError):
                    pass
    except FileNotFoundError:
        pass
    return installed


def find_by_id(game_id: str) -> dict | None:
    for g in list_installed():
        if g.get("id") == game_id:
            return g
    return None


def game_dir(game_id: str) -> str:
    return os.path.join(GAMES_DIR, game_id)

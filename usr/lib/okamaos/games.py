"""Game registry - list, query, and safely replace installed .ok games."""

import os
import json
import shutil
import tarfile
import tempfile
import datetime as _dt
from pathlib import Path

GAMES_DIR = os.environ.get("OKAMA_GAMES", "/var/okamaos/games")
UPDATES_DIR = os.environ.get("OKAMA_UPDATES", "/var/okamaos/updates")
_SAVE_NAMES = {
    "save",
    "saves",
    "save_data",
    "userdata",
    "profiles",
    "data",
    "save_state.json",
    "scores.json",
    "settings.json",
}


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


def install_package(ok_path: str, dev_mode: bool = False) -> dict:
    """Install or replace a .ok package without dropping local save data.

    The old game directory is archived under the update backup directory before
    replacement. Common save-data files/directories are copied into the new
    install when the package did not provide them.
    """
    import okamaos.package as pkg_mod

    manifest = pkg_mod.verify(ok_path, dev_mode=dev_mode)
    game_id = manifest["id"]
    dest = Path(game_dir(game_id))
    dest.parent.mkdir(parents=True, exist_ok=True)

    backup = backup_game(game_id) if dest.exists() else ""
    preserved = _collect_save_data(dest) if dest.exists() else []

    tmp_parent = Path(tempfile.mkdtemp(prefix=f".{game_id}.", dir=str(dest.parent)))
    tmp_dest = tmp_parent / "game"
    try:
        pkg_mod.extract(ok_path, str(tmp_dest))
        if dest.exists():
            shutil.rmtree(dest)
        shutil.move(str(tmp_dest), str(dest))
        _restore_save_data(dest, preserved)
        if backup:
            marker = dest / ".okamaos-backup"
            marker.write_text(backup + "\n", encoding="utf-8")
    finally:
        shutil.rmtree(tmp_parent, ignore_errors=True)
    return manifest


def backup_game(game_id: str) -> str:
    src = Path(game_dir(game_id))
    if not src.exists():
        return ""
    stamp = _dt.datetime.now(_dt.UTC).strftime("%Y%m%dT%H%M%SZ")
    backup_dir = Path(UPDATES_DIR) / "game-backups"
    backup_dir.mkdir(parents=True, exist_ok=True)
    backup_path = backup_dir / f"{game_id}-{stamp}.tar.gz"
    with tarfile.open(backup_path, "w:gz") as tf:
        tf.add(src, arcname=game_id)
    return str(backup_path)


def _collect_save_data(src: Path) -> list:
    if not src.exists():
        return []
    tmp = Path(tempfile.mkdtemp(prefix="okama-game-save-"))
    preserved = []
    try:
        for item in src.iterdir():
            name = item.name
            if name not in _SAVE_NAMES and not name.endswith((".sav", ".save")):
                continue
            dest = tmp / name
            if item.is_dir():
                shutil.copytree(item, dest)
            elif item.is_file():
                shutil.copy2(item, dest)
            preserved.append((name, dest))
    finally:
        if not preserved:
            shutil.rmtree(tmp, ignore_errors=True)
    return preserved


def _restore_save_data(dest: Path, preserved: list) -> None:
    try:
        for name, src in preserved:
            target = dest / name
            if target.exists():
                continue
            if src.is_dir():
                shutil.copytree(src, target)
            elif src.is_file():
                shutil.copy2(src, target)
    finally:
        if preserved:
            shutil.rmtree(preserved[0][1].parent, ignore_errors=True)

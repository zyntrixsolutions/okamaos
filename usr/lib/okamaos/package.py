"""Build, inspect, and extract .ok packages (tar+zstd or tar+gz)."""

import os
import tarfile
import json
import hashlib
import tempfile
import shutil
from pathlib import Path

from .manifest import load_and_validate, ManifestError

EXT = ".ok"
COMPRESSION = "gz"  # 'gz' or 'xz'; zstd requires tarfile streaming workaround


def _tar_mode(writing: bool = True) -> str:
    if COMPRESSION == "gz":
        return "w:gz" if writing else "r:gz"
    return "w:xz" if writing else "r:xz"


def build(source_dir: str, output_path: str, dev_mode: bool = False) -> str:
    """Pack source_dir into an .ok archive at output_path. Returns output_path."""
    src = Path(source_dir).resolve()
    manifest_path = src / "manifest.ok.json"

    if not manifest_path.exists():
        raise ManifestError(f"No manifest.ok.json found in {src}")

    manifest = load_and_validate(str(manifest_path), dev_mode=dev_mode)

    entry = src / manifest["entry"]
    if not entry.exists():
        raise ManifestError(f"Entry file not found: {entry}")

    _check_safe_paths(src)

    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    with tarfile.open(str(out), _tar_mode(writing=True)) as tf:
        tf.add(str(src), arcname=".", recursive=True)

    return str(out)


def inspect(ok_path: str) -> dict:
    """Return manifest dict from an .ok archive without fully extracting it."""
    with tarfile.open(ok_path, _tar_mode(writing=False)) as tf:
        try:
            member = tf.getmember("./manifest.ok.json")
        except KeyError:
            try:
                member = tf.getmember("manifest.ok.json")
            except KeyError:
                raise ManifestError("No manifest.ok.json inside package.")
        f = tf.extractfile(member)
        return json.load(f)


def verify(ok_path: str, dev_mode: bool = False) -> dict:
    """Inspect + validate the manifest. Returns manifest on success."""
    manifest = inspect(ok_path)
    from .manifest import validate
    validate(manifest, dev_mode=dev_mode)
    _verify_no_traversal(ok_path)
    return manifest


def extract(ok_path: str, dest_dir: str) -> str:
    """Extract .ok into dest_dir. Returns dest_dir."""
    _verify_no_traversal(ok_path)
    dest = Path(dest_dir)
    dest.mkdir(parents=True, exist_ok=True)
    with tarfile.open(ok_path, _tar_mode(writing=False)) as tf:
        tf.extractall(path=str(dest))
    return str(dest)


def _check_safe_paths(src: Path) -> None:
    for p in src.rglob("*"):
        rel = p.relative_to(src)
        parts = rel.parts
        if any(part == ".." for part in parts):
            raise ManifestError(f"Dangerous path in source: {rel}")


def _verify_no_traversal(ok_path: str) -> None:
    with tarfile.open(ok_path, _tar_mode(writing=False)) as tf:
        for member in tf.getmembers():
            if ".." in member.name or member.name.startswith("/"):
                raise ManifestError(
                    f"Path traversal detected in package: {member.name}"
                )

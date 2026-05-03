"""Build, inspect, and extract .ok packages.

Supports:
  - tar+gz (produced by okama-pack build)
  - ZIP (produced by Okama Studio JSZip builder)
Reading always auto-detects the archive format.
"""

import os
import tarfile
import zipfile
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
        return "w:gz" if writing else "r:*"
    return "w:xz" if writing else "r:*"


def _is_zip(ok_path: str) -> bool:
    """Return True if the file is a ZIP archive.

    Fast-path checks the first four magic bytes; falls back to Python's
    structural zipfile.is_zipfile() so edge-case archives (e.g. self-extracting
    prefixes, spanned zips, empty zips) are still recognised.
    """
    try:
        with open(ok_path, "rb") as f:
            sig = f.read(4)
            if sig in (b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08"):
                return True
    except OSError:
        return False
    # Fallback: let Python verify the End-of-Central-Directory record.
    return zipfile.is_zipfile(ok_path)


def _sniff_content(ok_path: str) -> str:
    """Return a short description of the file content for diagnostic errors."""
    try:
        with open(ok_path, "rb") as f:
            header = f.read(256)
    except OSError:
        return "unreadable file"
    if not header:
        return "empty file"
    if header[:4] in (b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08"):
        return "ZIP archive"
    if header[:2] == b"\x1f\x8b":
        return "gzip data"
    if header.startswith(b"ustar") or header.startswith(b"\x00" * 100 + b"ustar"):
        return "tar archive"
    text = header.decode("utf-8", "replace")
    if text.lstrip().startswith("<"):
        return "HTML document (likely a 404 / redirect page)"
    if text.lstrip().startswith(("{", "[")):
        return "JSON document"
    return f"unknown content ({len(header)} bytes read)"


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
    if _is_zip(ok_path):
        return _inspect_zip(ok_path)
    try:
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
    except tarfile.ReadError as exc:
        content = _sniff_content(ok_path)
        raise ManifestError(
            f"Cannot open package — file appears to be {content}. "
            f"(tar/zip error: {exc})"
        ) from exc


def _inspect_zip(ok_path: str) -> dict:
    """Read manifest from a ZIP-format .ok package (built by Okama Studio)."""
    with zipfile.ZipFile(ok_path, "r") as zf:
        names = zf.namelist()
        mf_name = next(
            (n for n in names if n == "manifest.ok.json" or n.endswith("/manifest.ok.json")),
            None,
        )
        if mf_name is None:
            raise ManifestError("No manifest.ok.json inside package.")
        with zf.open(mf_name) as f:
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
    if _is_zip(ok_path):
        with zipfile.ZipFile(ok_path, "r") as zf:
            zf.extractall(path=str(dest))
    else:
        with tarfile.open(ok_path, _tar_mode(writing=False)) as tf:
            tf.extractall(path=str(dest))
    return str(dest)


def bundle_deps(source_dir: str, python_deps: list, extra_index: str = "") -> str:
    """pip install python_deps into <source_dir>/site-packages/ for self-contained packaging.

    The bundled site-packages directory is automatically included when
    okama-pack builds the .ok archive.  okama-run prepends it to PYTHONPATH
    at launch so the game runs without any host-wide pip installs.

    Returns the path to site-packages/.
    """
    import subprocess
    import sys as _sys
    sp = os.path.join(source_dir, "site-packages")
    os.makedirs(sp, exist_ok=True)
    cmd = [_sys.executable, "-m", "pip", "install",
           "--target", sp, "--quiet"] + list(python_deps)
    if extra_index:
        cmd += ["--extra-index-url", extra_index]
    subprocess.check_call(cmd)
    return sp


def _check_safe_paths(src: Path) -> None:
    for p in src.rglob("*"):
        rel = p.relative_to(src)
        parts = rel.parts
        if any(part == ".." for part in parts):
            raise ManifestError(f"Dangerous path in source: {rel}")


def _verify_no_traversal(ok_path: str) -> None:
    if _is_zip(ok_path):
        with zipfile.ZipFile(ok_path, "r") as zf:
            for name in zf.namelist():
                if ".." in name or name.startswith("/"):
                    raise ManifestError(
                        f"Path traversal detected in package: {name}"
                    )
    else:
        try:
            with tarfile.open(ok_path, _tar_mode(writing=False)) as tf:
                for member in tf.getmembers():
                    if ".." in member.name or member.name.startswith("/"):
                        raise ManifestError(
                            f"Path traversal detected in package: {member.name}"
                        )
        except tarfile.ReadError as exc:
            content = _sniff_content(ok_path)
            raise ManifestError(
                f"Cannot read package — file appears to be {content}. "
                f"(tar error: {exc})"
            ) from exc

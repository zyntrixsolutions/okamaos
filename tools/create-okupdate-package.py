#!/usr/bin/env python3
"""Build an OkamaOS system `.okupdate` bundle from the current checkout."""

import argparse
import json
import os
import tarfile
import tempfile
from pathlib import Path


DEFAULT_INCLUDE_GLOBS = [
    "usr/bin/okama-*",
    "usr/lib/okamaos/*.py",
    "usr/share/okamaos/brand/*",
    "board/okamaos/rootfs-overlay/etc/init.d/S*",
    "board/okamaos/rootfs-overlay/etc/profile",
]

TARGET_RENAMES = {
    "board/okamaos/rootfs-overlay/etc/profile":
        "etc/profile",
}

PRESERVE_PATHS = [
    "/var/okamaos/games",
    "/var/okamaos/saves",
    "/var/okamaos/logs",
    "/var/okamaos/cache",
    "/var/okamaos/controllers",
    "/var/okamaos/updates",
    "/etc/okamaos/parent.conf",
    "/etc/okamaos/devmode.conf",
]


def gather_files(repo: Path) -> list[tuple[Path, str]]:
    files = []
    for pattern in DEFAULT_INCLUDE_GLOBS:
        for path in sorted(repo.glob(pattern)):
            if path.is_file():
                rel = path.relative_to(repo).as_posix()
                target = TARGET_RENAMES.get(rel, rel)
                if rel.startswith("board/okamaos/rootfs-overlay/"):
                    target = rel.removeprefix("board/okamaos/rootfs-overlay/")
                files.append((path, target))
    return files


def main() -> None:
    parser = argparse.ArgumentParser(prog="create-okupdate-package")
    parser.add_argument("--version", required=True)
    parser.add_argument("--codename", required=True)
    parser.add_argument("--summary", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--repo", default=".")
    args = parser.parse_args()

    repo = Path(args.repo).resolve()
    output = Path(args.output).resolve()
    files = gather_files(repo)

    manifest = {
        "schema_version": "2.0",
        "type": "okamaos-system-update",
        "version": args.version,
        "codename": args.codename,
        "channel": "public-preview",
        "date": "2026-04-30",
        "summary": args.summary,
        "overlay_root": "files",
        "requires_reboot": True,
        "preserve_paths": PRESERVE_PATHS,
        "config_merges": [
            {
                "path": "/etc/okamaos/okama.conf",
                "set": {
                    "VERSION": args.version,
                    "CODENAME": args.codename,
                },
                "defaults": {
                    "UPDATE_FEED_URL": "https://zyntrixsolutions.github.io/okamaos/updates/feed.json",
                    "APP_CATALOG_URL": "https://zyntrixsolutions.github.io/okamaos/catalog/apps.json",
                    "UPDATE_CHECK_ENABLED": "yes",
                    "UPDATE_CHECK_TIMEOUT_SEC": "2",
                    "UPDATE_BACKUP_DIR": "/var/okamaos/updates/backups",
                    "UPDATE_HISTORY_DIR": "/var/okamaos/updates/history",
                    "SYSTEM_KEYBOARD_ENABLED": "yes",
                    "BLUETOOTH_ENABLED": "auto",
                    "INTERNET_PROBE_TIMEOUT_SEC": "0.75",
                },
            }
        ],
        "files": [
            {"target": f"/{target}", "source": f"files/{target}"}
            for _, target in files
        ],
    }

    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="okama-okupdate-") as tmp_name:
        tmp = Path(tmp_name)
        manifest_path = tmp / "manifest.okupdate.json"
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")

        for source, target in files:
            dest = tmp / "files" / target
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(source.read_bytes())

        with tarfile.open(output, "w:gz") as tf:
            tf.add(manifest_path, arcname="manifest.okupdate.json")
            tf.add(tmp / "files", arcname="files")

    print(f"Built: {output} ({output.stat().st_size} bytes)")


if __name__ == "__main__":
    main()

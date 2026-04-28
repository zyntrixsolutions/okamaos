"""OkamaOS system update checker.

Fetches a release manifest from the update server and compares it against the
installed version.  The update server URL can be overridden in okama.conf via
the UPDATE_URL key.

Remote release manifest JSON:
  {
    "version":      "0.6.0",
    "notes":        "Bug fixes and UI improvements.",
    "download_url": "https://store.okamaos.io/os/okamaos-0.6.0.ok-update",
    "checksum":     "sha256:<hex>",
    "size_bytes":   52428800,
    "min_version":  "0.4.0"
  }
"""

import json
import os
import urllib.error
import urllib.request
from typing import Optional

UPDATE_URL_DEFAULT = "https://store.okamaos.io/os/latest.json"
FETCH_TIMEOUT = 10

_VERSION_CANDIDATES = [
    "/usr/lib/okamaos/VERSION",
    "/etc/okamaos/VERSION",
    os.path.join(os.path.dirname(os.path.realpath(__file__)), "..", "..", "VERSION"),
]


class UpdateError(Exception):
    pass


def current_version() -> str:
    """Return the installed OkamaOS version string, or 'unknown'."""
    for path in _VERSION_CANDIDATES:
        try:
            with open(os.path.abspath(path)) as f:
                v = f.read().strip()
            if v:
                return v
        except FileNotFoundError:
            continue
    return "unknown"


def fetch_release_info(url: Optional[str] = None, timeout: int = FETCH_TIMEOUT) -> dict:
    """Fetch the latest release metadata from the update server.

    Returns a dict containing at minimum 'version' and 'download_url'.
    Raises UpdateError on network or parse failure.
    """
    url = url or UPDATE_URL_DEFAULT
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "OkamaOS/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.load(resp)
        if "version" not in data:
            raise UpdateError("Update manifest missing 'version' field.")
        return data
    except urllib.error.URLError as e:
        raise UpdateError(f"Network error: {e.reason}")
    except json.JSONDecodeError as e:
        raise UpdateError(f"Bad response from update server: {e}")
    except UpdateError:
        raise
    except Exception as e:
        raise UpdateError(f"Update check failed: {e}")


def is_newer(current: str, remote: str) -> bool:
    """Return True if remote version is strictly newer than current."""
    def _parts(v: str):
        try:
            return tuple(int(x) for x in v.strip().lstrip("v").split("."))
        except ValueError:
            return (0,)
    return _parts(remote) > _parts(current)


def find_local_updates(search_paths: Optional[list] = None) -> list:
    """Scan common mount points for *.ok-update files and return their paths."""
    if search_paths is None:
        search_paths = ["/mnt", "/media", "/var/okamaos/updates", "/tmp"]
    found = []
    for base in search_paths:
        if not os.path.isdir(base):
            continue
        try:
            for root, _dirs, files in os.walk(base):
                for fn in files:
                    if fn.endswith(".ok-update"):
                        found.append(os.path.join(root, fn))
        except PermissionError:
            pass
    return sorted(found)

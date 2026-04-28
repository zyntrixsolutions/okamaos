"""OkamaOS Game Store client.

Fetches a JSON catalog from the OkamaOS store server and downloads .ok packages.
The catalog URL can be overridden in okama.conf via the STORE_URL key.

Catalog JSON format:
  {
    "version": 1,
    "games": [
      {
        "id":           "com.okamaos.demo",
        "name":         "Demo Game",
        "version":      "1.0.0",
        "description":  "A short description.",
        "size_bytes":   5242880,
        "download_url": "https://store.okamaos.io/packages/demo.ok",
        "checksum":     "sha256:<hex>",
        "category":     "demo",
        "age_rating":   "Everyone"
      },
      ...
    ]
  }
"""

import hashlib
import json
import os
import urllib.error
import urllib.request
from typing import Callable, Optional

CATALOG_URL_DEFAULT = "https://store.okamaos.io/catalog.json"
DOWNLOAD_TIMEOUT = 60  # seconds
FETCH_TIMEOUT = 10     # seconds


class StoreError(Exception):
    pass


def catalog_url(conf=None) -> str:
    if conf:
        return conf.get("STORE_URL", CATALOG_URL_DEFAULT)
    return CATALOG_URL_DEFAULT


def fetch_catalog(url: Optional[str] = None, timeout: int = FETCH_TIMEOUT) -> dict:
    """Fetch and return the game catalog dict from the store.

    Returns a dict with at minimum a 'games' list.
    Raises StoreError on network or parse failure.
    """
    url = url or CATALOG_URL_DEFAULT
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "OkamaOS/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.load(resp)
        if not isinstance(data, dict) or "games" not in data:
            raise StoreError("Invalid catalog: missing 'games' list.")
        return data
    except urllib.error.URLError as e:
        raise StoreError(f"Network error: {e.reason}")
    except json.JSONDecodeError as e:
        raise StoreError(f"Invalid catalog JSON: {e}")
    except StoreError:
        raise
    except Exception as e:
        raise StoreError(f"Catalog fetch failed: {e}")


def download_game(
    entry: dict,
    dest_path: str,
    progress_cb: Optional[Callable[[int, int], None]] = None,
    timeout: int = DOWNLOAD_TIMEOUT,
) -> str:
    """Download a game .ok package to dest_path.

    entry     : a game dict from the catalog (must have 'download_url').
    dest_path : where to write the .ok file.
    progress_cb : optional callable(bytes_received, total_bytes).
    Returns dest_path on success.
    Raises StoreError on network or checksum failure.
    """
    url = entry.get("download_url")
    if not url:
        raise StoreError("Catalog entry missing 'download_url'.")

    expected = entry.get("checksum", "")  # "sha256:<hex>" or ""

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "OkamaOS/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            total = int(
                resp.headers.get("Content-Length")
                or entry.get("size_bytes", 0)
                or 0
            )
            received = 0
            h = hashlib.sha256()
            os.makedirs(os.path.dirname(os.path.abspath(dest_path)), exist_ok=True)
            with open(dest_path, "wb") as f:
                while True:
                    chunk = resp.read(65536)
                    if not chunk:
                        break
                    f.write(chunk)
                    h.update(chunk)
                    received += len(chunk)
                    if progress_cb and total:
                        progress_cb(received, total)
    except urllib.error.URLError as e:
        raise StoreError(f"Download failed: {e.reason}")
    except OSError as e:
        raise StoreError(f"Write error: {e}")

    if expected:
        algo, _, expected_hex = expected.partition(":")
        if algo == "sha256" and h.hexdigest() != expected_hex:
            try:
                os.remove(dest_path)
            except OSError:
                pass
            raise StoreError("Checksum mismatch — package corrupted or tampered.")

    return dest_path


def format_size(size_bytes: int) -> str:
    """Return a compact human-readable size string."""
    if size_bytes <= 0:
        return "? MB"
    if size_bytes < 1024:
        return f"{size_bytes} B"
    if size_bytes < 1024 * 1024:
        return f"{size_bytes // 1024} KB"
    return f"{size_bytes / (1024 * 1024):.1f} MB"

"""OkamaOS update checks for system and installed game notifications."""

import datetime as _dt
import hashlib
import json
import os
import urllib.error
import urllib.request
from typing import Optional

UPDATE_URL_DEFAULT = "https://zyntrixsolutions.github.io/okamaos/updates/feed.json"
CATALOG_URL_DEFAULT = "https://zyntrixsolutions.github.io/okamaos/catalog/apps.json"
FETCH_TIMEOUT = 10

DEFAULT_UPDATE_FEED_URL = UPDATE_URL_DEFAULT
DEFAULT_APP_CATALOG_URL = CATALOG_URL_DEFAULT

_VERSION_CANDIDATES = [
    "/usr/lib/okamaos/VERSION",
    "/etc/okamaos/VERSION",
    "/VERSION",
    os.path.join(os.path.dirname(os.path.realpath(__file__)), "..", "..", "..", "VERSION"),
]


class UpdateError(Exception):
    pass


def _conf_value(key: str, default: str) -> str:
    try:
        import okamaos.config as cfg_mod
        return os.environ.get(f"OKAMA_{key}", cfg_mod.get().get(key, default))
    except Exception:
        return os.environ.get(f"OKAMA_{key}", default)


def _timeout() -> int:
    try:
        return int(float(_conf_value("UPDATE_CHECK_TIMEOUT_SEC", str(FETCH_TIMEOUT))))
    except ValueError:
        return FETCH_TIMEOUT


def _load_json(url: str, timeout: int) -> dict:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "OkamaOS/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.load(resp)
        if not isinstance(data, dict):
            raise UpdateError("Response was not a JSON object.")
        return data
    except urllib.error.URLError as e:
        reason = getattr(e, "reason", e)
        raise UpdateError(f"Network error: {reason}")
    except json.JSONDecodeError as e:
        raise UpdateError(f"Bad response from update server: {e}")
    except UpdateError:
        raise
    except Exception as e:
        raise UpdateError(f"Update check failed: {e}")


def current_version() -> str:
    """Return the installed OkamaOS version string, or 'unknown'."""
    for path in _VERSION_CANDIDATES:
        try:
            with open(os.path.abspath(path), encoding="utf-8") as f:
                v = f.read().strip()
            if v:
                return v
        except FileNotFoundError:
            continue
        except OSError:
            continue
    try:
        import okamaos.config as cfg_mod
        v = cfg_mod.get().get("VERSION", "")
        if v:
            return v
    except Exception:
        pass
    return "unknown"


def version_tuple(version: str) -> tuple:
    parts = []
    raw = str(version or "0").strip().lstrip("v")
    for chunk in raw.split("."):
        digits = ""
        for ch in chunk:
            if ch.isdigit():
                digits += ch
            else:
                break
        parts.append(int(digits or 0))
    while len(parts) < 3:
        parts.append(0)
    return tuple(parts[:3])


def is_newer(current: str, remote: str) -> bool:
    """Return True if remote version is strictly newer than current."""
    return version_tuple(remote) > version_tuple(current)


def fetch_release_info(url: Optional[str] = None, timeout: int = FETCH_TIMEOUT) -> dict:
    """Fetch the latest OS release metadata from GitHub Pages."""
    if url is None:
        url = _conf_value("UPDATE_URL", UPDATE_URL_DEFAULT)
    data = _load_json(url, timeout)
    latest = data.get("latest", data)
    if "version" not in latest:
        raise UpdateError("Update manifest missing 'version' field.")
    return latest


def fetch_catalog(url: Optional[str] = None, timeout: Optional[int] = None) -> dict:
    """Fetch the game/app catalog used for installed-game update notices."""
    if url is None:
        url = _conf_value("STORE_URL", CATALOG_URL_DEFAULT)
    return _load_json(url, timeout or _timeout())


def _catalog_entries(catalog: dict) -> list:
    entries = catalog.get("games")
    if isinstance(entries, list):
        return entries
    entries = catalog.get("apps")
    if isinstance(entries, list):
        return entries
    return []


def check_os_update(current: Optional[str] = None) -> dict | None:
    current = current or current_version()
    info = fetch_release_info(timeout=_timeout())
    remote = info.get("version", "")
    if not remote or not is_newer(current, remote):
        return None
    checksum = info.get("checksum", info.get("sha256", ""))
    if checksum.startswith("sha256:"):
        checksum = checksum.split(":", 1)[1]
    return {
        "type": "os",
        "id": "okamaos",
        "name": "OkamaOS",
        "current_version": current,
        "version": remote,
        "title": info.get("title", "OkamaOS update available"),
        "summary": info.get("summary", info.get("notes", "")),
        "download_url": info.get("download_url", ""),
        "sha256": checksum,
        "size_bytes": info.get("size_bytes", 0),
        "priority": info.get("priority", "recommended"),
    }


def check_game_updates(installed: Optional[list] = None) -> list:
    if installed is None:
        import okamaos.games as games_mod
        installed = games_mod.list_installed()
    installed_by_id = {g.get("id"): g for g in installed if g.get("id")}
    notices = []
    catalog = fetch_catalog(timeout=_timeout())
    for entry in _catalog_entries(catalog):
        game_id = entry.get("id")
        if not game_id or game_id not in installed_by_id:
            continue
        status = entry.get("status", "available")
        if status not in ("available", "published", ""):
            continue
        local = installed_by_id[game_id]
        remote_version = entry.get("version", "")
        if not remote_version or not is_newer(local.get("version", ""), remote_version):
            continue
        checksum = entry.get("checksum", entry.get("sha256", ""))
        if checksum.startswith("sha256:"):
            checksum = checksum.split(":", 1)[1]
        notices.append({
            "type": "game",
            "id": game_id,
            "name": entry.get("name", game_id),
            "current_version": local.get("version", "unknown"),
            "version": remote_version,
            "title": f"{entry.get('name', game_id)} update available",
            "summary": entry.get("tagline", entry.get("description", "")),
            "download_url": entry.get("download_url", ""),
            "sha256": checksum,
            "size_bytes": entry.get("size_bytes", 0),
            "priority": "available",
        })
    return notices


def check_all_updates(installed: Optional[list] = None) -> dict:
    """Return a single notification summary for OS and installed games."""
    result = {
        "checked_at": _dt.datetime.now(_dt.UTC).isoformat(),
        "os_update": None,
        "game_updates": [],
        "errors": [],
    }
    enabled = _conf_value("UPDATE_NOTIFICATIONS", "yes").lower() == "yes"
    if not enabled:
        return result
    try:
        result["os_update"] = check_os_update()
    except Exception as e:
        result["errors"].append(f"OS update check failed: {e}")
    try:
        result["game_updates"] = check_game_updates(installed=installed)
    except Exception as e:
        result["errors"].append(f"Game update check failed: {e}")
    result["count"] = (1 if result["os_update"] else 0) + len(result["game_updates"])
    return result


def check_all(current_version: Optional[str] = None, installed: Optional[list] = None) -> tuple[list, str | None]:
    """Compatibility wrapper returning notices plus a combined error string."""
    summary = check_all_updates(installed=installed)
    notices = []
    if summary.get("os_update"):
        notices.append(summary["os_update"])
    notices.extend(summary.get("game_updates", []))
    error = "; ".join(summary.get("errors", [])) or None
    return notices, error


def read_update_state(path: Optional[str] = None) -> dict:
    if path is None:
        path = _conf_value("UPDATE_STATE_FILE", "/var/okamaos/updates/update-state.json")
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, OSError, json.JSONDecodeError):
        return {}


def write_update_state(state: dict, path: Optional[str] = None) -> None:
    if path is None:
        path = _conf_value("UPDATE_STATE_FILE", "/var/okamaos/updates/update-state.json")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = f"{path}.tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, sort_keys=True)
    os.replace(tmp, path)


def find_local_updates(search_paths: Optional[list] = None) -> list:
    """Scan common mount points for *.okupdate/*.ok-update files."""
    if search_paths is None:
        search_paths = ["/mnt", "/media", "/var/okamaos/updates", "/tmp"]
    found = []
    for base in search_paths:
        if not os.path.isdir(base):
            continue
        try:
            for root, _dirs, files in os.walk(base):
                for fn in files:
                    if fn.endswith((".okupdate", ".ok-update")):
                        found.append(os.path.join(root, fn))
        except PermissionError:
            pass
    return sorted(found)


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

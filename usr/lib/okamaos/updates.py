"""Public update-feed checks for OS and installed game notifications."""

import json
import os
import urllib.request

import okamaos.config as cfg_mod
import okamaos.games as games_mod


DEFAULT_UPDATE_FEED_URL = "https://zyntrixsolutions.github.io/okamaos/updates/feed.json"
DEFAULT_APP_CATALOG_URL = "https://zyntrixsolutions.github.io/okamaos/catalog/apps.json"


def version_tuple(version: str) -> tuple:
    parts = []
    for raw in str(version or "0").split("."):
        digits = ""
        for ch in raw:
            if ch.isdigit():
                digits += ch
            else:
                break
        parts.append(int(digits or 0))
    while len(parts) < 3:
        parts.append(0)
    return tuple(parts[:3])


def is_newer(remote_version: str, local_version: str) -> bool:
    return version_tuple(remote_version) > version_tuple(local_version)


def _load_json(source: str, timeout: float) -> dict:
    if source.startswith(("http://", "https://")):
        with urllib.request.urlopen(source, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    with open(source) as f:
        return json.load(f)


def _conf_value(key: str, default: str) -> str:
    return os.environ.get(key, cfg_mod.get().get(key, default))


def check_os_update(current_version: str | None = None) -> dict | None:
    conf = cfg_mod.get()
    current = current_version or conf.get("VERSION", "0.0.0")
    feed_url = os.environ.get(
        "OKAMA_UPDATE_FEED_URL",
        _conf_value("UPDATE_FEED_URL", DEFAULT_UPDATE_FEED_URL),
    )
    timeout = float(_conf_value("UPDATE_CHECK_TIMEOUT_SEC", "2"))
    feed = _load_json(feed_url, timeout)
    latest = feed.get("latest", {})
    remote_version = latest.get("version", "")

    if not remote_version or not is_newer(remote_version, current):
        return None

    return {
        "type": "os",
        "id": "okamaos",
        "name": "OkamaOS",
        "current_version": current,
        "version": remote_version,
        "title": latest.get("title", "OkamaOS update available"),
        "summary": latest.get("summary", ""),
        "download_url": latest.get("download_url", ""),
        "priority": latest.get("priority", "recommended"),
    }


def check_game_updates(installed: list | None = None) -> list:
    installed_games = installed if installed is not None else games_mod.list_installed()
    installed_by_id = {g.get("id"): g for g in installed_games if g.get("id")}
    catalog_url = os.environ.get(
        "OKAMA_APP_CATALOG_URL",
        _conf_value("APP_CATALOG_URL", DEFAULT_APP_CATALOG_URL),
    )
    timeout = float(_conf_value("UPDATE_CHECK_TIMEOUT_SEC", "2"))
    catalog = _load_json(catalog_url, timeout)
    notices = []

    for app in catalog.get("apps", []):
        app_id = app.get("id")
        if app.get("status") != "available" or app_id not in installed_by_id:
            continue
        local = installed_by_id[app_id]
        if is_newer(app.get("version", ""), local.get("version", "")):
            notices.append({
                "type": "game",
                "id": app_id,
                "name": app.get("name", app_id),
                "current_version": local.get("version", "0.0.0"),
                "version": app.get("version", ""),
                "title": f"{app.get('name', app_id)} update available",
                "summary": app.get("tagline", app.get("description", "")),
                "download_url": app.get("download_url", ""),
                "priority": "available",
            })

    return notices


def check_all(current_version: str | None = None,
              installed: list | None = None) -> tuple[list, str | None]:
    if _conf_value("UPDATE_CHECK_ENABLED", "yes").lower() != "yes":
        return [], None

    notices = []
    errors = []

    try:
        os_notice = check_os_update(current_version=current_version)
        if os_notice:
            notices.append(os_notice)
    except Exception as exc:
        errors.append(f"OS update check failed: {exc}")

    try:
        notices.extend(check_game_updates(installed=installed))
    except Exception as exc:
        errors.append(f"Game update check failed: {exc}")

    return notices, "; ".join(errors) if errors else None

"""Read and write /etc/okamaos/okama.conf (and friends) as plain key=value."""

import os
import re

_DEFAULTS = {
    "VERSION": "1.1.1",
    "UPDATE_FEED_URL": "https://zyntrixsolutions.github.io/okamaos/updates/feed.json",
    "APP_CATALOG_URL": "https://zyntrixsolutions.github.io/okamaos/catalog/apps.json",
    "UPDATE_CHECK_ENABLED": "yes",
    "UPDATE_CHECK_TIMEOUT_SEC": "2",
    "UPDATE_BACKUP_DIR": "/var/okamaos/updates/backups",
    "UPDATE_HISTORY_DIR": "/var/okamaos/updates/history",
    "DISPLAY_MODE": "framebuffer",
    "FRAMEBUFFER_DEVICE": "/dev/fb0",
    "TARGET_FPS": "30",
    "AUDIO_BACKEND": "alsa",
    "DEFAULT_VOLUME": "80",
    "CONTROLLER_PREFER": "usb",
    "SYSTEM_KEYBOARD_ENABLED": "yes",
    "KEYBOARD_FALLBACK": "yes",
    "BLUETOOTH_ENABLED": "auto",
    "BT_SCAN_TIMEOUT": "30",
    "BT_AUTO_RECONNECT": "yes",
    "NETWORK_ENABLED": "yes",
    "WIFI_ENABLED": "no",
    "INTERNET_PROBE_TIMEOUT_SEC": "0.75",
    "GAMES_DIR": "/var/okamaos/games",
    "SAVES_DIR": "/var/okamaos/saves",
    "LOGS_DIR": "/var/okamaos/logs",
    "CACHE_DIR": "/var/okamaos/cache",
    "UPDATES_DIR": "/var/okamaos/updates",
    "CONTROLLERS_DIR": "/var/okamaos/controllers",
    "DEVELOPER_MODE": "no",
    "PARENT_MODE_ENABLED": "yes",
    "MAX_GAME_RAM_MB": "1800",
    "IDLE_RAM_BUDGET_MB": "250",
}

CONF_PATH = os.environ.get("OKAMA_CONF", "/etc/okamaos/okama.conf")
DEV_CONF_PATH = os.environ.get("OKAMA_DEV_CONF", "/etc/okamaos/devmode.conf")


def _parse_kv(path: str) -> dict:
    result = {}
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                m = re.match(r"^([A-Z_]+)=(.*)$", line)
                if m:
                    result[m.group(1)] = m.group(2).strip()
    except FileNotFoundError:
        pass
    return result


def _write_kv(path: str, data: dict) -> None:
    lines = []
    try:
        with open(path) as f:
            raw = f.readlines()
    except FileNotFoundError:
        raw = []

    written = set()
    for line in raw:
        stripped = line.strip()
        if stripped.startswith("#") or not stripped:
            lines.append(line.rstrip("\n"))
            continue
        m = re.match(r"^([A-Z_]+)=", stripped)
        if m and m.group(1) in data:
            key = m.group(1)
            lines.append(f"{key}={data[key]}")
            written.add(key)
        else:
            lines.append(line.rstrip("\n"))

    for k, v in data.items():
        if k not in written:
            lines.append(f"{k}={v}")

    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write("\n".join(lines) + "\n")


class Config:
    def __init__(self, path: str = CONF_PATH):
        self._path = path
        self._data = {**_DEFAULTS, **_parse_kv(path)}

    def get(self, key: str, default=None):
        return self._data.get(key, default)

    def set(self, key: str, value: str) -> None:
        self._data[key] = value
        _write_kv(self._path, {key: value})

    def is_dev_mode(self) -> bool:
        d = _parse_kv(DEV_CONF_PATH)
        return d.get("ENABLED", "no").lower() == "yes"

    def set_dev_mode(self, enabled: bool) -> None:
        _write_kv(DEV_CONF_PATH, {"ENABLED": "yes" if enabled else "no"})


_conf = None


def get() -> Config:
    global _conf
    if _conf is None:
        _conf = Config()
    return _conf

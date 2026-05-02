"""Parent mode PIN validation."""

import hashlib
import os
import re

PARENT_CONF = os.environ.get("OKAMA_PARENT_CONF", "/etc/okamaos/parent.conf")
PARENT_LOCK = os.environ.get("OKAMA_PARENT_LOCK", "/var/okamaos/parent.lock")


def _read_pin_hash() -> str:
    try:
        with open(PARENT_CONF) as f:
            for line in f:
                m = re.match(r"^PIN_HASH=([a-f0-9]+)", line.strip())
                if m:
                    return m.group(1)
    except FileNotFoundError:
        pass
    return ""


def _hash_pin(pin: str) -> str:
    return hashlib.sha256(pin.encode()).hexdigest()


def verify_pin(pin: str) -> bool:
    stored = _read_pin_hash()
    if not stored:
        return True  # no pin configured — open
    return _hash_pin(pin) == stored


def set_pin(new_pin: str) -> None:
    h = _hash_pin(new_pin)
    lines = []
    written = False
    try:
        with open(PARENT_CONF) as f:
            for line in f:
                if line.startswith("PIN_HASH="):
                    lines.append(f"PIN_HASH={h}\n")
                    written = True
                else:
                    lines.append(line)
    except FileNotFoundError:
        lines = []

    if not written:
        lines.append(f"PIN_HASH={h}\n")

    os.makedirs(os.path.dirname(PARENT_CONF), exist_ok=True)
    with open(PARENT_CONF, "w") as f:
        f.writelines(lines)


def _read_conf_value(key: str, default: str = "") -> str:
    """Read a single key=value from parent.conf."""
    try:
        with open(PARENT_CONF) as f:
            for line in f:
                m = re.match(rf"^{re.escape(key)}=(.+)", line.strip())
                if m:
                    return m.group(1).strip()
    except FileNotFoundError:
        pass
    return default


def _write_conf_value(key: str, value: str) -> None:
    """Write or replace a single key=value in parent.conf."""
    lines = []
    written = False
    try:
        with open(PARENT_CONF) as f:
            for line in f:
                if line.startswith(f"{key}="):
                    lines.append(f"{key}={value}\n")
                    written = True
                else:
                    lines.append(line)
    except FileNotFoundError:
        lines = []
    if not written:
        lines.append(f"{key}={value}\n")
    os.makedirs(os.path.dirname(PARENT_CONF), exist_ok=True)
    with open(PARENT_CONF, "w") as f:
        f.writelines(lines)


def wallet_enabled() -> bool:
    """Return True if wallet transactions are allowed (default: True)."""
    return _read_conf_value("WALLET_ENABLED", "yes").lower() == "yes"


def set_wallet_enabled(enabled: bool) -> None:
    _write_conf_value("WALLET_ENABLED", "yes" if enabled else "no")


def wallet_daily_limit_okt() -> float:
    """Return the daily OKT spend limit (0 = unlimited, default: 0)."""
    try:
        return float(_read_conf_value("WALLET_DAILY_LIMIT_OKT", "0"))
    except ValueError:
        return 0.0


def set_wallet_daily_limit_okt(limit: float) -> None:
    _write_conf_value("WALLET_DAILY_LIMIT_OKT", f"{limit:.2f}")


def is_locked() -> bool:
    return os.path.exists(PARENT_LOCK)


def lock() -> None:
    open(PARENT_LOCK, "w").close()


def unlock() -> None:
    try:
        os.remove(PARENT_LOCK)
    except FileNotFoundError:
        pass

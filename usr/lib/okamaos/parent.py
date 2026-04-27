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


def is_locked() -> bool:
    return os.path.exists(PARENT_LOCK)


def lock() -> None:
    open(PARENT_LOCK, "w").close()


def unlock() -> None:
    try:
        os.remove(PARENT_LOCK)
    except FileNotFoundError:
        pass

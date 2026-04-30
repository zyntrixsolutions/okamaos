"""Bluetooth controller management helpers wrapping bluetoothctl."""

import subprocess
import json
import os
import re
import time

CONTROLLERS_DIR = os.environ.get("OKAMA_CONTROLLERS_DIR", "/var/okamaos/controllers")


def _btctl(*args, timeout: int = 10) -> str:
    """Run bluetoothctl non-interactively and return stdout."""
    try:
        result = subprocess.run(
            ["bluetoothctl"] + list(args),
            capture_output=True, text=True, timeout=timeout
        )
        return result.stdout + result.stderr
    except FileNotFoundError:
        return "ERROR: bluetoothctl not found"
    except subprocess.TimeoutExpired:
        return "ERROR: bluetoothctl timed out"


def _have_cmd(cmd: str) -> bool:
    return subprocess.call(
        ["sh", "-c", f"command -v {cmd} >/dev/null 2>&1"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    ) == 0


def ensure_ready() -> dict:
    """Power the default adapter and make BlueZ ready for controller pairing."""
    if not _have_cmd("bluetoothctl"):
        return {"available": "no", "powered": "no", "error": "bluetoothctl not found"}
    _btctl("power", "on")
    _btctl("agent", "on")
    _btctl("default-agent")
    return status()


def status() -> dict:
    if not _have_cmd("bluetoothctl"):
        return {
            "available": "no",
            "powered": "no",
            "discovering": "no",
            "connected_count": 0,
            "trusted_count": len(list_trusted()),
            "raw": "ERROR: bluetoothctl not found",
        }
    out = _btctl("show")
    available = "no" if "No default controller available" in out or out.startswith("ERROR:") else "yes"
    powered = "yes" if "Powered: yes" in out else "no"
    discovering = "yes" if "Discovering: yes" in out else "no"
    connected = connected_devices()
    return {
        "available": available,
        "powered": powered,
        "discovering": discovering,
        "connected_count": len(connected),
        "trusted_count": len(list_trusted()),
        "connected": connected,
        "raw": out.strip(),
    }


def scan(timeout: int = 15) -> list:
    """Scan for nearby BT devices. Returns list of {mac, name} dicts."""
    ensure_ready()
    try:
        subprocess.Popen(["bluetoothctl", "scan", "on"],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except FileNotFoundError:
        return []
    time.sleep(timeout)
    try:
        subprocess.Popen(["bluetoothctl", "scan", "off"],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except FileNotFoundError:
        return []
    out = _btctl("devices")
    devices = []
    for line in out.splitlines():
        m = re.match(r"Device ([0-9A-F:]{17}) (.+)", line.strip())
        if m:
            devices.append({"mac": m.group(1), "name": m.group(2)})
    return devices


def pair(mac: str) -> bool:
    ensure_ready()
    out = _btctl("pair", mac, timeout=30)
    return "Pairing successful" in out or "already paired" in out.lower()


def trust(mac: str) -> bool:
    out = _btctl("trust", mac)
    return "trust succeeded" in out.lower() or "trusted" in out.lower()


def connect(mac: str) -> bool:
    ensure_ready()
    out = _btctl("connect", mac, timeout=15)
    return "Connection successful" in out


def disconnect(mac: str) -> bool:
    out = _btctl("disconnect", mac)
    return "Successful disconnected" in out or "disconnected" in out.lower()


def forget(mac: str) -> bool:
    out = _btctl("remove", mac)
    _remove_profile(mac)
    return "removed" in out.lower()


def save_controller_profile(mac: str, name: str) -> None:
    os.makedirs(CONTROLLERS_DIR, exist_ok=True)
    safe_mac = mac.replace(":", "-")
    path = os.path.join(CONTROLLERS_DIR, f"{safe_mac}.json")
    with open(path, "w") as f:
        json.dump({"mac": mac, "name": name, "trusted": True}, f)


def _remove_profile(mac: str) -> None:
    safe_mac = mac.replace(":", "-")
    path = os.path.join(CONTROLLERS_DIR, f"{safe_mac}.json")
    try:
        os.remove(path)
    except FileNotFoundError:
        pass


def list_trusted() -> list:
    profiles = []
    try:
        for fname in os.listdir(CONTROLLERS_DIR):
            if fname.endswith(".json"):
                with open(os.path.join(CONTROLLERS_DIR, fname)) as f:
                    profiles.append(json.load(f))
    except FileNotFoundError:
        pass
    return profiles


def connected_devices() -> list:
    out = _btctl("devices", "Connected")
    devices = []
    for line in out.splitlines():
        m = re.match(r"Device ([0-9A-F:]{17}) (.+)", line.strip())
        if m:
            devices.append({"mac": m.group(1), "name": m.group(2)})
    return devices

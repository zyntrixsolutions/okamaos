"""Live network state helpers for OkamaOS userland surfaces."""

import os
import socket
import subprocess

import okamaos.config as cfg_mod

SKIP_INTERFACES = {"lo"}
PROBE_TARGETS = (
    ("1.1.1.1", 53),
    ("1.0.0.1", 53),
    ("8.8.8.8", 53),
)


def _read_text(path: str) -> str:
    try:
        with open(path, encoding="utf-8") as f:
            return f.read().strip()
    except OSError:
        return ""


def _run(args: list[str], timeout: float = 0.5) -> str:
    try:
        result = subprocess.run(
            args,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
        return (result.stdout or "") + (result.stderr or "")
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        return ""


def _interfaces() -> list[str]:
    try:
        names = os.listdir("/sys/class/net")
    except OSError:
        return []
    return sorted(name for name in names if name not in SKIP_INTERFACES)


def _iface_type(name: str) -> str:
    if os.path.isdir(f"/sys/class/net/{name}/wireless") or name.startswith(("wl", "wlan")):
        return "wifi"
    if name.startswith(("eth", "en", "eno", "ens", "enp")):
        return "ethernet"
    return "network"


def _has_ipv4(name: str) -> bool:
    out = _run(["ip", "-o", "-4", "addr", "show", "dev", name])
    if " inet " in out:
        return True

    out = _run(["ifconfig", name])
    return "inet addr:" in out or "inet " in out


def _default_route_ifaces() -> set[str]:
    ifaces = set()
    try:
        with open("/proc/net/route", encoding="utf-8") as f:
            next(f, None)
            for line in f:
                fields = line.split()
                if len(fields) >= 2 and fields[1] == "00000000":
                    ifaces.add(fields[0])
    except OSError:
        pass
    return ifaces


def _internet_reachable(timeout: float) -> bool:
    for host, port in PROBE_TARGETS:
        try:
            with socket.create_connection((host, port), timeout=timeout):
                return True
        except OSError:
            continue
    return False


def status(skip_internet: bool = False) -> dict:
    """Return live network status derived from link, IP, route, and probe state."""
    conf = cfg_mod.get()
    enabled = conf.get("NETWORK_ENABLED", "yes").lower() == "yes"
    wifi_enabled = conf.get("WIFI_ENABLED", "no").lower() == "yes"
    route_ifaces = _default_route_ifaces()
    interfaces = []

    for name in _interfaces():
        carrier = _read_text(f"/sys/class/net/{name}/carrier")
        operstate = _read_text(f"/sys/class/net/{name}/operstate") or "unknown"
        has_ip = _has_ipv4(name)
        iface_type = _iface_type(name)
        link = carrier == "1" or operstate in {"up", "unknown"} and has_ip
        interfaces.append({
            "name": name,
            "type": iface_type,
            "operstate": operstate,
            "carrier": "yes" if carrier == "1" else "no",
            "link": "yes" if link else "no",
            "has_ip": "yes" if has_ip else "no",
            "default_route": "yes" if name in route_ifaces else "no",
        })

    routed = any(i["has_ip"] == "yes" and i["default_route"] == "yes" for i in interfaces)
    connected = enabled and routed
    internet = "unknown"
    if connected and not skip_internet:
        timeout = float(conf.get("INTERNET_PROBE_TIMEOUT_SEC", "0.75"))
        internet = "yes" if _internet_reachable(timeout) else "no"
    elif connected:
        internet = "unknown"
    else:
        internet = "no"

    online = connected and internet != "no"
    primary = next((i for i in interfaces if i["default_route"] == "yes"), None)
    if primary:
        summary = f"{primary['type']} {primary['name']}: internet {internet}"
    elif interfaces:
        linked = next((i for i in interfaces if i["link"] == "yes"), interfaces[0])
        summary = f"{linked['type']} {linked['name']}: no internet"
    else:
        summary = "no network devices"

    return {
        "enabled": "yes" if enabled else "no",
        "wifi_enabled": "yes" if wifi_enabled else "no",
        "connected": "yes" if connected else "no",
        "internet": internet,
        "online": "yes" if online else "no",
        "summary": summary,
        "interfaces": interfaces,
    }

"""Okama unified input protocol.

okama-inputd writes events to a Unix domain socket at SOCKET_PATH.
okama-shell and games read from that socket.

Wire format: one JSON object per line, newline-terminated.
  {"type": "button", "button": "A", "state": "pressed",  "controller": 0}
  {"type": "button", "button": "B", "state": "released", "controller": 0}
  {"type": "axis",   "axis": "LSTICK_X", "value": 0.75, "controller": 0}
  {"type": "hat",    "direction": "UP",                  "controller": 0}
  {"type": "connect","controller": 0, "name": "Xbox Controller", "bus": "usb"}
  {"type": "disconnect", "controller": 0}
"""

import json
import socket
import os

SOCKET_PATH = os.environ.get("OKAMA_INPUT_SOCK", "/run/okama-inputd.sock")

# Canonical button names (Okama unified layer)
BUTTONS = frozenset([
    "A", "B", "X", "Y",
    "L1", "R1", "L2", "R2",
    "L3", "R3",
    "START", "SELECT", "HOME",
    "DPAD_UP", "DPAD_DOWN", "DPAD_LEFT", "DPAD_RIGHT",
    "QUIT",  # developer mode only
    "TOUCH",
])

AXES = frozenset([
    "LSTICK_X", "LSTICK_Y",
    "RSTICK_X", "RSTICK_Y",
    "L2_AXIS", "R2_AXIS",
])


class InputClient:
    """Read input events from okama-inputd's Unix socket (non-blocking)."""

    def __init__(self):
        self._sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self._buf = b""
        self._connected = False

    def connect(self) -> bool:
        try:
            self._sock.connect(SOCKET_PATH)
            self._sock.setblocking(False)
            self._connected = True
            return True
        except (FileNotFoundError, ConnectionRefusedError, OSError):
            return False

    @property
    def connected(self) -> bool:
        return self._connected

    def poll(self) -> list:
        """Return list of event dicts received since last poll."""
        if not self._connected:
            return []
        events = []
        try:
            chunk = self._sock.recv(4096)
            if chunk:
                self._buf += chunk
                while b"\n" in self._buf:
                    line, self._buf = self._buf.split(b"\n", 1)
                    try:
                        events.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass
        except BlockingIOError:
            pass
        except OSError:
            self._connected = False
        return events

    def close(self):
        try:
            self._sock.close()
        except OSError:
            pass

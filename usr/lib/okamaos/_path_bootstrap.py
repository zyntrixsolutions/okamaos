"""Internal helper — resolves the okamaos lib dir at import time.

All okama-* binaries call:
    from okamaos._path_bootstrap import bootstrap
    bootstrap()

before any other okamaos imports. This makes the tools work both:
  - on target:  /usr/lib/okamaos  (Buildroot install path)
  - on host:    <repo>/usr/lib/okamaos  (relative to script)
"""

import sys
import os


def bootstrap() -> None:
    """Insert the canonical okamaos lib dir at the front of sys.path."""
    _candidates = [
        "/usr/lib/okamaos",
        os.path.join(os.path.dirname(__file__), ".."),       # already in lib
        os.path.join(os.path.dirname(__file__), "..", ".."), # repo/usr/lib
    ]
    for c in _candidates:
        real = os.path.realpath(c)
        if os.path.isdir(real) and real not in sys.path:
            sys.path.insert(0, real)

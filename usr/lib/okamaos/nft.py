"""OkamaOS NFT asset query module.

Queries ERC-1155 (OKAssets) token balances for the on-device wallet and
caches results to /var/okamaos/wallet/assets.json so games can read them
at launch via the OKAMA_ASSETS_PATH environment variable.
"""

import json
import os
import time
import urllib.error
import urllib.request
from typing import Optional

OKASSETS_ADDRESS_DEFAULT = os.environ.get(
    "OKASSETS_ADDRESS", "0x0000000000000000000000000000000000000000"
)
BASE_RPC_DEFAULT  = "https://mainnet.base.org"
METADATA_BASE_URI = "https://zyntrixsolutions.github.io/okamaos/metadata/"

_BALANCE_OF_SELECTOR = "00fdd58e"  # keccak256("balanceOf(address,uint256)")[:4]


class NFTError(Exception):
    pass


# ---------------------------------------------------------------------------
# RPC helpers
# ---------------------------------------------------------------------------

def _rpc_url() -> str:
    try:
        import okamaos.config as cfg
        return cfg.get().get("BASE_RPC_URL", BASE_RPC_DEFAULT)
    except Exception:
        return BASE_RPC_DEFAULT


def _rpc_call(method: str, params: list, rpc_url: Optional[str] = None) -> dict:
    url     = rpc_url or _rpc_url()
    payload = json.dumps({"jsonrpc": "2.0", "method": method,
                          "params": params, "id": 1}).encode()
    req = urllib.request.Request(
        url, data=payload,
        headers={"Content-Type": "application/json", "User-Agent": "OkamaOS/2.0"},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.load(resp)
    except urllib.error.URLError as e:
        raise NFTError(f"RPC error: {e.reason}")


# ---------------------------------------------------------------------------
# Balance queries
# ---------------------------------------------------------------------------

def balance_of(owner: str, token_id: int,
               contract: Optional[str] = None,
               rpc_url: Optional[str] = None) -> int:
    """Return ERC-1155 balance for an owner/token_id pair."""
    if contract is None:
        contract = OKASSETS_ADDRESS_DEFAULT
    padded_owner = owner.lower().replace("0x", "").zfill(64)
    padded_id    = hex(token_id)[2:].zfill(64)
    data         = "0x" + _BALANCE_OF_SELECTOR + padded_owner + padded_id
    result = _rpc_call("eth_call",
                       [{"to": contract, "data": data}, "latest"],
                       rpc_url)
    return int(result.get("result", "0x0"), 16)


# ---------------------------------------------------------------------------
# Metadata
# ---------------------------------------------------------------------------

def fetch_metadata(token_id: int) -> dict:
    """Fetch JSON metadata for a token from the metadata base URI."""
    url = f"{METADATA_BASE_URI}{token_id}.json"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "OkamaOS/2.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.load(resp)
    except Exception:
        return {"name": f"Asset #{token_id}", "description": "",
                "image": "", "rarity": "common", "game_id": ""}


# ---------------------------------------------------------------------------
# Asset cache
# ---------------------------------------------------------------------------

def refresh_assets(owner: str, token_ids: list,
                   contract: Optional[str] = None) -> list:
    """Query balances for a list of token IDs; return owned-asset list."""
    owned = []
    for tid in token_ids:
        try:
            bal = balance_of(owner, tid, contract)
            if bal > 0:
                meta = fetch_metadata(tid)
                owned.append({
                    "token_id":    tid,
                    "balance":     bal,
                    "name":        meta.get("name",        f"Asset #{tid}"),
                    "description": meta.get("description", ""),
                    "image":       meta.get("image",       ""),
                    "rarity":      meta.get("rarity",      "common"),
                    "game_id":     meta.get("game_id",     ""),
                })
        except NFTError:
            continue
    return owned


def save_assets_cache(assets: list, path: Optional[str] = None) -> None:
    """Persist the asset list to /var/okamaos/wallet/assets.json."""
    if path is None:
        try:
            import okamaos.wallet as w
            path = w.assets_path()
        except Exception:
            path = "/var/okamaos/wallet/assets.json"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump({"updated_at": int(time.time()), "assets": assets}, f, indent=2)


def load_assets_cache(path: Optional[str] = None) -> list:
    """Load cached assets. Returns [] if not found or unreadable."""
    if path is None:
        try:
            import okamaos.wallet as w
            path = w.assets_path()
        except Exception:
            path = "/var/okamaos/wallet/assets.json"
    if not os.path.exists(path):
        return []
    try:
        with open(path) as f:
            return json.load(f).get("assets", [])
    except Exception:
        return []

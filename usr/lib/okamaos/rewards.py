"""OkamaOS play-to-earn reward submission module.

After a game exits, okama-run calls process_game_rewards() which:
  1. Reads pending_rewards[] from the game's save_state.json
  2. Builds a signed claim payload (game_id + score + amount_ok + nonce)
  3. POSTs to the OkamaLabs relay API
  4. On success, clears pending_rewards and appends to the TX log

Reward claim format (signed by on-device wallet):
  {
    "game_id":   "com.okamaos.voidstriker",
    "score":     48200,
    "amount_ok": "10.000000",
    "timestamp": 1717000000,
    "wallet":    "0x...",
    "nonce":     "<32-char hex>"
  }

The relay verifies the ECDSA signature against the wallet address, checks
the score against an on-chain proof or oracle, and mints OKT if valid.
"""

import json
import os
import secrets
import time
import urllib.error
import urllib.request
from typing import Callable, Optional

RELAY_API_DEFAULT = "https://api.okamalabs.com/v1/rewards/claim"
RELAY_TIMEOUT     = 15


class RewardError(Exception):
    pass


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _relay_url() -> str:
    try:
        import okamaos.config as cfg
        return cfg.get().get("REWARD_RELAY_URL", RELAY_API_DEFAULT)
    except Exception:
        return RELAY_API_DEFAULT


def read_pending_rewards(save_path: str) -> list:
    """Return pending_rewards list from save_state.json, or []."""
    if not os.path.exists(save_path):
        return []
    try:
        with open(save_path) as f:
            data = json.load(f)
        rewards = data.get("pending_rewards", [])
        return rewards if isinstance(rewards, list) else []
    except Exception:
        return []


def clear_pending_rewards(save_path: str) -> None:
    """Remove pending_rewards from save_state.json after submission."""
    if not os.path.exists(save_path):
        return
    try:
        with open(save_path) as f:
            data = json.load(f)
        data.pop("pending_rewards", None)
        with open(save_path, "w") as f:
            json.dump(data, f, indent=2)
    except Exception:
        pass


def _build_claim(game_id: str, score: int,
                 amount_ok: float, wallet_addr: str) -> dict:
    return {
        "game_id":   game_id,
        "score":     score,
        "amount_ok": f"{amount_ok:.6f}",
        "timestamp": int(time.time()),
        "wallet":    wallet_addr,
        "nonce":     secrets.token_hex(16),
    }


# ---------------------------------------------------------------------------
# Network submission
# ---------------------------------------------------------------------------

def submit_claim(claim: dict, signature: str) -> dict:
    """POST a signed claim to the OkamaLabs relay.

    Returns the API response dict on success.
    Raises RewardError on any failure.
    """
    payload = json.dumps({"claim": claim, "signature": signature}).encode()
    req     = urllib.request.Request(
        _relay_url(), data=payload,
        headers={"Content-Type": "application/json", "User-Agent": "OkamaOS/2.0"},
    )
    try:
        with urllib.request.urlopen(req, timeout=RELAY_TIMEOUT) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        raise RewardError(f"Relay rejected claim (HTTP {e.code}): {body}")
    except urllib.error.URLError as e:
        raise RewardError(f"Network error submitting claim: {e.reason}")
    except Exception as e:
        raise RewardError(f"Claim submission failed: {e}")


# ---------------------------------------------------------------------------
# High-level pipeline
# ---------------------------------------------------------------------------

def process_game_rewards(
    game_id: str,
    saves_dir: str,
    passphrase_cb: Optional[Callable[[], str]] = None,
) -> list:
    """Read, sign, and submit pending rewards for a finished game session.

    game_id       : e.g. "com.okamaos.voidstriker"
    saves_dir     : /var/okamaos/saves/<game_id>/
    passphrase_cb : optional callable() → str (prompts for wallet PIN)

    Returns list of submitted API response dicts (empty if nothing to do).
    Never raises — reward errors are swallowed so they never block the
    shell return.
    """
    try:
        import okamaos.wallet as wallet_mod
    except ImportError:
        return []

    if not wallet_mod.is_initialized():
        return []

    save_path = os.path.join(saves_dir, "save_state.json")
    pending   = read_pending_rewards(save_path)
    if not pending:
        return []

    try:
        wallet_addr = wallet_mod.address()
    except wallet_mod.WalletError:
        return []

    results   = []
    passphrase: Optional[str] = None
    submitted_any = False

    for reward in pending:
        score     = int(reward.get("score", 0))
        amount_ok = float(reward.get("amount_ok", 0))
        if amount_ok <= 0:
            continue

        if passphrase is None:
            if passphrase_cb:
                passphrase = passphrase_cb()
            else:
                break

        try:
            claim     = _build_claim(game_id, score, amount_ok, wallet_addr)
            sig       = wallet_mod.sign_message(
                json.dumps(claim, sort_keys=True), passphrase
            )
            response  = submit_claim(claim, sig)
            results.append(response)
            submitted_any = True
            wallet_mod.append_tx_log({
                "type":         "reward_claim",
                "game_id":      game_id,
                "claim":        claim,
                "result":       response,
                "submitted_at": int(time.time()),
            })
        except (RewardError, wallet_mod.WalletError):
            pass

    if submitted_any:
        clear_pending_rewards(save_path)

    return results

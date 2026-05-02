"""OkamaOS on-device Base wallet.

Manages a non-custodial Base (EVM L2) wallet stored at /var/okamaos/wallet/.
The keypair lives in an Ethereum JSON keystore v3 file, encrypted with the
Parent PIN as the passphrase.  No seed phrase or private key is ever written
to disk in cleartext.

Optional Python deps (install once; graceful error if absent):
    pip install eth-account mnemonic
"""

import json
import os
import urllib.error
import urllib.request
from typing import Optional

WALLET_DIR_DEFAULT = "/var/okamaos/wallet"
KEYSTORE_FILE      = "keystore.json"
TX_LOG_FILE        = "tx-log.json"
ASSETS_FILE        = "assets.json"

BASE_RPC_DEFAULT        = "https://mainnet.base.org"
BASE_SEPOLIA_RPC        = "https://sepolia.base.org"
OKTOKEN_ADDRESS_DEFAULT = os.environ.get(
    "OKTOKEN_ADDRESS", "0x0000000000000000000000000000000000000000"
)

_BALANCE_OF_SELECTOR = "70a08231"  # keccak256("balanceOf(address)")[:4]


class WalletError(Exception):
    pass


# ---------------------------------------------------------------------------
# Filesystem helpers
# ---------------------------------------------------------------------------

def wallet_dir() -> str:
    d = os.environ.get("OKAMA_WALLET_DIR", WALLET_DIR_DEFAULT)
    os.makedirs(d, exist_ok=True)
    return d


def keystore_path() -> str:
    return os.path.join(wallet_dir(), KEYSTORE_FILE)


def tx_log_path() -> str:
    return os.path.join(wallet_dir(), TX_LOG_FILE)


def assets_path() -> str:
    return os.path.join(wallet_dir(), ASSETS_FILE)


def is_initialized() -> bool:
    return os.path.exists(keystore_path())


# ---------------------------------------------------------------------------
# eth_account helper
# ---------------------------------------------------------------------------

def _eth_account():
    try:
        from eth_account import Account
        Account.enable_unaudited_hdwallet_features()
        return Account
    except ImportError:
        raise WalletError(
            "eth_account is not installed. Run: pip install eth-account mnemonic"
        )


# ---------------------------------------------------------------------------
# Key management
# ---------------------------------------------------------------------------

def generate(passphrase: str) -> dict:
    """Generate a new BIP-39 wallet and save the encrypted keystore.

    Returns {'address': '0x...', 'mnemonic': '...'}.
    The mnemonic is returned ONCE and never persisted.
    """
    try:
        from mnemonic import Mnemonic
    except ImportError:
        raise WalletError("mnemonic package not installed. Run: pip install mnemonic")
    Account = _eth_account()
    words   = Mnemonic("english").generate(strength=128)
    acct    = Account.from_mnemonic(words)
    enc     = Account.encrypt(acct.key, passphrase)
    path    = keystore_path()
    with open(path, "w") as f:
        json.dump(enc, f, indent=2)
    os.chmod(path, 0o600)
    return {"address": acct.address, "mnemonic": words}


def load(passphrase: str):
    """Decrypt and return an eth_account LocalAccount."""
    Account = _eth_account()
    path = keystore_path()
    if not os.path.exists(path):
        raise WalletError("No wallet found. Run 'okama-wallet init' first.")
    with open(path) as f:
        ks = json.load(f)
    try:
        return Account.from_key(Account.decrypt(ks, passphrase))
    except Exception as e:
        raise WalletError(f"Failed to decrypt wallet (wrong PIN?): {e}")


def address() -> str:
    """Return the wallet address without decrypting the private key."""
    path = keystore_path()
    if not os.path.exists(path):
        raise WalletError("No wallet initialised. Run 'okama-wallet init'.")
    with open(path) as f:
        ks = json.load(f)
    raw = ks.get("address", "")
    return ("0x" + raw) if not raw.startswith("0x") else raw


# ---------------------------------------------------------------------------
# RPC calls (stdlib only — no web3.py required)
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
        raise WalletError(f"RPC error: {e.reason}")


def eth_balance(addr: Optional[str] = None) -> int:
    """Return ETH balance in wei."""
    if addr is None:
        addr = address()
    result = _rpc_call("eth_getBalance", [addr, "latest"])
    return int(result.get("result", "0x0"), 16)


def ok_balance(addr: Optional[str] = None,
               token_address: Optional[str] = None) -> int:
    """Return OKToken (ERC-20) balance in raw units (18 decimals)."""
    if addr is None:
        addr = address()
    if token_address is None:
        token_address = OKTOKEN_ADDRESS_DEFAULT
    padded = addr.lower().replace("0x", "").zfill(64)
    data   = "0x" + _BALANCE_OF_SELECTOR + padded
    result = _rpc_call("eth_call", [{"to": token_address, "data": data}, "latest"])
    return int(result.get("result", "0x0"), 16)


# ---------------------------------------------------------------------------
# Formatting
# ---------------------------------------------------------------------------

def format_eth(wei: int) -> str:
    return f"{wei / 1e18:.6f} ETH"


def format_ok(units: int) -> str:
    return f"{units / 1e18:.2f} OKT"


# ---------------------------------------------------------------------------
# Signing
# ---------------------------------------------------------------------------

def sign_message(message: str, passphrase: str) -> str:
    """Sign a text message. Returns hex signature string."""
    from eth_account.messages import encode_defunct
    acct   = load(passphrase)
    signed = acct.sign_message(encode_defunct(text=message))
    return signed.signature.hex()


# ---------------------------------------------------------------------------
# Transaction log
# ---------------------------------------------------------------------------

def append_tx_log(entry: dict) -> None:
    log = tx_log_path()
    entries: list = []
    if os.path.exists(log):
        try:
            with open(log) as f:
                entries = json.load(f)
        except Exception:
            entries = []
    entries.append(entry)
    with open(log, "w") as f:
        json.dump(entries, f, indent=2)


def read_tx_log() -> list:
    log = tx_log_path()
    if not os.path.exists(log):
        return []
    try:
        with open(log) as f:
            return json.load(f)
    except Exception:
        return []

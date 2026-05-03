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
PIN_PARAMS_FILE    = "pin_params.json"
TX_LOG_FILE        = "tx-log.json"
ASSETS_FILE        = "assets.json"

ARGON2_TIME_COST   = 2
ARGON2_MEMORY_COST = 65536  # 64 MB
ARGON2_PARALLELISM = 2
ARGON2_HASH_LEN    = 32

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


def pin_params_path() -> str:
    return os.path.join(wallet_dir(), PIN_PARAMS_FILE)


def is_initialized() -> bool:
    return os.path.exists(keystore_path())


# ---------------------------------------------------------------------------
# Argon2id passphrase derivation
# ---------------------------------------------------------------------------

def _argon2_available() -> bool:
    try:
        import argon2.low_level  # noqa: F401
        return True
    except ImportError:
        return False


def derive_passphrase(pin: str, salt_hex: str) -> str:
    """Derive an Argon2id-stretched passphrase from a PIN + stored salt.

    Falls back to the raw PIN if argon2-cffi is not installed.
    """
    if not salt_hex or not _argon2_available():
        return pin
    try:
        import argon2.low_level as _al
        salt = bytes.fromhex(salt_hex)
        raw = _al.hash_secret_raw(
            pin.encode(),
            salt,
            time_cost=ARGON2_TIME_COST,
            memory_cost=ARGON2_MEMORY_COST,
            parallelism=ARGON2_PARALLELISM,
            hash_len=ARGON2_HASH_LEN,
            type=_al.Type.ID,
        )
        return raw.hex()
    except Exception:
        return pin


def _load_pin_params() -> dict:
    path = pin_params_path()
    if os.path.exists(path):
        try:
            with open(path) as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def _save_pin_params(salt_hex: str) -> None:
    params = {
        "algo": "argon2id",
        "salt": salt_hex,
        "time_cost": ARGON2_TIME_COST,
        "memory_cost": ARGON2_MEMORY_COST,
        "parallelism": ARGON2_PARALLELISM,
        "hash_len": ARGON2_HASH_LEN,
    }
    path = pin_params_path()
    with open(path, "w") as f:
        json.dump(params, f, indent=2)
    os.chmod(path, 0o600)


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
    If argon2-cffi is available the passphrase is Argon2id-stretched before
    being used as the keystore encryption passphrase.
    """
    try:
        from mnemonic import Mnemonic
    except ImportError:
        raise WalletError("mnemonic package not installed. Run: pip install mnemonic")
    Account = _eth_account()
    words   = Mnemonic("english").generate(strength=128)
    acct    = Account.from_mnemonic(words)
    # Save Argon2id params (random salt) before deriving passphrase
    salt_hex = os.urandom(16).hex()
    _save_pin_params(salt_hex)
    enc_pass = derive_passphrase(passphrase, salt_hex)
    enc  = Account.encrypt(acct.key, enc_pass)
    path = keystore_path()
    with open(path, "w") as f:
        json.dump(enc, f, indent=2)
    os.chmod(path, 0o600)
    return {"address": acct.address, "mnemonic": words}


def load(passphrase: str):
    """Decrypt and return an eth_account LocalAccount.

    Checks parent controls before decrypting.
    Applies Argon2id stretching if pin_params.json is present.
    """
    # Parent control gate
    try:
        import okamaos.parent as _parent
        if not _parent.wallet_enabled():
            raise WalletError("Wallet is disabled by Parent Controls.")
    except ImportError:
        pass
    Account = _eth_account()
    path = keystore_path()
    if not os.path.exists(path):
        raise WalletError("No wallet found. Run 'okama-wallet init' first.")
    with open(path) as f:
        ks = json.load(f)
    params = _load_pin_params()
    salt_hex = params.get("salt", "")
    enc_pass = derive_passphrase(passphrase, salt_hex)
    try:
        return Account.from_key(Account.decrypt(ks, enc_pass))
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
            data = json.load(resp)
    except urllib.error.URLError as e:
        raise WalletError(f"RPC error: {e.reason}")
    if data.get("error"):
        err = data["error"]
        if isinstance(err, dict):
            msg = err.get("message", err)
        else:
            msg = err
        raise WalletError(f"RPC error: {msg}")
    return data


def _rpc_quantity_to_int(value) -> int:
    """Parse an Ethereum JSON-RPC hex quantity.

    Some gateways return ``0x`` for empty zero values. Treat that as zero
    instead of surfacing Python's low-level ValueError to the shell.
    """
    if value in (None, "", "0x"):
        return 0
    if isinstance(value, int):
        return max(0, value)
    raw = str(value).strip().lower()
    if raw in ("", "0x"):
        return 0
    if not raw.startswith("0x"):
        raise WalletError(f"RPC returned non-hex quantity: {value}")
    try:
        return int(raw, 16)
    except ValueError as exc:
        raise WalletError(f"RPC returned invalid hex quantity: {value}") from exc


def _is_zero_address(addr: str) -> bool:
    raw = str(addr or "").strip().lower()
    if raw.startswith("0x"):
        raw = raw[2:]
    return not raw or set(raw) <= {"0"}


def eth_balance(addr: Optional[str] = None) -> int:
    """Return ETH balance in wei."""
    if addr is None:
        addr = address()
    result = _rpc_call("eth_getBalance", [addr, "latest"])
    return _rpc_quantity_to_int(result.get("result", "0x0"))


def ok_balance(addr: Optional[str] = None,
               token_address: Optional[str] = None) -> int:
    """Return OKToken (ERC-20) balance in raw units (18 decimals)."""
    if addr is None:
        addr = address()
    if token_address is None:
        token_address = OKTOKEN_ADDRESS_DEFAULT
    if _is_zero_address(token_address):
        return 0
    padded = addr.lower().replace("0x", "").zfill(64)
    data   = "0x" + _BALANCE_OF_SELECTOR + padded
    result = _rpc_call("eth_call", [{"to": token_address, "data": data}, "latest"])
    return _rpc_quantity_to_int(result.get("result", "0x0"))


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

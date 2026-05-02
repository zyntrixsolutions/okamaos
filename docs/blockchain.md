# OkamaOS Blockchain Integration

OkamaOS v2 adds a non-custodial Base (EVM L2) wallet layer across all three
ecosystem tiers: the OS console, Okama Studio, and the OkamaOS Portal.

---

## Overview

| Layer    | Component          | What it does |
|----------|--------------------|--------------|
| OS       | `wallet.py`        | Key gen, encryption, balance query |
| OS       | `nft.py`           | ERC-1155 balance query + asset cache |
| OS       | `rewards.py`       | Post-game reward claim submission |
| OS       | `okama-wallet` CLI | Shell tool for wallet management |
| OS       | `okama-shell`      | Settings › Wallet status screen |
| OS       | `okama-run`        | Injects `OKAMA_ASSETS_PATH` + reward hook |
| OS       | `manifest.py`      | Validates `blockchain:` manifest field |
| Studio   | `lib/web3/`        | viem client, contract ABIs, balance helpers |
| Studio   | Settings page      | Network / RPC / contract address config |
| Portal   | `wallet.html`      | Connect wallet, view balances + NFTs |
| Portal   | `marketplace.html` | OKAssets NFT marketplace |
| Portal   | `leaderboard.html` | OKToken play-to-earn rankings |
| Contracts| `OKToken.sol`      | ERC-20 reward token (1 B OKT max supply) |
| Contracts| `OKAssets.sol`     | ERC-1155 game asset NFTs |

---

## Token Contracts

### OKToken (ERC-20)

- Symbol: **OKT**
- Max supply: 1,000,000,000 OKT (1 billion)
- Minting: relay-only via `MINTER_ROLE`
- Network: Base Mainnet / Base Sepolia (dev)

### OKAssets (ERC-1155)

- Token ID convention: `gameIndex * 1_000_000 + assetIndex`
- Metadata: `https://zyntrixsolutions.github.io/okamaos/metadata/{id}.json`
- Minting: relay-only via `MINTER_ROLE`

---

## Deploying Contracts

```bash
cd contracts
cp .env.example .env
# fill PRIVATE_KEY, BASESCAN_API_KEY

# Deploy to Base Sepolia
forge script script/Deploy.s.sol \
  --rpc-url base_sepolia \
  --broadcast \
  --verify \
  -vvvv

# Deploy to Base Mainnet
forge script script/Deploy.s.sol \
  --rpc-url base \
  --broadcast \
  --verify \
  -vvvv
```

After deployment, paste the contract addresses into:
- **OS**: `/etc/okamaos/okama.conf` → `OKTOKEN_ADDRESS`, `OKASSETS_ADDRESS`
- **Studio**: Settings › Web3 — Base Network
- **Portal**: `wallet.html` / `marketplace.html` (via `localStorage` keys set in Studio Settings)

---

## On-Device Wallet

The wallet lives at `/var/okamaos/wallet/keystore.json` — an Ethereum JSON
keystore v3 encrypted with the **Parent PIN** as the passphrase. No seed
phrase or private key is ever stored in cleartext.

### Setup

```bash
# Requires: pip install eth-account mnemonic
okama-wallet init        # generates BIP-39 mnemonic, shown once
okama-wallet address     # print address
okama-wallet balance     # ETH + OKT (requires network)
okama-wallet assets      # show cached NFT assets
okama-wallet log         # show reward TX log
```

### Wallet directory layout

```
/var/okamaos/wallet/
├── keystore.json   # encrypted keypair (chmod 600)
├── tx-log.json     # reward claim history
└── assets.json     # cached NFT inventory
```

---

## Game Manifest — `blockchain:` field

Add an optional `blockchain` section to `.ok` package manifests to enable
token rewards and associate NFT assets:

```json
{
  "id": "com.example.mygame",
  "name": "My Game",
  "version": "1.0.0",
  "runtime": "okama-sdl2",
  "entry": "main.py",
  "blockchain": {
    "token_rewards": {
      "score_threshold": 5000,
      "reward_amount_ok": 10.0
    },
    "nft_assets": [
      { "token_id": 1000001, "name": "Hero Sword" },
      { "token_id": 1000002, "name": "Shield of Dawn" }
    ]
  }
}
```

The manifest validator (`manifest.py`) checks all blockchain fields on
install and at launch.

---

## Play-to-Earn Flow

```
game exits cleanly
  └── okama-run calls _submit_game_rewards(game_id)
        └── rewards.py reads save_state.json["pending_rewards"]
              └── for each reward entry:
                    ├── build claim  {game_id, score, amount_ok, timestamp, wallet, nonce}
                    ├── sign claim JSON with on-device key (PIN-gated)
                    ├── POST {claim, signature} → OkamaLabs relay
                    ├── relay verifies signature + score
                    ├── relay calls OKToken.mint(wallet, amount)
                    └── append to /var/okamaos/wallet/tx-log.json
```

Games write pending rewards to `save_state.json`:

```json
{
  "score": 12500,
  "pending_rewards": [
    { "score": 12500, "amount_ok": 10.0 }
  ]
}
```

---

## Environment Variables (okama-run → game)

| Variable              | Value                                      |
|-----------------------|--------------------------------------------|
| `OKAMA_WALLET_ADDRESS`| Player's on-device wallet address (`0x…`) |
| `OKAMA_ASSETS_PATH`   | Path to `/var/okamaos/wallet/assets.json`  |

Games can read `OKAMA_ASSETS_PATH` to check owned NFT assets at launch.

---

## Parent Controls

Wallet operations respect parent mode:

- Wallet must be enabled in `/etc/okamaos/parent.conf` → `WALLET_ENABLED=yes`
- All signing operations require the Parent PIN (passphrase)
- A daily spend limit can be set: `WALLET_DAILY_LIMIT_OKT=50`

---

## Studio Web3 Settings

In Okama Studio › Settings › Web3 — Base Network:
- Toggle **Base Sepolia** (dev) vs **Base Mainnet**
- Override RPC endpoints
- Paste deployed `OKToken` and `OKAssets` contract addresses

These settings persist in `localStorage` and are used by `lib/web3/client.ts`,
`lib/web3/contracts.ts`, and `lib/web3/wallet.ts`.

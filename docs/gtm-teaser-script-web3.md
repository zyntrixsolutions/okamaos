# OkamaOS — "EARN YOUR GAME" Teaser Trailer Script (Web3 / Blockchain Market)

## Overview

| Attribute  | Value                                                              |
| ---------- | ------------------------------------------------------------------ |
| Title      | *"EARN YOUR GAME"*                                                 |
| Runtime    | 60s (short cut) / 90s (extended)                                   |
| Tone       | Sharp · Credible · Excitement-without-hype · Technically grounded  |
| Palette    | Deep black · Neon cyan · Base blue accent · Okama red emphasis     |
| Music      | Minimal dark synthwave, builds through each act                    |
| Target     | Web3 gamers · DeFi users · NFT collectors · Base ecosystem users   |
| Primary CTA| `okamaos.zyntrix.solutions` + "Claim your wallet. Start earning."  |

---

## Positioning Statement

> *Most play-to-earn games are browser tabs pretending to be games.
> OkamaOS is a real game console. The earnings are just built in.*

---

## Scene-by-Scene Script

---

### SCENE 1 — THE BROKEN PROMISE (0:00–0:12)

**[BLACK SCREEN. A single line of text appears, typing itself:]**
```
"Play to earn."
```

**[Pause 1 second. A second line types:]**
```
"...browser game with a token attached."
```

**[Third line types:]**
```
"...token that rugged in 90 days."
```

**[All three lines sit on screen. Then: a single keystroke. They all delete.]**

**[Full silence. Then:]**

> **VO (measured, direct):**
> *"Play-to-earn promised something real. It rarely delivered.
> We built the version that does."*

---

### SCENE 2 — WHAT REAL LOOKS LIKE (0:12–0:28)

**[Cut to: a bare-bones x86_64 machine — old laptop, a mini PC, a repurposed box.
Something anyone could afford or already owns.]**

**[Power button press. Single LED. Then:]**

**[SCREEN: OkamaOS boots. Shell launches fullscreen — red cyberpunk UI, live clock,
controller connected. No desktop. No browser. No MetaMask popup.]**

> **VO:**
> *"OkamaOS is a full Linux game console OS. It boots in under 10 seconds.
> No desktop. No browser. The blockchain layer is built into the OS itself."*

**[D-pad navigates to Settings → Wallet:]**

Shell UI:
```
Wallet
──────────────────────────────────
Address  0x4a3f...c821
Balance  0.012 ETH
OKT      2,450 OKT
Assets   7 NFTs
──────────────────────────────────
```

**ON-SCREEN TEXT:**
```
Non-custodial. On-device. Base L2.
Your keys. Your tokens. Your console.
```

---

### SCENE 3 — THE EARN LOOP (0:28–0:46)

**[Music lifts. Game footage begins — VOID STRIKER, vertical shoot-em-up.]**

**[SPLIT SCREEN:]**
- **Left:** Gameplay — player destroys boss wave, score counter climbs: `12,500`
- **Right:** Code overlay showing `save_state.json`:
```json
{
  "score": 12500,
  "pending_rewards": [
    { "score": 12500, "amount_ok": 10.0 }
  ]
}
```

**[Game exit screen. Then a reward sequence animation:]**

```
GAME COMPLETE
Score: 12,500                 ✓ threshold met

Submitting reward claim...
  Signing with on-device key...  ✓
  Relay verified score...        ✓
  OKToken.mint(0x4a3f…, 10 OKT)  ✓

+10 OKT added to your wallet.
```

> **VO:**
> *"Every game can define a score threshold. Hit it — the OS signs a claim,
> submits it to the relay, and OKT is minted to your wallet. On Base.*
> *No bridge. No gas fees beyond L2. No middleman."*

**ON-SCREEN TEXT (stacked, fast):**
```
Score threshold → reward claim
ECDSA signed on-device
OkamaLabs relay → OKToken.mint()
Base Mainnet. ERC-20.
```

---

### SCENE 4 — OWN YOUR ASSETS (0:46–1:00)

**[Music holds. Cyan glow. Slower pace.]**

**[Portal marketplace screen: NFT asset grid — art thumbnails for in-game items.]**

**[Click on "Hero Sword":]**
```
Hero Sword
Token ID: 1000001 (OKAssets ERC-1155)
Owner:    0x4a3f...c821  ← yours
Network:  Base Mainnet
```

> **VO:**
> *"In-game assets are ERC-1155 NFTs on Base. You own them.
> They work across every game that supports them.
> Sell them. Trade them. Keep them. The game can't take them back."*

**[Shell: game launches — `OKAMA_ASSETS_PATH` injected. In-game item unlocks
because the wallet holds the token. No login. No server check. It just works.]**

**ON-SCREEN TEXT:**
```
OKAssets — ERC-1155
One asset. Every compatible game.
True ownership. No platform lock-in.
```

---

### SCENE 5 — THE ECONOMICS (1:00–1:10) *(90s cut / optional in 60s)*

**[Clean infographic style. Dark bg. Numbers animate in.]**

```
OKToken (OKT)          ERC-20 · Base Mainnet
Max Supply             1,000,000,000 OKT
Minting                Relay-only (MINTER_ROLE)
Earn mechanism         Score-based post-game claims
Daily spend limit      Parent-configurable (family safe)

OKAssets               ERC-1155 · Base Mainnet
Token ID namespace     Per-game (gameIndex × 1,000,000)
Metadata               IPFS + GitHub Pages fallback
Cross-game             Yes — shared asset registry (v2.4)
```

> **VO:**
> *"Fixed supply. Relay-minted only. Score-verified before any token is issued.
> No infinite print. No pay-to-earn shortcuts."*

---

### SCENE 6 — WHO BUILDS THE GAMES (1:10–1:18) *(90s cut only)*

**[Quick flash: Okama Studio — AI chat panel, streaming Python game code.]**
**[`.ok` package builder — manifest editor, OKT reward threshold field, NFT asset IDs.]**

> **VO:**
> *"Any developer can attach OKT rewards and NFT assets to their game
> with three lines in a manifest file."*

**Code overlay:**
```json
"blockchain": {
  "token_rewards": { "score_threshold": 5000, "reward_amount_ok": 10.0 },
  "nft_assets": [{ "token_id": 1000001, "name": "Hero Sword" }]
}
```

---

### SCENE 7 — THE CALL (1:18–1:30 extended / 1:00–1:10 short)

**[All visuals fade. Okama mark. Red pulse. Silence.]**

> **VO (quiet, final):**
> *"The console is free. The games earn you tokens. The assets are yours forever."*
>
> *(beat)*
>
> *"This is what play-to-earn was supposed to be."*

**[LOGO SLAM — OKAMAOS wordmark. Okama red on black.]**

**[Sub-lines:]**
```
OKToken · OKAssets · Base Mainnet
Built by OkamaLabs × Zyntrix Solutions
```

**[CTA card — hold 5s:]**
```
EARN YOUR GAME — First Wave is open.

okamaos.zyntrix.solutions

Claim your wallet. Start earning.

[ Join Discord ]  [ Follow on X ]  [ View on Base ]  [ GitHub ]
```

**[Fade to black.]**

---

## Music & SFX Brief

| Moment                         | Direction                                             |
| ------------------------------ | ----------------------------------------------------- |
| Opening typing lines           | Mechanical keyboard SFX only                          |
| VO "We built the version..."   | Single low synth note enters                          |
| Boot → wallet reveal           | Synth arp ascends, held under VO                      |
| Earn loop / VOID STRIKER       | Beat kicks in — dark synthwave (ref: Perturbator)     |
| Reward claim animation         | Bright single chime per checkmark line                |
| NFT ownership section          | Music dips, slower pulse                              |
| Economics infographic          | Clean, minimal — almost silent, just sub-bass         |
| Final VO                       | Music stops completely                                |
| Logo slam                      | 1-beat silence → crescendo outro                      |

---

## Platform Distribution Strategy

| Platform     | Cut       | Hook angle                                  |
| ------------ | --------- | ------------------------------------------- |
| X / Twitter  | 60s       | "P2E is broken. We fixed it." thread format |
| YouTube      | 90s       | Full story with chapter timestamps          |
| TikTok       | 30s remix | "I earned OKT just playing a game on my old PC" |
| Farcaster    | 60s       | Frame embed + Base wallet connect CTA       |
| Lens         | 60s       | NFT-gated early access post                 |
| Base Discord | 90s       | Dev deep-dive with manifest code shown      |

---

## Post Copy

### X / Twitter Thread
> **1/** Play-to-earn has a reputation problem.
> Browser games. Inflationary tokens. Rugs.
>
> We built something different. A thread 🧵

> **2/** OkamaOS is a real game console OS. Boots on any x86_64 PC.
> No desktop. No browser. Controller-first.
> The blockchain layer is baked into the OS itself.

> **3/** How earning works:
> → Game defines a score threshold in its manifest
> → You hit it
> → OS signs a claim with your on-device key
> → Relay verifies the score
> → OKToken.mint() fires on Base
>
> No bridge fees. No fake points. Real ERC-20.

> **4/** The assets? ERC-1155 NFTs on Base.
> One item. Works across every compatible game.
> Your wallet holds it. The game reads it on launch.
> No login. No server check. It just unlocks.

> **5/** First Wave is open.
> Claim your wallet. Start earning.
> okamaos.zyntrix.solutions

### Farcaster Cast
> Built a game console OS where your scores mint OKT tokens on Base.
> Non-custodial wallet on-device. ERC-1155 assets work across games.
> No browser. No MetaMask popups. Just: play → earn → own.
>
> First Wave open now ↓
> okamaos.zyntrix.solutions

### Discord / Telegram (crypto communities)
> **OkamaOS — Real play-to-earn. No browser required.**
>
> It's a full Linux OS that turns any x86_64 PC into a game console.
> - OKT (ERC-20) earned post-game by score. Relay-minted on Base. Fixed 1B supply.
> - OKAssets (ERC-1155) NFTs — real cross-game ownership, no platform lock-in.
> - On-device non-custodial wallet. BIP-39 keygen. JSON keystore v3. PIN-gated.
> - Devs add rewards in 3 lines of manifest JSON.
>
> First Wave early access: okamaos.zyntrix.solutions

---

## Production Checklist

- [ ] Screen recording: Wallet screen — address, ETH, OKT balance, NFT count
- [ ] Animated graphic: post-game reward claim sequence (checkmarks firing)
- [ ] Screen recording: VOID STRIKER — boss kill → score threshold hit
- [ ] Animated infographic: OKT tokenomics card (supply, mint mechanism)
- [ ] Animated infographic: OKAssets ERC-1155 ownership diagram
- [ ] Screen recording: Portal marketplace — NFT asset ownership view
- [ ] Code overlay: `manifest.json` blockchain section animation
- [ ] Screen recording: Okama Studio manifest editor *(90s only)*
- [ ] B-roll: hardware — old laptop, mini PC, x86 box powering on
- [ ] Logo assets: `pages/assets/okama-logo.svg`, `pages/assets/okama-mark.svg`
- [ ] Audio: license dark synthwave track (ref: Perturbator, Makeup and Vanity Set)
- [ ] Captions: SRT for accessibility
- [ ] Farcaster Frame: wallet connect embed for CTA

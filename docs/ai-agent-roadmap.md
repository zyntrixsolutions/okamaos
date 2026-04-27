# OkamaOS AI Agent Roadmap

## Current State (MVP)

`okama-agent` is a template-based game scaffold tool.

```bash
okama-agent new-game           # interactive scaffold from template
okama-agent template list      # list available templates
okama-agent template create <name>  # create a new blank template
```

MVP generates:
- `manifest.ok.json` with all required fields
- Starter `main.py` using pygame + `okamaos.input_protocol`
- Empty `assets/` directory
- Ready for `okama-pack build`

No live AI API calls are made in MVP. All generation is local and deterministic.

## Phased Roadmap

### Phase 1 — Rich Templates (v1)

Goal: faster game creation without AI, just better scaffolds.

- 5+ built-in templates: blank, platformer, top-down shooter, puzzle, runner
- Each template ships with controller-ready movement, a start/pause/game-over
  screen, and a save-state stub
- `okama-agent template remix <src> <dest>` — fork and rename a template
- Template versioning: templates distributed as signed `.ok` packages themselves

### Phase 2 — Local AI Assist (v1.5)

Goal: AI help that works offline on the target hardware.

- Integrate a small quantized LLM (e.g. Phi-3 Mini 4B, llama.cpp)
- Chat interface via `okama-agent chat` in developer mode
- Prompts constrained to game-creation context
- AI output goes through a code sanitiser before writing to disk
- No internet required; model lives on a dedicated partition
- Kid-safe mode: content filter on all prompts and outputs

```bash
okama-agent chat
> "make the player move faster"
> "add a second enemy type"
> "add a sound effect when collecting coins"
```

### Phase 3 — Connected AI Creation (v2)

Goal: cloud-assisted game creation with parent oversight.

- OkamaLabs AI API (managed cloud)
- Age-appropriate content generation
- Asset generation (sprites, sounds, music) via API
- Parent dashboard: review AI-generated content before publish
- Token budget per account (prevents runaway API use)
- Offline fallback to Phase 1/2 if no connection

### Phase 4 — AI Publishing Pipeline (v2+)

Goal: kids publish games to the OkamaOS store.

- `okama-agent publish` submits a game for review
- Automated safety checks: content moderation, manifest validation, signing
- Parent co-approval required for all published games
- Review queue at OkamaLabs
- Approved games signed with OkamaLabs certificate and listed in store

## Safety Design

All AI integration must respect:

| Requirement                  | Mechanism                                        |
|------------------------------|--------------------------------------------------|
| No adult content             | Content filter on input and output               |
| No arbitrary code execution  | AI output sandboxed in `okama-agent` runtime     |
| Parent visibility            | All AI sessions logged, parent can review        |
| Parent approval for publish  | Required PIN before any store submission         |
| Offline-first                | Local templates always work; AI is additive      |
| No data leakage              | Game code not sent to API unless user opts in    |

## API Integration Spec (Phase 3)

```
POST https://api.okamalabs.com/v1/agent/complete
Authorization: Bearer <device_token>
Content-Type: application/json

{
  "session_id": "...",
  "game_id": "com.mygame.demo",
  "context": "pygame platformer with controller input",
  "prompt": "add a double jump mechanic",
  "safety_level": "kid_safe",
  "max_tokens": 512
}

Response:
{
  "code_patch": "...",
  "explanation": "...",
  "files_modified": ["main.py"]
}
```

## What is Explicitly Out of Scope (MVP)

- Live AI API calls of any kind
- Asset generation
- Game publishing
- Online store listings
- Multi-player AI features
- Personalization / learning profiles

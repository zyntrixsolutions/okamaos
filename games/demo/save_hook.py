"""save_hook.py — save/restore hook for com.okamalabs.demo.

Called by okama-snapshot:
  save_hook.py save    <save_dir>
  save_hook.py restore <save_dir>

For the demo game the canonical state is already written to
save_dir/save_state.json by the game itself when the player chooses
"Save state" in the pause menu. This hook just validates it and can
enrich the metadata if needed.
"""

import sys
import os
import json
import time


def do_save(save_dir: str) -> None:
    state_path = os.path.join(save_dir, "save_state.json")
    if os.path.exists(state_path):
        with open(state_path) as f:
            state = json.load(f)
        state["hook_saved_at"] = int(time.time())
        with open(state_path, "w") as f:
            json.dump(state, f, indent=2)
        print(f"[save_hook] state enriched at {state_path}")
    else:
        # No in-game save yet — write a minimal placeholder
        os.makedirs(save_dir, exist_ok=True)
        placeholder = {
            "game_id": "com.okamalabs.demo",
            "timestamp": int(time.time()),
            "hook_saved_at": int(time.time()),
            "px": 640,
            "py": 360,
            "score": 0,
        }
        with open(state_path, "w") as f:
            json.dump(placeholder, f, indent=2)
        print(f"[save_hook] placeholder written to {state_path}")


def do_restore(save_dir: str) -> None:
    state_path = os.path.join(save_dir, "save_state.json")
    if not os.path.exists(state_path):
        print(f"[save_hook] no save state at {state_path}", file=sys.stderr)
        sys.exit(1)
    with open(state_path) as f:
        state = json.load(f)
    print(f"[save_hook] restore: px={state.get('px','?')} py={state.get('py','?')} "
          f"score={state.get('score','?')}")


def main() -> None:
    if len(sys.argv) < 3:
        print("Usage: save_hook.py save|restore <save_dir>", file=sys.stderr)
        sys.exit(1)
    action = sys.argv[1]
    save_dir = sys.argv[2]
    if action == "save":
        do_save(save_dir)
    elif action == "restore":
        do_restore(save_dir)
    else:
        print(f"Unknown action: {action}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

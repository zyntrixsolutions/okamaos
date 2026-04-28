"""PGDrive — com.okamaos.pgdrive

Open-ended procedurally-generated driving simulator for OkamaOS.

Controls (keyboard):
  Arrow keys / WASD  — steer & accelerate
  H                  — toggle in-game help overlay
  Esc / Q            — quit back to OkamaOS shell

Joystick (if available):
  Left stick         — steer
  Right trigger      — accelerate
  Left trigger       — brake

The game auto-resets when the destination is reached or the vehicle crashes.
"""

import sys
import os
import random

GAME_DIR = os.environ.get("OKAMA_GAME_DIR",
                          os.path.dirname(os.path.realpath(__file__)))

sys.path.insert(0, GAME_DIR)

try:
    from pgdrive import PGDriveEnv
except ImportError as e:
    print(f"ERROR: PGDrive package not available: {e}", file=sys.stderr)
    print("Ensure pgdrive is installed or present in the game directory.", file=sys.stderr)
    sys.exit(1)


def main():
    controller_mode = "joystick"
    for arg in sys.argv[1:]:
        if arg == "--keyboard":
            controller_mode = "keyboard"

    env = PGDriveEnv(
        dict(
            use_render=True,
            controller=controller_mode,
            manual_control=True,
            traffic_density=0.2,
            environment_num=100,
            map=7,
            start_seed=random.randint(0, 1000),
        )
    )

    try:
        env.reset()
        for _ in range(1, 1_000_000):
            obs, reward, done, info = env.step([0, 0])
            env.render()
            if done:
                env.reset()
    except KeyboardInterrupt:
        pass
    finally:
        try:
            env.close()
        except Exception:
            pass

    sys.exit(0)


if __name__ == "__main__":
    main()

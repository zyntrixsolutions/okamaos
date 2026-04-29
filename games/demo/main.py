"""Okama Demo Game — com.okamalabs.demo

Controller-first reference game for OkamaOS.

Screens:
  start   → press A to begin
  play    → move sprite with D-pad / left stick; START to pause; B to return to start
  pause   → resume (A), save (X), quit to shell (B)

Save state: writes /var/okamaos/saves/com.okamalabs.demo/save_state.json
Exit: sys.exit(0) which causes okama-run to cleanly return to okama-shell.
"""

import sys
import os
import json
import time

sys.path.insert(0, "/usr/lib/okamaos")

try:
    import pygame
except ImportError:
    print("pygame not available — running in headless test mode")
    time.sleep(2)
    sys.exit(0)

from okamaos.input_protocol import InputClient

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
WIDTH, HEIGHT = 1280, 720
FPS    = 30
TITLE  = "Okama Demo"

GAME_ID   = os.environ.get("OKAMA_GAME_ID",  "com.okamalabs.demo")
SAVES_DIR = os.path.join(
    os.environ.get("OKAMA_SAVES", "/var/okamaos/saves"),
    GAME_ID,
)
SAVE_FILE = os.path.join(SAVES_DIR, "save_state.json")

COL_BG       = (10,  12,  28)
COL_ACCENT   = (80,  60, 200)
COL_TEXT     = (230, 230, 240)
COL_DIM      = (100, 100, 120)
COL_PLAYER   = (100, 200, 255)
COL_PLAYER2  = ( 60, 140, 200)
COL_PAUSE_BG = (10,  10,  20, 210)
COL_OK       = ( 60, 200,  80)
COL_WARN     = (220, 100,  30)

PLAYER_SPEED = 6
PLAYER_SIZE  = 40

AXIS_DEAD = 0.15


# ---------------------------------------------------------------------------
# Save / restore helpers
# ---------------------------------------------------------------------------
def load_save() -> dict:
    try:
        with open(SAVE_FILE) as f:
            return json.load(f)
    except Exception:
        return {}


def write_save(state: dict) -> None:
    os.makedirs(SAVES_DIR, exist_ok=True)
    state["timestamp"] = int(time.time())
    state["game_id"]   = GAME_ID
    with open(SAVE_FILE, "w") as f:
        json.dump(state, f, indent=2)


# ---------------------------------------------------------------------------
# Input adapter
# ---------------------------------------------------------------------------
class GameInput:
    """Reads from okama-inputd socket; falls back to pygame keyboard in dev mode."""

    def __init__(self):
        self.client = InputClient()
        self._connected = self.client.connect()
        self._held: set = set()
        self._just_pressed: set = set()
        self._axis: dict = {}

    def update(self, pygame_events: list):
        self._just_pressed = set()

        # okama-inputd socket
        for ev in self.client.poll():
            if ev.get("type") == "button":
                btn = ev["button"]
                if ev["state"] == "pressed":
                    if btn not in self._held:
                        self._just_pressed.add(btn)
                    self._held.add(btn)
                else:
                    self._held.discard(btn)
            elif ev.get("type") == "axis":
                self._axis[ev["axis"]] = ev["value"]

        # Keyboard fallback (emergency / dev)
        for ev in pygame_events:
            if ev.type == pygame.KEYDOWN:
                mapping = {
                    pygame.K_UP:     "DPAD_UP",
                    pygame.K_DOWN:   "DPAD_DOWN",
                    pygame.K_LEFT:   "DPAD_LEFT",
                    pygame.K_RIGHT:  "DPAD_RIGHT",
                    pygame.K_RETURN: "A",
                    pygame.K_ESCAPE: "B",
                    pygame.K_p:      "START",
                    pygame.K_x:      "X",
                }
                btn = mapping.get(ev.key)
                if btn and btn not in self._held:
                    self._just_pressed.add(btn)
                    self._held.add(btn)
            elif ev.type == pygame.KEYUP:
                mapping = {
                    pygame.K_UP:    "DPAD_UP",
                    pygame.K_DOWN:  "DPAD_DOWN",
                    pygame.K_LEFT:  "DPAD_LEFT",
                    pygame.K_RIGHT: "DPAD_RIGHT",
                }
                btn = mapping.get(ev.key)
                if btn:
                    self._held.discard(btn)

    def pressed(self, btn: str) -> bool:
        return btn in self._just_pressed

    def held(self, btn: str) -> bool:
        return btn in self._held

    def axis(self, name: str) -> float:
        return self._axis.get(name, 0.0)

    def move_vector(self) -> tuple:
        dx = dy = 0.0
        if self.held("DPAD_LEFT")  or self.axis("LSTICK_X") < -AXIS_DEAD:
            dx -= 1
        if self.held("DPAD_RIGHT") or self.axis("LSTICK_X") > AXIS_DEAD:
            dx += 1
        if self.held("DPAD_UP")    or self.axis("LSTICK_Y") < -AXIS_DEAD:
            dy -= 1
        if self.held("DPAD_DOWN")  or self.axis("LSTICK_Y") > AXIS_DEAD:
            dy += 1
        # Normalise diagonal
        if dx and dy:
            import math
            dx /= math.sqrt(2)
            dy /= math.sqrt(2)
        return dx, dy


# ---------------------------------------------------------------------------
# Player sprite
# ---------------------------------------------------------------------------
class Player:
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y
        self.angle = 0.0
        self.trail: list = []

    def update(self, dx: float, dy: float):
        self.x = max(PLAYER_SIZE // 2,
                     min(WIDTH  - PLAYER_SIZE // 2, self.x + dx * PLAYER_SPEED))
        self.y = max(PLAYER_SIZE // 2,
                     min(HEIGHT - PLAYER_SIZE // 2, self.y + dy * PLAYER_SPEED))
        self.angle = (self.angle + 2) % 360
        if dx or dy:
            self.trail.append((int(self.x), int(self.y)))
            if len(self.trail) > 18:
                self.trail.pop(0)

    def draw(self, surf):
        for i, (tx, ty) in enumerate(self.trail):
            alpha = int(180 * i / max(len(self.trail), 1))
            r = max(4, PLAYER_SIZE // 3 * i // max(len(self.trail), 1))
            c = (COL_PLAYER2[0], COL_PLAYER2[1], COL_PLAYER2[2])
            pygame.draw.circle(surf, c, (tx, ty), r)

        pygame.draw.circle(surf, COL_PLAYER, (int(self.x), int(self.y)),
                           PLAYER_SIZE // 2)
        eye_x = int(self.x + 10 * (__import__("math").cos(
            __import__("math").radians(self.angle))))
        eye_y = int(self.y + 10 * (__import__("math").sin(
            __import__("math").radians(self.angle))))
        pygame.draw.circle(surf, (255, 255, 255), (eye_x, eye_y), 5)

    def state_dict(self) -> dict:
        return {"px": self.x, "py": self.y}

    def load_state(self, d: dict):
        self.x = float(d.get("px", self.x))
        self.y = float(d.get("py", self.y))


# ---------------------------------------------------------------------------
# Screens
# ---------------------------------------------------------------------------
def draw_start(surf, fonts, blink: bool):
    surf.fill(COL_BG)
    title = fonts["xl"].render("OKAMA DEMO", True, COL_ACCENT)
    surf.blit(title, (WIDTH // 2 - title.get_width() // 2, 200))

    if blink:
        msg = fonts["md"].render("[A] Start", True, COL_TEXT)
        surf.blit(msg, (WIDTH // 2 - msg.get_width() // 2, 340))

    sub = fonts["sm"].render("Use D-pad or left stick to move", True, COL_DIM)
    surf.blit(sub, (WIDTH // 2 - sub.get_width() // 2, 400))

    credit = fonts["sm"].render("OkamaLabs demo — com.okamalabs.demo  v0.1.1",
                                True, COL_DIM)
    surf.blit(credit, (WIDTH // 2 - credit.get_width() // 2, HEIGHT - 40))


def draw_play(surf, fonts, player: Player, score: int):
    surf.fill(COL_BG)

    # Grid
    for gx in range(0, WIDTH, 80):
        pygame.draw.line(surf, (20, 22, 40), (gx, 0), (gx, HEIGHT))
    for gy in range(0, HEIGHT, 80):
        pygame.draw.line(surf, (20, 22, 40), (0, gy), (WIDTH, gy))

    player.draw(surf)

    sc = fonts["md"].render(f"Score: {score}", True, COL_TEXT)
    surf.blit(sc, (20, 14))

    hint = fonts["hint"].render(
        "  [D-pad/LSTICK] Move   [START] Pause   [B] Start screen",
        True, COL_DIM)
    surf.blit(hint, (20, HEIGHT - 28))


def draw_pause(surf, fonts, menu_idx: int):
    overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
    overlay.fill(COL_PAUSE_BG)
    surf.blit(overlay, (0, 0))

    title = fonts["lg"].render("PAUSED", True, COL_TEXT)
    surf.blit(title, (WIDTH // 2 - title.get_width() // 2, 180))

    options = ["Resume  [A]", "Save state  [X]", "Quit to shell  [B]"]
    colors  = [COL_OK, COL_ACCENT, COL_WARN]
    for i, (opt, col) in enumerate(zip(options, colors)):
        active = (i == menu_idx)
        text = fonts["md"].render(opt, True, col if active else COL_DIM)
        x = WIDTH // 2 - text.get_width() // 2
        y = 280 + i * 70
        if active:
            pygame.draw.rect(surf, (30, 30, 60),
                             (x - 16, y - 8, text.get_width() + 32,
                              text.get_height() + 16),
                             border_radius=8)
        surf.blit(text, (x, y))

    hint = fonts["hint"].render(
        "  [↕] Navigate   [A] Select   [B] Quit to shell", True, COL_DIM)
    surf.blit(hint, (20, HEIGHT - 28))


# ---------------------------------------------------------------------------
# Main game loop
# ---------------------------------------------------------------------------
def main():
    pygame.init()
    pygame.display.set_caption(TITLE)

    flags = pygame.FULLSCREEN | pygame.NOFRAME
    if "--windowed" in sys.argv:
        flags = 0
    screen = pygame.display.set_mode((WIDTH, HEIGHT), flags)
    pygame.mouse.set_visible(False)
    clock = pygame.time.Clock()

    try:
        font_xl   = pygame.font.SysFont("DejaVu Sans", 72, bold=True)
        font_lg   = pygame.font.SysFont("DejaVu Sans", 48, bold=True)
        font_md   = pygame.font.SysFont("DejaVu Sans", 32)
        font_sm   = pygame.font.SysFont("DejaVu Sans", 22)
        font_hint = pygame.font.SysFont("DejaVu Sans", 18)
    except Exception:
        f = pygame.font.Font(None, 36)
        font_xl = font_lg = font_md = font_sm = font_hint = f

    fonts = {"xl": font_xl, "lg": font_lg, "md": font_md,
             "sm": font_sm, "hint": font_hint}

    inp = GameInput()
    player = Player(WIDTH // 2, HEIGHT // 2)
    score = 0
    blink_timer = 0
    pause_idx = 0

    # Try to load a save
    saved = load_save()
    if saved:
        player.load_state(saved)
        score = int(saved.get("score", 0))

    game_state = "start"  # start | play | pause

    running = True
    while running:
        raw_events = pygame.event.get()
        inp.update(raw_events)

        for ev in raw_events:
            if ev.type == pygame.QUIT:
                running = False

        blink_timer += 1

        # -------------------------------------------------------------------
        if game_state == "start":
            if inp.pressed("A"):
                game_state = "play"
            elif inp.pressed("B"):
                running = False

        # -------------------------------------------------------------------
        elif game_state == "play":
            dx, dy = inp.move_vector()
            if dx or dy:
                score += 1
            player.update(dx, dy)

            if inp.pressed("START"):
                pause_idx = 0
                game_state = "pause"
            elif inp.pressed("B"):
                game_state = "start"

        # -------------------------------------------------------------------
        elif game_state == "pause":
            if inp.pressed("DPAD_DOWN"):
                pause_idx = (pause_idx + 1) % 3
            elif inp.pressed("DPAD_UP"):
                pause_idx = (pause_idx - 1) % 3
            elif inp.pressed("A"):
                if pause_idx == 0:
                    game_state = "play"
                elif pause_idx == 1:
                    write_save({**player.state_dict(), "score": score})
                    game_state = "play"
                elif pause_idx == 2:
                    running = False
            elif inp.pressed("B"):
                running = False

        # -------------------------------------------------------------------
        if game_state == "start":
            draw_start(screen, fonts, blink=(blink_timer // 20) % 2 == 0)
        elif game_state == "play":
            draw_play(screen, fonts, player, score)
        elif game_state == "pause":
            draw_play(screen, fonts, player, score)
            draw_pause(screen, fonts, pause_idx)

        pygame.display.flip()
        clock.tick(FPS)

    pygame.quit()
    sys.exit(0)


if __name__ == "__main__":
    main()

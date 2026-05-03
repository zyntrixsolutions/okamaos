"""OkamaOS platformer template.

Features: gravity, left/right movement, jump, simple platform collision.
A = jump, D-pad/LSTICK = move, B = back to shell.
Replace platform list and add your own levels.
"""

import sys
import os

sys.path.insert(0, "/usr/lib/okamaos")

import pygame
from okamaos.display import open_display
from okamaos.input_protocol import InputClient

WIDTH, HEIGHT = 1280, 720
FPS = 30
GRAVITY = 0.6
JUMP_SPEED = -14
MOVE_SPEED = 5

COL_BG      = (18, 20, 36)
COL_PLAYER  = (100, 200, 255)
COL_GROUND  = (60, 80, 140)
COL_TEXT    = (230, 230, 240)


class Player:
    def __init__(self, x, y):
        self.rect = pygame.Rect(x, y, 36, 48)
        self.vx = 0.0
        self.vy = 0.0
        self.on_ground = False

    def update(self, platforms):
        self.vy += GRAVITY
        self.rect.x += int(self.vx)
        self._collide_x(platforms)
        self.rect.y += int(self.vy)
        self.on_ground = False
        self._collide_y(platforms)

    def _collide_x(self, platforms):
        for p in platforms:
            if self.rect.colliderect(p):
                if self.vx > 0:
                    self.rect.right = p.left
                elif self.vx < 0:
                    self.rect.left = p.right
                self.vx = 0

    def _collide_y(self, platforms):
        for p in platforms:
            if self.rect.colliderect(p):
                if self.vy > 0:
                    self.rect.bottom = p.top
                    self.on_ground = True
                elif self.vy < 0:
                    self.rect.top = p.bottom
                self.vy = 0

    def draw(self, surf):
        pygame.draw.rect(surf, COL_PLAYER, self.rect, border_radius=6)


PLATFORMS = [
    pygame.Rect(0,    680, 1280, 40),
    pygame.Rect(200,  540, 200,  20),
    pygame.Rect(500,  440, 200,  20),
    pygame.Rect(800,  340, 200,  20),
    pygame.Rect(300,  300, 150,  20),
]


def main():
    pygame.init()
    screen, display = open_display(
        pygame, WIDTH, HEIGHT, pygame.FULLSCREEN | pygame.NOFRAME,
        caption="OkamaOS Platformer")
    pygame.mouse.set_visible(False)
    clock = pygame.time.Clock()
    font = pygame.font.SysFont("DejaVu Sans", 22)

    inp = InputClient()
    inp.connect()

    player = Player(100, 600)
    axis: dict = {}
    held: set = set()
    just: set = set()

    running = True
    while running:
        just = set()
        for ev in pygame.event.get():
            if ev.type == pygame.QUIT:
                running = False
            elif ev.type == pygame.KEYDOWN:
                if ev.key == pygame.K_ESCAPE:
                    running = False
                elif ev.key == pygame.K_SPACE and player.on_ground:
                    player.vy = JUMP_SPEED

        for ev in inp.poll():
            t = ev.get("type")
            if t == "button":
                btn = ev["button"]
                if ev["state"] == "pressed":
                    just.add(btn)
                    held.add(btn)
                else:
                    held.discard(btn)
            elif t == "axis":
                axis[ev["axis"]] = ev["value"]

        if "B" in just:
            running = False
        if ("A" in just) and player.on_ground:
            player.vy = JUMP_SPEED

        dx = 0
        if "DPAD_LEFT"  in held or axis.get("LSTICK_X", 0) < -0.15:
            dx = -MOVE_SPEED
        if "DPAD_RIGHT" in held or axis.get("LSTICK_X", 0) > 0.15:
            dx = MOVE_SPEED
        player.vx = dx

        player.update(PLATFORMS)

        screen.fill(COL_BG)
        for p in PLATFORMS:
            pygame.draw.rect(screen, COL_GROUND, p, border_radius=4)
        player.draw(screen)

        hint = font.render("[D-pad] Move   [A] Jump   [B] Exit", True, (80, 80, 120))
        screen.blit(hint, (20, HEIGHT - 30))
        display.flip(screen)
        clock.tick(FPS)

    display.close()
    pygame.quit()
    sys.exit(0)


if __name__ == "__main__":
    main()

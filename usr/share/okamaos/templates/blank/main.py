"""Blank OkamaOS game template.

Replace this file with your game logic.
Controller input flows through okama-inputd → InputClient.
"""

import sys
import os

sys.path.insert(0, "/usr/lib/okamaos")

import pygame
from okamaos.display import open_display
from okamaos.input_protocol import InputClient

WIDTH, HEIGHT = 1280, 720
FPS = 30


def main():
    pygame.init()
    screen, display = open_display(
        pygame, WIDTH, HEIGHT, pygame.FULLSCREEN | pygame.NOFRAME,
        caption="OkamaOS Game")
    pygame.mouse.set_visible(False)
    clock = pygame.time.Clock()

    inp = InputClient()
    inp.connect()

    running = True
    while running:
        raw = pygame.event.get()
        for ev in raw:
            if ev.type == pygame.QUIT:
                running = False

        for ev in inp.poll():
            if ev.get("type") == "button" and ev.get("state") == "pressed":
                if ev["button"] == "B":
                    running = False  # return to okama-shell

        screen.fill((10, 10, 24))
        display.flip(screen)
        clock.tick(FPS)

    display.close()
    pygame.quit()
    sys.exit(0)


if __name__ == "__main__":
    main()

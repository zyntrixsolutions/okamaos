"""PGDrive — com.okamaos.pgdrive  v0.2.0
Pygame top-down driving simulator for OkamaOS.
Self-contained: only pygame required (already installed on OkamaOS).
No panda3d, gym, or heavy dependencies needed.

Controls (keyboard):
  Up / W        — accelerate
  Down / S      — brake / reverse
  Left / Right  — steer
  H             — toggle help overlay
  R             — new random map
  Esc / Q       — quit back to OkamaOS shell

Controller (via okama-inputd):
  LSTICK_X      — steer
  R2_AXIS       — gas
  L2_AXIS       — brake
  DPAD Up/Down  — gas / brake
  DPAD Left/Right — steer (digital)
  Y             — new random map
  X             — toggle help
  START         — quit
"""

import sys
import os
import math
import random
import time

sys.path.insert(0, "/usr/lib/okamaos")

try:
    import pygame
    from pygame.locals import (
        QUIT, KEYDOWN,
        K_ESCAPE, K_q, K_h, K_r,
        K_w, K_a, K_s, K_d,
        K_UP, K_DOWN, K_LEFT, K_RIGHT,
    )
except ImportError as e:
    print(f"ERROR: pygame not available: {e}", file=sys.stderr)
    sys.exit(1)

from okamaos.display import open_display

try:
    from okamaos.input_protocol import InputClient
    _HAS_INPUT_CLIENT = True
except ImportError:
    _HAS_INPUT_CLIENT = False

# ─────────────────────────────── display ────────────────────────────────────
TARGET_FPS = 30
WIDTH      = 1024
HEIGHT     = 768

# ─────────────────────────────── world ──────────────────────────────────────
GRID_COLS    = 12
GRID_ROWS    = 12
CELL_SIZE    = 240     # world-units between grid nodes
ROAD_HW      = 32     # road half-width (world units)
EDGE_DENSITY = 0.85   # probability that any potential road edge exists
DASH_LEN     = 22
DASH_GAP     = 16

# ─────────────────────────────── vehicles ───────────────────────────────────
CAR_L        = 28
CAR_W        = 14
MAX_SPD      = 6.0
ACCEL        = 0.20
BRAKE_F      = 0.32
FRICTION     = 0.91
STEER_MAX    = 0.048
NPC_COUNT    = 10
NPC_SPD_LO   = 0.8
NPC_SPD_HI   = 2.4

# ─────────────────────────────── palette ────────────────────────────────────
C_GRASS    = ( 28,  88,  28)
C_ROAD     = ( 52,  52,  58)
C_ROAD_EDG = (200, 200, 200)
C_ROAD_CTR = (230, 210,  40)
C_PLAYER   = ( 40, 180, 255)
C_PLAYER_H = (180, 240, 255)
C_NPC      = (255,  80,  80)
C_NPC_H    = (255, 180, 180)
C_WHITE    = (255, 255, 255)
C_YELLOW   = (240, 200,   0)
C_GREEN    = ( 50, 210,  80)
C_RED      = (220,  40,  40)
C_BLUE     = ( 40, 140, 240)
C_DIM      = (120, 120, 130)


# ══════════════════════════════════════════════════════════════════════════════
# Road network
# ══════════════════════════════════════════════════════════════════════════════

def node_pos(col, row):
    """World-space centre of grid node (col, row)."""
    ox = -(GRID_COLS - 1) * CELL_SIZE // 2
    oy = -(GRID_ROWS - 1) * CELL_SIZE // 2
    return (ox + col * CELL_SIZE, oy + row * CELL_SIZE)


def build_graph(seed):
    """Return (edges_list, nodes_set) for the road network."""
    rng = random.Random(seed)
    edges = []
    nodes = set()
    for r in range(GRID_ROWS):
        for c in range(GRID_COLS):
            if c + 1 < GRID_COLS and rng.random() < EDGE_DENSITY:
                edges.append(((c, r), (c + 1, r)))
                nodes |= {(c, r), (c + 1, r)}
            if r + 1 < GRID_ROWS and rng.random() < EDGE_DENSITY:
                edges.append(((c, r), (c, r + 1)))
                nodes |= {(c, r), (c, r + 1)}
    if not edges:
        for c in range(GRID_COLS - 1):
            edges.append(((c, 0), (c + 1, 0)))
            nodes |= {(c, 0), (c + 1, 0)}
    return edges, nodes


# ══════════════════════════════════════════════════════════════════════════════
# Camera
# ══════════════════════════════════════════════════════════════════════════════

class Camera:
    def __init__(self):
        self.x = 0.0
        self.y = 0.0

    def follow(self, tx, ty, smooth=0.10):
        self.x += (tx - self.x) * smooth
        self.y += (ty - self.y) * smooth

    def w2s(self, wx, wy):
        return (int(wx - self.x + WIDTH // 2), int(wy - self.y + HEIGHT // 2))

    def visible_aabb(self, margin=320):
        hw = WIDTH  // 2 + margin
        hh = HEIGHT // 2 + margin
        return (self.x - hw, self.y - hh, self.x + hw, self.y + hh)


# ══════════════════════════════════════════════════════════════════════════════
# Car physics
# ══════════════════════════════════════════════════════════════════════════════

class Car:
    def __init__(self, wx, wy, heading=0.0, color=C_PLAYER, hl=C_PLAYER_H):
        self.x       = float(wx)
        self.y       = float(wy)
        self.heading = float(heading)
        self.speed   = 0.0
        self.color   = color
        self.hl      = hl

    def update(self, gas, brake, steer):
        turn_scale    = min(1.0, abs(self.speed) / 2.5)
        sign          = 1.0 if self.speed >= 0 else -1.0
        self.heading += steer * STEER_MAX * turn_scale * sign
        self.speed   += gas * ACCEL - brake * BRAKE_F
        self.speed    = max(-MAX_SPD * 0.38, min(MAX_SPD, self.speed))
        self.speed   *= FRICTION
        self.x       += math.cos(self.heading) * self.speed
        self.y       += math.sin(self.heading) * self.speed

    def draw(self, surf, cam):
        sx, sy  = cam.w2s(self.x, self.y)
        ch, sh  = math.cos(self.heading), math.sin(self.heading)
        hl2, hw2 = CAR_L / 2, CAR_W / 2
        corners = [( hl2,  hw2), ( hl2, -hw2), (-hl2, -hw2), (-hl2,  hw2)]
        pts = [(sx + lx * ch - ly * sh, sy + lx * sh + ly * ch)
               for lx, ly in corners]
        pygame.draw.polygon(surf, self.color, pts)
        fx = sx + ch * hl2 * 0.65
        fy = sy + sh * hl2 * 0.65
        pygame.draw.circle(surf, self.hl, (int(fx), int(fy)), 4)


# ══════════════════════════════════════════════════════════════════════════════
# NPC car
# ══════════════════════════════════════════════════════════════════════════════

class NpcCar(Car):
    def __init__(self, edges, rng):
        self._edges = edges
        self._rng   = rng
        e  = rng.choice(edges)
        na, nb = (e[1], e[0]) if rng.random() < 0.5 else (e[0], e[1])
        ax, ay = node_pos(*na)
        bx, by = node_pos(*nb)
        t = rng.random()
        super().__init__(ax + (bx - ax) * t, ay + (by - ay) * t,
                         heading=math.atan2(by - ay, bx - ax),
                         color=C_NPC, hl=C_NPC_H)
        self._dest    = (bx, by)
        self._tgt_spd = rng.uniform(NPC_SPD_LO, NPC_SPD_HI)

    def tick(self):
        dx = self._dest[0] - self.x
        dy = self._dest[1] - self.y
        if math.hypot(dx, dy) < 28:
            e = self._rng.choice(self._edges)
            na, nb = (e[1], e[0]) if self._rng.random() < 0.5 else (e[0], e[1])
            self._dest = node_pos(*nb)
            return
        tgt  = math.atan2(dy, dx)
        diff = (tgt - self.heading + math.pi) % (2 * math.pi) - math.pi
        self.heading += diff * 0.07
        self.speed   += (self._tgt_spd - self.speed) * 0.05
        self.x       += math.cos(self.heading) * self.speed
        self.y       += math.sin(self.heading) * self.speed


# ══════════════════════════════════════════════════════════════════════════════
# Road drawing
# ══════════════════════════════════════════════════════════════════════════════

def draw_road_segment(surf, cam, na, nb):
    ax, ay = cam.w2s(*node_pos(*na))
    bx, by = cam.w2s(*node_pos(*nb))
    angle  = math.atan2(by - ay, bx - ax)
    perp   = angle + math.pi / 2
    pw, ph = math.cos(perp) * ROAD_HW, math.sin(perp) * ROAD_HW
    pts = [(ax + pw, ay + ph), (ax - pw, ay - ph),
           (bx - pw, by - ph), (bx + pw, by + ph)]
    pygame.draw.polygon(surf, C_ROAD, pts)
    pygame.draw.line(surf, C_ROAD_EDG, (int(ax + pw), int(ay + ph)),
                     (int(bx + pw), int(by + ph)), 2)
    pygame.draw.line(surf, C_ROAD_EDG, (int(ax - pw), int(ay - ph)),
                     (int(bx - pw), int(by - ph)), 2)
    seg_len = math.hypot(bx - ax, by - ay)
    if seg_len < 1:
        return
    ux, uy = (bx - ax) / seg_len, (by - ay) / seg_len
    pos, draw = 0.0, True
    while pos < seg_len:
        nxt = min(pos + (DASH_LEN if draw else DASH_GAP), seg_len)
        if draw:
            pygame.draw.line(surf, C_ROAD_CTR,
                             (int(ax + ux * pos),  int(ay + uy * pos)),
                             (int(ax + ux * nxt),  int(ay + uy * nxt)), 2)
        pos  = nxt
        draw = not draw


def draw_intersection(surf, cam, node):
    sx, sy = cam.w2s(*node_pos(*node))
    r = ROAD_HW
    pygame.draw.rect(surf, C_ROAD, (sx - r, sy - r, 2 * r, 2 * r))


# ══════════════════════════════════════════════════════════════════════════════
# HUD & minimap
# ══════════════════════════════════════════════════════════════════════════════

def draw_hud(surf, fsm, flg, car, elapsed, show_hints):
    bx, by   = 18, HEIGHT - 56
    bar_w, bar_h = 170, 14
    spd_ratio = abs(car.speed) / MAX_SPD
    pygame.draw.rect(surf, (36, 36, 42), (bx, by, bar_w, bar_h))
    fill_col = C_GREEN if car.speed >= 0 else C_RED
    pygame.draw.rect(surf, fill_col, (bx, by, int(bar_w * spd_ratio), bar_h))
    pygame.draw.rect(surf, C_DIM, (bx, by, bar_w, bar_h), 1)
    km_h = abs(car.speed) * 18
    surf.blit(fsm.render(f"{km_h:.0f} km/h", True, C_WHITE), (bx + bar_w + 10, by - 1))
    gear = "R" if car.speed < -0.08 else ("N" if abs(car.speed) < 0.08 else "D")
    surf.blit(flg.render(gear, True, C_YELLOW), (bx - 30, by - 6))
    m, s = int(elapsed) // 60, int(elapsed) % 60
    t_txt = fsm.render(f"{m:02d}:{s:02d}", True, C_WHITE)
    surf.blit(t_txt, (WIDTH - t_txt.get_width() - 16, 14))
    if show_hints:
        h = fsm.render("  ↑/W Gas   ↓/S Brake   ←/→ Steer   H Help   R New map   Esc Quit",
                        True, C_DIM)
        surf.blit(h, (bx, HEIGHT - 26))


def draw_minimap(surf, edges, nodes, npcs, player, cam):
    mm_w, mm_h = 168, 130
    mm_x = WIDTH  - mm_w - 12
    mm_y = 12
    mm   = pygame.Surface((mm_w, mm_h), pygame.SRCALPHA)
    mm.fill((10, 10, 20, 185))
    wx0 = -(GRID_COLS - 1) * CELL_SIZE // 2
    wy0 = -(GRID_ROWS - 1) * CELL_SIZE // 2
    wx1 = -wx0 or 1
    wy1 = -wy0 or 1
    sx  = wx1 - wx0 or 1
    sy  = wy1 - wy0 or 1

    def w2m(wx, wy):
        return (int((wx - wx0) / sx * mm_w), int((wy - wy0) / sy * mm_h))

    for na, nb in edges:
        pygame.draw.line(mm, (90, 90, 100), w2m(*node_pos(*na)), w2m(*node_pos(*nb)), 1)
    for npc in npcs:
        pygame.draw.circle(mm, C_NPC, w2m(npc.x, npc.y), 2)
    pp = w2m(player.x, player.y)
    pygame.draw.circle(mm, C_PLAYER, pp, 4)
    pygame.draw.circle(mm, C_WHITE,  pp, 4, 1)
    vx, vy = w2m(cam.x, cam.y)
    vw = max(4, int(WIDTH  / sx * mm_w))
    vh = max(4, int(HEIGHT / sy * mm_h))
    pygame.draw.rect(mm, (80, 130, 200, 120), (vx - vw//2, vy - vh//2, vw, vh))
    pygame.draw.rect(mm, C_BLUE,              (vx - vw//2, vy - vh//2, vw, vh), 1)
    pygame.draw.rect(mm, C_DIM, (0, 0, mm_w, mm_h), 1)
    surf.blit(mm, (mm_x, mm_y))


def draw_help(surf, fsm):
    lines = [
        ("PGDRIVE CONTROLS", C_YELLOW),
        ("",                                    C_WHITE),
        ("↑ / W            Accelerate",         C_WHITE),
        ("↓ / S            Brake / Reverse",    C_WHITE),
        ("← / →            Steer",              C_WHITE),
        ("R                New random map",     C_WHITE),
        ("H / X            Toggle help",        C_WHITE),
        ("Esc / Q / START  Quit",               C_WHITE),
        ("",                                    C_WHITE),
        ("Controller:",                         C_YELLOW),
        ("LSTICK X         Steer",              C_WHITE),
        ("R2_AXIS / DPAD↑  Gas",               C_WHITE),
        ("L2_AXIS / DPAD↓  Brake",             C_WHITE),
        ("Y                New map",            C_WHITE),
        ("START            Quit",               C_WHITE),
    ]
    lh  = fsm.get_linesize() + 4
    pad = 24
    pw  = 380
    ph  = len(lines) * lh + pad * 2
    px  = (WIDTH  - pw) // 2
    py  = (HEIGHT - ph) // 2
    panel = pygame.Surface((pw, ph), pygame.SRCALPHA)
    panel.fill((10, 10, 24, 215))
    surf.blit(panel, (px, py))
    pygame.draw.rect(surf, C_BLUE, (px, py, pw, ph), 2)
    for i, (txt, col) in enumerate(lines):
        surf.blit(fsm.render(txt, True, col), (px + pad, py + pad + i * lh))


# ══════════════════════════════════════════════════════════════════════════════
# Input handler
# ══════════════════════════════════════════════════════════════════════════════

class DriveInput:
    AXIS_DEAD = 0.12

    def __init__(self):
        self._ic   = None
        self._js   = None
        self._held = set()
        self._just = set()
        self._axes = {}
        if _HAS_INPUT_CLIENT:
            ic = InputClient()
            if ic.connect():
                self._ic = ic
        if pygame.joystick.get_count() > 0:
            self._js = pygame.joystick.Joystick(0)
            self._js.init()

    def update(self, raw_events):
        self._just = set()
        if self._ic:
            for ev in self._ic.poll():
                t = ev.get("type")
                if t == "button":
                    b = ev["button"]
                    if ev["state"] == "pressed" and b not in self._held:
                        self._just.add(b)
                    if ev["state"] == "pressed":
                        self._held.add(b)
                    else:
                        self._held.discard(b)
                elif t == "axis":
                    self._axes[ev["axis"]] = ev["value"]
        keys = pygame.key.get_pressed()
        for key, tag in ((K_UP, "_gas"), (K_w, "_gas"), (K_DOWN, "_brake"),
                         (K_s, "_brake"), (K_LEFT, "_left"), (K_a, "_left"),
                         (K_RIGHT, "_right"), (K_d, "_right")):
            if keys[key]:
                self._held.add(tag)
            else:
                self._held.discard(tag)
        if self._js and not self._ic:
            try:
                self._axes["LSTICK_X"] = self._js.get_axis(0)
                rt = (self._js.get_axis(5) + 1) / 2
                lt = (self._js.get_axis(2) + 1) / 2
                self._axes["R2_AXIS"] = rt
                self._axes["L2_AXIS"] = lt
            except Exception:
                pass

    def pressed(self, btn):
        return btn in self._just

    def drive(self):
        gas = max(0.0, min(1.0, self._axes.get("R2_AXIS", 0.0)))
        if "DPAD_UP" in self._held or "_gas" in self._held:
            gas = 1.0
        brake = max(0.0, min(1.0, self._axes.get("L2_AXIS", 0.0)))
        if "DPAD_DOWN" in self._held or "_brake" in self._held:
            brake = 1.0
        steer = self._axes.get("LSTICK_X", 0.0)
        if abs(steer) < self.AXIS_DEAD:
            steer = 0.0
        if "DPAD_LEFT"  in self._held or "_left"  in self._held:
            steer = -1.0
        if "DPAD_RIGHT" in self._held or "_right" in self._held:
            steer = 1.0
        return gas, brake, max(-1.0, min(1.0, steer))

    def want_quit(self):
        return "START" in self._held or "QUIT" in self._just

    def want_reset(self):
        return self.pressed("Y")

    def want_help(self):
        return self.pressed("X")


# ══════════════════════════════════════════════════════════════════════════════
# Game
# ══════════════════════════════════════════════════════════════════════════════

class Game:
    def __init__(self, screen, display, seed=None):
        self.screen    = screen
        self.display   = display
        self._inp      = DriveInput()
        self.cam       = Camera()
        self.show_help = False
        try:
            self.fsm = pygame.font.SysFont("DejaVu Sans", 22)
            self.flg = pygame.font.SysFont("DejaVu Sans", 40, bold=True)
        except Exception:
            self.fsm = pygame.font.Font(None, 24)
            self.flg = pygame.font.Font(None, 42)
        self._build(seed or random.randint(0, 99999))

    def _build(self, seed):
        self.seed  = seed
        rng = random.Random(seed)
        self.edges, self.nodes = build_graph(seed)
        start = rng.choice(sorted(self.nodes))
        wx, wy = node_pos(*start)
        self.player = Car(wx, wy, heading=rng.uniform(0, 2 * math.pi))
        self.npcs   = [
            NpcCar(self.edges, random.Random(rng.randint(0, 999999)))
            for _ in range(NPC_COUNT)
        ]
        self.cam.x = float(wx)
        self.cam.y = float(wy)
        self.t0    = time.monotonic()

    def reset(self):
        self._build(random.randint(0, 99999))

    def run(self):
        clock   = pygame.time.Clock()
        running = True
        while running:
            raw = pygame.event.get()
            for ev in raw:
                if ev.type == QUIT:
                    running = False
                elif ev.type == KEYDOWN:
                    if ev.key in (K_ESCAPE, K_q):
                        running = False
                    elif ev.key == K_h:
                        self.show_help = not self.show_help
                    elif ev.key == K_r:
                        self.reset()
            self._inp.update(raw)
            if self._inp.want_quit():
                running = False
            if self._inp.want_reset():
                self.reset()
            if self._inp.want_help():
                self.show_help = not self.show_help
            gas, brake, steer = self._inp.drive()
            self.player.update(gas, brake, steer)
            for npc in self.npcs:
                npc.tick()
            self.cam.follow(self.player.x, self.player.y)
            self._draw()
            self.display.flip(self.screen)
            clock.tick(TARGET_FPS)

    def _draw(self):
        surf = self.screen
        surf.fill(C_GRASS)
        aabb = self.cam.visible_aabb()
        for na, nb in self.edges:
            ax, ay = node_pos(*na)
            bx, by = node_pos(*nb)
            if (max(ax, bx) < aabb[0] or min(ax, bx) > aabb[2] or
                    max(ay, by) < aabb[1] or min(ay, by) > aabb[3]):
                continue
            draw_road_segment(surf, self.cam, na, nb)
        for node in self.nodes:
            nx, ny = node_pos(*node)
            if aabb[0] <= nx <= aabb[2] and aabb[1] <= ny <= aabb[3]:
                draw_intersection(surf, self.cam, node)
        for npc in self.npcs:
            if aabb[0] <= npc.x <= aabb[2] and aabb[1] <= npc.y <= aabb[3]:
                npc.draw(surf, self.cam)
        self.player.draw(surf, self.cam)
        draw_minimap(surf, self.edges, self.nodes, self.npcs, self.player, self.cam)
        draw_hud(surf, self.fsm, self.flg, self.player,
                 time.monotonic() - self.t0, not self.show_help)
        if self.show_help:
            draw_help(surf, self.fsm)


# ══════════════════════════════════════════════════════════════════════════════
# Entry point
# ══════════════════════════════════════════════════════════════════════════════

def main():
    seed = None
    for arg in sys.argv[1:]:
        if arg.startswith("--seed="):
            try:
                seed = int(arg.split("=", 1)[1])
            except ValueError:
                pass

    pygame.init()

    flags = pygame.FULLSCREEN | pygame.NOFRAME
    if "--windowed" in sys.argv:
        flags = 0
    screen, display = open_display(pygame, WIDTH, HEIGHT, flags,
                                   caption="PGDrive — OkamaOS")
    pygame.mouse.set_visible(False)

    game = Game(screen, display, seed=seed)
    game.run()

    display.close()
    pygame.quit()
    sys.exit(0)


if __name__ == "__main__":
    main()

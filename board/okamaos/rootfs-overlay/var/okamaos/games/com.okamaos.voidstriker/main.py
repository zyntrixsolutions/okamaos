"""VOID STRIKER — com.okamaos.voidstriker  v1.0.0

Triple-A vertical shoot-em-up for OkamaOS.
Pure pygame — zero extra dependencies.

Controls:
  LSTICK / D-pad     Move ship
  A / Z / Space      Fire
  X                  Activate shield (when charged)
  RB / LB            Cycle weapon
  START / Esc        Pause
  B                  Back / Resume

Weapons:
  LASER  — fast single shot, rapid fire
  SPREAD — 3-way shot, medium rate
  BEAM   — dual high-damage bolts, very fast

Wave progression: 5 waves then BOSS.  Difficulty scales per wave.
High score is saved to /var/okamaos/saves/com.okamaos.voidstriker/save_state.json
"""

import sys
import os
import math
import random
import json
import time

sys.path.insert(0, "/usr/lib/okamaos")

try:
    import pygame
    from pygame.locals import (
        QUIT, KEYDOWN, KEYUP,
        K_UP, K_DOWN, K_LEFT, K_RIGHT,
        K_w, K_a, K_s, K_d,
        K_RETURN, K_z, K_SPACE, K_x,
        K_ESCAPE, K_p, K_TAB,
    )
except ImportError:
    print("pygame not available — headless mode")
    time.sleep(2)
    sys.exit(0)

from okamaos.display import open_display

try:
    from okamaos.input_protocol import InputClient
    _HAS_IC = True
except ImportError:
    _HAS_IC = False

# ── constants ─────────────────────────────────────────────────────────────────
W, H    = 1280, 720
FPS     = 60
GAME_ID = "com.okamaos.voidstriker"
SAVES   = os.path.join(os.environ.get("OKAMA_SAVES", "/var/okamaos/saves"), GAME_ID)
SAVE_F  = os.path.join(SAVES, "save_state.json")

# Palette
C_BG      = (  4,   6,  18)
C_STAR3   = ( 55,  65,  95)
C_STAR2   = (110, 125, 155)
C_STAR1   = (200, 210, 230)
C_PLAYER  = ( 80, 200, 255)
C_PLAYER2 = (  0, 110, 210)
C_ENGINE  = (255, 155,  30)
C_BULLET  = (255, 240,  90)
C_EBULLET = (255,  55,  55)
C_SPREAD  = ( 80, 255, 170)
C_BEAM    = (190,  60, 255)
C_SHIELD  = ( 55, 160, 255)
C_DRONE   = (175,  55, 240)
C_TANK    = (220, 100,  35)
C_BOMBER  = ( 35, 195,  80)
C_BOSS    = (255,  45,  75)
C_GOLD    = (255, 200,  35)
C_WHITE   = (255, 255, 255)
C_DIM     = ( 85,  90, 110)
C_RED     = (220,  35,  35)
C_GREEN   = ( 45, 205,  75)

WEAPON_COLORS = {"laser": C_BULLET, "spread": C_SPREAD, "beam": C_BEAM}
WEAPONS       = ["laser", "spread", "beam"]
AXIS_DEAD     = 0.15

# ── save / load ───────────────────────────────────────────────────────────────

def load_hi() -> int:
    try:
        with open(SAVE_F) as f:
            return int(json.load(f).get("hi_score", 0))
    except Exception:
        return 0


def save_hi(score: int) -> None:
    os.makedirs(SAVES, exist_ok=True)
    with open(SAVE_F, "w") as f:
        json.dump({"hi_score": score, "game_id": GAME_ID,
                   "timestamp": int(time.time())}, f, indent=2)


# ── input ─────────────────────────────────────────────────────────────────────

class GameInput:
    def __init__(self):
        self._ic   = None
        self._held = set()
        self._just = set()
        self._axes = {}
        if _HAS_IC:
            ic = InputClient()
            if ic.connect():
                self._ic = ic

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

        _kmap_dn = {
            K_UP: "DPAD_UP",   K_DOWN:  "DPAD_DOWN",
            K_LEFT: "DPAD_LEFT", K_RIGHT: "DPAD_RIGHT",
            K_w: "DPAD_UP",    K_s: "DPAD_DOWN",
            K_a: "DPAD_LEFT",  K_d: "DPAD_RIGHT",
            K_RETURN: "A",     K_z:  "A",  K_SPACE: "A",
            K_x: "X",          K_ESCAPE: "B", K_p: "START",
            K_TAB: "RB",
        }
        _kmap_up = {
            K_UP: "DPAD_UP",   K_DOWN:  "DPAD_DOWN",
            K_LEFT: "DPAD_LEFT", K_RIGHT: "DPAD_RIGHT",
            K_w: "DPAD_UP",    K_s: "DPAD_DOWN",
            K_a: "DPAD_LEFT",  K_d: "DPAD_RIGHT",
        }
        for ev in raw_events:
            if ev.type == KEYDOWN:
                b = _kmap_dn.get(ev.key)
                if b and b not in self._held:
                    self._just.add(b)
                    self._held.add(b)
            elif ev.type == KEYUP:
                b = _kmap_up.get(ev.key)
                if b:
                    self._held.discard(b)

    def pressed(self, b: str) -> bool:
        return b in self._just

    def held(self, b: str) -> bool:
        return b in self._held

    def move(self):
        ax = self._axes.get("LSTICK_X", 0.0)
        ay = self._axes.get("LSTICK_Y", 0.0)
        dx = dy = 0.0
        if self.held("DPAD_LEFT")  or ax < -AXIS_DEAD: dx = -1.0
        if self.held("DPAD_RIGHT") or ax >  AXIS_DEAD: dx =  1.0
        if self.held("DPAD_UP")    or ay < -AXIS_DEAD: dy = -1.0
        if self.held("DPAD_DOWN")  or ay >  AXIS_DEAD: dy =  1.0
        if dx and dy:
            f = math.sqrt(2)
            dx /= f
            dy /= f
        return dx, dy

    def firing(self) -> bool:
        r2 = self._axes.get("R2_AXIS", -1.0)
        return self.held("A") or r2 > 0.3


# ── screen shake ──────────────────────────────────────────────────────────────

_shake = [0, 0, 0]  # [ox, oy, intensity]


def trigger_shake(intensity: int = 8) -> None:
    _shake[2] = max(_shake[2], intensity)


def update_shake() -> tuple:
    if _shake[2] > 0:
        _shake[0] = random.randint(-_shake[2], _shake[2])
        _shake[1] = random.randint(-_shake[2], _shake[2])
        _shake[2] = max(0, _shake[2] - 1)
    else:
        _shake[0] = _shake[1] = 0
    return (_shake[0], _shake[1])


# ── particle system ───────────────────────────────────────────────────────────

_particles: list = []


def spawn_explosion(x, y, color, n=20, spd=4.5, life=38):
    for _ in range(n):
        a = random.uniform(0, math.pi * 2)
        s = random.uniform(0.4, spd)
        _particles.append([
            float(x), float(y),
            math.cos(a) * s, math.sin(a) * s,
            random.randint(life // 2, life), life,
            color, random.randint(2, 5)
        ])


def spawn_trail(x, y, color, n=2):
    for _ in range(n):
        _particles.append([
            x + random.uniform(-3, 3), y + random.uniform(-2, 4),
            random.uniform(-0.4, 0.4), random.uniform(0.5, 2.2),
            random.randint(6, 12), 12, color, 2
        ])


def draw_particles(surf):
    keep = []
    for p in _particles:
        p[0] += p[2]
        p[1] += p[3]
        p[4] -= 1
        if p[4] > 0:
            r, g, b = p[6]
            pygame.draw.circle(surf, (r, g, b), (int(p[0]), int(p[1])), p[7])
            keep.append(p)
    _particles[:] = keep


# ── scrolling starfield ───────────────────────────────────────────────────────

class Starfield:
    def __init__(self):
        rng = random.Random(1337)
        self.layers = [
            [(rng.randint(0, W), rng.uniform(0, H)) for _ in range(130)],
            [(rng.randint(0, W), rng.uniform(0, H)) for _ in range(55)],
            [(rng.randint(0, W), rng.uniform(0, H)) for _ in range(22)],
        ]
        self.speeds = [0.35, 0.9, 2.0]
        self.colors = [C_STAR3, C_STAR2, C_STAR1]
        self.radii  = [1, 1, 2]

    def update_draw(self, surf):
        for li, layer in enumerate(self.layers):
            spd = self.speeds[li]
            col = self.colors[li]
            r   = self.radii[li]
            for i, (sx, sy) in enumerate(layer):
                ny = sy + spd
                if ny > H:
                    ny -= H
                self.layers[li][i] = (sx, ny)
                pygame.draw.circle(surf, col, (int(sx), int(ny)), r)


# ── projectiles ───────────────────────────────────────────────────────────────

class Bullet:
    def __init__(self, x, y, vx, vy, color, dmg=1, r=4):
        self.x = float(x)
        self.y = float(y)
        self.vx = vx
        self.vy = vy
        self.color = color
        self.dmg = dmg
        self.r = r
        self.alive = True

    def update(self):
        self.x += self.vx
        self.y += self.vy
        if self.y < -30 or self.y > H + 30 or self.x < -30 or self.x > W + 30:
            self.alive = False

    def draw(self, surf):
        cx, cy = int(self.x), int(self.y)
        r, g, b = self.color
        outer = (min(255, r + 40), min(255, g + 40), min(255, b + 40))
        pygame.draw.circle(surf, outer, (cx, cy), self.r + 2)
        pygame.draw.circle(surf, self.color, (cx, cy), self.r)

    def rect(self):
        return pygame.Rect(self.x - self.r, self.y - self.r, self.r * 2, self.r * 2)


class EnemyBullet(Bullet):
    def __init__(self, x, y, vx, vy):
        super().__init__(x, y, vx, vy, C_EBULLET, dmg=1, r=3)


# ── enemy base ────────────────────────────────────────────────────────────────

class Enemy:
    def __init__(self, x, y, hp, score_val, color, size=20):
        self.x = float(x)
        self.y = float(y)
        self.hp = hp
        self.max_hp = hp
        self.score_val = score_val
        self.color = color
        self.size = size
        self.alive = True
        self.t = 0
        self.bullets: list = []

    def rect(self):
        s = self.size // 2
        return pygame.Rect(self.x - s, self.y - s, self.size, self.size)

    def hit(self, dmg: int) -> bool:
        self.hp -= dmg
        if self.hp <= 0:
            self.alive = False
            spawn_explosion(self.x, self.y, self.color, n=24, spd=5.5)
            return True
        spawn_explosion(self.x, self.y, self.color, n=5, spd=2.5, life=14)
        return False

    def _update_bullets(self):
        for b in self.bullets:
            b.update()
        self.bullets = [b for b in self.bullets if b.alive]

    def _draw_hp_bar(self, surf):
        if self.hp >= self.max_hp:
            return
        bw = self.size + 6
        bx = int(self.x) - bw // 2
        by = int(self.y) - self.size // 2 - 9
        pygame.draw.rect(surf, (55, 15, 15), (bx, by, bw, 4))
        frac = max(0.0, self.hp / self.max_hp)
        pygame.draw.rect(surf, C_RED, (bx, by, int(bw * frac), 4))

    def draw_bullets(self, surf):
        for b in self.bullets:
            b.draw(surf)


# ── drone ─────────────────────────────────────────────────────────────────────

class Drone(Enemy):
    def __init__(self, x, y, wave):
        super().__init__(x, y, hp=2, score_val=100, color=C_DRONE, size=20)
        self.vx = random.choice([-1, 1]) * random.uniform(1.5, 2.5 + wave * 0.12)
        self.vy = random.uniform(1.4, 2.2 + wave * 0.1)
        self.shoot_cd = random.randint(60, 180)

    def update(self):
        self.t += 1
        self.x += self.vx + math.sin(self.t * 0.055) * 1.8
        self.y += self.vy
        if self.x < self.size:   self.vx =  abs(self.vx)
        if self.x > W - self.size: self.vx = -abs(self.vx)
        if self.y > H + 80:
            self.alive = False
        self.shoot_cd -= 1
        if self.shoot_cd <= 0:
            self.shoot_cd = random.randint(90, 200)
            self.bullets.append(EnemyBullet(self.x, self.y + 8, 0.0, 4.2))
        self._update_bullets()

    def draw(self, surf):
        cx, cy = int(self.x), int(self.y)
        pts = [(cx, cy - 10), (cx + 10, cy), (cx, cy + 10), (cx - 10, cy)]
        pygame.draw.polygon(surf, self.color, pts)
        hi = tuple(min(255, c + 80) for c in self.color)
        pygame.draw.polygon(surf, hi, pts, 2)
        self._draw_hp_bar(surf)
        self.draw_bullets(surf)


# ── tank ──────────────────────────────────────────────────────────────────────

class Tank(Enemy):
    def __init__(self, x, y, wave):
        hp = 8 + wave * 2
        super().__init__(x, y, hp=hp, score_val=300, color=C_TANK, size=34)
        self.vy = 0.55 + wave * 0.04
        self.shoot_cd = random.randint(40, 80)

    def update(self):
        self.t += 1
        self.y += self.vy
        self.x += math.sin(self.t * 0.022) * 0.9
        if self.y > H + 90:
            self.alive = False
        self.shoot_cd -= 1
        if self.shoot_cd <= 0:
            self.shoot_cd = random.randint(50, 100)
            for ang in (-0.28, 0.0, 0.28):
                self.bullets.append(EnemyBullet(
                    self.x, self.y + self.size // 2,
                    math.sin(ang) * 3.0, math.cos(ang) * 3.0
                ))
        self._update_bullets()

    def draw(self, surf):
        cx, cy = int(self.x), int(self.y)
        s = self.size // 2
        pygame.draw.rect(surf, self.color, (cx - s, cy - s, s * 2, s * 2), border_radius=5)
        hi = tuple(min(255, c + 55) for c in self.color)
        pygame.draw.rect(surf, hi, (cx - s, cy - s, s * 2, s * 2), 2, border_radius=5)
        pygame.draw.rect(surf, (170, 75, 15), (cx - 4, cy + s - 2, 8, 14))
        self._draw_hp_bar(surf)
        self.draw_bullets(surf)


# ── bomber ────────────────────────────────────────────────────────────────────

class Bomber(Enemy):
    def __init__(self, x, y, wave):
        super().__init__(x, y, hp=5, score_val=220, color=C_BOMBER, size=24)
        self.vx = random.choice([-1, 1]) * (1.0 + wave * 0.06)
        self.vy = 0.9
        self.bomb_cd = random.randint(55, 110)

    def update(self):
        self.t += 1
        self.x += self.vx
        self.y += self.vy
        if self.x < self.size:     self.vx =  abs(self.vx)
        if self.x > W - self.size: self.vx = -abs(self.vx)
        if self.y > H + 80:
            self.alive = False
        self.bomb_cd -= 1
        if self.bomb_cd <= 0:
            self.bomb_cd = random.randint(80, 150)
            for vx in (-0.9, 0.0, 0.9):
                self.bullets.append(EnemyBullet(self.x, self.y + 10, vx, 3.6))
        self._update_bullets()

    def draw(self, surf):
        cx, cy = int(self.x), int(self.y)
        s = self.size // 2
        pygame.draw.ellipse(surf, self.color, (cx - s, cy - int(s * 0.7), s * 2, int(s * 1.5)))
        hi = tuple(min(255, c + 55) for c in self.color)
        pygame.draw.ellipse(surf, hi, (cx - s, cy - int(s * 0.7), s * 2, int(s * 1.5)), 2)
        self._draw_hp_bar(surf)
        self.draw_bullets(surf)


# ── boss ──────────────────────────────────────────────────────────────────────

class Boss(Enemy):
    PHASES = 3

    def __init__(self, wave):
        hp = 80 + wave * 25
        super().__init__(W // 2, -90, hp=hp, score_val=2500 + wave * 600,
                         color=C_BOSS, size=64)
        self.entry_done = False
        self.vx = 1.6
        self.shoot_cd = 40
        self.spiral_angle = 0.0
        self.shield_active = wave >= 3
        self.shield_hp = 4 if self.shield_active else 0

    @property
    def phase(self) -> int:
        ratio = self.hp / self.max_hp
        if ratio > 0.66: return 1
        if ratio > 0.33: return 2
        return 3

    def hit(self, dmg: int) -> bool:
        if self.shield_active:
            self.shield_hp -= dmg
            spawn_explosion(self.x, self.y, C_SHIELD, n=10, spd=3.0)
            if self.shield_hp <= 0:
                self.shield_active = False
                spawn_explosion(self.x, self.y, C_SHIELD, n=30, spd=6.0, life=50)
            return False
        return super().hit(dmg)

    def update(self):
        self.t += 1
        if not self.entry_done:
            self.y += 1.4
            if self.y >= 110:
                self.entry_done = True
            self._update_bullets()
            return

        ph = self.phase
        if ph == 1:
            self.x += self.vx
            if self.x < 110 or self.x > W - 110:
                self.vx *= -1
        elif ph == 2:
            self.x = W // 2 + math.sin(self.t * 0.024) * 420
            self.y = 110 + math.sin(self.t * 0.017) * 65
        else:
            self.x = W // 2 + math.cos(self.t * 0.038) * 360
            self.y = 85 + math.sin(self.t * 0.028) * 105

        self.shoot_cd -= 1
        rate = max(14, 42 - ph * 9)
        if self.shoot_cd <= 0:
            self.shoot_cd = rate
            if ph == 1:
                for ang in (-0.22, 0.0, 0.22):
                    spd = 7.0
                    self.bullets.append(EnemyBullet(
                        self.x, self.y + 32,
                        math.sin(ang) * spd, math.cos(ang) * spd
                    ))
            elif ph == 2:
                n = 8
                for i in range(n):
                    a = self.spiral_angle + i * (math.pi * 2 / n)
                    self.bullets.append(EnemyBullet(
                        self.x, self.y, math.cos(a) * 4.0, math.sin(a) * 4.0
                    ))
                self.spiral_angle += 0.18
            else:
                n = 14
                for i in range(n):
                    a = self.spiral_angle + i * (math.pi * 2 / n)
                    self.bullets.append(EnemyBullet(
                        self.x, self.y, math.cos(a) * 4.5, math.sin(a) * 4.5
                    ))
                self.spiral_angle += 0.26
                for ang in (-0.18, 0.0, 0.18):
                    self.bullets.append(EnemyBullet(
                        self.x, self.y + 32,
                        math.sin(ang) * 6.5, math.cos(ang) * 6.5
                    ))
        self._update_bullets()

    def draw(self, surf):
        cx, cy = int(self.x), int(self.y)
        s = self.size // 2
        ph = self.phase
        wing_col = tuple(min(255, c + 45) for c in self.color)
        pygame.draw.polygon(surf, wing_col,
            [(cx - s, cy), (cx - s - 35, cy + 22), (cx - s - 24, cy - 22)])
        pygame.draw.polygon(surf, wing_col,
            [(cx + s, cy), (cx + s + 35, cy + 22), (cx + s + 24, cy - 22)])
        pygame.draw.circle(surf, self.color, (cx, cy), s)
        core_col = (255, min(255, 80 + ph * 55), min(255, ph * 90))
        pygame.draw.circle(surf, core_col, (cx, cy), s // 2)
        if self.shield_active:
            r1 = s + 10 + int(math.sin(self.t * 0.15) * 4)
            pygame.draw.circle(surf, C_SHIELD, (cx, cy), r1, 3)
            pygame.draw.circle(surf, C_SHIELD, (cx, cy), r1 + 6, 1)
        # Boss HP bar
        bw = 220
        bx = W // 2 - bw // 2
        by = 18
        pygame.draw.rect(surf, (35, 8, 8), (bx - 2, by - 2, bw + 4, 16))
        pygame.draw.rect(surf, (55, 18, 18), (bx, by, bw, 12))
        frac = max(0.0, self.hp / self.max_hp)
        bar_col = C_GREEN if frac > 0.5 else (C_GOLD if frac > 0.25 else C_RED)
        pygame.draw.rect(surf, bar_col, (bx, by, int(bw * frac), 12))
        pygame.draw.rect(surf, C_WHITE, (bx, by, bw, 12), 1)
        # Phase pips
        for i in range(Boss.PHASES):
            pip_col = C_RED if i < ph else C_DIM
            pygame.draw.circle(surf, pip_col, (W // 2 - 30 + i * 30, by + 20), 4)
        self.draw_bullets(surf)


# ── power-ups ─────────────────────────────────────────────────────────────────

_PU_TYPES  = ["weapon", "shield", "life"]
_PU_COLORS = {"weapon": C_SPREAD, "shield": C_SHIELD, "life": C_GREEN}
_PU_LABELS = {"weapon": "W", "shield": "S", "life": "+"}


class PowerUp:
    def __init__(self, x, y):
        self.x     = float(x)
        self.y     = float(y)
        self.kind  = random.choice(_PU_TYPES)
        self.alive = True
        self.t     = 0

    def update(self):
        self.t += 1
        self.y += 1.3
        if self.y > H + 40:
            self.alive = False

    def draw(self, surf, font):
        col = _PU_COLORS[self.kind]
        cx, cy = int(self.x), int(self.y)
        r = 12 + int(math.sin(self.t * 0.12) * 3)
        pygame.draw.circle(surf, col, (cx, cy), r)
        pygame.draw.circle(surf, C_WHITE, (cx, cy), r, 2)
        lbl = font.render(_PU_LABELS[self.kind], True, C_WHITE)
        surf.blit(lbl, (cx - lbl.get_width() // 2, cy - lbl.get_height() // 2))

    def rect(self):
        return pygame.Rect(self.x - 14, self.y - 14, 28, 28)


# ── player ────────────────────────────────────────────────────────────────────

class Player:
    SPEED     = 5.2
    SIZE      = 22
    MAX_HP    = 3
    SHIELD_CD = 420  # frames to fully recharge

    def __init__(self):
        self.x = float(W // 2)
        self.y = float(H - 110)
        self.hp = self.MAX_HP
        self.weapon_idx = 0
        self.fire_cd = 0
        self.shield_charge = 0.0
        self.shielded = False
        self.shield_time = 0
        self.invincible = 0
        self.alive = True
        self.bullets: list = []

    @property
    def weapon(self) -> str:
        return WEAPONS[self.weapon_idx % len(WEAPONS)]

    def cycle_weapon(self):
        self.weapon_idx = (self.weapon_idx + 1) % len(WEAPONS)

    def activate_shield(self):
        if self.shield_charge >= 1.0:
            self.shielded = True
            self.shield_time = 130
            self.shield_charge = 0.0

    def update(self, inp: GameInput):
        dx, dy = inp.move()
        self.x = max(self.SIZE, min(W - self.SIZE, self.x + dx * self.SPEED))
        self.y = max(self.SIZE, min(H - self.SIZE, self.y + dy * self.SPEED))

        if dx or dy:
            spawn_trail(self.x, self.y + self.SIZE, C_ENGINE, n=2)

        if self.shielded:
            self.shield_time -= 1
            if self.shield_time <= 0:
                self.shielded = False
        else:
            self.shield_charge = min(1.0, self.shield_charge + 1.0 / self.SHIELD_CD)

        if self.invincible > 0:
            self.invincible -= 1

        self.fire_cd = max(0, self.fire_cd - 1)
        if inp.firing() and self.fire_cd == 0:
            self._fire()

        for b in self.bullets:
            b.update()
        self.bullets = [b for b in self.bullets if b.alive]

    def _fire(self):
        w = self.weapon
        col = WEAPON_COLORS[w]
        bx, by = self.x, self.y - self.SIZE
        if w == "laser":
            self.fire_cd = 6
            self.bullets.append(Bullet(bx, by, 0.0, -15.0, col, dmg=1, r=4))
        elif w == "spread":
            self.fire_cd = 10
            for vx in (-3.2, 0.0, 3.2):
                self.bullets.append(Bullet(bx, by, vx, -11.5, col, dmg=1, r=3))
        elif w == "beam":
            self.fire_cd = 4
            self.bullets.append(Bullet(bx - 3, by, -0.15, -17.0, col, dmg=2, r=3))
            self.bullets.append(Bullet(bx + 3, by,  0.15, -17.0, col, dmg=2, r=3))
        spawn_trail(bx, by, col, n=1)

    def take_hit(self) -> bool:
        if self.invincible > 0:
            return False
        if self.shielded:
            spawn_explosion(self.x, self.y, C_SHIELD, n=14, spd=3.5)
            self.shielded = False
            self.shield_time = 0
            return False
        self.hp -= 1
        self.invincible = 95
        if self.hp <= 0:
            self.alive = False
            spawn_explosion(self.x, self.y, C_PLAYER, n=45, spd=8.5, life=65)
        else:
            spawn_explosion(self.x, self.y, C_PLAYER, n=22, spd=5.5)
        return True

    def draw(self, surf):
        if self.invincible > 0 and (self.invincible // 6) % 2 == 0:
            return
        cx, cy = int(self.x), int(self.y)
        s = self.SIZE
        pts = [(cx, cy - s), (cx + s // 2, cy + s // 2),
               (cx, cy + s // 3), (cx - s // 2, cy + s // 2)]
        pygame.draw.polygon(surf, C_PLAYER, pts)
        pygame.draw.polygon(surf, C_WHITE, pts, 1)
        pygame.draw.circle(surf, C_ENGINE, (cx, cy + s // 3), 5)
        if self.shielded:
            t_val = pygame.time.get_ticks()
            r = s + 8 + int(math.sin(t_val * 0.012) * 4)
            pygame.draw.circle(surf, C_SHIELD, (cx, cy), r, 3)
        pygame.draw.circle(surf, WEAPON_COLORS[self.weapon], (cx, cy), 4)

    def draw_bullets(self, surf):
        for b in self.bullets:
            b.draw(surf)


# ── wave controller ───────────────────────────────────────────────────────────

class WaveController:
    BOSS_EVERY = 5

    def __init__(self):
        self.wave = 0
        self.enemies: list = []
        self.powerups: list = []
        self.boss: Boss = None
        self._queue: list = []
        self._spawn_cd = 0
        self.cleared = True

    def start_next_wave(self):
        self.wave += 1
        self.enemies = []
        self.boss = None
        self._queue = []
        self._spawn_cd = 0

        if self.wave % self.BOSS_EVERY == 0:
            self.boss = Boss(self.wave)
        else:
            w = self.wave
            types = (["drone"] * (4 + w * 2) +
                     ["tank"]  * max(0, w - 1) +
                     ["bomber"]* max(0, (w - 2) * 1))
            random.shuffle(types)
            self._queue = [(kind, random.randint(80, W - 80)) for kind in types]
        self.cleared = False

    def _is_clear(self) -> bool:
        if self.boss:
            return not self.boss.alive and not self.enemies and not self._queue
        return not self.enemies and not self._queue

    def update(self):
        self._spawn_cd -= 1
        if self._queue and self._spawn_cd <= 0:
            kind, x = self._queue.pop(0)
            if kind == "drone":
                self.enemies.append(Drone(x, -35, self.wave))
            elif kind == "tank":
                self.enemies.append(Tank(x, -55, self.wave))
            elif kind == "bomber":
                self.enemies.append(Bomber(x, -35, self.wave))
            self._spawn_cd = max(8, 42 - self.wave * 2)

        if self.boss and self.boss.alive:
            self.boss.update()
        for e in self.enemies:
            e.update()
        self.enemies = [e for e in self.enemies if e.alive]
        for pu in self.powerups:
            pu.update()
        self.powerups = [pu for pu in self.powerups if pu.alive]

        if not self.cleared and self._is_clear():
            self.cleared = True

    def draw(self, surf, small_font):
        if self.boss and self.boss.alive:
            self.boss.draw(surf)
        for e in self.enemies:
            e.draw(surf)
        for pu in self.powerups:
            pu.draw(surf, small_font)

    def all_enemy_bullets(self) -> list:
        bl = []
        if self.boss and self.boss.alive:
            bl += self.boss.bullets
        for e in self.enemies:
            bl += e.bullets
        return bl


# ── HUD ───────────────────────────────────────────────────────────────────────

def draw_hud(surf, fonts, player: Player, score: int, hi_score: int,
             wave: int, combo: int, wave_banner_t: int):
    fsm = fonts["sm"]
    fhint = fonts["hint"]

    # Score / hi-score
    surf.blit(fsm.render(f"SCORE  {score:>9}", True, C_GOLD), (18, 12))
    surf.blit(fhint.render(f"HI    {hi_score:>9}", True, C_DIM), (18, 40))

    # Wave (top right)
    wt = fsm.render(f"WAVE  {wave}", True, C_WHITE)
    surf.blit(wt, (W - wt.get_width() - 18, 12))

    # Combo (top center)
    if combo > 1:
        col = C_GOLD if combo >= 10 else C_SPREAD
        ct = fsm.render(f"x{combo}  COMBO", True, col)
        surf.blit(ct, (W // 2 - ct.get_width() // 2, 12))

    # HP hearts (bottom-left)
    for i in range(player.MAX_HP):
        filled = i < player.hp
        col = C_RED if filled else (40, 15, 15)
        bx = 18 + i * 30
        by = H - 42
        pygame.draw.polygon(surf, col,
            [(bx + 10, by), (bx + 18, by), (bx + 22, by + 6),
             (bx + 14, by + 14), (bx + 6, by + 6), (bx, by),
             (bx + 4, by)])

    # Shield bar (bottom, next to hearts)
    bw, bh = 110, 9
    sx = 18 + player.MAX_HP * 30 + 10
    sy = H - 34
    pygame.draw.rect(surf, (18, 28, 55), (sx, sy, bw, bh))
    pygame.draw.rect(surf, C_SHIELD, (sx, sy, int(bw * player.shield_charge), bh))
    pygame.draw.rect(surf, C_DIM, (sx, sy, bw, bh), 1)
    surf.blit(fhint.render("SHD", True, C_DIM), (sx, sy - 16))

    # Weapon pill (bottom-right)
    wname = player.weapon.upper()
    wt2 = fhint.render(f"WPN  {wname}", True, WEAPON_COLORS[player.weapon])
    surf.blit(wt2, (W - wt2.get_width() - 18, H - 30))

    # Boss warning
    if wave > 0 and wave % WaveController.BOSS_EVERY == 0:
        pass  # boss HP bar is drawn by Boss.draw()

    # Wave-clear banner
    if wave_banner_t > 0:
        alpha = min(255, wave_banner_t * 7)
        msg = fonts["lg"].render(f"WAVE {wave - 1}  CLEARED!", True, C_GOLD)
        msg.set_alpha(alpha)
        surf.blit(msg, (W // 2 - msg.get_width() // 2, H // 2 - 36))

    # Boss incoming warning (right before boss wave)
    next_is_boss = (wave % WaveController.BOSS_EVERY == WaveController.BOSS_EVERY - 1)
    if next_is_boss and wave_banner_t > 0:
        warn = fhint.render("BOSS INCOMING NEXT WAVE", True, C_BOSS)
        warn.set_alpha(min(255, wave_banner_t * 7))
        surf.blit(warn, (W // 2 - warn.get_width() // 2, H // 2 + 20))


# ── screens ───────────────────────────────────────────────────────────────────

def draw_title(surf, fonts, hi_score: int, blink: bool, frame: int):
    surf.fill(C_BG)
    pulse = 1.0 + math.sin(frame * 0.04) * 0.04
    title = fonts["xl"].render("VOID  STRIKER", True, C_BOSS)
    surf.blit(title, (W // 2 - title.get_width() // 2, 150))
    sub = fonts["sm"].render("OkamaOS  |  com.okamaos.voidstriker  v1.0.0", True, C_DIM)
    surf.blit(sub, (W // 2 - sub.get_width() // 2, 255))
    if blink:
        msg = fonts["md"].render("[ A ]  LAUNCH", True, C_WHITE)
        surf.blit(msg, (W // 2 - msg.get_width() // 2, 340))
    hi = fonts["sm"].render(f"HIGH SCORE     {hi_score}", True, C_GOLD)
    surf.blit(hi, (W // 2 - hi.get_width() // 2, 430))
    # Controls legend
    legend = [
        "LSTICK / D-pad  Move     A / Space  Fire",
        "X  Shield        RB / Tab  Cycle Weapon",
        "START / Esc  Pause        B  Back",
    ]
    for i, line in enumerate(legend):
        t = fonts["hint"].render(line, True, C_DIM)
        surf.blit(t, (W // 2 - t.get_width() // 2, H - 90 + i * 22))


def draw_pause(surf, fonts, menu_idx: int):
    overlay = pygame.Surface((W, H), pygame.SRCALPHA)
    overlay.fill((4, 6, 18, 205))
    surf.blit(overlay, (0, 0))
    title = fonts["lg"].render("PAUSED", True, C_WHITE)
    surf.blit(title, (W // 2 - title.get_width() // 2, 210))
    options = [("Resume", C_GREEN), ("Quit to Menu", C_GOLD)]
    for i, (txt, col) in enumerate(options):
        active = (i == menu_idx)
        t = fonts["md"].render(txt, True, col if active else C_DIM)
        x = W // 2 - t.get_width() // 2
        y = 320 + i * 75
        if active:
            pygame.draw.rect(surf, (20, 28, 50),
                (x - 18, y - 10, t.get_width() + 36, t.get_height() + 20),
                border_radius=8)
        surf.blit(t, (x, y))
    hint = fonts["hint"].render("[DPAD UP/DOWN] Navigate   [A] Select   [B] Resume", True, C_DIM)
    surf.blit(hint, (W // 2 - hint.get_width() // 2, H - 38))


def draw_gameover(surf, fonts, score: int, hi_score: int, new_hi: bool):
    overlay = pygame.Surface((W, H), pygame.SRCALPHA)
    overlay.fill((4, 6, 18, 215))
    surf.blit(overlay, (0, 0))
    t1 = fonts["xl"].render("GAME  OVER", True, C_BOSS)
    surf.blit(t1, (W // 2 - t1.get_width() // 2, 175))
    t2 = fonts["md"].render(f"Score:  {score}", True, C_WHITE)
    surf.blit(t2, (W // 2 - t2.get_width() // 2, 290))
    if new_hi:
        t3 = fonts["md"].render("*  NEW HIGH SCORE  *", True, C_GOLD)
        surf.blit(t3, (W // 2 - t3.get_width() // 2, 348))
    else:
        t3 = fonts["sm"].render(f"High Score:  {hi_score}", True, C_GOLD)
        surf.blit(t3, (W // 2 - t3.get_width() // 2, 352))
    hint = fonts["hint"].render("[A] Play Again   [B] Title Screen", True, C_DIM)
    surf.blit(hint, (W // 2 - hint.get_width() // 2, H - 38))


# ── main loop ─────────────────────────────────────────────────────────────────

def main():
    try:
        pygame.init()
    except Exception as e:
        print(f"pygame.init() failed: {e}", file=sys.stderr)
        sys.exit(1)
    
    flags = pygame.FULLSCREEN | pygame.NOFRAME
    if "--windowed" in sys.argv:
        flags = 0
    
    try:
        screen, display = open_display(pygame, W, H, flags,
                                       caption="VOID STRIKER — OkamaOS")
    except Exception as e:
        print(f"pygame.display.set_mode() failed: {e}", file=sys.stderr)
        print(f"SDL_VIDEODRIVER: {os.environ.get('SDL_VIDEODRIVER', 'not set')}", file=sys.stderr)
        sys.exit(1)
    
    pygame.mouse.set_visible(False)
    # Force window focus on desktop systems
    if flags == 0:
        pygame.event.set_grab(True)
    clock = pygame.time.Clock()

    try:
        font_xl   = pygame.font.SysFont("DejaVu Sans", 72, bold=True)
        font_lg   = pygame.font.SysFont("DejaVu Sans", 48, bold=True)
        font_md   = pygame.font.SysFont("DejaVu Sans", 32)
        font_sm   = pygame.font.SysFont("DejaVu Sans", 22)
        font_hint = pygame.font.SysFont("DejaVu Sans", 18)
        font_tiny = pygame.font.SysFont("DejaVu Sans", 14, bold=True)
    except Exception:
        f = pygame.font.Font(None, 36)
        font_xl = font_lg = font_md = font_sm = font_hint = font_tiny = f

    fonts = {
        "xl": font_xl, "lg": font_lg, "md": font_md,
        "sm": font_sm, "hint": font_hint, "tiny": font_tiny,
    }

    stars    = Starfield()
    inp      = GameInput()
    hi_score = load_hi()

    state     = "title"
    player    = None
    wc        = None
    score     = 0
    combo     = 0
    combo_cd  = 0
    blink_t   = 0
    pause_idx = 0
    wave_banner_t = 0
    new_hi    = False
    frame     = 0

    def start_game():
        nonlocal player, wc, score, combo, combo_cd, wave_banner_t, new_hi
        _particles.clear()
        _shake[0] = _shake[1] = _shake[2] = 0
        player = Player()
        wc = WaveController()
        wc.start_next_wave()
        score = combo = combo_cd = wave_banner_t = 0
        new_hi = False

    running = True
    while running:
        frame += 1
        clock.tick(FPS)

        raw = pygame.event.get()
        inp.update(raw)
        for ev in raw:
            if ev.type == QUIT:
                running = False

        # ── title ────────────────────────────────────────────────────────────
        if state == "title":
            blink_t += 1
            if inp.pressed("A"):
                start_game()
                state = "play"
            elif inp.pressed("B"):
                running = False

        # ── play ─────────────────────────────────────────────────────────────
        elif state == "play":
            if inp.pressed("START") or inp.pressed("B"):
                pause_idx = 0
                state = "pause"

            if inp.pressed("X"):
                player.activate_shield()
            if inp.pressed("RB") or inp.pressed("LB"):
                player.cycle_weapon()

            player.update(inp)
            wc.update()

            combo_cd = max(0, combo_cd - 1)
            if combo_cd == 0:
                combo = 0

            # Player bullets vs enemies
            all_enemies = wc.enemies[:]
            if wc.boss and wc.boss.alive:
                all_enemies.append(wc.boss)

            for pb in player.bullets[:]:
                if not pb.alive:
                    continue
                for e in all_enemies:
                    if pb.rect().colliderect(e.rect()):
                        killed = e.hit(pb.dmg)
                        pb.alive = False
                        combo += 1
                        combo_cd = 95
                        if killed:
                            bonus = max(1, combo // 3)
                            score += e.score_val * bonus
                            trigger_shake(7 if isinstance(e, Boss) else 3)
                            if random.random() < 0.28:
                                wc.powerups.append(PowerUp(e.x, e.y))
                        break

            # Enemy bullets vs player
            if player.alive and player.invincible == 0:
                pr = pygame.Rect(
                    player.x - player.SIZE // 2, player.y - player.SIZE // 2,
                    player.SIZE, player.SIZE
                )
                for eb in wc.all_enemy_bullets():
                    if eb.alive and eb.rect().colliderect(pr):
                        if player.take_hit():
                            eb.alive = False
                            trigger_shake(12)
                            combo = combo_cd = 0

            # Power-ups
            pcol = pygame.Rect(player.x - 16, player.y - 16, 32, 32)
            for pu in wc.powerups[:]:
                if pu.rect().colliderect(pcol):
                    pu.alive = False
                    if pu.kind == "weapon":
                        player.cycle_weapon()
                    elif pu.kind == "shield":
                        player.shield_charge = 1.0
                    elif pu.kind == "life":
                        player.hp = min(player.MAX_HP, player.hp + 1)
                    score += 75
                    combo += 1
                    combo_cd = 95

            # Wave cleared → start next
            if wave_banner_t > 0:
                wave_banner_t -= 1
            if wc.cleared and wave_banner_t == 0:
                wave_banner_t = 55
                wc.start_next_wave()

            # Player dead
            if not player.alive:
                if score > hi_score:
                    hi_score = score
                    new_hi = True
                    save_hi(hi_score)
                state = "gameover"
                blink_t = 0

        # ── pause ─────────────────────────────────────────────────────────────
        elif state == "pause":
            if inp.pressed("DPAD_DOWN"):
                pause_idx = (pause_idx + 1) % 2
            if inp.pressed("DPAD_UP"):
                pause_idx = (pause_idx - 1) % 2
            if inp.pressed("A"):
                if pause_idx == 0:
                    state = "play"
                else:
                    if score > hi_score:
                        hi_score = score
                        save_hi(hi_score)
                    state = "title"
                    blink_t = 0
            if inp.pressed("B"):
                state = "play"

        # ── game over ─────────────────────────────────────────────────────────
        elif state == "gameover":
            blink_t += 1
            if inp.pressed("A"):
                start_game()
                state = "play"
            elif inp.pressed("B"):
                state = "title"
                blink_t = 0

        # ── draw ──────────────────────────────────────────────────────────────
        off = update_shake()
        canvas = pygame.Surface((W, H))
        canvas.fill(C_BG)
        stars.update_draw(canvas)

        if state in ("play", "pause", "gameover") and player is not None:
            wc.draw(canvas, fonts["tiny"])
            player.draw_bullets(canvas)
            player.draw(canvas)
            draw_particles(canvas)
            draw_hud(canvas, fonts, player, score, hi_score,
                     wc.wave, combo, wave_banner_t)

        if state == "title":
            draw_title(canvas, fonts, hi_score, (blink_t // 22) % 2 == 0, frame)
        elif state == "pause":
            draw_pause(canvas, fonts, pause_idx)
        elif state == "gameover":
            draw_gameover(canvas, fonts, score, hi_score, new_hi)

        screen.blit(canvas, off)
        display.flip(screen)

    display.close()
    pygame.quit()
    sys.exit(0)


if __name__ == "__main__":
    main()

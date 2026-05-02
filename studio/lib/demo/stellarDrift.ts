/**
 * STELLAR DRIFT — Okama Studio Demo Game
 *
 * A fully featured cinematic space shooter that demonstrates every Studio capability:
 *  - Particle system (explosions, engine exhaust, bullet glow)
 *  - Parallax 3-layer starfield background
 *  - 3 enemy types (Drone, Hunter, Tank) with AI movement patterns
 *  - Sprite-based player ship with rotation/tilt
 *  - HUD (score, lives, wave counter)
 *  - Pause / Game Over / Win overlays
 *  - 5 escalating waves
 *  - Collision detection (rect + point checks)
 *
 * Press RUN in the Preview tab to play it right now — no API key needed!
 */

export const STELLAR_DRIFT_CODE = `"""
STELLAR DRIFT — Okama Studio Demo Game
=======================================
Showcases: particles, parallax, enemy AI, collision, HUD, game states.

Controls:
  WASD / Arrow Keys  — Move
  SPACE              — Shoot
  P                  — Pause
  R                  — Restart (on Game Over / Win)
"""

import pygame
import math
import random
import sys

# ─── Constants ──────────────────────────────────────────────────────────────
WIDTH, HEIGHT = 800, 500
FPS = 60

# OkamaOS color palette
INK     = ( 16,  18,  15)
GREEN   = (141, 247, 127)
YELLOW  = (255, 207,  74)
CYAN    = ( 83, 217, 230)
CORAL   = (242, 109,  91)
WHITE   = (243, 239, 228)
DIM     = ( 59,  61,  54)
PURPLE  = (138, 100, 220)


# ─── Utilities ──────────────────────────────────────────────────────────────
def lerp(a, b, t):
    """Linearly interpolate between a and b by factor t."""
    return a + (b - a) * t

def clamp(v, lo, hi):
    """Clamp v between lo and hi."""
    return max(lo, min(hi, v))


# ─── Particle ───────────────────────────────────────────────────────────────
class Particle:
    """A single short-lived visual particle (explosion debris, engine trail)."""

    def __init__(self, x, y, vx, vy, color, life, size=3):
        self.x, self.y     = x, y
        self.vx, self.vy   = vx, vy
        self.color         = color
        self.life          = life
        self.max_life      = life
        self.size          = size

    def update(self):
        self.x  += self.vx
        self.y  += self.vy
        self.vy += 0.06      # gentle downward drift
        self.vx *= 0.96      # air resistance
        self.life -= 1
        return self.life > 0  # returns False when dead

    def draw(self, surf):
        alpha = self.life / self.max_life           # fade out
        r = max(1, int(self.size * alpha))
        c = tuple(int(ch * alpha) for ch in self.color)
        pygame.draw.circle(surf, c, (int(self.x), int(self.y)), r)


class ParticleSystem:
    """Manages all live particles and provides helper emitters."""

    def __init__(self):
        self.particles = []

    def explode(self, x, y, color, count=28, speed=5):
        """Burst explosion at (x, y)."""
        for _ in range(count):
            angle = random.uniform(0, math.tau)
            spd   = random.uniform(0.5, speed)
            life  = random.randint(22, 55)
            size  = random.randint(2, 6)
            self.particles.append(Particle(
                x, y,
                math.cos(angle) * spd,
                math.sin(angle) * spd,
                color, life, size,
            ))

    def exhaust(self, x, y, color=CYAN, count=2):
        """Continuous engine exhaust stream."""
        for _ in range(count):
            self.particles.append(Particle(
                x + random.uniform(-3, 3),
                y + random.uniform(-1, 1),
                random.uniform(-0.4, 0.4),
                random.uniform(1.5, 3.5),
                color,
                random.randint(8, 18),
                random.randint(1, 3),
            ))

    def sparkle(self, x, y, color=GREEN, count=6):
        """Small sparks for bullet impact."""
        for _ in range(count):
            angle = random.uniform(0, math.tau)
            spd   = random.uniform(1, 3)
            self.particles.append(Particle(
                x, y,
                math.cos(angle) * spd,
                math.sin(angle) * spd,
                color,
                random.randint(6, 14),
                2,
            ))

    def update_draw(self, surf):
        self.particles = [p for p in self.particles if p.update()]
        for p in self.particles:
            p.draw(surf)


# ─── Parallax Background ────────────────────────────────────────────────────
class StarLayer:
    """One layer of a parallax scrolling star field."""

    def __init__(self, count, speed, size, color):
        self.speed = speed
        self.size  = size
        self.color = color
        self.stars = [
            [random.uniform(0, WIDTH), random.uniform(0, HEIGHT)]
            for _ in range(count)
        ]

    def update_draw(self, surf):
        for s in self.stars:
            s[1] += self.speed
            if s[1] > HEIGHT:
                s[1] = -2
                s[0] = random.uniform(0, WIDTH)
            pygame.draw.circle(surf, self.color, (int(s[0]), int(s[1])), self.size)


# ─── Bullets ────────────────────────────────────────────────────────────────
class Bullet:
    """A projectile fired by the player or an enemy."""

    def __init__(self, x, y, vy=-13, color=GREEN, damage=1):
        self.x, self.y = float(x), float(y)
        self.vy     = vy
        self.color  = color
        self.damage = damage
        self.alive  = True

    def update(self):
        self.y += self.vy
        if self.y < -12 or self.y > HEIGHT + 12:
            self.alive = False

    def draw(self, surf):
        # Outer glow
        pygame.draw.rect(
            surf, self.color,
            (int(self.x) - 2, int(self.y) - 9, 4, 16),
            border_radius=2,
        )
        # Bright core
        pygame.draw.rect(
            surf, WHITE,
            (int(self.x) - 1, int(self.y) - 7, 2, 12),
            border_radius=1,
        )


# ─── Enemy ──────────────────────────────────────────────────────────────────
class Enemy:
    """
    Enemy ship. Three types:
      drone  — fast, straight, no shooting
      hunter — medium, sinusoidal sway, fires at player
      tank   — slow, shoots bursts, high HP
    """

    TYPES = {
        "drone":  {"hp": 1, "speed": 2.2, "color": CORAL,  "size": 13, "score": 10, "fire": 0  },
        "hunter": {"hp": 2, "speed": 1.5, "color": YELLOW, "size": 17, "score": 25, "fire": 75 },
        "tank":   {"hp": 5, "speed": 0.7, "color": PURPLE, "size": 24, "score": 60, "fire": 45 },
    }

    def __init__(self, x, y, kind="drone"):
        cfg = self.TYPES[kind]
        self.x, self.y    = float(x), float(y)
        self.hp           = cfg["hp"]
        self.speed        = cfg["speed"]
        self.color        = cfg["color"]
        self.size         = cfg["size"]
        self.score        = cfg["score"]
        self.fire_rate    = cfg["fire"]
        self.fire_timer   = random.randint(0, max(1, self.fire_rate))
        self.alive        = True
        self.kind         = kind
        self.t            = random.uniform(0, math.tau)

    @property
    def rect(self):
        s = self.size
        return pygame.Rect(self.x - s, self.y - s, s * 2, s * 2)

    def update(self, e_bullets):
        self.t += 0.04
        self.y += self.speed

        if self.kind == "hunter":
            self.x += math.sin(self.t * 2.2) * 1.8   # sinusoidal sway

        if self.y > HEIGHT + self.size:
            self.alive = False
            return

        # Firing
        if self.fire_rate > 0:
            self.fire_timer -= 1
            if self.fire_timer <= 0:
                self.fire_timer = self.fire_rate
                if self.kind == "tank":
                    # 3-way spread
                    for angle_off in (-0.25, 0, 0.25):
                        speed = 4.5
                        e_bullets.append(Bullet(
                            self.x, self.y + self.size,
                            vy=math.cos(angle_off) * speed,
                            color=self.color, damage=1,
                        ))
                else:
                    e_bullets.append(Bullet(
                        self.x, self.y + self.size,
                        vy=4, color=self.color, damage=1,
                    ))

    def hit(self, damage=1):
        self.hp -= damage
        if self.hp <= 0:
            self.alive = False
            return True
        return False

    def draw(self, surf):
        # Polygon body — shape varies by type
        sides = 6 if self.kind == "tank" else 4
        pts = []
        for i in range(sides):
            a = math.tau * i / sides - math.pi / 2
            pts.append((
                self.x + math.cos(a) * self.size,
                self.y + math.sin(a) * self.size,
            ))
        pygame.draw.polygon(surf, self.color, pts)
        pygame.draw.polygon(surf, WHITE, pts, 1)

        # HP pips for tank
        if self.kind == "tank" and self.hp > 1:
            for i in range(self.hp - 1):
                pygame.draw.circle(
                    surf, WHITE,
                    (int(self.x - (self.hp - 2) * 5 + i * 10), int(self.y)),
                    2,
                )

        # Core dot
        pygame.draw.circle(surf, WHITE, (int(self.x), int(self.y)), self.size // 3)


# ─── Player ─────────────────────────────────────────────────────────────────
class Player:
    """The player's ship."""

    def __init__(self):
        self.x          = WIDTH / 2
        self.y          = HEIGHT - 80
        self.speed      = 5.5
        self.hp         = 3
        self.max_hp     = 3
        self.score      = 0
        self.invincible = 0
        self.fire_cd    = 0
        self.alive      = True
        self.tilt       = 0.0   # visual lean based on horizontal movement

    @property
    def rect(self):
        return pygame.Rect(int(self.x) - 13, int(self.y) - 15, 26, 30)

    def update(self, keys, p_bullets, ps):
        dx = dy = 0
        if keys[pygame.K_LEFT]  or keys[pygame.K_a]: dx -= 1
        if keys[pygame.K_RIGHT] or keys[pygame.K_d]: dx += 1
        if keys[pygame.K_UP]    or keys[pygame.K_w]: dy -= 1
        if keys[pygame.K_DOWN]  or keys[pygame.K_s]: dy += 1

        if dx and dy:                    # normalize diagonal movement
            dx *= 0.707; dy *= 0.707

        self.x = clamp(self.x + dx * self.speed, 18, WIDTH - 18)
        self.y = clamp(self.y + dy * self.speed, 40, HEIGHT - 18)
        self.tilt = lerp(self.tilt, dx * 20, 0.15)

        # Engine exhaust (twin engines)
        ps.exhaust(self.x - 9, self.y + 17, CYAN)
        ps.exhaust(self.x + 9, self.y + 17, GREEN)

        # Shooting — twin cannons
        if self.fire_cd > 0:
            self.fire_cd -= 1
        if keys[pygame.K_SPACE] and self.fire_cd == 0:
            p_bullets.append(Bullet(self.x - 10, self.y - 8))
            p_bullets.append(Bullet(self.x + 10, self.y - 8))
            self.fire_cd = 9

        if self.invincible > 0:
            self.invincible -= 1

    def take_hit(self, ps):
        if self.invincible > 0:
            return False
        self.hp -= 1
        self.invincible = 90
        ps.explode(self.x, self.y, CORAL, count=22, speed=5)
        if self.hp <= 0:
            self.alive = False
            ps.explode(self.x, self.y, CORAL, count=70, speed=9)
        return True

    def draw(self, surf):
        # Blink during invincibility frames
        if self.invincible > 0 and (self.invincible // 5) % 2:
            return

        r  = math.radians(self.tilt)
        ca, sa = math.cos(r), math.sin(r)

        def rot(px, py):
            return (
                self.x + ca * px - sa * py,
                self.y + sa * px + ca * py,
            )

        # Wing accents
        pygame.draw.polygon(surf, DIM, [rot(-14, 6), rot(-24, 2), rot(-9, 2)])
        pygame.draw.polygon(surf, DIM, [rot( 14, 6), rot( 24, 2), rot(  9, 2)])

        # Main body
        body = [rot(0, -18), rot(-13, 14), rot(13, 14)]
        pygame.draw.polygon(surf, WHITE, body)
        pygame.draw.polygon(surf, INK, body, 1)

        # Cockpit glow
        pygame.draw.circle(surf, CYAN,  (int(rot(0, -4)[0]), int(rot(0, -4)[1])), 5)
        # Engine glows
        pygame.draw.circle(surf, GREEN, (int(rot(-8, 14)[0]), int(rot(-8, 14)[1])), 4)
        pygame.draw.circle(surf, GREEN, (int(rot( 8, 14)[0]), int(rot( 8, 14)[1])), 4)


# ─── HUD ────────────────────────────────────────────────────────────────────
def draw_hud(surf, player, wave, font_sm, font_md):
    # Score (centered top)
    sc = font_md.render(f"{player.score:06d}", True, GREEN)
    surf.blit(sc, (WIDTH // 2 - sc.get_width() // 2, 10))

    # Wave (top-right)
    wv = font_sm.render(f"WAVE {wave}/5", True, CYAN)
    surf.blit(wv, (WIDTH - wv.get_width() - 14, 12))

    # HP (top-left)  — filled/empty segments
    for i in range(player.max_hp):
        color = CORAL if i < player.hp else DIM
        rect  = pygame.Rect(14 + i * 24, 12, 18, 11)
        pygame.draw.rect(surf, color, rect, border_radius=3)
        if i < player.hp:
            pygame.draw.rect(surf, WHITE, rect, 1, border_radius=3)

    # Bottom control hint
    hint = font_sm.render("WASD/ARROWS move  ·  SPACE shoot  ·  P pause", True, DIM)
    surf.blit(hint, (WIDTH // 2 - hint.get_width() // 2, HEIGHT - 16))


# ─── Wave Spawner ────────────────────────────────────────────────────────────
def spawn_wave(wave_num):
    """Generate a wave of enemies. More enemies and tougher types each wave."""
    enemies = []
    base = 6 + wave_num * 2
    pool = ["drone"] * 5 + ["hunter"] * 3
    if wave_num >= 2:
        pool += ["tank"]
    if wave_num >= 4:
        pool += ["tank", "tank"]

    for i in range(base):
        cols  = min(base, 10)
        col   = i % cols
        row   = i // cols
        x     = (col + 0.5) * (WIDTH / cols)
        y     = -50 - row * 65
        enemies.append(Enemy(x, y, random.choice(pool)))
    return enemies


# ─── Main Loop ───────────────────────────────────────────────────────────────
def main():
    pygame.init()
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("STELLAR DRIFT — Okama Studio Demo")
    clock  = pygame.time.Clock()

    font_sm = pygame.font.SysFont("monospace", 12, bold=True)
    font_md = pygame.font.SysFont("monospace", 20, bold=True)
    font_lg = pygame.font.SysFont("monospace", 38, bold=True)

    # 3-layer parallax star field (far → near)
    stars = [
        StarLayer(70,  0.25, 1, ( 38,  40,  36)),
        StarLayer(35,  0.8,  1, ( 85,  88,  82)),
        StarLayer(14,  2.0,  2, (165, 168, 160)),
    ]

    ps        = ParticleSystem()
    player    = Player()
    p_bullets = []
    e_bullets = []
    wave      = 1
    enemies   = spawn_wave(wave)
    clear_t   = 0
    state     = "play"   # play | pause | gameover | win

    while True:
        clock.tick(FPS)

        for ev in pygame.event.get():
            if ev.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if ev.type == pygame.KEYDOWN:
                if ev.key == pygame.K_p:
                    if state == "play":
                        state = "pause"
                    elif state == "pause":
                        state = "play"
                if ev.key == pygame.K_r and state in ("gameover", "win"):
                    main()
                    return

        # ── Game Logic ──────────────────────────────────────────────────────
        if state == "play":
            keys = pygame.key.get_pressed()
            player.update(keys, p_bullets, ps)

            for b in p_bullets: b.update()
            p_bullets = [b for b in p_bullets if b.alive]

            for b in e_bullets: b.update()
            e_bullets = [b for b in e_bullets if b.alive]

            for e in enemies:
                e.update(e_bullets)

            # Player bullet → enemy
            for b in p_bullets:
                if not b.alive:
                    continue
                for e in enemies:
                    if e.alive and e.rect.collidepoint(b.x, b.y):
                        b.alive = False
                        ps.sparkle(b.x, b.y, e.color)
                        if e.hit(b.damage):
                            player.score += e.score
                            ps.explode(e.x, e.y, e.color, count=30)

            # Enemy bullet → player
            for b in e_bullets:
                if b.alive and player.rect.collidepoint(b.x, b.y):
                    b.alive = False
                    player.take_hit(ps)

            # Enemy body → player
            for e in enemies:
                if e.alive and player.rect.colliderect(e.rect):
                    e.alive = False
                    player.take_hit(ps)
                    ps.explode(e.x, e.y, e.color, count=18)

            enemies = [e for e in enemies if e.alive]

            # Wave clear
            if not enemies:
                clear_t += 1
                if clear_t > 100:
                    wave += 1
                    clear_t = 0
                    if wave > 5:
                        state = "win"
                    else:
                        enemies = spawn_wave(wave)

            if not player.alive:
                state = "gameover"

        # ── Render ──────────────────────────────────────────────────────────
        screen.fill(INK)

        for sl in stars:
            sl.update_draw(screen)

        for b in e_bullets:
            b.draw(screen)

        for e in enemies:
            e.draw(screen)

        for b in p_bullets:
            b.draw(screen)

        ps.update_draw(screen)

        if player.alive:
            player.draw(screen)

        draw_hud(screen, player, wave, font_sm, font_md)

        # Wave clear flash message
        if 0 < clear_t < 70:
            msg = font_md.render(f"WAVE {wave - 1} CLEAR!  +BONUS", True, GREEN)
            screen.blit(msg, (WIDTH // 2 - msg.get_width() // 2, HEIGHT // 2 - 16))

        # State overlays
        if state == "pause":
            ov = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
            ov.fill((16, 18, 15, 170))
            screen.blit(ov, (0, 0))
            t = font_lg.render("PAUSED", True, CYAN)
            screen.blit(t, (WIDTH // 2 - t.get_width() // 2, HEIGHT // 2 - 28))
            s = font_sm.render("P  —  resume", True, WHITE)
            screen.blit(s, (WIDTH // 2 - s.get_width() // 2, HEIGHT // 2 + 26))

        elif state == "gameover":
            ov = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
            ov.fill((16, 18, 15, 185))
            screen.blit(ov, (0, 0))
            t = font_lg.render("GAME OVER", True, CORAL)
            screen.blit(t, (WIDTH // 2 - t.get_width() // 2, HEIGHT // 2 - 48))
            sc = font_md.render(f"Score: {player.score:06d}", True, YELLOW)
            screen.blit(sc, (WIDTH // 2 - sc.get_width() // 2, HEIGHT // 2 + 8))
            r = font_sm.render("R  —  restart", True, WHITE)
            screen.blit(r, (WIDTH // 2 - r.get_width() // 2, HEIGHT // 2 + 44))

        elif state == "win":
            ov = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
            ov.fill((16, 18, 15, 185))
            screen.blit(ov, (0, 0))
            t = font_lg.render("YOU WIN!", True, GREEN)
            screen.blit(t, (WIDTH // 2 - t.get_width() // 2, HEIGHT // 2 - 48))
            sc = font_md.render(f"Final Score: {player.score:06d}", True, YELLOW)
            screen.blit(sc, (WIDTH // 2 - sc.get_width() // 2, HEIGHT // 2 + 8))
            r = font_sm.render("R  —  play again", True, WHITE)
            screen.blit(r, (WIDTH // 2 - r.get_width() // 2, HEIGHT // 2 + 44))

        pygame.display.flip()


if __name__ == "__main__":
    main()
`;

export const STELLAR_DRIFT_README = `# STELLAR DRIFT

> A cinematic space shooter — the Okama Studio demo game.

## How to play

| Control | Action |
|---|---|
| **WASD** / **Arrow Keys** | Move ship |
| **SPACE** | Fire twin cannons |
| **P** | Pause / Resume |
| **R** | Restart (Game Over / Win) |

## What this demo shows

This single \`main.py\` demonstrates every Studio capability you can build with:

### Rendering
- **Parallax starfield** — 3 independent scroll-speed layers create depth
- **Rotated polygon sprites** — player ship tilts using trig rotation
- **Alpha overlay** — semi-transparent pause/game-over screens via \`pygame.SRCALPHA\`

### Systems
- **Particle system** — generic \`Particle\` + \`ParticleSystem\` classes handle engine exhaust, bullet sparks, and explosions
- **Object-oriented enemies** — a shared \`Enemy\` class with a \`TYPES\` dict drives three different AI behaviours from one class

### Gameplay
- **3 enemy types** — Drone (fast), Hunter (sinusoidal sway + fires), Tank (slow, 3-way spread, HP pips)
- **Collision detection** — \`pygame.Rect.colliderect\` for broad-phase, \`.collidepoint\` for bullet precision
- **Wave escalation** — \`spawn_wave(n)\` adds more enemies and tougher types each wave
- **Invincibility frames** — prevents one-shot deaths on overlap

### UI
- **HUD** — score, wave counter, life bars rendered every frame
- **Game state machine** — \`state\` variable switches between \`play\`, \`pause\`, \`gameover\`, \`win\`

## Extend it with AI

Open the **AI Chat** tab and try:
- *"Add a power-up that gives the player a shield for 5 seconds"*
- *"Make the enemies home in on the player in wave 4 and 5"*
- *"Add a scrolling planet in the background"*
- *"Add a boss enemy that appears at the end of wave 5"*

## Get an API key

To use the AI, add your free Google Gemini key in **Settings → AI Keys**.
Get one at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) — it's free.
`;

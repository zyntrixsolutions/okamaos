'use client';

import { STELLAR_DRIFT_CODE, STELLAR_DRIFT_README } from "@/lib/demo/stellarDrift";

export const DEMO_PROJECT_ID = "okama-demo-stellar-drift";

export interface ProjectFile {
  name: string;
  content: string;
  type: "python" | "json" | "text" | "asset";
  mimeType?: string;
  dataUrl?: string;
}

export interface OkManifest {
  name: string;
  id: string;
  version: string;
  runtime: string;
  entry: string;
  min_ram_mb: number;
  target_fps: number;
  permissions: string[];
  age_rating: string;
  supports_save_state: boolean;
  controller_required: boolean;
  keyboard_usage: string;
  description?: string;
  python_deps?: string[];
}

export interface Project {
  id: string;
  name: string;
  genre: string;
  createdAt: number;
  updatedAt: number;
  files: ProjectFile[];
  manifest: OkManifest;
  thumbnail?: string;
  lessonProgress?: number;
}

const STORAGE_KEY = "okama-studio-projects";

export function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function getProject(id: string): Project | null {
  return loadProjects().find((p) => p.id === id) ?? null;
}

export function saveProject(project: Project): void {
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    projects[idx] = { ...project, updatedAt: Date.now() };
  } else {
    projects.push({ ...project, updatedAt: Date.now() });
  }
  saveProjects(projects);
}

export function deleteProject(id: string): void {
  const projects = loadProjects().filter((p) => p.id !== id);
  saveProjects(projects);
}

export function createDefaultManifest(name: string, publisherId: string): OkManifest {
  const safeName = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const safePublisher = publisherId.toLowerCase().replace(/[^a-z0-9.]/g, "");
  return {
    name,
    id: `${safePublisher}.${safeName}`,
    version: "0.1.0",
    runtime: "okama-sdl2",
    entry: "main.py",
    min_ram_mb: 128,
    target_fps: 60,
    permissions: ["controller", "audio"],
    age_rating: "Everyone",
    supports_save_state: false,
    controller_required: false,
    keyboard_usage: "supported",
    description: `${name} — created with Okama Studio`,
  };
}

export function createBlankProject(name: string, genre: string, publisherId: string = "com.okamalabs"): Project {
  const manifest = createDefaultManifest(name, publisherId);
  const mainPy = generateStarterCode(genre, name);

  return {
    id: crypto.randomUUID(),
    name,
    genre,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    files: [
      { name: "main.py", content: mainPy, type: "python" },
      { name: "manifest.ok.json", content: JSON.stringify(manifest, null, 2), type: "json" },
    ],
    manifest,
  };
}

export function createDemoProject(): Project {
  const manifest: OkManifest = {
    name: "Stellar Drift",
    id: "com.okamalabs.stellar-drift",
    version: "1.0.0",
    runtime: "okama-sdl2",
    entry: "main.py",
    min_ram_mb: 128,
    target_fps: 60,
    permissions: ["controller", "audio"],
    age_rating: "Everyone",
    supports_save_state: false,
    controller_required: false,
    keyboard_usage: "full",
    description: "A cinematic space shooter — Okama Studio demo game.",
    python_deps: [],
  };

  return {
    id: DEMO_PROJECT_ID,
    name: "Stellar Drift (Demo)",
    genre: "shooter",
    createdAt: 0,
    updatedAt: 0,
    files: [
      { name: "main.py",          content: STELLAR_DRIFT_CODE,   type: "python" },
      { name: "README.md",        content: STELLAR_DRIFT_README, type: "text" },
      { name: "manifest.ok.json", content: JSON.stringify(manifest, null, 2), type: "json" },
    ],
    manifest,
  };
}

export function ensureDemoProject(): void {
  if (typeof window === "undefined") return;
  const existing = getProject(DEMO_PROJECT_ID);
  if (!existing) {
    saveProject(createDemoProject());
  }
}

function generateStarterCode(genre: string, name: string): string {
  const templates: Record<string, string> = {
    platformer: `"""
${name} — Platformer
Created with Okama Studio
"""
import sys
import pygame

# --- Constants ---
SCREEN_W, SCREEN_H = 1280, 720
FPS = 60
GRAVITY = 0.6
PLAYER_SPEED = 5
JUMP_FORCE = -14

# --- Colors ---
SKY_TOP = (20, 10, 40)
SKY_BOT = (60, 20, 80)
GROUND_COLOR = (60, 200, 80)
PLAYER_COLOR = (141, 247, 127)

def main():
    pygame.init()
    pygame.mixer.init()
    screen = pygame.display.set_mode((SCREEN_W, SCREEN_H), pygame.SCALED)
    pygame.display.set_caption("${name}")
    clock = pygame.time.Clock()

    # Player state
    player = pygame.Rect(100, 400, 48, 64)
    vel_y = 0
    on_ground = False
    facing_right = True

    # Platforms
    platforms = [
        pygame.Rect(0, 600, 1280, 120),    # ground
        pygame.Rect(200, 480, 200, 20),
        pygame.Rect(500, 380, 200, 20),
        pygame.Rect(800, 280, 200, 20),
    ]

    running = True
    while running:
        dt = clock.tick(FPS)

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False
                if event.key in (pygame.K_SPACE, pygame.K_UP, pygame.K_w) and on_ground:
                    vel_y = JUMP_FORCE  # Jump!

        # Movement
        keys = pygame.key.get_pressed()
        if keys[pygame.K_LEFT] or keys[pygame.K_a]:
            player.x -= PLAYER_SPEED
            facing_right = False
        if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
            player.x += PLAYER_SPEED
            facing_right = True

        # Gravity
        vel_y += GRAVITY
        player.y += int(vel_y)
        on_ground = False

        # Platform collisions
        for plat in platforms:
            if player.colliderect(plat) and vel_y > 0:
                player.bottom = plat.top
                vel_y = 0
                on_ground = True

        # Keep on screen
        player.clamp_ip(pygame.Rect(0, 0, SCREEN_W, SCREEN_H))

        # --- Draw ---
        # Sky gradient (simple two-rect approximation)
        screen.fill(SKY_TOP)
        pygame.draw.rect(screen, SKY_BOT, (0, SCREEN_H // 2, SCREEN_W, SCREEN_H // 2))

        # Platforms
        for plat in platforms:
            pygame.draw.rect(screen, GROUND_COLOR, plat)
            pygame.draw.rect(screen, (40, 160, 60), plat, 3)  # border

        # Player (simple rect for now — replace with sprite!)
        pygame.draw.rect(screen, PLAYER_COLOR, player, border_radius=8)

        pygame.display.flip()

    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    main()
`,
    topdown: `"""
${name} — Top-Down Adventure
Created with Okama Studio
"""
import sys
import math
import pygame

SCREEN_W, SCREEN_H = 1280, 720
FPS = 60
PLAYER_SPEED = 4
TILE_SIZE = 64

# OkamaOS color palette
INK = (16, 18, 15)
GREEN = (141, 247, 127)
CYAN = (83, 217, 230)
CORAL = (242, 109, 91)

def main():
    pygame.init()
    pygame.mixer.init()
    screen = pygame.display.set_mode((SCREEN_W, SCREEN_H), pygame.SCALED)
    pygame.display.set_caption("${name}")
    clock = pygame.time.Clock()

    # Camera offset
    cam_x, cam_y = 0, 0

    # Player
    px, py = SCREEN_W // 2, SCREEN_H // 2
    player_rect = pygame.Rect(px, py, 40, 40)

    running = True
    while running:
        clock.tick(FPS)

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                running = False

        keys = pygame.key.get_pressed()
        dx = (keys[pygame.K_RIGHT] or keys[pygame.K_d]) - (keys[pygame.K_LEFT] or keys[pygame.K_a])
        dy = (keys[pygame.K_DOWN] or keys[pygame.K_s]) - (keys[pygame.K_UP] or keys[pygame.K_w])

        # Normalise diagonal movement
        if dx and dy:
            dx *= 0.707
            dy *= 0.707

        player_rect.x += int(dx * PLAYER_SPEED)
        player_rect.y += int(dy * PLAYER_SPEED)

        # Draw world
        screen.fill(INK)

        # Draw grid
        for gx in range(0, SCREEN_W, TILE_SIZE):
            pygame.draw.line(screen, (30, 33, 28), (gx, 0), (gx, SCREEN_H))
        for gy in range(0, SCREEN_H, TILE_SIZE):
            pygame.draw.line(screen, (30, 33, 28), (0, gy), (SCREEN_W, gy))

        # Draw player
        pygame.draw.ellipse(screen, GREEN, player_rect, border_radius=8)
        # Direction indicator
        mx, my = pygame.mouse.get_pos()
        angle = math.atan2(my - player_rect.centery, mx - player_rect.centerx)
        tip_x = player_rect.centerx + math.cos(angle) * 28
        tip_y = player_rect.centery + math.sin(angle) * 28
        pygame.draw.line(screen, CYAN, player_rect.center, (int(tip_x), int(tip_y)), 3)

        pygame.display.flip()

    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    main()
`,
    rpg: `"""
${name} — RPG
Created with Okama Studio
"""
import sys
import pygame

SCREEN_W, SCREEN_H = 1280, 720
FPS = 60

INK = (16, 18, 15)
PAPER = (243, 239, 228)
GREEN = (141, 247, 127)
YELLOW = (255, 207, 74)

def main():
    pygame.init()
    pygame.mixer.init()
    screen = pygame.display.set_mode((SCREEN_W, SCREEN_H), pygame.SCALED)
    pygame.display.set_caption("${name}")
    clock = pygame.time.Clock()
    font = pygame.font.SysFont("monospace", 18, bold=True)
    title_font = pygame.font.SysFont("monospace", 42, bold=True)

    # Simple title screen state
    state = "title"

    running = True
    while running:
        clock.tick(FPS)

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False
                if event.key == pygame.K_RETURN and state == "title":
                    state = "game"

        screen.fill(INK)

        if state == "title":
            title = title_font.render("${name}", True, GREEN)
            sub = font.render("Press ENTER to begin your journey", True, YELLOW)
            screen.blit(title, title.get_rect(center=(SCREEN_W // 2, SCREEN_H // 2 - 40)))
            screen.blit(sub, sub.get_rect(center=(SCREEN_W // 2, SCREEN_H // 2 + 40)))
        elif state == "game":
            msg = font.render("Your adventure awaits! Add your game logic here.", True, PAPER)
            screen.blit(msg, msg.get_rect(center=(SCREEN_W // 2, SCREEN_H // 2)))

        pygame.display.flip()

    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    main()
`,
    blank: `"""
${name}
Created with Okama Studio
"""
import sys
import pygame

SCREEN_W, SCREEN_H = 1280, 720
FPS = 60

def main():
    pygame.init()
    screen = pygame.display.set_mode((SCREEN_W, SCREEN_H), pygame.SCALED)
    pygame.display.set_caption("${name}")
    clock = pygame.time.Clock()

    running = True
    while running:
        clock.tick(FPS)
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                running = False

        screen.fill((16, 18, 15))
        pygame.display.flip()

    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    main()
`,
  };

  return templates[genre] ?? templates.blank;
}

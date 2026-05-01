export interface Exercise {
  prompt: string;
  starterCode: string;
  solution: string;
  checkHint?: string;
}

export interface Lesson {
  slug: string;
  chapter: number;
  title: string;
  description: string;
  concept: string;
  theory: string;
  codeDemo: string;
  exercises: Exercise[];
  badge?: string;
  xp: number;
}

export const CURRICULUM: Lesson[] = [
  // ── Chapter 1: Python Basics ────────────────────────────────────────────────
  {
    slug: "variables",
    chapter: 1,
    title: "Variables & Values",
    description: "Store information so your game can remember things.",
    concept: "Variables are like labelled boxes — they hold a value you can use later.",
    theory: `In Python, you create a variable by giving it a name and a value:

\`\`\`python
score = 0          # an integer
player_name = "Alex"  # a string (text)
speed = 3.5        # a float (decimal)
alive = True       # a boolean (True/False)
\`\`\`

Variable names should be lowercase with underscores. Change the value anytime by reassigning it.`,
    codeDemo: `# Game variables
score = 0
lives = 3
player_name = "Hero"

print(f"Player: {player_name}")
print(f"Score: {score}  Lives: {lives}")

# Update score
score = score + 100
print(f"New score: {score}")`,
    exercises: [
      {
        prompt: "Create a variable called `health` with value 100, and a variable called `level` with value 1. Then print both.",
        starterCode: `# Create your variables here\n\nprint(health)\nprint(level)`,
        solution: `health = 100\nlevel = 1\nprint(health)\nprint(level)`,
      },
    ],
    badge: "Variable Master",
    xp: 50,
  },
  {
    slug: "loops",
    chapter: 2,
    title: "Loops",
    description: "Make things repeat — essential for game loops!",
    concept: "Loops run a block of code multiple times so you don't have to write the same thing over and over.",
    theory: `Two types of loops:

**for loop** — repeat a known number of times:
\`\`\`python
for i in range(5):
    print(i)  # prints 0, 1, 2, 3, 4
\`\`\`

**while loop** — repeat until a condition is false:
\`\`\`python
lives = 3
while lives > 0:
    print(f"{lives} lives left")
    lives -= 1
print("Game Over!")
\`\`\``,
    codeDemo: `# Spawn 5 enemies
for i in range(5):
    enemy_x = i * 100
    print(f"Enemy {i+1} at x={enemy_x}")

# Countdown timer
countdown = 3
while countdown > 0:
    print(f"Starting in {countdown}...")
    countdown -= 1
print("GO!")`,
    exercises: [
      {
        prompt: "Write a loop that prints the numbers 1 to 10.",
        starterCode: `# Your loop here`,
        solution: `for i in range(1, 11):\n    print(i)`,
      },
    ],
    badge: "Loop Hero",
    xp: 75,
  },
  {
    slug: "functions",
    chapter: 3,
    title: "Functions",
    description: "Package code into reusable blocks — just like game actions.",
    concept: "Functions are named blocks of code you can call whenever you need them.",
    theory: `Define a function with \`def\`, give it a name, and optionally some inputs (parameters):

\`\`\`python
def greet_player(name):
    print(f"Welcome, {name}!")

greet_player("Alex")  # calls the function
\`\`\`

Functions can also **return** a value:
\`\`\`python
def calculate_damage(attack, defense):
    return max(0, attack - defense)

dmg = calculate_damage(30, 10)
print(f"Damage dealt: {dmg}")
\`\`\``,
    codeDemo: `def show_hud(score, lives, level):
    """Display the game's heads-up display."""
    print(f"╔══ LEVEL {level} ══╗")
    print(f"  Score: {score}")
    print(f"  Lives: {'❤️ ' * lives}")
    print(f"╚══════════╝")

show_hud(score=1500, lives=3, level=2)`,
    exercises: [
      {
        prompt: "Write a function called `is_game_over` that takes `lives` as a parameter and returns True if lives is 0, else False.",
        starterCode: `def is_game_over(lives):\n    # your code here\n    pass\n\nprint(is_game_over(0))   # should print True\nprint(is_game_over(3))   # should print False`,
        solution: `def is_game_over(lives):\n    return lives == 0\n\nprint(is_game_over(0))\nprint(is_game_over(3))`,
      },
    ],
    badge: "Function Wizard",
    xp: 100,
  },
  {
    slug: "lists",
    chapter: 4,
    title: "Lists",
    description: "Store collections — enemies, items, bullets, scores.",
    concept: "A list holds multiple values in order, like an inventory or enemy roster.",
    theory: `Create a list with square brackets:
\`\`\`python
inventory = ["sword", "potion", "shield"]
scores = [100, 250, 80, 330]

print(inventory[0])   # "sword" (index starts at 0)
inventory.append("bow")  # add item
inventory.remove("potion")  # remove item
print(len(inventory))  # how many items
\`\`\``,
    codeDemo: `# Enemy list
enemies = ["Slime", "Goblin", "Dragon"]

for enemy in enemies:
    print(f"Spawning: {enemy}")

# Add a new enemy
enemies.append("Dark Knight")
print(f"Total enemies: {len(enemies)}")

# Remove defeated
enemies.remove("Slime")
print(f"Remaining: {enemies}")`,
    exercises: [
      {
        prompt: "Create a list of 3 power-ups. Loop through them and print each one.",
        starterCode: `power_ups = []  # add 3 items\n\n# loop and print each`,
        solution: `power_ups = ["speed_boost", "shield", "double_jump"]\n\nfor pu in power_ups:\n    print(pu)`,
      },
    ],
    badge: "List Collector",
    xp: 75,
  },
  {
    slug: "conditionals",
    chapter: 5,
    title: "If / Else Decisions",
    description: "Make your game react to different situations.",
    concept: "Conditionals let your game decide what to do based on what's happening.",
    theory: `\`\`\`python
health = 20

if health <= 0:
    print("You died!")
elif health < 30:
    print("⚠️ Low health! Find a potion!")
else:
    print("You're doing great!")
\`\`\`

Comparison operators: \`==\` \`!=\` \`<\` \`>\` \`<=\` \`>=\`
Logical: \`and\` \`or\` \`not\``,
    codeDemo: `def check_collision(player_x, enemy_x, threshold=50):
    distance = abs(player_x - enemy_x)
    if distance < threshold:
        print("💥 Hit! Taking damage.")
        return True
    else:
        print("Safe!")
        return False

check_collision(100, 120)  # close — hit
check_collision(100, 300)  # far — safe`,
    exercises: [
      {
        prompt: "Write an `if/elif/else` that prints 'Boss!' if score > 1000, 'Good!' if score > 500, else 'Keep going!'",
        starterCode: `score = 750\n\n# your if/elif/else here`,
        solution: `score = 750\n\nif score > 1000:\n    print("Boss!")\nelif score > 500:\n    print("Good!")\nelse:\n    print("Keep going!")`,
      },
    ],
    badge: "Decision Maker",
    xp: 75,
  },
  // ── Chapter 6: Pygame Basics ────────────────────────────────────────────────
  {
    slug: "pygame-window",
    chapter: 6,
    title: "Your First Window",
    description: "Open a game window — the first step to any game!",
    concept: "pygame.display.set_mode() creates a window. The game loop keeps it running.",
    theory: `Every pygame game has 3 parts:
1. **Init** — start pygame
2. **Game loop** — run forever until quit
3. **Quit** — clean up

\`\`\`python
import pygame, sys
pygame.init()
screen = pygame.display.set_mode((800, 600))
clock = pygame.time.Clock()

while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit(); sys.exit()
    screen.fill((20, 10, 40))  # dark purple
    pygame.display.flip()
    clock.tick(60)
\`\`\``,
    codeDemo: `import pygame, sys
pygame.init()
screen = pygame.display.set_mode((640, 360))
pygame.display.set_caption("Hello OkamaOS!")
clock = pygame.time.Clock()

while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit(); sys.exit()
    screen.fill((16, 18, 15))
    pygame.display.flip()
    clock.tick(60)`,
    exercises: [
      {
        prompt: "Create a window of size 800x500 with a dark blue background (0, 10, 40) and title 'My Game'.",
        starterCode: `import pygame, sys\npygame.init()\n# set up screen, clock, loop here`,
        solution: `import pygame, sys\npygame.init()\nscreen = pygame.display.set_mode((800, 500))\npygame.display.set_caption("My Game")\nclock = pygame.time.Clock()\nwhile True:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            pygame.quit(); sys.exit()\n    screen.fill((0, 10, 40))\n    pygame.display.flip()\n    clock.tick(60)`,
      },
    ],
    badge: "Window Opener",
    xp: 150,
  },
  {
    slug: "drawing",
    chapter: 7,
    title: "Drawing Shapes",
    description: "Draw rectangles, circles, and lines to build game graphics.",
    concept: "pygame.draw has functions for every basic shape — the building blocks of any game.",
    theory: `\`\`\`python
# Filled rectangle: (surface, color, Rect)
pygame.draw.rect(screen, (141, 247, 127), (100, 200, 60, 80))

# Circle: (surface, color, center, radius)
pygame.draw.circle(screen, (83, 217, 230), (400, 300), 30)

# Line: (surface, color, start, end, width)
pygame.draw.line(screen, (255, 207, 74), (0, 0), (800, 600), 2)

# Unfilled rect (outline): add border width at end
pygame.draw.rect(screen, (242, 109, 91), (50, 50, 100, 100), 3)
\`\`\``,
    codeDemo: `import pygame, sys
pygame.init()
screen = pygame.display.set_mode((640, 360))
clock = pygame.time.Clock()

while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit(); sys.exit()
    screen.fill((16, 18, 15))
    # Ground
    pygame.draw.rect(screen, (60, 200, 80), (0, 300, 640, 60))
    # Player
    pygame.draw.rect(screen, (141, 247, 127), (100, 240, 40, 60), border_radius=8)
    # Sun
    pygame.draw.circle(screen, (255, 207, 74), (560, 60), 40)
    pygame.display.flip()
    clock.tick(60)`,
    exercises: [
      {
        prompt: "Draw a 'night sky' scene: dark background, a yellow circle (moon), and 5 small white circles (stars).",
        starterCode: `import pygame, sys\npygame.init()\nscreen = pygame.display.set_mode((640, 360))\nclock = pygame.time.Clock()\n\nwhile True:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            pygame.quit(); sys.exit()\n    screen.fill((5, 5, 20))  # night sky\n    # draw moon and stars here\n    pygame.display.flip()\n    clock.tick(60)`,
        solution: `import pygame, sys\npygame.init()\nscreen = pygame.display.set_mode((640, 360))\nclock = pygame.time.Clock()\nstars = [(50,30),(150,80),(300,20),(450,60),(580,40)]\nwhile True:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            pygame.quit(); sys.exit()\n    screen.fill((5, 5, 20))\n    pygame.draw.circle(screen, (255, 230, 100), (100, 80), 35)\n    for sx, sy in stars:\n        pygame.draw.circle(screen, (255, 255, 255), (sx, sy), 3)\n    pygame.display.flip()\n    clock.tick(60)`,
      },
    ],
    badge: "Shape Artist",
    xp: 150,
  },
  {
    slug: "movement",
    chapter: 8,
    title: "Player Movement",
    description: "Read keyboard input and move a character around the screen.",
    concept: "pygame.key.get_pressed() reads which keys are held down each frame.",
    theory: `\`\`\`python
keys = pygame.key.get_pressed()
if keys[pygame.K_LEFT]:
    x -= speed
if keys[pygame.K_RIGHT]:
    x += speed
\`\`\`

Key constants: K_LEFT, K_RIGHT, K_UP, K_DOWN, K_SPACE, K_RETURN, K_ESCAPE, K_a, K_w, K_s, K_d`,
    codeDemo: `import pygame, sys
pygame.init()
screen = pygame.display.set_mode((640, 360))
clock = pygame.time.Clock()

player = pygame.Rect(300, 160, 40, 40)
SPEED = 4

while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit(); sys.exit()

    keys = pygame.key.get_pressed()
    if keys[pygame.K_LEFT] or keys[pygame.K_a]:  player.x -= SPEED
    if keys[pygame.K_RIGHT] or keys[pygame.K_d]: player.x += SPEED
    if keys[pygame.K_UP] or keys[pygame.K_w]:    player.y -= SPEED
    if keys[pygame.K_DOWN] or keys[pygame.K_s]:  player.y += SPEED
    player.clamp_ip(screen.get_rect())

    screen.fill((16, 18, 15))
    pygame.draw.rect(screen, (141, 247, 127), player, border_radius=6)
    pygame.display.flip()
    clock.tick(60)`,
    exercises: [
      {
        prompt: "Add a speed boost — when the player holds SHIFT, move at double the normal speed.",
        starterCode: `import pygame, sys\npygame.init()\nscreen = pygame.display.set_mode((640, 360))\nclock = pygame.time.Clock()\nplayer = pygame.Rect(300, 160, 40, 40)\nSPEED = 4\n\nwhile True:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            pygame.quit(); sys.exit()\n    keys = pygame.key.get_pressed()\n    # modify speed based on SHIFT here\n    if keys[pygame.K_LEFT]:  player.x -= SPEED\n    if keys[pygame.K_RIGHT]: player.x += SPEED\n    screen.fill((16, 18, 15))\n    pygame.draw.rect(screen, (141, 247, 127), player, border_radius=6)\n    pygame.display.flip()\n    clock.tick(60)`,
        solution: `import pygame, sys\npygame.init()\nscreen = pygame.display.set_mode((640, 360))\nclock = pygame.time.Clock()\nplayer = pygame.Rect(300, 160, 40, 40)\n\nwhile True:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            pygame.quit(); sys.exit()\n    keys = pygame.key.get_pressed()\n    speed = 8 if (keys[pygame.K_LSHIFT] or keys[pygame.K_RSHIFT]) else 4\n    if keys[pygame.K_LEFT]:  player.x -= speed\n    if keys[pygame.K_RIGHT]: player.x += speed\n    if keys[pygame.K_UP]:    player.y -= speed\n    if keys[pygame.K_DOWN]:  player.y += speed\n    player.clamp_ip(screen.get_rect())\n    screen.fill((16, 18, 15))\n    pygame.draw.rect(screen, (141, 247, 127), player, border_radius=6)\n    pygame.display.flip()\n    clock.tick(60)`,
      },
    ],
    badge: "Movement Pro",
    xp: 150,
  },
  {
    slug: "sprites",
    chapter: 9,
    title: "Sprites & Images",
    description: "Load real art assets and use sprite classes for clean game objects.",
    concept: "pygame.Sprite is the base class for all game objects — combine it with groups for easy rendering and collision.",
    theory: `\`\`\`python
class Player(pygame.sprite.Sprite):
    def __init__(self):
        super().__init__()
        self.image = pygame.Surface((40, 60), pygame.SRCALPHA)
        pygame.draw.rect(self.image, (141, 247, 127), (0, 0, 40, 60), border_radius=8)
        self.rect = self.image.get_rect(center=(320, 180))

    def update(self):
        keys = pygame.key.get_pressed()
        self.rect.x += (keys[pygame.K_RIGHT] - keys[pygame.K_LEFT]) * 4

all_sprites = pygame.sprite.Group()
player = Player()
all_sprites.add(player)

# In game loop:
all_sprites.update()
all_sprites.draw(screen)
\`\`\``,
    codeDemo: `import pygame, sys

pygame.init()
screen = pygame.display.set_mode((640, 360))
clock = pygame.time.Clock()

class Player(pygame.sprite.Sprite):
    def __init__(self):
        super().__init__()
        self.image = pygame.Surface((36, 52), pygame.SRCALPHA)
        # Draw a simple character shape
        pygame.draw.ellipse(self.image, (141, 247, 127), (8, 0, 20, 20))   # head
        pygame.draw.rect(self.image, (83, 217, 230), (6, 20, 24, 32), border_radius=4)  # body
        self.rect = self.image.get_rect(center=(320, 180))

    def update(self):
        keys = pygame.key.get_pressed()
        self.rect.x += (keys[pygame.K_RIGHT] - keys[pygame.K_LEFT]) * 4
        self.rect.y += (keys[pygame.K_DOWN] - keys[pygame.K_UP]) * 4
        self.rect.clamp_ip(screen.get_rect())

all_sprites = pygame.sprite.Group()
all_sprites.add(Player())

while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT: pygame.quit(); sys.exit()
    screen.fill((16, 18, 15))
    all_sprites.update()
    all_sprites.draw(screen)
    pygame.display.flip()
    clock.tick(60)`,
    exercises: [
      {
        prompt: "Create an Enemy sprite class with a red color. Add 3 enemies at different positions to a sprite group and draw them.",
        starterCode: `import pygame, sys\npygame.init()\nscreen = pygame.display.set_mode((640, 360))\nclock = pygame.time.Clock()\n\nclass Enemy(pygame.sprite.Sprite):\n    def __init__(self, x, y):\n        super().__init__()\n        # create a 32x32 red surface\n        # set rect position\n        pass\n\nall_sprites = pygame.sprite.Group()\n# add 3 enemies\n\nwhile True:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT: pygame.quit(); sys.exit()\n    screen.fill((16, 18, 15))\n    all_sprites.draw(screen)\n    pygame.display.flip()\n    clock.tick(60)`,
        solution: `import pygame, sys\npygame.init()\nscreen = pygame.display.set_mode((640, 360))\nclock = pygame.time.Clock()\n\nclass Enemy(pygame.sprite.Sprite):\n    def __init__(self, x, y):\n        super().__init__()\n        self.image = pygame.Surface((32, 32))\n        self.image.fill((242, 109, 91))\n        self.rect = self.image.get_rect(topleft=(x, y))\n\nall_sprites = pygame.sprite.Group()\nall_sprites.add(Enemy(100, 100), Enemy(300, 200), Enemy(500, 80))\n\nwhile True:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT: pygame.quit(); sys.exit()\n    screen.fill((16, 18, 15))\n    all_sprites.draw(screen)\n    pygame.display.flip()\n    clock.tick(60)`,
      },
    ],
    badge: "Sprite Summoner",
    xp: 200,
  },
  {
    slug: "collision",
    chapter: 10,
    title: "Collision Detection",
    description: "Detect when sprites touch — the heart of game physics.",
    concept: "pygame.sprite.spritecollide() checks if a sprite overlaps with any sprite in a group.",
    theory: `\`\`\`python
# Check if player hits any enemy
hits = pygame.sprite.spritecollide(player, enemies, False)
if hits:
    health -= 10

# Kill enemy on bullet hit
pygame.sprite.groupcollide(bullets, enemies, True, True)
# first True = kill bullet, second True = kill enemy
\`\`\``,
    codeDemo: `import pygame, sys
pygame.init()
screen = pygame.display.set_mode((640, 360))
clock = pygame.time.Clock()
font = pygame.font.SysFont("monospace", 20, bold=True)

class Player(pygame.sprite.Sprite):
    def __init__(self):
        super().__init__()
        self.image = pygame.Surface((36, 36))
        self.image.fill((141, 247, 127))
        self.rect = self.image.get_rect(center=(320, 180))
    def update(self):
        keys = pygame.key.get_pressed()
        self.rect.x += (keys[pygame.K_RIGHT] - keys[pygame.K_LEFT]) * 5
        self.rect.y += (keys[pygame.K_DOWN] - keys[pygame.K_UP]) * 5
        self.rect.clamp_ip(screen.get_rect())

class Coin(pygame.sprite.Sprite):
    def __init__(self, x, y):
        super().__init__()
        self.image = pygame.Surface((20, 20), pygame.SRCALPHA)
        pygame.draw.circle(self.image, (255, 207, 74), (10, 10), 10)
        self.rect = self.image.get_rect(topleft=(x, y))

player = Player()
coins = pygame.sprite.Group(Coin(100,100), Coin(400,200), Coin(550,80))
all_sprites = pygame.sprite.Group(player, *coins)
score = 0

while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT: pygame.quit(); sys.exit()
    all_sprites.update()
    collected = pygame.sprite.spritecollide(player, coins, True)
    score += len(collected) * 10
    screen.fill((16, 18, 15))
    all_sprites.draw(screen)
    txt = font.render(f"Score: {score}", True, (255,207,74))
    screen.blit(txt, (10, 10))
    pygame.display.flip()
    clock.tick(60)`,
    exercises: [
      {
        prompt: "Build a simple dodge game: player moves, enemies move left, if enemy hits player print 'HIT!'",
        starterCode: `import pygame, sys\npygame.init()\nscreen = pygame.display.set_mode((640, 360))\nclock = pygame.time.Clock()\n# create Player and Enemy sprites, check collision`,
        solution: `import pygame, sys, random\npygame.init()\nscreen = pygame.display.set_mode((640, 360))\nclock = pygame.time.Clock()\n\nclass Player(pygame.sprite.Sprite):\n    def __init__(self):\n        super().__init__()\n        self.image = pygame.Surface((32,32)); self.image.fill((141,247,127))\n        self.rect = self.image.get_rect(center=(100, 180))\n    def update(self):\n        keys = pygame.key.get_pressed()\n        self.rect.y += (keys[pygame.K_DOWN]-keys[pygame.K_UP])*5\n        self.rect.clamp_ip(screen.get_rect())\n\nclass Enemy(pygame.sprite.Sprite):\n    def __init__(self):\n        super().__init__()\n        self.image = pygame.Surface((28,28)); self.image.fill((242,109,91))\n        self.rect = self.image.get_rect(topleft=(640, random.randint(0,328)))\n    def update(self):\n        self.rect.x -= 4\n        if self.rect.right < 0: self.kill()\n\nplayer = Player()\nenemies = pygame.sprite.Group()\nall_sprites = pygame.sprite.Group(player)\nhit_count = 0\ntimer = 0\n\nwhile True:\n    clock.tick(60)\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT: pygame.quit(); sys.exit()\n    timer += 1\n    if timer % 60 == 0:\n        e = Enemy(); enemies.add(e); all_sprites.add(e)\n    all_sprites.update()\n    if pygame.sprite.spritecollide(player, enemies, True):\n        hit_count += 1; print(f"HIT! Total: {hit_count}")\n    screen.fill((16,18,15))\n    all_sprites.draw(screen)\n    pygame.display.flip()`,
      },
    ],
    badge: "Collision Champion",
    xp: 250,
  },
];

export function getLessonBySlug(slug: string): Lesson | undefined {
  return CURRICULUM.find((l) => l.slug === slug);
}

export function getLessonsByChapter(chapter: number): Lesson[] {
  return CURRICULUM.filter((l) => l.chapter === chapter);
}

export function getTotalXP(): number {
  return CURRICULUM.reduce((sum, l) => sum + l.xp, 0);
}

export const CHAPTER_LABELS: Record<number, string> = {
  1: "Python Basics",
  2: "Python Basics",
  3: "Python Basics",
  4: "Python Basics",
  5: "Python Basics",
  6: "Pygame Basics",
  7: "Pygame Basics",
  8: "Pygame Basics",
  9: "Pygame Basics",
  10: "Game Mechanics",
};

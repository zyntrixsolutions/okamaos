# OkamaOS — "THE CONSOLE NOBODY MADE"
## A 6-Part Documentary Series + LinkedIn Campaign

---

### Series Identity

| Attribute    | Value                                                               |
| ------------ | ------------------------------------------------------------------- |
| Series name  | *"THE CONSOLE NOBODY MADE"*                                         |
| Format       | 6 episodes · 3–5 minutes each                                       |
| Style        | Talking-head founder narration + screen footage + ambient music     |
| Palette      | Black · Okama red · Neon cyan · warm tungsten for interview footage |
| Narrative    | Linear founder journey — frustration → breakthrough → community     |
| Drop cadence | 1 episode per week (6-week campaign)                                |
| Platform     | LinkedIn (primary) · YouTube · X/Twitter                            |

---

### The Arc

```
EP 1 — THE PROBLEM      →  Everyone owns hardware that's being wasted.
EP 2 — THE BOOT         →  The moment it clicked: any PC can be a console.
EP 3 — THE GAME         →  What "console-grade" actually means to build.
EP 4 — THE WALLET       →  Why every play-to-earn game got it backwards.
EP 5 — THE STUDIO       →  Making game creation accessible to anyone.
EP 6 — THE WAVE         →  The community that forms around a shared belief.
```

---
---

## EP 1 — "THE PROBLEM"

### Episode Brief

| Runtime  | 3–4 minutes |
| -------- | ----------- |
| Tone     | Frustrated. Honest. Identifying with the audience's pain. |
| Footage  | Consumer hardware prices. Cluttered desktop UI. Old PCs gathering dust. |
| Music    | Slow, minimal ambient. Slightly tense. |

---

### Script

**[OPEN: Black screen. A single line of white text appears.]**

```
The average gaming PC costs $800.
The average gaming console costs $500.
The average child's household income: $0.
```

**[Cut to: an old laptop sitting on a desk. Dust on the keyboard. Sticker half peeled off.]**

> **NARRATOR (VO):**
> *"We kept looking at this hardware and thinking — this is powerful enough.
> Not powerful enough for the latest AAA titles.
> But powerful enough to be a real gaming machine.
> The problem wasn't the hardware."*

**[Cut to: Windows desktop. 60 icons. System tray with 14 notifications. Antivirus popup.]**

> **NARRATOR:**
> *"The problem was everything else sitting on top of it.*
> *The launcher. The updater. The driver conflict.*
> *The 40-step setup before a 10-year-old can just... play a game."*

**[Cut to: a PS5 price tag. A Switch price tag.]**

> **NARRATOR:**
> *"And if you wanted the clean experience — the boot-straight-into-gaming,
> controller-just-works, no-clutter experience —
> you were looking at $400, $500, $600.*
> *Which meant: millions of kids who couldn't afford that,
> were just locked out of that experience entirely."*

**[Long pause. Ambient music drops slightly.]**

> **NARRATOR:**
> *"Then there was the other problem.*
> *The one that was supposed to solve access.*
> *Play-to-earn."*

**[Montage: cryptocurrency logos. Browser-based P2E games. Token price charts crashing.]**

> **NARRATOR:**
> *"Great idea.*
> *Terrible execution.*
> *Browser games with a token bolted on.*
> *Inflation built in from day one.*
> *And then — the rug."*

**[Cut to black.]**

> **NARRATOR:**
> *"We started asking: what if someone actually built this right?*
> *Not as a financial product.*
> *As a console.*
> *A real console.*
> *That happens to reward you for playing."*

**[TITLE CARD: THE CONSOLE NOBODY MADE — Episode 1: The Problem]**

**[Fade to black. End card: okamaos.zyntrix.solutions]**

---

### LinkedIn Post — EP 1

---

> **The console costs $500.**
>
> **The laptop your kid already has: $0.**
>
> We kept looking at low-cost x86 hardware gathering dust and asking the same question:
>
> Why can't this just boot into a game?
>
> Not "open Windows, launch Steam, update the launcher, configure the controller."
>
> Just.
>
> Boot.
>
> Into.
>
> A game.
>
> The hardware was never the problem.
>
> Everything sitting on top of it was.
>
> We spent months trying to answer that question properly.
>
> Not a launcher. Not an emulator skin. A full OS.
>
> Controller-first. No desktop. No clutter.
>
> Boot in under 10 seconds.
>
> This is Episode 1 of a 6-part series documenting what we built — and why.
>
> [▶ Watch: THE CONSOLE NOBODY MADE — Ep 1: The Problem]
>
> ---
>
> What piece of hardware do you own that's been "too good to throw away, not good enough to use"?
>
> Drop it below. I'm curious.
>
> #BuildInPublic #Linux #Gaming #OpenSource #OkamaOS #IndieGaming #GameDev

---
---

## EP 2 — "THE BOOT"

### Episode Brief

| Runtime  | 3–5 minutes |
| -------- | ----------- |
| Tone     | Technical wonder. The moment of breakthrough. Quiet excitement. |
| Footage  | Terminal output. Buildroot compile. Framebuffer first render. Boot sequence. Shell appearing. |
| Music    | Builds slowly from near-silence. Single note expands. |

---

### Script

**[OPEN: Terminal window. A compile log scrolling. Thousands of lines.]**

> **NARRATOR:**
> *"The first thing you learn when you build an OS from scratch
> is that there are a thousand ways it can go wrong
> before anything appears on screen."*

**[Cut to: blank monitor. A cursor blinking in a black framebuffer.]**

> **NARRATOR:**
> *"Buildroot. That's where we started.*
> *It's a tool that lets you construct a Linux system from source —
> every package, every driver, every init script —
> exactly and only what you need.*
> *Nothing more."*

**[Split screen: Windows task manager — 200+ processes. OkamaOS process table — 8.]**

> **NARRATOR:**
> *"At idle, a normal Windows PC runs 150 to 200 background processes.*
> *OkamaOS idles at eight.*
> *185 megabytes of RAM.*
> *That's it.*
> *The rest is yours. The game's."*

**[Footage: okama-shell booting. The Okama mark glows red. The shell UI appears — full screen. No desktop. No taskbar. No system tray. A game list. A controller icon.]**

> **NARRATOR:**
> *"The first time the shell came up on a framebuffer —
> not a virtual machine, not a dev box —
> a real machine, cold boot, under 10 seconds,
> straight into a fullscreen game UI —*
>
> *that was the moment we knew this was real."*

**[Close up: a controller being plugged in. The shell detects it. "Controller connected." appears.]**

> **NARRATOR:**
> *"No drivers to install.*
> *No Bluetooth pairing wizard.*
> *No reboot required.*
> *Xbox. PlayStation. USB. Bluetooth.*
> *The OS handles it.*
> *Because the OS was built around the controller.*
> *Not the keyboard."*

**[Cut to: the `.ok` package format. A game downloading. A progress bar. Game appears in list.]**

> **NARRATOR:**
> *"Games are `.ok` packages — self-contained, signed, versioned.*
> *One press to install.*
> *One press to play.*
> *No file manager. No extraction. No setup.exe.*
> *Console behaviour. On PC hardware.*
> *That's the goal.*
> *That's always been the goal."*

**[TITLE CARD: THE CONSOLE NOBODY MADE — Episode 2: The Boot]**

**[Fade to black. End card: okamaos.zyntrix.solutions]**

---

### LinkedIn Post — EP 2

---

> **185 MB of RAM.**
>
> **That's the entire OS at idle.**
>
> Not the game. The entire operating system.
>
> Kernel. Input daemon. Audio. Network. Shell.
>
> All of it: 185 MB.
>
> We built OkamaOS on Buildroot — a tool that forces you to be intentional about every single package you include.
>
> No package enters the system without a reason.
>
> The result:
>
> Cold boot → fullscreen game shell in under 10 seconds.
>
> No desktop.
> No taskbar.
> No background updater stealing your game's RAM.
>
> Just the game.
>
> The first time it booted on real hardware — not a VM, not a dev box — a real laptop, cold, under 10 seconds — I stopped typing and just stared.
>
> That feeling is what we're trying to give to every player on this platform.
>
> Episode 2 of 6 is live.
>
> [▶ Watch: THE CONSOLE NOBODY MADE — Ep 2: The Boot]
>
> ---
>
> What's the fastest boot-to-usable you've ever experienced on a consumer device? I'll bet ours is faster.
>
> #Linux #BuildInPublic #GameDev #OkamaOS #Buildroot #OpenSource #EmbeddedLinux

---
---

## EP 3 — "THE GAME"

### Episode Brief

| Runtime  | 4–5 minutes |
| -------- | ----------- |
| Tone     | Creative pride. The craft of making something real. |
| Footage  | VOID STRIKER gameplay — boss fights, particle explosions. PGDRIVE racing. Live framebuffer rendering. Controller input. High score. |
| Music    | The beat finally arrives. Driving. Energised. |

---

### Script

**[OPEN: VOID STRIKER gameplay. No UI, no chrome. Just the game on screen. Full screen. Enemies flooding in. Explosions. Screen shake.]**

**[Hold for 10 seconds. No narration. Just the game.]**

> **NARRATOR:**
> *"If you're going to build a console,
> you have to build games worthy of it."*

**[Cut to: code editor. Python. `main.py` open. `pygame.display.set_mode()`. Controller input polling.]**

> **NARRATOR:**
> *"VOID STRIKER is a vertical shoot-em-up.*
> *Procedural enemy waves. Three weapon types. A boss every five waves.*
> *A rechargeable shield. A score combo multiplier.*
> *A particle system. Screen shake calibrated per event.*
> *A three-layer parallax starfield running at 60 frames per second.*
> *And a high-score save state.*
> *Packaged into a single `.ok` file.*
> *Six kilobytes.*"*

**[On screen: `ls -lh com.okamaos.voidstriker.ok` — output: 6K]**

> **NARRATOR:**
> *"That's not a tech demo.*
> *That's a game.*
> *A real one.*
> *Running on a framebuffer.*
> *On a $50 PC.*
> *With a controller.*
> *At 60 frames per second."*

**[Cut to: PGDRIVE. Top-down city driving. Minimap. NPC cars. Procedural road grid. Smooth camera.]**

> **NARRATOR:**
> *"PGDrive is different.*
> *Every city is procedurally generated from a seed.*
> *Twelve-by-twelve grid. 85% edge density.*
> *Ten NPC vehicles with autonomous navigation.*
> *Arcade physics.*
> *All of it: pure Python. Pure pygame.*
> *No engine. No middleware. Just math and the framebuffer."*

**[Cut to: the `.ok` manifest file in the editor.]**

```json
{
  "id": "com.okamaos.voidstriker",
  "name": "VOID STRIKER",
  "version": "1.0.0",
  "runtime": "okama-sdl2",
  "entry": "main.py"
}
```

> **NARRATOR:**
> *"Three lines is all it takes to package a game for OkamaOS.*
> *The OS handles the rest.*
> *Install. Validate. Launch. Recover on crash. Restore saves.*
> *The developer just writes the game."*

**[Final shot: the Play screen in the shell. VOID STRIKER and PGDRIVE in the list. A controller selects VOID STRIKER. The screen fades to black. The game launches.]**

> **NARRATOR:**
> *"We built these games to prove the platform could support them.*
> *The platform exceeded what we expected.*
> *Which means — so can yours."*

**[TITLE CARD: THE CONSOLE NOBODY MADE — Episode 3: The Game]**

**[Fade to black. End card: okamaos.zyntrix.solutions]**

---

### LinkedIn Post — EP 3

---

> **6 kilobytes.**
>
> That's the size of VOID STRIKER — a full vertical shoot-em-up with boss fights, a particle system, 3 weapon types, and a 60fps parallax starfield.
>
> Packaged as a single `.ok` file.
>
> It runs on a $50 PC.
>
> With a controller.
>
> At 60 frames per second.
>
> No engine. No middleware. No Steam runtime.
>
> Pure Python. Pure pygame. Pure framebuffer.
>
> When we talk about "console-grade gaming on low-cost hardware," this is what we mean.
>
> Not a demo. Not a proof of concept.
>
> A game you'd actually play.
>
> The OkamaOS `.ok` package format is three fields in a JSON manifest. The OS handles install, validation, launch, crash recovery, and save preservation.
>
> The developer just writes the game.
>
> That's the platform we built.
>
> Episode 3 of 6 is live.
>
> [▶ Watch: THE CONSOLE NOBODY MADE — Ep 3: The Game]
>
> ---
>
> If you could put one type of game on this platform — what would it be?
>
> #GameDev #IndieGames #Python #Pygame #BuildInPublic #OkamaOS #Linux #Gaming

---
---

## EP 4 — "THE WALLET"

### Episode Brief

| Runtime  | 4–5 minutes |
| -------- | ----------- |
| Tone     | Measured. Credible. Cutting through the noise of failed P2E. |
| Footage  | Shell wallet screen. Post-game reward animation. OKT balance. NFT asset grid. Base blockchain explorer. |
| Music    | Returns to minimal. Single synth. Deliberate. |

---

### Script

**[OPEN: A montage of play-to-earn game headlines. Fast cuts. Price crash charts. "Exit scam." "Token down 99%." "Servers shut down." Each headline appears then dissolves.]**

**[Cut to black.]**

> **NARRATOR:**
> *"Play-to-earn had a real idea.*
> *If you're going to spend 100 hours in a game,
> shouldn't some of that value come back to you?*
>
> *The idea was right.*
> *Almost everything built around it was wrong."*

**[Pause.]**

> **NARRATOR:**
> *"The mistakes were predictable.*
> *Token with infinite mint. No real game underneath. Rewards designed to attract speculators, not players.*
> *The moment the speculators left, the game died.*
> *Because there was no game.*
> *There was only the token."*

**[Cut to: okama-shell. Settings → Wallet screen.]**

```
Wallet
──────────────────────────────────
Address  0x4a3f...c821
Balance  0.012 ETH
OKT      2,450 OKT
Assets   7 NFTs
──────────────────────────────────
```

> **NARRATOR:**
> *"OkamaOS does this differently.*
> *Radically differently.*
> *The wallet lives on the device itself.*
> *Your private key is encrypted with your PIN.*
> *No browser. No MetaMask. No seed phrase in a notes app.*
> *It's in the OS.*
> *Like the controller driver.*
> *Like the audio system.*
> *It's infrastructure — not a feature."*

**[Cut to: VOID STRIKER gameplay. High score hit. Post-game screen.]**

> **NARRATOR:**
> *"When a game session ends,*
> *the OS checks whether the player hit the score threshold defined in the game's manifest.*
> *If they did — the OS signs a reward claim with the on-device key.*
> *Posts it to the relay.*
> *The relay verifies the score.*
> *OKToken is minted to the player's address.*
> *On Base. The Ethereum L2.*
> *In under five seconds."*

**[Reward sequence animation: score verification → signature → relay → mint → wallet balance increments.]**

> **NARRATOR:**
> *"No speculative tokenomics.*
> *Fixed supply. One billion OKT. That's all there will ever be.*
> *Minted only by verified score claims.*
> *Earned. Not airdropped. Not pre-mined. Earned.*
>
> *And the in-game assets?*
> *ERC-1155 NFTs on Base.*
> *One asset. Works across every game that supports it.*
> *The game can't revoke it.*
> *The platform can't take it.*
> *It's in your wallet.*
> *It's yours."*

**[Portal marketplace: NFT asset ownership view. Token ID. Owned status. Cross-game compatible.]**

> **NARRATOR:**
> *"This is what play-to-earn should have been.*
> *A real game first.*
> *A real economy second.*
> *Built into the OS.*
> *So neither one can exist without the other."*

**[TITLE CARD: THE CONSOLE NOBODY MADE — Episode 4: The Wallet]**

**[Fade to black. End card: okamaos.zyntrix.solutions]**

---

### LinkedIn Post — EP 4

---

> **Play-to-earn had one real problem.**
>
> It wasn't the blockchain.
>
> It was that there was no game.
>
> A token bolted onto a browser tab isn't a game economy. It's a spreadsheet with animations.
>
> When speculators left — and they always leave — there was nothing underneath.
>
> We built it the other way around.
>
> Game first. Economy second.
>
> The OkamaOS wallet lives on the device itself. Your key, encrypted with your PIN. No browser extension. No seed phrase in a notes app.
>
> When a game ends, the OS checks your score against the threshold the developer set in three lines of JSON.
>
> If you hit it: the OS signs the claim, submits it to the relay, and OKT is minted to your address on Base.
>
> Fixed supply. 1 billion OKT. That's all there will ever be.
>
> Minted only by verified score claims.
>
> Not airdropped. Not pre-mined.
>
> **Earned.**
>
> Episode 4 of 6 is live.
>
> [▶ Watch: THE CONSOLE NOBODY MADE — Ep 4: The Wallet]
>
> ---
>
> The play-to-earn model isn't broken because of crypto. It's broken because the games weren't worth playing.
>
> Do you agree?
>
> #Web3 #Gaming #PlayToEarn #Blockchain #Base #OKToken #OkamaOS #BuildInPublic #NFT #GameFi

---
---

## EP 5 — "THE STUDIO"

### Episode Brief

| Runtime  | 3–4 minutes |
| -------- | ----------- |
| Tone     | Hopeful. Empowering. The tool that lowers the barrier. |
| Footage  | Okama Studio — AI chat generating a game. Monaco editor. Pyodide preview running. `.ok` package being built. |
| Music    | Warmer. More melodic. Forward-feeling. |

---

### Script

**[OPEN: A child's hands on a keyboard. Close-up on the screen: a Python file, `main.py`.]**

> **NARRATOR:**
> *"We kept coming back to the same question.*
> *What if someone wanted to build a game for this platform?*
> *What if they were 14?*
> *What if they'd never written a line of code?"*

**[Cut to: Okama Studio in a browser. The 3-panel IDE: file tree, Monaco editor, AI chat.]**

> **NARRATOR:**
> *"Okama Studio is a browser-based game development environment.*
> *Built specifically for OkamaOS.*
> *Python. pygame. The same stack the OS runs on.*
> *You write the game in your browser.*
> *You export it as a `.ok` package.*
> *You drop it on the console.*
> *That's the full pipeline."*

**[AI chat panel: user types "make a top-down shooter with controller support". AI streams code line by line into the editor.]**

> **NARRATOR:**
> *"The AI doesn't just suggest.*
> *It writes.*
> *Full files. Working code. Immediately runnable.*
> *Constrained to the OkamaOS game engine context.*
> *So everything it generates works on the platform.*
> *Out of the box.*
> *No configuration.*
> *No dependency hell."*

**[Pyodide preview panel: the generated game running in-browser. A top-down player sprite moving with WASD.]**

> **NARRATOR:**
> *"You can preview the game in the browser before you ever touch the console.*
> *Pyodide — Python running in WebAssembly —
> gives you a live canvas.*
> *See it working.*
> *Then package it.*
> *Then install it.*
> *Three clicks."*

**[Package builder: manifest editor, blockchain field: score threshold, OKT amount.]**

> **NARRATOR:**
> *"And when you're ready to add earning to your game —*
> *three fields in the manifest.*
> *Score threshold.*
> *Reward amount.*
> *The relay handles the rest.*
> *You just built a game that pays its players."*

**[Final shot: a `.ok` file being copied to a USB drive. Plugged into the console machine. Game appears in the Play list. Controller selects it. Launches.]**

> **NARRATOR:**
> *"We built the console.*
> *We built the games.*
> *We built the economy.*
> *Now we're handing you the tools.*
> *What you build is yours."*

**[TITLE CARD: THE CONSOLE NOBODY MADE — Episode 5: The Studio]**

**[Fade to black. End card: okamaos.zyntrix.solutions]**

---

### LinkedIn Post — EP 5

---

> **You shouldn't need a $200K computer science degree to make a game.**
>
> Or a team of 20.
>
> Or a $500/month engine license.
>
> We built Okama Studio because we believe the next great indie game might be made by a 14-year-old with a browser and an idea.
>
> It's a game development IDE built specifically for OkamaOS.
>
> Python. pygame. AI-assisted code generation. In-browser preview via Pyodide.
>
> You type what you want the game to do.
>
> The AI writes the code.
>
> You see it run in the browser.
>
> You export a `.ok` package.
>
> You plug a USB into the console.
>
> The game is on the platform.
>
> And if you want to add earning — three fields in a JSON manifest.
>
> Score threshold. Reward amount. Done.
>
> You just built a game that pays its players.
>
> The barrier to game creation should be imagination, not access.
>
> That's the platform we're building.
>
> Episode 5 of 6 is live.
>
> [▶ Watch: THE CONSOLE NOBODY MADE — Ep 5: The Studio]
>
> ---
>
> If someone handed you a tool like this at age 14 — what game would you have built?
>
> #GameDev #AI #IndieGames #OpenSource #OkamaOS #Python #BuildInPublic #EdTech #GamingCommunity

---
---

## EP 6 — "THE WAVE"

### Episode Brief

| Runtime  | 4–5 minutes |
| -------- | ----------- |
| Tone     | Reflective. Charged with possibility. The community moment. |
| Footage  | The hardware — diverse machines. Maps showing Africa, Europe, the US. Real users. The shell on real devices. Controllers in real hands. |
| Music    | Full score. The series theme, complete. Builds to a real ending. |

---

### Script

**[OPEN: A series of shots — slow, warm, almost meditative.]**

Old laptop. Powered on. Shell appears.

Mini PC on a shelf. Controller beside it.

A child's bedroom. A PC that cost less than the poster on the wall.

> **NARRATOR:**
> *"We called it First Wave.*
> *Because we needed a name for the people who would show up before the crowd.*
> *Before the marketing.*
> *Before the press.*
> *Before any of it was polished.*
> *The people who believed in the idea when it was still mostly terminal output."*

**[Cut to: a map of the world. Points of light appearing. Johannesburg. London. Lagos. Berlin. Toronto. São Paulo. Each one a device that has downloaded OkamaOS.]**

> **NARRATOR:**
> *"The hardware costs nothing.*
> *Or nearly nothing.*
> *That was always the point.*
> *Gaming shouldn't be a luxury.*
> *The experience of picking up a controller,
> booting straight into a game,
> not worrying about updates or configuration or drivers —
> that experience shouldn't cost five hundred dollars.*
> *It should cost whatever an old PC costs.*
> *Which is often: nothing."*

**[Cut to: the Game Store. Games downloading. New titles appearing in the catalog. The catalog growing.]**

> **NARRATOR:**
> *"The First Wave builds the catalog.*
> *Every developer who packages a game adds to what the next player finds when they open the store.*
> *Every player who earns OKT gives a developer a reason to keep building.*
> *The economy works because the community makes it work.*
> *Not because of the token.*
> *Because of the games.*
> *Because of the players.*
> *Because of the belief that gaming should be for everyone."*

**[Cut to: Okama Studio. A new project. An empty editor. A blank canvas.]**

> **NARRATOR:**
> *"We are at the beginning.*
> *The marketplace isn't open yet.*
> *The leaderboard isn't live yet.*
> *The AI agent isn't connected yet.*
> *Cross-game assets are on the roadmap.*
> *Studio is getting more powerful every week.*
>
> *But the OS boots.*
> *The games run.*
> *The wallet earns.*
> *And the community is forming.*
>
> *That's enough to start."*

**[Long pause. Single red pulse.]**

> **NARRATOR:**
> *"This is the console nobody made.*
> *Until we did.*
> *Now it's yours."*

**[TITLE CARD: THE CONSOLE NOBODY MADE — Episode 6: The Wave]**

**[FINAL CARD — holds for 5 seconds:]**

```
FIRST WAVE — Early access is open.

okamaos.zyntrix.solutions

Build. Play. Earn.
```

**[Fade to black.]**

---

### LinkedIn Post — EP 6

---

> **We called it First Wave.**
>
> Because we needed a name for the people who believe in something before it's finished.
>
> Before the marketing. Before the press. Before the launch event.
>
> The people who show up when it's still mostly terminal output and a dream about framebuffers.
>
> OkamaOS isn't finished.
>
> The marketplace isn't open.
> The leaderboard isn't live.
> The cross-game asset registry is still on the roadmap.
>
> But the OS boots.
>
> The games run.
>
> The wallet earns.
>
> And people on every continent are plugging in controllers and playing.
>
> On hardware that cost them nothing.
>
> Having the experience that used to cost $500.
>
> That was always the point.
>
> Gaming shouldn't be a luxury.
>
> This is the last episode of a 6-part series documenting what we built and why.
>
> If any part of this resonates —
>
> If you've ever had a piece of hardware that deserved better,
> or a game idea that deserved a platform,
> or a player in your life who deserved access —
>
> First Wave is open.
>
> [▶ Watch: THE CONSOLE NOBODY MADE — Ep 6: The Wave]
>
> okamaos.zyntrix.solutions
>
> ---
>
> What does "gaming for everyone" actually mean to you?
>
> I'm asking seriously.
>
> #OkamaOS #BuildInPublic #GamingForEveryone #Linux #Web3 #IndieGaming #FirstWave #Community #GameDev #OpenSource

---
---

## Series Production Master Checklist

### Pre-Production
- [ ] Confirm founder / lead engineer as on-camera narrator or VO talent
- [ ] Record all VO in one session — consistent voice, consistent room treatment
- [ ] Capture all shell/studio screen recordings at 1920×1080 minimum
- [ ] Capture VOID STRIKER boss fight, high score moment, reward claim animation
- [ ] Capture PGDRIVE procedural city race clip (30+ seconds)
- [ ] Capture Okama Studio: AI chat → code generation → Pyodide preview → package build
- [ ] Capture Wallet screen: address, balances, NFT count, post-game reward sequence
- [ ] B-roll: real hardware (laptop, mini PC, desktop) being powered on
- [ ] Commission or license series music suite (ambient → driving → warm → full score)

### Post-Production
- [ ] Each episode: cold open (no title for first 10–15s), then episode title card
- [ ] Consistent lower-third for URL: `okamaos.zyntrix.solutions`
- [ ] Color grade: match series palette (dark, red accent, cyan highlight)
- [ ] SRT captions for every episode
- [ ] Export: 16:9 master (YouTube) + 9:16 vertical cut (TikTok/Reels) per episode
- [ ] Thumbnail: dark bg, red Okama mark, episode number + title, no stock photos

### LinkedIn Cadence
- [ ] Week 1: EP 1 — The Problem
- [ ] Week 2: EP 2 — The Boot
- [ ] Week 3: EP 3 — The Game
- [ ] Week 4: EP 4 — The Wallet
- [ ] Week 5: EP 5 — The Studio
- [ ] Week 6: EP 6 — The Wave
- [ ] Post at 08:00–09:00 local time Tuesday or Wednesday (peak LinkedIn engagement)
- [ ] Reply to every comment in the first 60 minutes to trigger algorithm boost
- [ ] Pin each post to profile for the duration of the campaign

### Community Activation
- [ ] Create Discord server before EP 1 drops — invite link in all posts
- [ ] "First Wave" role for anyone who joins during the 6-week campaign
- [ ] Weekly AMA thread in Discord tied to each episode's theme
- [ ] Tie First Wave membership to future OKT airdrop or NFT badge (makes joining tangible)

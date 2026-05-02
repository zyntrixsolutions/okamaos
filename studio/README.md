# Okama Studio

Okama Studio is the creator app for the OkamaOS ecosystem. Build games in the
browser, preview Python/Pygame projects, export `.ok` packages, and publish
games to a local dev-store URL that OkamaOS can install from.

## Ecosystem Links

- OkamaOS Pages portal: <https://zyntrixsolutions.github.io/okamaos/>
- OS downloads: <https://zyntrixsolutions.github.io/okamaos/#downloads>
- Beginner manual: <https://zyntrixsolutions.github.io/okamaos/docs/manual.md>
- Package docs: <https://zyntrixsolutions.github.io/okamaos/docs/packages.md>
- Dev Console docs: <https://zyntrixsolutions.github.io/okamaos/docs/dev-console.md>

Studio includes visible links back to the Pages portal so creators can download
the OS, read update instructions, and test exported packages on the console.

## Local Development

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Core Workflow

1. Create or open a project.
2. Build with the AI agent or edit files directly.
3. Preview the game in the browser.
4. Export a `.ok` package.
5. Install the package on OkamaOS by USB or Studio dev server.

## Dev Server Loop

1. Start Studio on a machine connected to the same LAN as OkamaOS.
2. Open a game project.
3. Publish the game to the dev server.
4. Copy the LAN catalog URL shown by Studio.
5. On OkamaOS, open Game Store.
6. Press X to enter a custom store URL.
7. Enter the Studio LAN URL and install the game.

## Version Tracking

- Studio version: `VERSION`
- Package metadata: `package.json` and `package-lock.json`
- Studio changelog: `CHANGELOG.md`
- Studio roadmap: `ROADMAP.md`

Keep all four aligned when the Studio user experience changes.

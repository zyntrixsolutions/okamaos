# Changelog

## 0.3.4 - 2026-05-02

- Migrated dev server storage from local filesystem to Vercel Blob storage.
- Fixed ENOENT error when publishing games in deployed environments.
- Dev server now works from any URL including okamaos.zyntrix.solutions.
- Updated DevServerPanel UI to reflect cloud storage instead of local storage.

## 0.3.3 - 2026-05-02

- Added keyboard and mouse event routing from the browser preview canvas into pygame events and pressed-state APIs.
- Fixed Stop so it signals the running Pyodide game loop, clears preview input state, and allows clean reruns.

## 0.3.2 - 2026-05-02

- Fixed browser preview crashes when pygame draw APIs receive `pygame.Rect` objects.
- Improved preview rendering for offscreen surfaces, alpha fills, text surfaces, and blits so generated games display more consistently in Pyodide preview mode.
- Added a fullscreen preview toggle for expanding and inspecting the game canvas.

# Roadmap

## Preview Runtime

- [x] Create issue and branch tracking for preview runtime fixes.
- [x] Accept pygame `Rect` objects and rect-like values across preview draw APIs.
- [x] Render offscreen surfaces, font surfaces, alpha overlays, and blits without rebinding the main preview canvas.
- [x] Add a fullscreen toggle to expand the game preview canvas.
- [x] Track the shipped preview milestone in changelog and version files.
- [x] Route keyboard and mouse input from the browser canvas into pygame preview APIs.
- [x] Stop running Pyodide preview loops through a per-frame stop signal and cleanup path.

## Next

- [ ] Add automated browser smoke tests for generated pygame templates.
- [ ] Add gamepad event routing into the Pyodide pygame event queue.

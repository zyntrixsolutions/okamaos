# OkamaOS Publishing Setup Guide

This guide explains how to set up the publishing repository so users can install updates and games.

## Current Status

The publishing infrastructure is **already configured** and ready to use:

### ✅ Already Configured

1. **GitHub Pages Workflow** - `.github/workflows/pages.yml` is configured to deploy the `pages/` directory
2. **OS Client Configuration** - `board/okamaos/rootfs-overlay/etc/okamaos/okama.conf` points to the correct URLs:
   - `UPDATE_FEED_URL=https://zyntrixsolutions.github.io/okamaos/updates/feed.json`
   - `APP_CATALOG_URL=https://zyntrixsolutions.github.io/okamaos/catalog/apps.json`
3. **Game Catalog** - `pages/catalog/apps.json` contains the demo game listing
4. **Update Feed** - `pages/updates/feed.json` contains OS update information
5. **Game Packages** - `pages/downloads/games/` contains built `.ok` files:
   - `com.okamalabs.demo-0.1.0.ok`
   - `com.okamalabs.demo-0.1.1.ok`
6. **Update Client** - The OS has `okama-update` and `updates.py` that can fetch from the feed

## Setup Steps

### 1. Enable GitHub Pages

In your GitHub repository settings:

1. Go to **Settings** > **Pages**
2. Under **Source**, select **GitHub Actions** (not "Deploy from a branch")
3. Click **Save**

### 2. Deploy the Pages

The workflow is already configured to trigger on push to `main` when `pages/` changes:

```bash
# If pages/ has changes, push to main
git add pages/
git commit -m "Update games and updates catalog"
git push origin main
```

Or manually trigger the workflow:
1. Go to **Actions** tab in GitHub
2. Select **Deploy OkamaOS Pages** workflow
3. Click **Run workflow**

### 3. Verify Deployment

After deployment, verify the URLs are accessible:

- Update feed: https://zyntrixsolutions.github.io/okamaos/updates/feed.json
- App catalog: https://zyntrixsolutions.github.io/okamaos/catalog/apps.json
- Demo game: https://zyntrixsolutions.github.io/okamaos/downloads/games/com.okamalabs.demo-0.1.1.ok

## Adding New Games

### 1. Build the Game Package

```bash
# Using the provided script
./tools/create-ok-package.sh games/your-game build/your-game.ok
```

### 2. Copy to Downloads Directory

```bash
cp build/your-game.ok pages/downloads/games/
```

### 3. Calculate SHA256

```bash
sha256sum pages/downloads/games/your-game.ok
```

### 4. Add to Catalog

Edit `pages/catalog/apps.json` and add your game entry:

```json
{
  "id": "com.yourcompany.yourgame",
  "name": "Your Game Name",
  "version": "1.0.0",
  "runtime": "okama-sdl2",
  "category": "Action",
  "status": "available",
  "tagline": "Short tagline for the game",
  "description": "Full description of the game",
  "download_url": "https://zyntrixsolutions.github.io/okamaos/downloads/games/your-game-1.0.0.ok",
  "manifest_url": "https://zyntrixsolutions.github.io/okamaos/catalog/manifests/com.yourcompany.yourgame.json",
  "sha256": "<SHA256 from step 3>",
  "size_bytes": <file size in bytes>,
  "min_os_version": "1.0.0",
  "min_ram_mb": 64,
  "target_fps": 30,
  "permissions": ["controller", "audio"],
  "age_rating": "Everyone",
  "featured": false
}
```

### 5. Copy Manifest

```bash
cp games/your-game/manifest.ok.json pages/catalog/manifests/com.yourcompany.yourgame.json
```

### 6. Deploy

```bash
git add pages/
git commit -m "Add new game: Your Game"
git push origin main
```

## Adding OS Updates

### 1. Build A System Update Bundle

Use the repo helper to package CLI, shell, runtime library files, boot assets,
and config defaults into an installable `.okupdate` bundle:

```bash
python3 tools/create-okupdate-package.py \
  --version 1.0.2 \
  --codename "Safe System Update" \
  --summary "Runtime update with preserved games, saves, settings, and update history." \
  --output pages/updates/okamaos-v1.0.2.okupdate
```

The system updater backs up replaced files under
`/var/okamaos/updates/backups` and refuses to overwrite:

- `/var/okamaos/games`
- `/var/okamaos/saves`
- `/var/okamaos/logs`
- `/var/okamaos/cache`
- `/var/okamaos/controllers`
- `/var/okamaos/updates`
- `/etc/okamaos/parent.conf`
- `/etc/okamaos/devmode.conf`

Local `/etc/okamaos/okama.conf` values are merged instead of blindly
replaced. Version fields are updated, while existing local feed/catalog
overrides are preserved unless the user changes them.

### 2. Update Feed

Edit `pages/updates/feed.json` and update the `latest` section with the new
version, download URL, SHA-256, and byte size.

### 3. Deploy

```bash
git add pages/
git commit -m "Update OS feed to version X.Y.Z"
git push origin main
```

## Testing Updates

On an OkamaOS system or in QEMU:

```bash
# Check for updates
okama-update check
okama-update apply https://zyntrixsolutions.github.io/okamaos/updates/okamaos-v1.0.2.okupdate

# Install a game from the catalog
okama-cli install https://zyntrixsolutions.github.io/okamaos/downloads/games/com.okamalabs.demo-0.1.1.ok
```

## URL Configuration

If you need to change the base URL (e.g., for a different repository or domain), update these files:

1. `board/okamaos/rootfs-overlay/etc/okamaos/okama.conf` - UPDATE_FEED_URL and APP_CATALOG_URL
2. `usr/lib/okamaos/config.py` - DEFAULT_UPDATE_FEED_URL and DEFAULT_APP_CATALOG_URL
3. `usr/lib/okamaos/updates.py` - DEFAULT_UPDATE_FEED_URL and DEFAULT_APP_CATALOG_URL
4. `pages/catalog/apps.json` - download_url and manifest_url for all apps
5. `pages/updates/feed.json` - download_url
6. `pages/app.js` - download_url and manifest_url references

Then rebuild the OS image to apply the configuration changes.

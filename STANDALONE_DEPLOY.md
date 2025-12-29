# Standalone Client Deployment Guide

Build the client for deployment to GitHub Pages or itch.io.

## Quick Start

1. **Build the standalone client:**
   ```bash
   ./build-standalone.sh
   ```
2. **Deploy `client/dist/`** to GitHub Pages or itch.io
3. **Users will be prompted** to enter the server URL when they first load the app

## Building

### Basic Build

```bash
./build-standalone.sh
```

**No server URL needed!** The app will prompt users to enter the server URL on first load.

This will:
- Build the shared package
- Build the client (no server URL needed at build time)
- Output everything to `docs/` folder (ready for GitHub Pages)

### How It Works

When users first visit the deployed site:
1. They'll see a prompt asking for the server URL (Cloudflare tunnel URL)
2. The URL is saved in their browser's localStorage
3. They won't need to enter it again unless they clear browser data
4. They can change the server URL anytime from the lobby

### What Gets Built

The build creates a complete static website in `client/dist/`:
- `index.html` - Main HTML file
- `assets/` - JavaScript and CSS bundles
- All files needed to run the game

## Deployment Options

### GitHub Pages

1. **Build the client:**
   ```bash
   ./build-standalone.sh
   ```
   This creates a `docs/` folder in your repository root.

2. **Commit and push:**
   ```bash
   git add docs/
   git commit -m "Deploy to GitHub Pages"
   git push
   ```

3. **Enable GitHub Pages:**
   - Go to repository Settings > Pages
   - Source: **Deploy from a branch**
   - Branch: **main** (or your default branch)
   - Folder: **/docs**
   - Save

4. **Your site will be live at:**
   - `https://yourusername.github.io/repo-name`

See [GITHUB_PAGES.md](./GITHUB_PAGES.md) for detailed instructions.

### itch.io

1. **Build the client:**
   ```bash
   ./build-standalone.sh
   ```

2. **Create zip file:**
   ```bash
   cd docs
   zip -r ../culinary-card-game.zip .
   cd ..
   ```

3. **Upload to itch.io:**
   - Go to your itch.io project
   - Upload `culinary-card-game.zip`
   - Set as HTML5 game
   - Configure embed settings

## Server Configuration

**Important:** Your server must allow CORS from your deployment URL.

Update your server's `CORS_ORIGIN` environment variable:

```bash
# In server/.env or when running server
CORS_ORIGIN=https://yourusername.github.io,https://yourgame.itch.io
```

Or for testing, allow all origins:
```bash
CORS_ORIGIN=*
```

## Testing

After building, test locally:

```bash
cd client/dist
python3 -m http.server 8000
# Or use any static file server
```

Then open http://localhost:8000 and verify it connects to your server.

## Troubleshooting

**Client can't connect to server?**
- Check that `VITE_SERVER_URL` is set correctly in the build
- Verify server is running and accessible
- Check server CORS settings include your deployment URL
- Check browser console for connection errors

**CORS errors?**
- Update server `CORS_ORIGIN` to include your deployment URL
- Restart server after changing CORS settings
- For testing, use `CORS_ORIGIN=*`

**Build fails?**
- Make sure all dependencies are installed: `npm run install:all`
- Check that shared package builds: `npm run build:shared`
- Verify Node.js version is 18+

## Notes

- The server URL is baked into the JavaScript at build time
- If you change the server URL, rebuild the client
- The built client is completely static - no server needed for the frontend
- All game logic runs on your separate game server


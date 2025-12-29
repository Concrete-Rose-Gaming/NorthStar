# itch.io Deployment Guide

## Prerequisites

1. itch.io account
2. Created a new project on itch.io
3. Cloudflare Tunnel URL is available
4. Server CORS configured

## Setup Steps

### Step 1: Build and Zip Client

Run the deployment script:
```bash
./deploy-itch-io.sh
```

This will:
1. Build the client with your server URL
2. Create a zip file: `culinary-card-game-itch-io.zip`

### Step 2: Upload to itch.io

1. Go to your itch.io project page
2. Click **"Edit project"** (or create new project)
3. Scroll to **"Uploads"** section
4. Click **"Upload files"** or drag and drop
5. Upload `culinary-card-game-itch-io.zip`
6. Wait for upload to complete

### Step 3: Configure as HTML5 Game

1. In the uploads section, find your zip file
2. Click **"Edit"** on the zip file
3. Set **"Kind"** to: **"HTML"**
4. Set **"Embed options"**:
   - **Width**: `1280` (or your preferred width)
   - **Height**: `720` (or your preferred height)
   - **Fullscreen button**: ✓ (recommended)
5. Click **"Save"**

### Step 4: Set as Main File (Optional)

If you want this to be the default file:
1. Go to **"Edit project"** > **"Embed & assets"**
2. Set **"Embed game"** to your uploaded HTML file
3. Save

### Step 5: Get Your itch.io URL

Your game URL will be:
- `https://yourusername.itch.io/your-game-name`

Or if you set a custom domain:
- `https://your-custom-domain.com`

### Step 6: Update Server CORS

Add your itch.io URL to server's `CORS_ORIGIN`:

```bash
# In server/.env
CORS_ORIGIN=https://your-tunnel-url.trycloudflare.com,https://yourusername.github.io,https://yourgame.itch.io
```

**Important**: Include the full URL with `https://` and no trailing slash.

Restart the server after updating.

## Testing

1. Visit your itch.io game page
2. Click **"Run game"** or **"Play"**
3. The game should load and connect to your server
4. Check browser console for any errors

## Updating Your Game

To update the game on itch.io:

1. Make changes to your code
2. Run `./deploy-itch-io.sh` again
3. Upload the new zip file to itch.io
4. Replace the old file or upload as a new version
5. itch.io will serve the new version

## Troubleshooting

**Game won't load?**
- Check browser console for errors
- Verify server is running
- Check that CORS includes your itch.io URL
- Ensure tunnel URL is correct in `.env.production`

**CORS errors?**
- Verify itch.io URL is in server's `CORS_ORIGIN`
- Include `https://` protocol
- No trailing slash
- Restart server after updating CORS

**Connection timeout?**
- Check that Cloudflare Tunnel is running
- Verify tunnel URL is correct
- Check server logs for errors

**Game loads but can't connect?**
- Check browser console for WebSocket errors
- Verify server is accessible via tunnel URL
- Check that Socket.io is working on server

## itch.io Project Settings Tips

**Recommended settings:**
- **Visibility**: Public (or Draft for testing)
- **Classification**: Game > Card Game
- **Tags**: Add relevant tags (card game, multiplayer, etc.)
- **Embed dimensions**: 1280x720 or 1920x1080
- **Fullscreen**: Enable fullscreen button

## File Size Limits

- itch.io free accounts: 1GB per file
- Your game should be well under this limit
- If zip is too large, check for unnecessary files in `client/dist`


# Client Build Guide

## Building for Production

### Step 1: Set Server URL

Create `client/.env.production`:
```bash
VITE_SERVER_URL=https://your-tunnel-url.trycloudflare.com
```

Replace `your-tunnel-url` with your actual Cloudflare Tunnel URL.

### Step 2: Build

**Option A: Using the build script**
```bash
./build-client.sh
```

**Option B: Manual build**
```bash
# Build shared package first
npm run build:shared

# Build client
cd client
npm run build
```

### Step 3: Verify Build

Check that `client/dist/` contains:
- `index.html`
- `assets/` folder with JavaScript and CSS files

### Step 4: Test Locally (Optional)

```bash
cd client
npm run preview
```

Open http://localhost:4173 and verify the game connects to your server.

## Important Notes

- **Build-time variable**: `VITE_SERVER_URL` is baked into the JavaScript at build time
- **Rebuild required**: If you change the server URL, you must rebuild the client
- **Environment file**: `.env.production` is only used during `npm run build`, not in development

## Troubleshooting

**Build fails?**
- Make sure `client/.env.production` exists
- Check that `VITE_SERVER_URL` is set correctly
- Ensure shared package is built: `npm run build:shared`

**Game can't connect to server?**
- Verify the tunnel URL in `.env.production` is correct
- Check that the server is running
- Verify CORS is configured on the server
- Check browser console for connection errors


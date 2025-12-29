# Deployment Guide

This guide covers how to deploy the Culinary Card Game to various hosting platforms.

## Important Note

This game requires **both a client (frontend) and server (backend)** because it uses Socket.io for real-time multiplayer. itch.io only hosts static HTML5 games, so you'll need to:

1. Deploy the server to a hosting service (Railway, Render, Heroku, etc.)
2. Deploy the client to itch.io or another static hosting service
3. Configure the client to connect to your deployed server

## Quick Start: Local Play

The easiest way to play right now is locally:

```bash
npm run install:all
npm run dev
```

Then open http://localhost:3000 in your browser.

## Deployment Options

### Option 1: Railway (Recommended - Easy Server + Client)

Railway can host both your server and client together.

1. **Install Railway CLI**:
```bash
npm install -g @railway/cli
railway login
```

2. **Deploy**:
```bash
railway init
railway up
```

3. **Set environment variables** in Railway dashboard:
   - `CORS_ORIGIN`: Your Railway app URL (e.g., `https://your-app.railway.app`)
   - `PORT`: Railway will set this automatically

4. **Access your game** at the Railway-provided URL

### Option 2: Render (Free Tier Available)

#### Deploy Server:

1. Go to [render.com](https://render.com) and create a new Web Service
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `cd server && npm install && npm run build`
   - **Start Command**: `cd server && npm start`
   - **Environment Variables**:
     - `CORS_ORIGIN`: Your client URL (e.g., `https://your-client.onrender.com` or itch.io URL)
     - `NODE_ENV`: `production`

#### Deploy Client:

1. Create a new Static Site on Render
2. Configure:
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/dist`
   - **Environment Variables**:
     - `VITE_SERVER_URL`: Your server URL (e.g., `https://your-server.onrender.com`)

### Option 3: itch.io + Separate Server Hosting

Since itch.io only hosts static files, you need to:

1. **Deploy server** to Railway/Render/Heroku (see Option 1 or 2)

2. **Build client**:
```bash
cd client
npm install
npm run build
```

3. **Update server URL** in the built client:
   - Edit `client/dist/assets/*.js` files (or better, use environment variable before building)
   - Or create a `.env.production` file in `client/`:
```
VITE_SERVER_URL=https://your-server-url.com
```

4. **Upload to itch.io**:
   - Zip the `client/dist` folder
   - Go to your itch.io project
   - Upload the zip file
   - Set it as HTML5 game

5. **Update server CORS** to allow your itch.io URL:
   - Set `CORS_ORIGIN` environment variable to your itch.io game URL

### Option 4: Vercel (Client) + Railway/Render (Server)

#### Deploy Client to Vercel:

1. Install Vercel CLI: `npm install -g vercel`
2. In the project root:
```bash
vercel
```
3. Configure:
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variable**: `VITE_SERVER_URL` = your server URL

#### Deploy Server:

Follow Option 1 (Railway) or Option 2 (Render) for server deployment.

### Option 5: Netlify (Client) + Separate Server

Similar to Vercel:

1. Connect GitHub repo to Netlify
2. Configure:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist`
   - **Environment variable**: `VITE_SERVER_URL` = your server URL

## Environment Variables

### Client (.env or .env.production)

```env
VITE_SERVER_URL=https://your-server-url.com
```

### Server

```env
PORT=3001
CORS_ORIGIN=https://your-client-url.com,https://your-itch-io-url.itch.io
NODE_ENV=production
```

For multiple origins, separate with commas: `CORS_ORIGIN=https://site1.com,https://site2.com`

## Building for Production

```bash
# Build everything
npm run build

# Or build individually
npm run build:shared
npm run build:server
npm run build:client
```

## Testing Production Build Locally

```bash
# Build everything
npm run build

# Terminal 1 - Start server
cd server
npm start

# Terminal 2 - Serve client
cd client
npm run preview
```

## Troubleshooting

### CORS Errors

If you see CORS errors, make sure:
1. Your server's `CORS_ORIGIN` includes your client URL
2. URLs match exactly (including `https://` vs `http://`)

### Socket Connection Failed

1. Check that your server is running and accessible
2. Verify `VITE_SERVER_URL` is set correctly in your client
3. Check server logs for connection errors
4. Ensure WebSocket connections are allowed by your hosting provider

### Build Errors

1. Make sure all dependencies are installed: `npm run install:all`
2. Check that TypeScript compiles: `npm run build:shared`
3. Verify Node.js version is 18+

## Free Hosting Options Summary

| Service | Client | Server | Free Tier |
|---------|--------|--------|-----------|
| Railway | ✅ | ✅ | Limited |
| Render | ✅ | ✅ | Yes |
| Vercel | ✅ | ❌ | Yes |
| Netlify | ✅ | ❌ | Yes |
| itch.io | ✅ | ❌ | Yes |
| Heroku | ✅ | ✅ | No (paid only) |

## Recommended Setup for itch.io

1. **Server**: Deploy to Render (free) or Railway
2. **Client**: Build and upload to itch.io
3. **Configuration**: Set `VITE_SERVER_URL` before building client, and `CORS_ORIGIN` on server

This gives you a free, playable game on itch.io with multiplayer support!


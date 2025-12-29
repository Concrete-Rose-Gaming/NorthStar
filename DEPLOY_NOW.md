# Deploy Your Game Now! 🚀

This guide will help you deploy your game to a live server so you can play it online or on itch.io.

## Option 1: Railway (Easiest - Recommended) ⭐

Railway can host both your server and client together, or just the server.

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway

```bash
railway login
```

This will open your browser to authenticate.

### Step 3: Deploy Server

```bash
# Initialize Railway project
railway init

# Deploy the server
railway up
```

### Step 4: Configure Environment Variables

After deployment, Railway will give you a URL like `https://your-app.railway.app`

1. Go to your Railway dashboard: https://railway.app
2. Click on your project
3. Go to "Variables" tab
4. Add these environment variables:
   - `CORS_ORIGIN`: Your client URL (e.g., `https://your-client.railway.app` or your itch.io URL)
   - `PORT`: Railway sets this automatically, but you can verify it's there

### Step 5: Get Your Server URL

Railway will provide a URL for your server. Copy this URL - you'll need it for the client.

### Step 6: Deploy Client (for Railway or itch.io)

**For Railway (hosting both):**
- Create a new service in the same project
- Set root directory to `client`
- Build command: `npm install && npm run build`
- Start command: `npx serve dist` (or use Railway's static site option)

**For itch.io:**
1. Set the server URL before building:
   ```bash
   cd client
   echo "VITE_SERVER_URL=https://your-server-url.railway.app" > .env.production
   ```
2. Build the client:
   ```bash
   npm run build
   ```
3. Zip the `client/dist` folder
4. Upload to itch.io as an HTML5 game
5. Update Railway's `CORS_ORIGIN` to include your itch.io URL

---

## Option 2: Render (Free Tier Available) 🆓

### Step 1: Create Render Account

Go to https://render.com and sign up (free tier available).

### Step 2: Deploy Server

1. Click "New +" → "Web Service"
2. Connect your GitHub repository (or use Render's CLI)
3. Configure:
   - **Name**: `culinary-card-game-server`
   - **Environment**: `Node`
   - **Build Command**: `cd shared && npm install && npm run build && cd ../server && npm install && npm run build`
   - **Start Command**: `cd server && npm start`
   - **Plan**: Free

4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: Leave empty for now (we'll update after client deployment)

5. Click "Create Web Service"

6. Wait for deployment and copy your server URL (e.g., `https://culinary-card-game-server.onrender.com`)

### Step 3: Deploy Client to itch.io

1. Set server URL:
   ```bash
   cd client
   echo "VITE_SERVER_URL=https://your-server-url.onrender.com" > .env.production
   ```

2. Build:
   ```bash
   npm run build
   ```

3. Zip `client/dist` folder

4. Upload to itch.io:
   - Go to your itch.io project
   - Upload the zip file
   - Set as HTML5 game

5. Update Render server CORS:
   - Go back to Render dashboard
   - Edit your server's environment variables
   - Set `CORS_ORIGIN` to your itch.io URL (e.g., `https://yourgame.itch.io`)

---

## Option 3: Quick Test with ngrok (Temporary)

If you want to test quickly without deploying:

1. Install ngrok: https://ngrok.com/download
2. Start your server locally:
   ```bash
   npm run dev:server
   ```
3. In another terminal, expose it:
   ```bash
   ngrok http 3001
   ```
4. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
5. Update client:
   ```bash
   cd client
   echo "VITE_SERVER_URL=https://abc123.ngrok.io" > .env
   npm run dev
   ```
6. Update server CORS (in `server/src/index.ts` temporarily) or set `CORS_ORIGIN` env var

**Note**: ngrok URLs expire and are for testing only!

---

## After Deployment Checklist ✅

- [ ] Server is running and accessible
- [ ] Client can connect to server (check browser console)
- [ ] CORS is configured correctly
- [ ] Environment variables are set
- [ ] Game loads and you can join lobby
- [ ] AI games work
- [ ] Multiplayer works (test with two browsers)

## Troubleshooting

**"Cannot connect to server"**
- Check server URL is correct in client
- Verify server is running (check deployment logs)
- Check CORS settings include your client URL

**"CORS error"**
- Make sure `CORS_ORIGIN` includes your exact client URL
- Include protocol (`https://`) in CORS_ORIGIN
- For multiple origins, separate with commas: `https://site1.com,https://site2.com`

**"Socket connection failed"**
- Verify WebSocket connections are allowed by your hosting provider
- Check server logs for errors
- Ensure port is correct (most hosts set PORT automatically)

## Need Help?

- Railway docs: https://docs.railway.app
- Render docs: https://render.com/docs
- itch.io upload guide: https://itch.io/docs/creators/html5

Good luck! 🎮


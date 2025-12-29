# Automated Temporary Deployment

Quick setup for testing without permanent configuration.

## Quick Start

### Option 1: Fully Automated (Recommended)

Run the all-in-one script:
```bash
./auto-deploy-temp.sh
```

This will:
1. ✅ Build the server
2. ✅ Start the server on port 3001
3. ✅ Create a Cloudflare quick tunnel (no login needed!)
4. ✅ Extract the tunnel URL automatically
5. ✅ Update client `.env.production` with tunnel URL
6. ✅ Build the client

**That's it!** You'll get:
- Server running locally
- Public tunnel URL
- Client built and ready to deploy

### Option 2: Just Tunnel

If server is already running:
```bash
./start-temp-tunnel.sh
```

This starts a quick tunnel and displays the URL.

## How It Works

### Quick Tunnel (No Login Required)

Cloudflare's "quick tunnel" feature:
- ✅ **No login needed** - works immediately
- ✅ **No configuration** - just run the command
- ✅ **Automatic URL** - gets a URL instantly
- ⚠️ **Temporary** - URL changes when you restart
- ⚠️ **Public** - anyone with the URL can access

Perfect for:
- Testing deployments
- Quick demos
- Development
- Temporary sharing

### Permanent Tunnel (For Production)

For a permanent setup with a stable URL:
- Use the regular tunnel setup (see `CLOUDFLARE_SETUP.md`)
- Requires Cloudflare login
- URL stays the same
- Better for production

## Usage Examples

### Test Everything Locally
```bash
# Start automated deployment
./auto-deploy-temp.sh

# In another terminal, test the tunnel
curl https://your-tunnel-url.trycloudflare.com

# Or open in browser
# The script will show you the URL
```

### Deploy Client with Temporary URL
```bash
# Run auto-deploy
./auto-deploy-temp.sh

# Deploy to GitHub Pages (URL already configured)
# Or deploy to itch.io
./deploy-itch-io.sh
```

### Update Server CORS for Testing
```bash
# Allow all origins (for testing only!)
cd server
CORS_ORIGIN="*" npm start
```

## What You Get

After running `auto-deploy-temp.sh`:

1. **Server running** on `http://localhost:3001`
2. **Tunnel URL** like `https://xxxx-xxxx-xxxx.trycloudflare.com`
3. **Client built** in `client/dist/` with tunnel URL configured
4. **Ready to deploy** - just upload client/dist to GitHub Pages or itch.io

## Important Notes

### Temporary URLs
- URL changes every time you restart the tunnel
- Not suitable for production
- Great for testing and development

### CORS Configuration
For testing, you can use:
```bash
CORS_ORIGIN="*"  # Allows all origins (testing only!)
```

For production, specify exact URLs:
```bash
CORS_ORIGIN="https://your-tunnel-url.trycloudflare.com,https://yourusername.github.io"
```

### Server Auto-Start
The automated script starts the server in the background. To stop:
```bash
# Find and kill the process
lsof -ti:3001 | xargs kill
```

Or use the PID shown in the script output.

## Troubleshooting

### Tunnel URL Not Showing
```bash
# Check the log file
tail -f /tmp/cloudflared-tunnel.log

# Look for a line with "trycloudflare.com"
```

### Server Won't Start
```bash
# Check if port is in use
lsof -i :3001

# Check server logs
cat /tmp/culinary-server.log
```

### Client Build Fails
```bash
# Make sure .env.production exists
cat client/.env.production

# Should contain: VITE_SERVER_URL=https://...
```

## Next Steps After Auto-Deploy

1. **Test the tunnel:**
   ```bash
   curl https://your-tunnel-url.trycloudflare.com
   ```

2. **Deploy client:**
   - GitHub Pages: Push to repo (workflow will deploy)
   - itch.io: Run `./deploy-itch-io.sh`

3. **Update server CORS:**
   - Add your GitHub Pages/itch.io URLs to `CORS_ORIGIN`
   - Restart server

4. **For production:**
   - Set up permanent tunnel (see `CLOUDFLARE_SETUP.md`)
   - Use stable URLs
   - Configure proper CORS

## Comparison: Temporary vs Permanent

| Feature | Quick Tunnel | Permanent Tunnel |
|---------|-------------|------------------|
| Setup Time | Instant | ~5 minutes |
| Login Required | No | Yes |
| URL Stability | Changes on restart | Stays same |
| Best For | Testing/Dev | Production |
| Configuration | None | Config file needed |

Use quick tunnel for testing, permanent tunnel for production!


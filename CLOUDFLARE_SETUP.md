# Cloudflare Tunnel Setup Instructions

## Quick Setup (5 minutes)

### Step 1: Login to Cloudflare
```bash
cloudflared tunnel login
```
This will open your browser. Log in and authorize the tunnel.

### Step 2: Create Tunnel
```bash
cloudflared tunnel create culinary-game
```
Note the tunnel ID that's displayed (looks like: `xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### Step 3: Create Config File
Create `~/.cloudflared/config.yml` with:
```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: /home/northpi/.cloudflared/<YOUR_TUNNEL_ID>.json

ingress:
  - service: http://localhost:3001
```

### Step 4: Run Tunnel
```bash
cloudflared tunnel run culinary-game
```

The tunnel will give you a URL like: `https://xxxxx-xxxx-xxxx.trycloudflare.com`

**Save this URL** - you'll need it for:
- Setting `VITE_SERVER_URL` in client build
- Setting `CORS_ORIGIN` on server

## Alternative: Use Setup Script

Run the automated setup script:
```bash
./setup-cloudflare-tunnel.sh
```

## For Permanent Domain (Optional)

If you have a domain managed by Cloudflare:

1. Add a CNAME record:
   - Name: `game-server` (or whatever you want)
   - Target: `<TUNNEL_ID>.cfargotunnel.com`
   - Proxy: ON (orange cloud)

2. Update config.yml:
```yaml
tunnel: <TUNNEL_ID>
credentials-file: /home/northpi/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: game-server.yourdomain.com
    service: http://localhost:3001
  - service: http_status:404
```

## Testing

Once the tunnel is running, test it:
```bash
curl https://your-tunnel-url.trycloudflare.com
```

You should see a response from your server (or a 404 if the server isn't running).

## Next Steps

After tunnel is running:
1. Note the tunnel URL
2. Update server CORS (see configure-server-cors step)
3. Build client with tunnel URL (see build-client-production step)


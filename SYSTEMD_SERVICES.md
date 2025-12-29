# Systemd Services Setup Guide

## Overview

This guide sets up systemd services to automatically start your game server and Cloudflare Tunnel when your Raspberry Pi boots.

## Prerequisites

1. Server is built: `npm run build:server`
2. Cloudflare Tunnel is configured (see `CLOUDFLARE_SETUP.md`)
3. Server `.env` file exists with correct settings

## Installation

### Step 1: Prepare Environment File

Ensure `server/.env` exists with:
```bash
PORT=3001
CORS_ORIGIN=https://your-tunnel-url.trycloudflare.com,https://yourusername.github.io,https://yourgame.itch.io
NODE_ENV=production
```

### Step 2: Install Services

Run the installation script as root:
```bash
sudo ./install-services.sh
```

This will:
- Copy service files to `/etc/systemd/system/`
- Enable services to start on boot
- Reload systemd configuration

### Step 3: Start Services

Start the services now (optional - they'll start on boot):
```bash
sudo systemctl start culinary-game-server
sudo systemctl start cloudflared-tunnel
```

### Step 4: Verify Services

Check that services are running:
```bash
sudo systemctl status culinary-game-server
sudo systemctl status cloudflared-tunnel
```

Both should show "active (running)".

## Service Management

### Start Services
```bash
sudo systemctl start culinary-game-server
sudo systemctl start cloudflared-tunnel
```

### Stop Services
```bash
sudo systemctl stop culinary-game-server
sudo systemctl stop cloudflared-tunnel
```

### Restart Services
```bash
sudo systemctl restart culinary-game-server
sudo systemctl restart cloudflared-tunnel
```

### Check Status
```bash
sudo systemctl status culinary-game-server
sudo systemctl status cloudflared-tunnel
```

### View Logs
```bash
# Server logs
sudo journalctl -u culinary-game-server -f

# Tunnel logs
sudo journalctl -u cloudflared-tunnel -f

# Last 50 lines
sudo journalctl -u culinary-game-server -n 50
```

### Enable/Disable Auto-Start
```bash
# Enable (start on boot)
sudo systemctl enable culinary-game-server
sudo systemctl enable cloudflared-tunnel

# Disable (don't start on boot)
sudo systemctl disable culinary-game-server
sudo systemctl disable cloudflared-tunnel
```

## Troubleshooting

### Service Won't Start

1. **Check logs:**
   ```bash
   sudo journalctl -u culinary-game-server -n 50
   ```

2. **Verify paths:**
   - Service file expects: `/home/northpi/Documents/NorthStar/server`
   - Check that `server/dist/server/src/index.js` exists
   - Verify `.env` file exists in `server/` directory

3. **Check permissions:**
   ```bash
   ls -la /home/northpi/Documents/NorthStar/server/.env
   ls -la /home/northpi/Documents/NorthStar/server/dist/server/src/index.js
   ```

4. **Test manually:**
   ```bash
   cd /home/northpi/Documents/NorthStar/server
   node dist/server/src/index.js
   ```

### Tunnel Service Fails

1. **Check tunnel is configured:**
   ```bash
   cloudflared tunnel list
   ls -la ~/.cloudflared/
   ```

2. **Test tunnel manually:**
   ```bash
   cloudflared tunnel run culinary-game
   ```

3. **Check logs:**
   ```bash
   sudo journalctl -u cloudflared-tunnel -n 50
   ```

### Service Starts But Server Not Accessible

1. **Check server is listening:**
   ```bash
   sudo netstat -tlnp | grep 3001
   ```

2. **Check firewall:**
   ```bash
   sudo ufw status
   ```

3. **Verify tunnel is running:**
   ```bash
   sudo systemctl status cloudflared-tunnel
   ```

### Update Service Files

If you modify service files:
```bash
# Copy updated files
sudo cp culinary-game-server.service /etc/systemd/system/
sudo cp cloudflared-tunnel.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Restart services
sudo systemctl restart culinary-game-server
sudo systemctl restart cloudflared-tunnel
```

## Service Dependencies

- **Server service** starts after network is available
- **Tunnel service** starts after network is online and waits for network
- Server will restart automatically if it crashes (after 10 seconds)
- Tunnel will restart automatically if it crashes (after 10 seconds)

## Manual Override

If you need to run services manually instead:

1. **Disable services:**
   ```bash
   sudo systemctl disable culinary-game-server
   sudo systemctl disable cloudflared-tunnel
   ```

2. **Stop services:**
   ```bash
   sudo systemctl stop culinary-game-server
   sudo systemctl stop cloudflared-tunnel
   ```

3. **Run manually:**
   ```bash
   # Terminal 1 - Server
   cd /home/northpi/Documents/NorthStar/server
   npm start

   # Terminal 2 - Tunnel
   cloudflared tunnel run culinary-game
   ```


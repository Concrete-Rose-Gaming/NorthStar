# Deployment Setup Complete! 🎉

All deployment infrastructure is now in place. Follow these steps to get your game live.

## Quick Start Checklist

### 1. Set Up Cloudflare Tunnel
- [ ] Run: `cloudflared tunnel login`
- [ ] Run: `cloudflared tunnel create culinary-game`
- [ ] Create `~/.cloudflared/config.yml` (see `CLOUDFLARE_SETUP.md`)
- [ ] Test tunnel: `cloudflared tunnel run culinary-game`
- [ ] **Save your tunnel URL** (e.g., `https://xxxxx.trycloudflare.com`)

### 2. Configure Server
- [ ] Create `server/.env` with:
  ```bash
  PORT=3001
  CORS_ORIGIN=https://your-tunnel-url.trycloudflare.com
  NODE_ENV=production
  ```
- [ ] Build server: `npm run build:shared && npm run build:server`
- [ ] Test server: `cd server && npm start`

### 3. Build Client
- [ ] Create `client/.env.production` with:
  ```bash
  VITE_SERVER_URL=https://your-tunnel-url.trycloudflare.com
  ```
- [ ] Build client: `./build-client.sh`

### 4. Deploy Client

**GitHub Pages:**
- [ ] Set GitHub secret: `VITE_SERVER_URL` = your tunnel URL
- [ ] Enable GitHub Pages in repo settings
- [ ] Push to `main` branch (workflow auto-deploys)
- [ ] **Save your GitHub Pages URL**

**itch.io:**
- [ ] Run: `./deploy-itch-io.sh`
- [ ] Upload `culinary-card-game-itch-io.zip` to itch.io
- [ ] Configure as HTML5 game
- [ ] **Save your itch.io URL**

### 5. Update Server CORS
- [ ] Update `server/.env`:
  ```bash
  CORS_ORIGIN=https://your-tunnel-url.trycloudflare.com,https://yourusername.github.io,https://yourgame.itch.io
  ```
- [ ] Restart server

### 6. Set Up Auto-Start (Optional)
- [ ] Run: `sudo ./install-services.sh`
- [ ] Start services: 
  ```bash
  sudo systemctl start culinary-game-server
  sudo systemctl start cloudflared-tunnel
  ```

## Documentation Files

- **`CLOUDFLARE_SETUP.md`** - Cloudflare Tunnel setup
- **`SERVER_CONFIG.md`** - Server configuration guide
- **`CLIENT_BUILD.md`** - Client build instructions
- **`GITHUB_PAGES_SETUP.md`** - GitHub Pages deployment
- **`ITCH_IO_SETUP.md`** - itch.io deployment
- **`SYSTEMD_SERVICES.md`** - Auto-start services setup

## Scripts Available

- **`./build-client.sh`** - Build client for production
- **`./deploy-itch-io.sh`** - Build and zip for itch.io
- **`./setup-cloudflare-tunnel.sh`** - Automated tunnel setup (optional)
- **`./install-services.sh`** - Install systemd services

## Architecture

```
┌─────────────────┐
│  GitHub Pages   │ ───┐
│   (Client)      │    │
└─────────────────┘    │
                        │
┌─────────────────┐    │    ┌──────────────────┐    ┌──────────────┐
│    itch.io      │ ───┼───▶│ Cloudflare Tunnel │───▶│ Raspberry Pi │
│   (Client)      │    │    │  (Public URL)     │    │   (Server)   │
└─────────────────┘    │    └──────────────────┘    └──────────────┘
                       │                                    │
                       └──────────────────────────────────┘
                              (WebSocket connections)
```

## Testing Your Deployment

1. **Test GitHub Pages:**
   - Visit your GitHub Pages URL
   - Game should load and connect to server
   - Check browser console for errors

2. **Test itch.io:**
   - Visit your itch.io game page
   - Click "Play" or "Run game"
   - Game should load and connect to server

3. **Test Server:**
   ```bash
   curl https://your-tunnel-url.trycloudflare.com
   ```

4. **Test Multiplayer:**
   - Open game in two different browsers
   - Both should connect to same server
   - Try challenging each other

## Troubleshooting

**Server not accessible?**
- Check tunnel is running: `cloudflared tunnel run culinary-game`
- Check server is running: `sudo systemctl status culinary-game-server`
- Check logs: `sudo journalctl -u culinary-game-server -f`

**CORS errors?**
- Verify all URLs in `CORS_ORIGIN` are correct
- Include `https://` protocol
- No trailing slashes
- Restart server after changes

**Client can't connect?**
- Verify `VITE_SERVER_URL` in `.env.production` is correct
- Rebuild client after changing URL
- Check browser console for connection errors

**Services won't start?**
- Check logs: `sudo journalctl -u culinary-game-server -n 50`
- Verify paths in service files are correct
- Test running manually first

## Next Steps

1. **Monitor your server:**
   - Set up logging/monitoring
   - Check server health regularly
   - Monitor tunnel status

2. **Optimize:**
   - Consider using a custom domain for tunnel
   - Set up SSL certificates if needed
   - Optimize client build size

3. **Scale:**
   - If you get many players, consider server optimizations
   - Monitor resource usage on Raspberry Pi
   - Consider upgrading hardware if needed

## Support

If you encounter issues:
1. Check the relevant documentation file
2. Check service logs
3. Test components individually
4. Verify all URLs and configurations

Good luck with your deployment! 🚀


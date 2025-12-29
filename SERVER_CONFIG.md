# Server Configuration Guide

## Environment Variables

Create a `.env` file in the `server/` directory with:

```bash
PORT=3001
CORS_ORIGIN=https://your-tunnel-url.trycloudflare.com,https://yourusername.github.io,https://yourgame.itch.io
NODE_ENV=production
```

### CORS_ORIGIN Format

- **Comma-separated** list of allowed origins
- **Include protocol** (`https://`)
- **No trailing slashes**
- **Examples:**
  - Single origin: `CORS_ORIGIN=https://xxxxx.trycloudflare.com`
  - Multiple origins: `CORS_ORIGIN=https://xxxxx.trycloudflare.com,https://yourusername.github.io,https://yourgame.itch.io`

### Getting Your URLs

1. **Cloudflare Tunnel URL**: Run `cloudflared tunnel run culinary-game` and copy the URL
2. **GitHub Pages URL**: Usually `https://<username>.github.io` or `https://<username>.github.io/<repo-name>`
3. **itch.io URL**: Your game's itch.io URL, e.g., `https://yourgame.itch.io`

## Running the Server

### Development Mode
```bash
npm run dev:server
```

### Production Mode
```bash
# Build first
npm run build:shared
npm run build:server

# Then start
cd server
npm start
```

Or with environment variables:
```bash
cd server
PORT=3001 CORS_ORIGIN=https://your-url.com npm start
```

## Testing CORS

After starting the server, test from browser console on your client:
```javascript
fetch('https://your-server-url.com', {
  method: 'GET',
  headers: {
    'Origin': 'https://your-client-url.com'
  }
})
.then(r => console.log('CORS OK'))
.catch(e => console.error('CORS Error:', e));
```

## Troubleshooting

**CORS errors?**
- Check that `CORS_ORIGIN` includes your exact client URL
- Include `https://` protocol
- No trailing slashes
- Restart server after changing `.env`

**Port already in use?**
- Change `PORT` in `.env` or use `PORT=3002 npm start`
- Or stop the existing process: `lsof -ti:3001 | xargs kill`


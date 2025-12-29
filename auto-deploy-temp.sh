#!/bin/bash
# Fully automated temporary deployment
# Starts server, tunnel, builds client, and provides URLs

set -e

echo "🎮 Automated Temporary Deployment"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build server
echo "📦 Step 1: Building server..."
npm run build:shared > /dev/null 2>&1
npm run build:server > /dev/null 2>&1
echo -e "${GREEN}✓${NC} Server built"

# Step 2: Start server
echo ""
echo "🚀 Step 2: Starting server..."
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠${NC}  Port 3001 already in use. Using existing server."
else
    cd server
    PORT=3001 NODE_ENV=production CORS_ORIGIN="*" node dist/server/src/index.js > /tmp/culinary-server.log 2>&1 &
    SERVER_PID=$!
    cd ..
    sleep 2
    echo -e "${GREEN}✓${NC} Server started (PID: $SERVER_PID)"
fi

# Step 3: Start tunnel and capture URL
echo ""
echo "🌐 Step 3: Starting Cloudflare tunnel..."
echo "   (This will create a temporary tunnel - URL changes on restart)"
echo ""

# Start tunnel in background and capture output
TUNNEL_LOG="/tmp/cloudflared-tunnel.log"
rm -f "$TUNNEL_LOG"
cloudflared tunnel --url http://localhost:3001 > "$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!

# Wait for tunnel to establish and extract URL
echo "   Waiting for tunnel to establish..."
for i in {1..10}; do
    sleep 1
    TUNNEL_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1 || echo "")
    if [ ! -z "$TUNNEL_URL" ]; then
        break
    fi
done

if [ -z "$TUNNEL_URL" ]; then
    echo -e "${YELLOW}⚠${NC}  Could not automatically extract URL"
    echo "   The tunnel is running, but URL extraction failed."
    echo "   Check the output above or run:"
    echo "   tail -f $TUNNEL_LOG"
    echo ""
    echo "   Look for a line with 'trycloudflare.com'"
    echo "   Or manually check: ps aux | grep cloudflared"
    TUNNEL_URL="https://MANUAL-CHECK-REQUIRED.trycloudflare.com"
else
    echo -e "${GREEN}✓${NC} Tunnel URL: $TUNNEL_URL"
fi

# Step 4: Update client .env.production
echo ""
echo "📝 Step 4: Updating client configuration..."
mkdir -p client
echo "VITE_SERVER_URL=$TUNNEL_URL" > client/.env.production
echo -e "${GREEN}✓${NC} Client configured with tunnel URL"

# Step 5: Build client
echo ""
echo "🔨 Step 5: Building client..."
cd client
npm run build > /dev/null 2>&1
cd ..
echo -e "${GREEN}✓${NC} Client built"

# Summary
echo ""
echo "=================================="
echo "✅ Deployment Complete!"
echo "=================================="
echo ""
echo "Server URL: http://localhost:3001"
echo "Tunnel URL: $TUNNEL_URL"
echo ""
echo "Client built in: client/dist/"
echo ""
echo "Next steps:"
echo "1. Test server: curl $TUNNEL_URL"
echo "2. Deploy client/dist to GitHub Pages or itch.io"
echo "3. Update server CORS with your client URLs"
echo ""
echo "To stop:"
echo "  kill $TUNNEL_PID  # Stop tunnel"
if [ ! -z "$SERVER_PID" ]; then
    echo "  kill $SERVER_PID  # Stop server"
fi
echo ""
echo "Tunnel log: tail -f $TUNNEL_LOG"
echo "Server log: tail -f /tmp/culinary-server.log"


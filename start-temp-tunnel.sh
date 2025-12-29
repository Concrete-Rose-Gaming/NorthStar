#!/bin/bash
# Automated temporary Cloudflare Tunnel setup
# Uses quick tunnel (no login required, perfect for testing)

set -e

echo "🚀 Automated Temporary Cloudflare Tunnel Setup"
echo "================================================"
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared not found. Installing..."
    echo "   Visit: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
    exit 1
fi

# Check if server is running
if ! lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Server not running. Starting server..."
    
    # Build if needed
    if [ ! -f "server/dist/server/src/index.js" ]; then
        echo "   Building server..."
        npm run build:shared > /dev/null 2>&1
        npm run build:server > /dev/null 2>&1
    fi
    
    # Start server
    cd server
    PORT=3001 NODE_ENV=production CORS_ORIGIN="*" node dist/server/src/index.js > /tmp/culinary-server.log 2>&1 &
    SERVER_PID=$!
    cd ..
    
    sleep 2
    echo "   ✓ Server started (PID: $SERVER_PID)"
else
    echo "✓ Server already running"
    SERVER_PID=""
fi

# Start quick tunnel
echo ""
echo "🌐 Starting Cloudflare quick tunnel..."
echo "   (No login required - temporary tunnel)"
echo ""
echo "📋 The tunnel URL will appear below:"
echo "   Look for: https://xxxx-xxxx-xxxx.trycloudflare.com"
echo ""
echo "🛑 Press Ctrl+C to stop"
echo ""

# Use quick tunnel - it will print the URL to stderr
# We'll run it in foreground so user can see the URL
cloudflared tunnel --url http://localhost:3001 2>&1 | tee /tmp/cloudflared-output.log

#!/bin/bash
#
# Culinary Card Game - Startup Script
# Starts the game server and creates a public tunnel
#

cd "$(dirname "$0")"

# Colors for output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════╗"
echo "║      🎮 CULINARY CARD GAME 🎮             ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Shutting down...${NC}"
    kill $SERVER_PID 2>/dev/null
    kill $TUNNEL_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Kill any existing processes
echo -e "${YELLOW}Checking for existing processes...${NC}"
pkill -f "node.*dist/server/src/index.js" 2>/dev/null
pkill -f "cloudflared tunnel" 2>/dev/null

# Kill any process using port 3001
if lsof -ti:3001 > /dev/null 2>&1; then
    echo -e "${YELLOW}Killing process on port 3001...${NC}"
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    sleep 1
fi

sleep 1

# Build everything
echo -e "${GREEN}Building project...${NC}"

# Build shared package
echo "  Building shared package..."
cd shared
npm run build > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Failed to build shared package"
    exit 1
fi
cd ..

# Build server
echo "  Building server..."
cd server
npm run build > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Failed to build server"
    exit 1
fi
cd ..

# Build client
echo "  Building client..."
cd client
npm run build > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Failed to build client"
    exit 1
fi
cd ..

echo -e "${GREEN}✓ Build complete${NC}"

# Start the server
echo -e "${GREEN}Starting game server...${NC}"
cd server
PORT=3001 NODE_ENV=production node dist/server/src/index.js > /tmp/culinary-server.log 2>&1 &
SERVER_PID=$!
cd ..

# Wait for server to start
sleep 2

if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "❌ Server failed to start. Check /tmp/culinary-server.log"
    cat /tmp/culinary-server.log
    exit 1
fi

echo -e "${GREEN}✓ Game server running on port 3001${NC}"

# Start cloudflare tunnel
echo -e "${GREEN}Creating public tunnel...${NC}"
cloudflared tunnel --url http://localhost:3001 > /tmp/tunnel.log 2>&1 &
TUNNEL_PID=$!

# Wait for tunnel URL
echo "Waiting for tunnel..."
for i in {1..15}; do
    TUNNEL_URL=$(grep -o 'https://[^ ]*\.trycloudflare\.com' /tmp/tunnel.log 2>/dev/null | head -1)
    if [ -n "$TUNNEL_URL" ]; then
        break
    fi
    sleep 1
done

if [ -z "$TUNNEL_URL" ]; then
    echo -e "${YELLOW}⚠ Could not get tunnel URL. Check /tmp/tunnel.log${NC}"
    echo "Server is still running locally at http://localhost:3001"
    wait $TUNNEL_PID
    exit 1
fi

# Create short URL with TinyURL
echo -e "${GREEN}Creating short URL...${NC}"
SHORT_URL=$(curl -s "https://tinyurl.com/api-create.php?url=$TUNNEL_URL" 2>/dev/null || echo "$TUNNEL_URL")

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}✓ CULINARY CARD GAME IS LIVE!${NC}"
echo ""
echo -e "  ${YELLOW}${BOLD}PLAY THE GAME:${NC}"
echo -e "  ${CYAN}${BOLD}$SHORT_URL${NC}"
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Full URL: $TUNNEL_URL"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# Save URL to file for reference
echo "Game URL: $SHORT_URL" > /tmp/culinary_urls.txt
echo "Full URL: $TUNNEL_URL" >> /tmp/culinary_urls.txt

# Keep running until interrupted
wait $TUNNEL_PID


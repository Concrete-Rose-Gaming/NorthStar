#!/bin/bash
# Setup script for Cloudflare Tunnel

set -e

echo "Setting up Cloudflare Tunnel for Culinary Card Game..."
echo ""

# Step 1: Login (opens browser)
echo "Step 1: Logging in to Cloudflare..."
echo "This will open your browser for authentication."
cloudflared tunnel login

# Step 2: Create tunnel
echo ""
echo "Step 2: Creating tunnel 'culinary-game'..."
TUNNEL_ID=$(cloudflared tunnel create culinary-game 2>&1 | grep -oP "Created tunnel \K[0-9a-f-]+" || echo "")
if [ -z "$TUNNEL_ID" ]; then
    echo "Tunnel may already exist. Checking existing tunnels..."
    cloudflared tunnel list
    echo ""
    echo "If tunnel already exists, you can use it. Otherwise, delete it first with:"
    echo "  cloudflared tunnel delete culinary-game"
    exit 1
fi

echo "Tunnel created with ID: $TUNNEL_ID"

# Step 3: Create config file
echo ""
echo "Step 3: Creating config file..."
cat > ~/.cloudflared/config.yml <<EOF
tunnel: $TUNNEL_ID
credentials-file: /home/northpi/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: culinary-game-server.trycloudflare.com
    service: http://localhost:3001
  - service: http_status:404
EOF

echo "Config file created at ~/.cloudflared/config.yml"
echo ""
echo "Step 4: Testing tunnel..."
echo "Run the tunnel with: cloudflared tunnel run culinary-game"
echo ""
echo "Or set up as a service (see setup-tunnel-service.sh)"
echo ""
echo "Note: For a permanent domain, you'll need to:"
echo "1. Add a domain to Cloudflare"
echo "2. Create a CNAME record pointing to your tunnel"
echo "3. Update the hostname in ~/.cloudflared/config.yml"


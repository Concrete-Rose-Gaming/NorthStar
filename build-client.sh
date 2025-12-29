#!/bin/bash
# Build client for production with Cloudflare Tunnel URL

set -e

echo "Building client for production..."

# Check if .env.production exists
if [ ! -f "client/.env.production" ]; then
    echo "ERROR: client/.env.production not found!"
    echo ""
    echo "Create client/.env.production with:"
    echo "  VITE_SERVER_URL=https://your-tunnel-url.trycloudflare.com"
    echo ""
    echo "Or copy from template:"
    echo "  cp client/.env.production.example client/.env.production"
    echo "  # Then edit and set your tunnel URL"
    exit 1
fi

# Check if VITE_SERVER_URL is set
if ! grep -q "VITE_SERVER_URL=" client/.env.production || grep -q "VITE_SERVER_URL=$" client/.env.production || grep -q "VITE_SERVER_URL=https://your-tunnel-url" client/.env.production; then
    echo "WARNING: VITE_SERVER_URL may not be set correctly in client/.env.production"
    echo "Please ensure it points to your Cloudflare Tunnel URL"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build shared package first
echo "Building shared package..."
npm run build:shared

# Build client
echo "Building client..."
cd client
npm run build

echo ""
echo "Build complete! Output is in client/dist/"
echo ""
echo "Next steps:"
echo "1. Deploy to GitHub Pages (see deploy-github-pages step)"
echo "2. Or zip client/dist and upload to itch.io (see deploy-itch-io step)"


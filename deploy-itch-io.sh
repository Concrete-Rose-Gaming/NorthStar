#!/bin/bash
# Build and prepare client for itch.io deployment

set -e

echo "Preparing client for itch.io deployment..."

# Check if .env.production exists
if [ ! -f "client/.env.production" ]; then
    echo "ERROR: client/.env.production not found!"
    echo ""
    echo "Create client/.env.production with:"
    echo "  VITE_SERVER_URL=https://your-tunnel-url.trycloudflare.com"
    exit 1
fi

# Build client
echo "Building client..."
./build-client.sh

# Create zip file
ZIP_NAME="culinary-card-game-itch-io.zip"
echo "Creating zip file: $ZIP_NAME"

cd client/dist
zip -r "../../$ZIP_NAME" . -x "*.map" "*.DS_Store"
cd ../..

echo ""
echo "✓ Build complete!"
echo ""
echo "Zip file created: $ZIP_NAME"
echo ""
echo "Next steps:"
echo "1. Go to your itch.io project page"
echo "2. Click 'Edit project'"
echo "3. Go to 'Uploads' section"
echo "4. Upload: $ZIP_NAME"
echo "5. Set as HTML5 game"
echo "6. Save changes"
echo ""
echo "After uploading, update server CORS to include your itch.io URL:"
echo "  CORS_ORIGIN=...,https://yourgame.itch.io"


#!/bin/bash
# Build client for standalone deployment (GitHub Pages, itch.io, etc.)
# Note: Server URL is now prompted in the app, so no build-time URL needed

set -e

echo "🎮 Building Standalone Client for GitHub Pages/itch.io"
echo "========================================================"
echo ""
echo "Note: The app will prompt users for the server URL on first load."
echo "No server URL needed at build time!"
echo ""

# Build shared package first
echo "📦 Building shared package..."
cd shared
npm run build > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Failed to build shared package"
    exit 1
fi
cd ..

# Build client
echo "🔨 Building client..."
cd client

# Build (no .env.production needed - URL is prompted in app)
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build client"
    exit 1
fi

cd ..

cd ..

echo ""
echo "✅ Build complete!"
echo ""
echo "📁 Output directory: docs/"
echo ""
echo "📋 Next steps:"
echo ""
echo "For GitHub Pages:"
echo "  1. Commit and push the docs/ folder to your repository"
echo "  2. In GitHub repo Settings > Pages:"
echo "     - Source: Deploy from a branch"
echo "     - Branch: main (or your default branch)"
echo "     - Folder: /docs"
echo "  3. Your site will be available at: https://yourusername.github.io/repo-name"
echo ""
echo "For itch.io:"
echo "  1. Zip the docs folder: cd docs && zip -r ../culinary-card-game.zip ."
echo "  2. Upload to itch.io as HTML5 game"
echo ""
echo "✅ The app will prompt users to enter the server URL when they first load it."
echo "   The URL is saved in localStorage for convenience."
echo ""
echo "⚠️  Important: Make sure your server CORS allows requests from:"
echo "  - Your GitHub Pages URL (if using GitHub Pages)"
echo "  - Your itch.io URL (if using itch.io)"
echo "  - Or set CORS_ORIGIN=* on your server for testing"


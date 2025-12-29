#!/bin/bash
# Install systemd services for server and tunnel

set -e

echo "Installing systemd services for Culinary Card Game..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Get the project directory
PROJECT_DIR="/home/northpi/Documents/NorthStar"
SERVICE_DIR="/etc/systemd/system"

# Copy service files
echo "Copying service files..."
cp "$PROJECT_DIR/culinary-game-server.service" "$SERVICE_DIR/"
cp "$PROJECT_DIR/cloudflared-tunnel.service" "$SERVICE_DIR/"

# Reload systemd
echo "Reloading systemd..."
systemctl daemon-reload

# Enable services (but don't start yet)
echo "Enabling services..."
systemctl enable culinary-game-server.service
systemctl enable cloudflared-tunnel.service

echo ""
echo "✓ Services installed and enabled!"
echo ""
echo "Services will start automatically on boot."
echo ""
echo "To start services now:"
echo "  sudo systemctl start culinary-game-server"
echo "  sudo systemctl start cloudflared-tunnel"
echo ""
echo "To check status:"
echo "  sudo systemctl status culinary-game-server"
echo "  sudo systemctl status cloudflared-tunnel"
echo ""
echo "To view logs:"
echo "  sudo journalctl -u culinary-game-server -f"
echo "  sudo journalctl -u cloudflared-tunnel -f"
echo ""
echo "To stop services:"
echo "  sudo systemctl stop culinary-game-server"
echo "  sudo systemctl stop cloudflared-tunnel"
echo ""
echo "To disable auto-start:"
echo "  sudo systemctl disable culinary-game-server"
echo "  sudo systemctl disable cloudflared-tunnel"


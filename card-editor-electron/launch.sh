#!/bin/bash
# Launcher script for Chef Card Editor

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if we're in development mode
if [ -d "$SCRIPT_DIR/node_modules" ] && [ -f "$SCRIPT_DIR/package.json" ]; then
    # Development mode - run electron directly
    cd "$SCRIPT_DIR"
    npm run electron:dev
else
    # Production mode - look for built executable
    # Check for AppImage first
    if [ -f "$SCRIPT_DIR/dist/Chef Card Editor-"*.AppImage ]; then
        APPIMAGE=$(ls "$SCRIPT_DIR/dist/Chef Card Editor-"*.AppImage 2>/dev/null | head -n 1)
        if [ -n "$APPIMAGE" ]; then
            chmod +x "$APPIMAGE"
            "$APPIMAGE"
            exit 0
        fi
    fi
    
    # Check for installed version
    if command -v chef-card-editor &> /dev/null; then
        chef-card-editor
        exit 0
    fi
    
    # Check for local build
    if [ -f "$SCRIPT_DIR/dist/linux-unpacked/chef-card-editor" ]; then
        "$SCRIPT_DIR/dist/linux-unpacked/chef-card-editor"
        exit 0
    fi
    
    echo "Error: Could not find Chef Card Editor executable."
    echo "Please build the app first with: npm run electron:dist"
    exit 1
fi



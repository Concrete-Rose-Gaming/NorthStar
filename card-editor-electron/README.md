# Chef Card Editor

A desktop application for creating and editing game cards for the Chef Card Game. Cards are stored locally in JSON files and can be synced to Supabase individually.

## Features

- Create and edit game cards locally
- Store cards in JSON files (works offline)
- Live preview of cards as you edit
- Upload card artwork (PNG, JPG, WebP)
- Sync individual cards to Supabase
- Track sync status for all cards

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the `card-editor-electron` directory:
```
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3. Run in development mode:
```bash
npm start  # Start React dev server in one terminal
npm run electron:dev  # Start Electron in another terminal
```

## Building Executable

Build for production to create a downloadable executable:
```bash
npm run electron:dist
```

This will create:
- **AppImage** in `dist/` directory - Portable executable, just double-click to run!
- **Deb package** in `dist/` directory - Install with `sudo dpkg -i dist/*.deb`

## Running the Executable

### Quick Launch (AppImage)
After building, you'll find an AppImage file in the `dist/` directory:
```bash
# Make it executable (if needed)
chmod +x "dist/Chef Card Editor-"*.AppImage

# Run it
./dist/Chef\ Card\ Editor-*.AppImage
```

Or simply double-click the AppImage file in your file manager!

### Using the Launcher Script
```bash
./launch.sh
```

### Creating a Desktop Shortcut

1. Build the app first: `npm run electron:dist`
2. Find the AppImage path
3. Create/edit `~/.local/share/applications/chef-card-editor.desktop`:
```ini
[Desktop Entry]
Name=Chef Card Editor
Comment=Create and edit game cards
Exec=/full/path/to/Chef Card Editor-*.AppImage
Icon=application-x-executable
Type=Application
Categories=Utility;Game;
```

4. Make it executable: `chmod +x ~/.local/share/applications/chef-card-editor.desktop`

The app will now appear in your applications menu!

## Data Storage

- Cards are stored in: `~/.config/chef-card-editor/cards.json`
- Artwork is stored in: `~/.config/chef-card-editor/artwork/`

## Usage

1. Click "New Card" to create a new card
2. Fill in the card details
3. Upload artwork if desired
4. Click "Save Locally" to save to JSON
5. Click "Save & Sync to Supabase" to save and sync to Supabase
6. Use the sync status panel to see which cards need syncing



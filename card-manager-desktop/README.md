# Card Manager Desktop Application

A modern desktop application for creating, editing, viewing, and managing cards for the NorthStar card game. Built with Electron, React, and TypeScript.

## Features

- Create and edit game cards locally
- Store cards in JSON files (works offline)
- Live preview of cards as you edit
- Upload card artwork to Supabase Storage
- Sync individual cards to Supabase
- Track sync status for all cards
- Support for all card types: CHEF, RESTAURANT, MEAL, STAFF, SUPPORT, EVENT
- Type-specific fields for each card type

## Setup

1. Install dependencies:
```bash
npm install
```

2. (Optional) Create a `.env` file in the project root:
```
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Alternatively, configure Supabase connection through the Settings dialog in the app.

## Development

Run in development mode:
```bash
npm run dev
```

This will:
- Start the React dev server on http://localhost:3000
- Launch Electron when the dev server is ready

Or run separately:
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
chmod +x "dist/Card Manager-"*.AppImage

# Run it
./dist/Card\ Manager-*.AppImage
```

Or simply double-click the AppImage file in your file manager!

## Data Storage

- Cards are stored in: `~/.config/card-manager/cards.json`
- Artwork previews are stored in: `~/.config/card-manager/artwork/`
- Card images are uploaded to Supabase Storage bucket `card-artwork`

## Usage

1. Click "New Card" to create a new card
2. Fill in the card details
3. Upload artwork if desired (requires Supabase configuration)
4. Click "Save Locally" to save to JSON
5. Click "Save & Sync to Supabase" to save and sync to Supabase (requires Supabase configuration)
6. Use the sync status panel to see which cards need syncing
7. Configure Supabase connection in Settings if needed

## Card Types

The app supports all card types with their specific fields:

- **CHEF**: Starting influence, star bonus influence, primary/secondary archetypes
- **RESTAURANT**: Primary/secondary archetypes, required stars
- **MEAL**: Influence cost, food type, restaurant types
- **STAFF**: Influence cost, employee type, restaurant type
- **SUPPORT**: Duration (stored in effect field)
- **EVENT**: Influence cost, first/second enum

## Requirements

- Node.js 16+ and npm
- Linux (x64 or arm64) for building executables
- Supabase account (optional, for cloud sync and image storage)


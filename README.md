# Culinary Card Game 🎮

A web-based culinary card game with online multiplayer, AI opponents, lobby system, and live chat.

## Features

- **Card Game Mechanics**: Chef cards, restaurant cards, dish cards, and character cards
- **Head-to-Head Combat**: Automatic combat between chefs after each round
- **Legendary Stars**: First to 5 stars wins
- **Online Multiplayer**: Challenge other players directly
- **AI Opponents**: Play against AI with three difficulty levels
- **Lobby System**: See online players and send challenges
- **Live Chat**: Text chat in lobby and during games

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- (Optional) Cloudflare Tunnel for public access

### Installation

1. **Install dependencies:**
```bash
npm run install:all
```

2. **Start the game:**
```bash
./start.sh
```

That's it! The script will:
- Build the server and client
- Start the game server
- Create a public Cloudflare tunnel
- Display the game URL

### Development Mode

For development with hot reload:

```bash
npm run dev
```

This starts both client and server in development mode:
- Client: http://localhost:3000
- Server: http://localhost:3001

## Usage

### For Players

1. Open the game URL (displayed when you run `./start.sh`)
2. Enter a username
3. Join the lobby
4. Challenge other players or play against AI
5. Play cards and battle to reach 5 legendary stars!

### For Hosts

The game runs automatically - just share the URL with players!

## Game Rules

1. **Setup**: Each player starts with a Chef card, 3 randomly selected Restaurant cards, and a 30-card deck
2. **Mulligan**: Players can mulligan their starting hand once
3. **Rounds**: Players take turns playing cards from their hand
4. **Head-to-Head**: After each round, chefs automatically battle
5. **Victory**: First player to reach 5 legendary stars wins

## Card Types

- **Chef**: Your main character with health and attack stats
- **Restaurant**: Provides ongoing effects
- **Dish**: Playable cards with various effects
- **Character**: Waiters, legendary chefs, actors, investors, etc.

## Project Structure

```
NorthStar/
├── client/          # React frontend
├── server/          # Node.js backend (serves client files)
└── shared/          # Shared TypeScript types
```

## Technologies

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Real-time**: Socket.io
- **State Management**: Zustand

## Deployment

The game is designed to run on a single server that serves both the API and client files. Use the included `start.sh` script which automatically:

1. Builds the project
2. Starts the server
3. Creates a Cloudflare tunnel for public access
4. Displays the game URL

No complex deployment setup needed - just run `./start.sh`!

## License

[Add your license here]

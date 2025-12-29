# Culinary Card Game

A web-based culinary card game with online multiplayer, AI opponents, lobby system, and live chat.

## Features

- **Card Game Mechanics**: Chef cards, restaurant cards, dish cards, and character cards
- **Head-to-Head Combat**: Automatic combat between chefs after each round
- **Legendary Stars**: First to 5 stars wins
- **Online Multiplayer**: Challenge other players directly
- **AI Opponents**: Play against AI with three difficulty levels
- **Lobby System**: See online players and send challenges
- **Live Chat**: Text chat in lobby and during games

## Project Structure

```
NorthStar/
├── client/          # React frontend
├── server/          # Node.js backend
└── shared/          # Shared TypeScript types
```

## Setup

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install root dependencies:
```bash
npm install
```

2. Install all workspace dependencies:
```bash
npm run install:all
```

Or install individually:
```bash
cd shared && npm install
cd ../server && npm install
cd ../client && npm install
```

### Development

Run both client and server in development mode:

```bash
npm run dev
```

Or run separately:

```bash
# Terminal 1 - Server
npm run dev:server

# Terminal 2 - Client
npm run dev:client
```

- Client: http://localhost:3000
- Server: http://localhost:3001

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

## Technologies

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Real-time**: Socket.io
- **State Management**: Zustand


# Chef Card Game

A strategic card game prototype where players compete as chefs, building decks and managing restaurants to earn stars. The first player to 5 stars wins!

## 🎮 How to Play

**Just visit the website and start playing!** No setup, no accounts, no backend needed.

1. Go to the game website (once deployed)
2. Enter your name
3. Click "🤖 Start Game vs AI"
4. Build your deck and play!

Click the **"📖 How to Play"** button in-game for a detailed tutorial.

## 🎯 Game Rules

- **Decks**: 1 Chef card + 3 Restaurant cards (separate) + 30 main deck cards
- **Main Deck**: Meals, Staff, Support, and Event cards only (max 3 of each)
- **Chef Cards**: Each player has one Chef with a base value and special ability (cannot be removed)
- **Restaurant Cards**: Each player has 3 Restaurants with base scores and conditional abilities (cannot be removed)
- **Gameplay**: 
  - Both players draw 5 cards and can mulligan
  - A random Restaurant card is selected from each player's 3
  - Coin flip determines first player
  - Each round: both players draw a card, take simultaneous turns, then face-off
  - Restaurant with higher score gets a star
  - First to 5 stars wins

## 🚀 Quick Start

### Playing Online (GitHub Pages)
Once deployed, just visit: `https://concrete-rose-gaming.github.io/NorthStar`

### Running Locally
```bash
npm install
npm start
```
Then open `http://localhost:3000`

## 🛠️ Development

### Prerequisites
- Node.js (v20 or higher)
- npm (v10 or higher) or yarn

### Installation
```bash
npm install
```

### Development Server
```bash
npm start
```

### Build for Production
```bash
npm run build
```

## 📁 Project Structure

```
NorthStar/
├── src/
│   ├── components/          # React components
│   │   ├── GameBoard/       # Main game interface
│   │   ├── Card/            # Card display component
│   │   ├── DeckBuilder/     # Deck construction UI
│   │   ├── Restaurant/      # Restaurant card display
│   │   ├── PlayerArea/      # Player's hand and board
│   │   └── Tutorial/        # Game tutorial
│   ├── game/                # Game logic
│   │   ├── GameEngine.ts    # Core game state management
│   │   ├── CardTypes.ts     # Card type definitions
│   │   ├── DeckManager.ts   # Deck validation and management
│   │   ├── Scoring.ts        # Restaurant scoring logic
│   │   └── AIOpponent.ts    # AI opponent logic
│   ├── App.tsx              # Main app component
│   └── index.tsx            # Entry point
├── public/                  # Static assets
├── .github/workflows/       # GitHub Actions for deployment
└── package.json
```

## 🎴 Card Types

- **Chef**: Your character with special abilities
- **Restaurant**: Your restaurant with conditional bonuses
- **Meal**: Adds points to your score
- **Staff**: Provides bonuses and modifiers
- **Support**: Utility and enhancement effects
- **Event**: One-time effects and disruptions

## 🤖 AI Opponent

The game features a built-in AI opponent that:
- Makes strategic decisions about which cards to play
- Mulligans low-value cards
- Plays high-value meals and useful support cards
- Adapts based on the game state

## 🚀 Deployment

The project includes GitHub Actions workflow that automatically builds and deploys to GitHub Pages when you push to the main branch.

## 📝 Technologies Used

- **React** - UI framework
- **TypeScript** - Type safety
- **CSS** - Styling

## 📄 License

This project is a prototype and is available for educational purposes.

## 🤝 Contributing

This is a prototype project. Feel free to fork and modify for your own use!


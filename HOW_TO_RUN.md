# How to Play Chef Card Game

## 🎮 For Players (Once Deployed)

**Just visit the website and play!** No setup needed.

1. Go to: `https://concrete-rose-gaming.github.io/NorthStar`
2. Enter your name
3. Click "🤖 Start Game vs AI"
4. Play!

The game runs entirely in your browser - no accounts, no backend, no setup!

## 🛠️ For Developers

### Preferred: Development Mode (`npm start`)

**This is what you should use for testing and development:**

```bash
npm start
```

This will:
- Start a development server at `http://localhost:3000`
- Automatically reload when you make changes
- Show helpful error messages
- Use the latest code from `src/` folder

**This is the "source of truth"** - what you see here is what gets built and deployed.

### Production Build (`npm run build`)

This creates optimized files in the `build/` folder for deployment:

```bash
npm run build
```

**Note:** The root `index.html` file is just a placeholder. The workflow automatically copies the built `index.html` (with correct file hashes) during deployment.

## 📝 Important Notes

- **`npm start`** = Development mode (use this for testing)
- **`npm run build`** = Production build (for deployment)
- **Root `index.html`** = Placeholder (gets overwritten during deployment)
- **GitHub Pages** = Uses the built files from `build/` folder

## 🚀 Deployment

When you push to GitHub:
1. GitHub Actions runs `npm run build`
2. Copies built files to root
3. Deploys to GitHub Pages
4. Game is live!

The deployed version will match what you see with `npm start` (just optimized for production).

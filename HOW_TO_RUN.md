# How to Run the Chef Card Game

## Quick Start (Development)

1. **Set up Supabase credentials** in `.env` file:
   ```env
   REACT_APP_SUPABASE_URL=https://your-actual-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-actual-anon-key
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Open your browser** to `http://localhost:3000`

The app will automatically reload when you make changes!

## Production Build (For Deployment)

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **The built files** will be in the `build/` folder. These are static HTML/CSS/JS files that can be served by any web server.

3. **To test the production build locally**:
   ```bash
   # Install a simple server (one-time)
   npm install -g serve
   
   # Serve the build folder
   serve -s build
   ```
   Then open `http://localhost:3000` (or the port shown)

## Understanding React Apps

**Important**: You cannot just open `index.html` directly in a browser! React apps need to be:
- **Built** (compiled from TypeScript/JSX to regular JavaScript)
- **Served** by a web server (even a simple one)

### Why?

- React uses JSX (JavaScript + HTML) which browsers don't understand directly
- The code needs to be compiled/bundled
- Environment variables need to be injected at build time
- The app uses modern JavaScript features that need transpilation

### The `public/index.html` file

This is just a **template**. React injects the compiled JavaScript into it when you build or run the dev server. The actual app code is in `src/`.

## Deployment Options

### Option 1: GitHub Pages (Automatic)
- Push to GitHub
- The GitHub Actions workflow will automatically build and deploy
- Your game will be live at `https://yourusername.github.io/NorthStar`

### Option 2: Manual Build & Deploy
```bash
npm run build
# Then upload the contents of the build/ folder to any static hosting
```

### Option 3: Local Development
```bash
npm start
# Opens http://localhost:3000 automatically
```

## Troubleshooting

### CORS Error
- Make sure your `.env` file has the correct Supabase URL
- Make sure you've run the SQL migration in Supabase
- Make sure Realtime is enabled for your tables

### "Cannot find module" errors
- Run `npm install` again
- Make sure you're in the project directory

### Port already in use
- Kill the process using port 3000, or
- Set a different port: `PORT=3001 npm start`


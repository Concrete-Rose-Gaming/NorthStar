# GitHub Pages Build Output

This folder contains the built static files for GitHub Pages deployment.

**Do not edit files in this folder directly.** They are automatically generated when you run:

```bash
npm run build:pages
```

## Setup Instructions

1. Build the project for GitHub Pages:
   ```bash
   npm run build:pages
   ```

2. Commit and push the `docs` folder to your repository:
   ```bash
   git add docs/
   git commit -m "Update GitHub Pages build"
   git push
   ```

3. In your GitHub repository settings:
   - Go to **Settings** → **Pages**
   - Under **Source**, select **Deploy from a branch**
   - Select **main** (or your default branch) and **/docs** folder
   - Click **Save**

4. Your site will be available at: `https://yourusername.github.io/NorthStar/`

## Important Notes

- The base path is set to `/NorthStar/` - if your repository has a different name, update the `VITE_BASE_PATH` in `package.json` script `build:pages`
- The backend server must be hosted separately (GitHub Pages only serves static files)
- Update the socket connection URL in `client/src/services/socketService.ts` to point to your hosted backend


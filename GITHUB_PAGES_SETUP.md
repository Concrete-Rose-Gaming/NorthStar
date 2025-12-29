# GitHub Pages Deployment Guide

## Prerequisites

1. Repository is on GitHub
2. GitHub Pages is enabled in repository settings
3. Cloudflare Tunnel URL is available

## Setup Steps

### Step 1: Enable GitHub Pages

1. Go to your repository on GitHub
2. Settings > Pages
3. Source: "GitHub Actions"
4. Save

### Step 2: Set Secret for Server URL

1. Go to repository Settings > Secrets and variables > Actions
2. Click "New repository secret"
3. Name: `VITE_SERVER_URL`
4. Value: Your Cloudflare Tunnel URL (e.g., `https://xxxxx-xxxx-xxxx.trycloudflare.com`)
5. Click "Add secret"

### Step 3: Push Workflow File

The workflow file (`.github/workflows/deploy-pages.yml`) should already be in your repo.
If not, commit and push it:

```bash
git add .github/workflows/deploy-pages.yml
git commit -m "Add GitHub Pages deployment workflow"
git push
```

### Step 4: Trigger Deployment

The workflow will automatically run when you:
- Push to `main` branch with changes to `client/` or `shared/`
- Or manually trigger it: Actions > Deploy to GitHub Pages > Run workflow

### Step 5: Get Your GitHub Pages URL

After deployment completes:
1. Go to repository Settings > Pages
2. Your site URL will be shown (e.g., `https://yourusername.github.io` or `https://yourusername.github.io/repo-name`)

### Step 6: Update Server CORS

Add your GitHub Pages URL to server's `CORS_ORIGIN`:

```bash
# In server/.env
CORS_ORIGIN=https://your-tunnel-url.trycloudflare.com,https://yourusername.github.io,https://yourgame.itch.io
```

Restart the server after updating.

## Manual Deployment (Alternative)

If you prefer to deploy manually:

```bash
# Build client
./build-client.sh

# Commit and push dist folder
cd client/dist
git init
git add .
git commit -m "Deploy to GitHub Pages"
git branch -M gh-pages
git remote add origin https://github.com/yourusername/yourrepo.git
git push -u origin gh-pages
```

Then in GitHub Settings > Pages, set source to `gh-pages` branch.

## Troubleshooting

**Workflow fails?**
- Check Actions tab for error details
- Verify `VITE_SERVER_URL` secret is set correctly
- Ensure Node.js version matches (workflow uses Node 20)

**404 on GitHub Pages?**
- Check that `client/dist/index.html` exists
- Verify Pages source is set to "GitHub Actions"
- Wait a few minutes for deployment to complete

**CORS errors?**
- Verify GitHub Pages URL is in server's `CORS_ORIGIN`
- Check that server is running and accessible
- Verify tunnel URL is correct

## Updating Deployment

To update the deployed site:
1. Make changes to client code
2. Commit and push to `main`
3. Workflow will automatically rebuild and deploy
4. Changes appear in 1-2 minutes


# GitHub Pages Deployment Guide

## Quick Setup

1. **Build the client:**
   ```bash
   ./build-standalone.sh
   ```

2. **Commit and push the `docs/` folder:**
   ```bash
   git add docs/
   git commit -m "Deploy to GitHub Pages"
   git push
   ```

3. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Settings > Pages
   - Source: **Deploy from a branch**
   - Branch: **main** (or your default branch)
   - Folder: **/docs**
   - Click **Save**

4. **Your site will be live at:**
   - `https://yourusername.github.io/repo-name` (if repo has a name)
   - Or `https://yourusername.github.io` (if repo is named `yourusername.github.io`)

## How It Works

- The build script creates a `docs/` folder in the root of your repository
- GitHub Pages serves files from the `/docs` folder
- All asset paths are relative, so it works whether at root or in a subdirectory
- Users will be prompted to enter the server URL when they first visit

## Updating Your Site

To update the deployed site:

1. Make changes to your code
2. Rebuild: `./build-standalone.sh`
3. Commit and push: `git add docs/ && git commit -m "Update site" && git push`
4. Changes appear in 1-2 minutes

## Server Configuration

Make sure your server's `CORS_ORIGIN` includes your GitHub Pages URL:

```bash
# In server/.env or when running server
CORS_ORIGIN=https://yourusername.github.io,https://yourusername.github.io/repo-name
```

Or for testing, allow all origins:
```bash
CORS_ORIGIN=*
```

## Troubleshooting

**Site shows 404?**
- Check that `docs/index.html` exists
- Verify GitHub Pages is set to serve from `/docs` folder
- Wait a few minutes for deployment to complete

**Assets not loading?**
- Check browser console for 404 errors
- Verify asset paths in `docs/index.html` are relative (should start with `./`)
- Clear browser cache

**Can't connect to server?**
- Verify server is running
- Check server CORS includes your GitHub Pages URL
- Users need to enter the server URL when they first visit

## File Structure

After building, your repository should have:
```
NorthStar/
├── docs/              ← GitHub Pages serves from here
│   ├── index.html
│   └── assets/
│       ├── index-xxx.js
│       └── index-xxx.css
├── client/
├── server/
└── ...
```

The `docs/` folder is committed to git and deployed by GitHub Pages.


# Quick Start Guide - Play the Game Now!

## 🎮 Play Locally (Easiest Way)

1. **Make sure dependencies are installed**:
```bash
npm run install:all
```

2. **Start the game**:
```bash
npm run dev
```

3. **Open your browser** and go to: **http://localhost:3000**

4. **Enter a username** and start playing!

That's it! The game is now running locally. You can:
- Play against AI opponents (choose difficulty level)
- Challenge other players (if you open multiple browser tabs/windows)
- Chat in the lobby

## 🌐 Deploy to Web/itch.io

Since this game requires a server for multiplayer, here are your options:

### Simple Option: Railway (Hosts Both Client + Server)

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Deploy: `railway init && railway up`
4. Your game will be live at a Railway URL!

### For itch.io: Two-Step Process

**Step 1: Deploy Server** (choose one):
- **Railway**: `railway init && railway up` (easiest)
- **Render**: Go to render.com, connect GitHub, deploy server

**Step 2: Deploy Client to itch.io**:
1. Set server URL before building:
   ```bash
   cd client
   echo "VITE_SERVER_URL=https://your-server-url.com" > .env.production
   ```
2. Build: `npm run build`
3. Zip the `client/dist` folder
4. Upload to itch.io as HTML5 game
5. Update server CORS to allow itch.io URL

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🐛 Troubleshooting

**Game won't start?**
- Make sure Node.js 18+ is installed: `node --version`
- Reinstall dependencies: `npm run install:all`
- Check if ports 3000 and 3001 are available

**Can't connect to server?**
- Make sure both client and server are running
- Check browser console for errors
- Verify server is running on port 3001

**Want to play with friends?**
- Deploy to Railway/Render (see DEPLOYMENT.md)
- Share the URL with your friends
- They can join and challenge you!

## 📝 Next Steps

- Read [README.md](./README.md) for full documentation
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for hosting options
- Customize the game in the `client/src` and `server/src` folders

Enjoy playing! 🎉


import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { GameHandlers } from './socket/gameHandlers';
import { LobbyHandlers } from './socket/lobbyHandlers';
import { ChatHandlers } from './socket/chatHandlers';

const app = express();
const httpServer = createServer(app);

// Allow all origins since client is served from same server
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Serve static files from client/dist (for development) or docs (for production)
// Path is relative to the compiled dist directory (server/dist/server/src/)
// Try docs first (GitHub Pages build), then fall back to client/dist
const fs = require('fs');
const docsPath = path.join(__dirname, '../../../../docs');
const clientDistPath = path.join(__dirname, '../../../../client/dist');
const staticPath = fs.existsSync(docsPath) ? docsPath : clientDistPath;
app.use(express.static(staticPath));

// Handle SPA routing - serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  // Don't serve index.html for API routes or socket.io
  if (req.path.startsWith('/socket.io') || req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Initialize handlers
const gameHandlers = new GameHandlers(io);
const lobbyHandlers = new LobbyHandlers(io, gameHandlers);
const chatHandlers = new ChatHandlers(io);

// Connect handlers
gameHandlers.setUsernameGetter((socketId) => lobbyHandlers.getUsername(socketId));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  gameHandlers.handleConnection(socket);
  lobbyHandlers.handleConnection(socket);
  chatHandlers.handleConnection(socket);
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving static files from: ${staticPath}`);
}).on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please kill the process using that port or use a different port.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});


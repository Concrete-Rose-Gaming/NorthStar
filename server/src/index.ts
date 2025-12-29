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

// Serve static files from client/dist
// Path is relative to the compiled dist directory (server/dist/server/src/)
// Need to go up to project root: ../../../../client/dist
const clientDistPath = path.join(__dirname, '../../../../client/dist');
app.use(express.static(clientDistPath));

// Handle SPA routing - serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  // Don't serve index.html for API routes or socket.io
  if (req.path.startsWith('/socket.io') || req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
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
});


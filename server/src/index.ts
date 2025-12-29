import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameHandlers } from './socket/gameHandlers';
import { LobbyHandlers } from './socket/lobbyHandlers';
import { ChatHandlers } from './socket/chatHandlers';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

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


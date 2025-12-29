import { io, Socket } from 'socket.io-client';
import { GameState, GameAction, LobbyPlayer, ChatMessage, Challenge } from '@culinary-game/shared';
import { useGameStore } from '../store/gameStore';

class SocketService {
  private socket: Socket | null = null;
  private username: string = '';

  connect(username: string) {
    this.username = username;
    if (this.socket?.connected) {
      return;
    }

    // Use environment variable or default to localhost for development
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
    
    this.socket = io(serverUrl, {
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      
      // Join lobby
      this.socket?.emit('lobby-join', { username });
      this.socket?.emit('request-player-list');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    const store = useGameStore.getState();

    // Game events
    this.socket.on('game-state-updated', (gameState: GameState) => {
      store.setGameState(gameState);
    });

    this.socket.on('joined-game', (data: { gameId: string; success: boolean }) => {
      if (data.success) {
        store.setCurrentGameId(data.gameId);
      }
    });

    this.socket.on('game-created', (data: { gameId: string; opponent: string }) => {
      store.setCurrentGameId(data.gameId);
      // Automatically join the game
      this.joinGame(data.gameId, this.username);
    });

    // Lobby events
    this.socket.on('player-list', (players: LobbyPlayer[]) => {
      store.setPlayerList(players);
    });

    this.socket.on('lobby-joined', () => {
      this.socket?.emit('request-player-list');
    });

    // Challenge events
    this.socket.on('challenge-received', (challenge: Challenge) => {
      store.addPendingChallenge(challenge);
    });

    this.socket.on('challenge-sent', () => {
      // Challenge sent confirmation
    });

    this.socket.on('challenge-rejected', (data: { challengeId: string; by: string }) => {
      store.removePendingChallenge(data.challengeId);
    });

    this.socket.on('challenge-cancelled', (data: { challengeId: string }) => {
      store.removePendingChallenge(data.challengeId);
    });

    // Chat events
    this.socket.on('chat-message', (message: ChatMessage) => {
      store.addChatMessage(message);
    });

    this.socket.on('chat-history', (messages: ChatMessage[]) => {
      store.setChatMessages(messages);
    });

    // Error events
    this.socket.on('error', (data: { message: string }) => {
      console.error('Socket error:', data.message);
    });
  }

  joinGame(gameId: string, username: string) {
    if (this.socket?.connected) {
      this.socket.emit('join-game', { gameId, username });
    }
  }

  sendGameAction(action: GameAction) {
    if (this.socket?.connected) {
      this.socket.emit('game-action', action);
    }
  }

  requestGameState(gameId: string) {
    if (this.socket?.connected) {
      this.socket.emit('request-game-state', { gameId });
    }
  }

  challengePlayer(targetId: string) {
    if (this.socket?.connected) {
      this.socket.emit('challenge-player', { targetId });
    }
  }

  acceptChallenge(challengeId: string) {
    if (this.socket?.connected) {
      this.socket.emit('accept-challenge', { challengeId });
      useGameStore.getState().removePendingChallenge(challengeId);
    }
  }

  rejectChallenge(challengeId: string) {
    if (this.socket?.connected) {
      this.socket.emit('reject-challenge', { challengeId });
      useGameStore.getState().removePendingChallenge(challengeId);
    }
  }

  createAIGame(difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    if (this.socket?.connected) {
      this.socket.emit('create-ai-game', { difficulty });
    }
  }

  sendChatMessage(message: string, username: string, roomId?: string) {
    if (this.socket?.connected) {
      this.socket.emit('chat-message', { message, username, roomId });
    }
  }

  requestChatHistory(roomId?: string) {
    if (this.socket?.connected) {
      this.socket.emit('request-chat-history', { roomId });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();


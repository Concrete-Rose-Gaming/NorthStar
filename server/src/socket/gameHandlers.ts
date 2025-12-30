import { Server, Socket } from 'socket.io';
import { GameEngine } from '../game/GameEngine';
import { CardSystem } from '../game/CardSystem';
import { GameAction, GameState, GamePhase } from '@culinary-game/shared';
import { AIOpponent } from '../ai/AIOpponent';

interface GameRoom {
  id: string;
  engine: GameEngine;
  players: Map<string, Socket>;
  aiOpponent?: AIOpponent;
}

export class GameHandlers {
  private rooms: Map<string, GameRoom> = new Map();
  private cardSystem: CardSystem;
  private getUsername?: (socketId: string) => string | undefined;

  constructor(private io: Server) {
    this.cardSystem = new CardSystem();
  }

  setUsernameGetter(getter: (socketId: string) => string | undefined) {
    this.getUsername = getter;
  }

  handleConnection(socket: Socket) {
    console.log(`Player connected: ${socket.id}`);

    socket.on('join-game', (data: { gameId: string; username: string }) => {
      this.handleJoinGame(socket, data.gameId, data.username);
    });

    socket.on('game-action', (action: GameAction) => {
      this.handleGameAction(socket, action);
    });

    socket.on('request-game-state', (data: { gameId: string }) => {
      this.handleRequestGameState(socket, data.gameId);
    });

    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  private handleJoinGame(socket: Socket, gameId: string, username: string) {
    let room = this.rooms.get(gameId);
    
    if (!room) {
      // Create new game room
      const engine = new GameEngine(this.cardSystem);
      room = {
        id: gameId,
        engine,
        players: new Map()
      };
      this.rooms.set(gameId, room);
    }

    // Add player to room
    room.players.set(socket.id, socket);
    socket.join(gameId);

    // Check if game is already initialized (e.g., AI game)
    const currentState = room.engine.getState();
    if (currentState.phase !== GamePhase.SETUP || currentState.players.length > 0) {
      // Game already initialized, just send current state
      socket.emit('game-state-updated', currentState);
      
      // If it's an AI game and it's the AI's turn, trigger AI action
      if (room.aiOpponent) {
        const currentPlayer = currentState.players[currentState.currentPlayerIndex];
        if (currentPlayer.isAI) {
          setTimeout(() => {
            const aiAction = room.aiOpponent!.makeDecision(currentState, room.engine);
            if (aiAction) {
              this.processActionForRoom(room, aiAction, null);
            }
          }, 1000);
        }
      }
    } else if (room.players.size === 2) {
      // Initialize game for 2 human players
      const playerSockets = Array.from(room.players.values());
      const playerIds = Array.from(room.players.keys());
      const usernames = playerIds.map(id => 
        this.getUsername ? (this.getUsername(id) || 'Player') : (id === socket.id ? username : 'Opponent')
      );
      
      const gameState = room.engine.initializeGame(playerIds, usernames);
      
      // Send game state to all players
      this.io.to(gameId).emit('game-state-updated', gameState);
    }

    socket.emit('joined-game', { gameId, success: true });
  }

  private handleGameAction(socket: Socket, action: GameAction) {
    const room = this.findRoomBySocket(socket);
    if (!room) {
      // If this is an AI action, find room by gameId instead
      const roomByGameId = Array.from(this.rooms.values()).find(r => {
        const state = r.engine.getState();
        return state.players.some(p => p.id === action.playerId);
      });
      
      if (!roomByGameId) {
        if (socket && socket.connected) {
          socket.emit('error', { message: 'Not in a game room' });
        }
        return;
      }
      
      // Process AI action
      return this.processActionForRoom(roomByGameId, action, null);
    }

    return this.processActionForRoom(room, action, socket);
  }

  private processActionForRoom(room: GameRoom, action: GameAction, socket: Socket | null) {
    const result = room.engine.processAction(action);
    
    if (result.success && result.newState) {
      // Broadcast updated game state
      this.io.to(room.id).emit('game-state-updated', result.newState);

      // If AI opponent's turn, make AI decision (including mulligan phase)
      if (result.newState.phase !== GamePhase.VICTORY) {
        const currentPlayer = result.newState.players[result.newState.currentPlayerIndex];
        if (currentPlayer.isAI && room.aiOpponent) {
          setTimeout(() => {
            const aiAction = room.aiOpponent!.makeDecision(result.newState!, room.engine);
            if (aiAction) {
              // Process AI action directly without socket
              this.processActionForRoom(room, aiAction, null);
            }
          }, 1000); // Delay for better UX
        }
      }
    } else {
      if (socket && socket.connected) {
        socket.emit('error', { message: result.error || 'Action failed' });
      }
    }
  }

  private handleRequestGameState(socket: Socket, gameId: string) {
    const room = this.rooms.get(gameId);
    if (!room) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    const gameState = room.engine.getState();
    socket.emit('game-state-updated', gameState);
  }

  private handleDisconnect(socket: Socket) {
    const room = this.findRoomBySocket(socket);
    if (room) {
      room.players.delete(socket.id);
      
      if (room.players.size === 0) {
        // Clean up empty room
        this.rooms.delete(room.id);
      } else {
        // Notify remaining players
        this.io.to(room.id).emit('player-disconnected', { playerId: socket.id });
      }
    }
  }

  private findRoomBySocket(socket: Socket): GameRoom | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.has(socket.id)) {
        return room;
      }
    }
    return undefined;
  }

  createGameWithAI(playerId: string, username: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): string {
    const gameId = `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const engine = new GameEngine(this.cardSystem);
    const aiOpponent = new AIOpponent(difficulty);
    
    const room: GameRoom = {
      id: gameId,
      engine,
      players: new Map(),
      aiOpponent
    };

    // Initialize game with AI
    const aiId = `ai-${Date.now()}`;
    const gameState = engine.initializeGame([playerId, aiId], [username, 'AI Opponent'], [false, true]);
    
    this.rooms.set(gameId, room);
    
    // If it's the AI's turn first, trigger AI action after a delay
    if (gameState.players[gameState.currentPlayerIndex].isAI) {
      setTimeout(() => {
        const aiAction = aiOpponent.makeDecision(gameState, engine);
        if (aiAction) {
          this.processActionForRoom(room, aiAction, null);
        }
      }, 1500);
    }
    
    return gameId;
  }

  getGameState(gameId: string): GameState | null {
    const room = this.rooms.get(gameId);
    if (!room) return null;
    return room.engine.getState();
  }
}


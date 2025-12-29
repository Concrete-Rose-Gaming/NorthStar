import { Server, Socket } from 'socket.io';
import { Challenge, LobbyPlayer } from '@culinary-game/shared';
import { GameHandlers } from './gameHandlers';

interface ConnectedPlayer {
  id: string;
  username: string;
  socket: Socket;
  isInGame: boolean;
  currentGameId?: string;
}

export class LobbyHandlers {
  private players: Map<string, ConnectedPlayer> = new Map();
  private challenges: Map<string, Challenge> = new Map();

  constructor(private io: Server, private gameHandlers: GameHandlers) {}

  handleConnection(socket: Socket) {
    socket.on('lobby-join', (data: { username: string }) => {
      this.handleLobbyJoin(socket, data.username);
    });

    socket.on('request-player-list', () => {
      this.handleRequestPlayerList(socket);
    });

    socket.on('challenge-player', (data: { targetId: string }) => {
      this.handleChallengePlayer(socket, data.targetId);
    });

    socket.on('accept-challenge', (data: { challengeId: string }) => {
      this.handleAcceptChallenge(socket, data.challengeId);
    });

    socket.on('reject-challenge', (data: { challengeId: string }) => {
      this.handleRejectChallenge(socket, data.challengeId);
    });

    socket.on('create-ai-game', (data: { difficulty?: 'easy' | 'medium' | 'hard' }) => {
      this.handleCreateAIGame(socket, data.difficulty);
    });

    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  private handleLobbyJoin(socket: Socket, username: string) {
    const player: ConnectedPlayer = {
      id: socket.id,
      username,
      socket,
      isInGame: false
    };

    this.players.set(socket.id, player);
    socket.join('lobby');

    // Notify all players in lobby
    this.broadcastPlayerList();

    socket.emit('lobby-joined', { success: true });
  }

  private handleRequestPlayerList(socket: Socket) {
    this.sendPlayerList(socket);
  }

  private handleChallengePlayer(socket: Socket, targetId: string) {
    const challenger = this.players.get(socket.id);
    const target = this.players.get(targetId);

    if (!challenger || !target) {
      socket.emit('error', { message: 'Player not found' });
      return;
    }

    if (target.isInGame) {
      socket.emit('error', { message: 'Player is already in a game' });
      return;
    }

    // Check for existing challenge
    const existingChallenge = Array.from(this.challenges.values()).find(
      c => c.challengerId === socket.id && c.targetId === targetId && c.status === 'PENDING'
    );

    if (existingChallenge) {
      socket.emit('error', { message: 'Challenge already sent' });
      return;
    }

    const challenge: Challenge = {
      id: `challenge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      challengerId: socket.id,
      challengerName: challenger.username,
      targetId: targetId,
      targetName: target.username,
      status: 'PENDING',
      createdAt: new Date()
    };

    this.challenges.set(challenge.id, challenge);

    // Notify target player
    target.socket.emit('challenge-received', challenge);
    socket.emit('challenge-sent', challenge);
  }

  private handleAcceptChallenge(socket: Socket, challengeId: string) {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) {
      socket.emit('error', { message: 'Challenge not found' });
      return;
    }

    if (challenge.targetId !== socket.id) {
      socket.emit('error', { message: 'Not your challenge' });
      return;
    }

    if (challenge.status !== 'PENDING') {
      socket.emit('error', { message: 'Challenge already processed' });
      return;
    }

    challenge.status = 'ACCEPTED';
    
    // Create game room
    const gameId = `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const challenger = this.players.get(challenge.challengerId);
    const target = this.players.get(challenge.targetId);

    if (challenger && target) {
      challenger.isInGame = true;
      challenger.currentGameId = gameId;
      target.isInGame = true;
      target.currentGameId = gameId;

      // Notify both players to join the game
      challenger.socket.emit('game-created', { gameId, opponent: target.username });
      target.socket.emit('game-created', { gameId, opponent: challenger.username });
    }

    // Remove challenge
    this.challenges.delete(challengeId);
    this.broadcastPlayerList();
  }

  private handleRejectChallenge(socket: Socket, challengeId: string) {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) {
      socket.emit('error', { message: 'Challenge not found' });
      return;
    }

    if (challenge.targetId !== socket.id) {
      socket.emit('error', { message: 'Not your challenge' });
      return;
    }

    challenge.status = 'REJECTED';
    
    const challenger = this.players.get(challenge.challengerId);
    if (challenger) {
      challenger.socket.emit('challenge-rejected', { challengeId, by: socket.id });
    }

    this.challenges.delete(challengeId);
  }

  private handleCreateAIGame(socket: Socket, difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    const player = this.players.get(socket.id);
    if (!player) {
      socket.emit('error', { message: 'Not in lobby' });
      return;
    }

    const gameId = this.gameHandlers.createGameWithAI(socket.id, player.username, difficulty);
    player.isInGame = true;
    player.currentGameId = gameId;

    socket.emit('game-created', { gameId, opponent: 'AI Opponent' });
    socket.emit('join-game', { gameId, username: player.username });
    this.broadcastPlayerList();
  }

  private handleDisconnect(socket: Socket) {
    const player = this.players.get(socket.id);
    if (player) {
      // Cancel pending challenges
      const challenges = Array.from(this.challenges.values()).filter(
        c => (c.challengerId === socket.id || c.targetId === socket.id) && c.status === 'PENDING'
      );
      
      for (const challenge of challenges) {
        this.challenges.delete(challenge.id);
        if (challenge.challengerId === socket.id) {
          const target = this.players.get(challenge.targetId);
          if (target) {
            target.socket.emit('challenge-cancelled', { challengeId: challenge.id });
          }
        } else {
          const challenger = this.players.get(challenge.challengerId);
          if (challenger) {
            challenger.socket.emit('challenge-cancelled', { challengeId: challenge.id });
          }
        }
      }

      this.players.delete(socket.id);
      this.broadcastPlayerList();
    }
  }

  private sendPlayerList(socket: Socket) {
    const lobbyPlayers: LobbyPlayer[] = Array.from(this.players.values()).map(p => ({
      id: p.id,
      username: p.username,
      isOnline: true,
      isInGame: p.isInGame,
      currentGameId: p.currentGameId
    }));

    socket.emit('player-list', lobbyPlayers);
  }

  private broadcastPlayerList() {
    const lobbyPlayers: LobbyPlayer[] = Array.from(this.players.values()).map(p => ({
      id: p.id,
      username: p.username,
      isOnline: true,
      isInGame: p.isInGame,
      currentGameId: p.currentGameId
    }));

    this.io.to('lobby').emit('player-list', lobbyPlayers);
  }

  getPlayer(socketId: string): ConnectedPlayer | undefined {
    return this.players.get(socketId);
  }

  getUsername(socketId: string): string | undefined {
    return this.players.get(socketId)?.username;
  }
}


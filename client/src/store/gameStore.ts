import { create } from 'zustand';
import { GameState, LobbyPlayer, ChatMessage, Challenge } from '@culinary-game/shared';

interface GameStore {
  currentGameId: string | null;
  gameState: GameState | null;
  playerList: LobbyPlayer[];
  chatMessages: ChatMessage[];
  pendingChallenges: Challenge[];
  setCurrentGameId: (gameId: string | null) => void;
  setGameState: (state: GameState | null) => void;
  setPlayerList: (players: LobbyPlayer[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  addPendingChallenge: (challenge: Challenge) => void;
  removePendingChallenge: (challengeId: string) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  currentGameId: null,
  gameState: null,
  playerList: [],
  chatMessages: [],
  pendingChallenges: [],
  setCurrentGameId: (gameId) => set({ currentGameId: gameId }),
  setGameState: (state) => set({ gameState: state }),
  setPlayerList: (players) => set({ playerList: players }),
  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, message]
  })),
  setChatMessages: (messages) => set({ chatMessages: messages }),
  addPendingChallenge: (challenge) => set((state) => ({
    pendingChallenges: [...state.pendingChallenges, challenge]
  })),
  removePendingChallenge: (challengeId) => set((state) => ({
    pendingChallenges: state.pendingChallenges.filter(c => c.id !== challengeId)
  }))
}));


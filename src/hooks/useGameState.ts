import { useState, useEffect, useCallback } from 'react';
import { GameState, GamePhase } from '../game/GameEngine';
import {
  subscribeToGameState,
  updateGameState,
  setPlayerData,
  generateGameId
} from '../supabase/config';

export interface UseGameStateReturn {
  gameState: GameState | null;
  loading: boolean;
  error: string | null;
  updateState: (updates: Partial<GameState>) => Promise<void>;
  updatePlayer: (playerId: 'player1' | 'player2', playerData: any) => Promise<void>;
  createGame: () => Promise<string>;
}

/**
 * Custom hook for managing game state with Supabase synchronization
 */
export function useGameState(gameId: string | null): UseGameStateReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToGameState(gameId, (state) => {
      setGameState(state);
      setLoading(false);
      if (!state) {
        setError('Game not found');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [gameId]);

  const updateState = useCallback(async (updates: Partial<GameState>) => {
    if (!gameId) {
      throw new Error('No game ID provided');
    }
    try {
      await updateGameState(gameId, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update game state');
      throw err;
    }
  }, [gameId]);

  const updatePlayer = useCallback(async (playerId: 'player1' | 'player2', playerData: any) => {
    if (!gameId) {
      throw new Error('No game ID provided');
    }
    try {
      await setPlayerData(gameId, playerId, playerData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update player data');
      throw err;
    }
  }, [gameId]);

  const createGame = useCallback(async (): Promise<string> => {
    try {
      const newGameId = generateGameId();
      return newGameId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
      throw err;
    }
  }, []);

  return {
    gameState,
    loading,
    error,
    updateState,
    updatePlayer,
    createGame
  };
}


import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GameState } from '../game/GameEngine';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

// Initialize Supabase client
let supabase: SupabaseClient;

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (error) {
  console.error('Supabase initialization error:', error);
  // Create a dummy client to prevent crashes
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
}

export { supabase };

// Database table names
export const TABLES = {
  GAMES: 'games',
  PLAYERS: 'players'
};

/**
 * Creates a new game room in Supabase
 */
export async function createGameRoom(gameId: string, initialState: GameState): Promise<void> {
  const { error } = await supabase
    .from(TABLES.GAMES)
    .insert({
      id: gameId,
      state: initialState,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error creating game room:', error);
    throw error;
  }
}

/**
 * Updates game state in Supabase
 */
export async function updateGameState(gameId: string, state: Partial<GameState>): Promise<void> {
  // First get current state
  const { data: currentData, error: fetchError } = await supabase
    .from(TABLES.GAMES)
    .select('state')
    .eq('id', gameId)
    .single();

  if (fetchError) {
    console.error('Error fetching game state:', fetchError);
    throw fetchError;
  }

  // Merge with updates
  const updatedState = {
    ...currentData.state,
    ...state
  };

  const { error } = await supabase
    .from(TABLES.GAMES)
    .update({
      state: updatedState,
      updated_at: new Date().toISOString()
    })
    .eq('id', gameId);

  if (error) {
    console.error('Error updating game state:', error);
    throw error;
  }
}

/**
 * Sets a player's data in Supabase
 */
export async function setPlayerData(
  gameId: string,
  playerId: 'player1' | 'player2',
  playerData: any
): Promise<void> {
  // Check if player record exists
  const { data: existing } = await supabase
    .from(TABLES.PLAYERS)
    .select('*')
    .eq('game_id', gameId)
    .eq('player_id', playerId)
    .single();

  const playerRecord = {
    game_id: gameId,
    player_id: playerId,
    data: playerData,
    updated_at: new Date().toISOString()
  };

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from(TABLES.PLAYERS)
      .update(playerRecord)
      .eq('game_id', gameId)
      .eq('player_id', playerId);

    if (error) {
      console.error('Error updating player data:', error);
      throw error;
    }
  } else {
    // Insert new record
    const { error } = await supabase
      .from(TABLES.PLAYERS)
      .insert(playerRecord);

    if (error) {
      console.error('Error creating player data:', error);
      throw error;
    }
  }

  // Also update the game state's players object
  const { data: gameData } = await supabase
    .from(TABLES.GAMES)
    .select('state')
    .eq('id', gameId)
    .single();

  if (gameData) {
    const updatedState = {
      ...gameData.state,
      players: {
        ...gameData.state.players,
        [playerId]: playerData
      }
    };

    await supabase
      .from(TABLES.GAMES)
      .update({
        state: updatedState,
        updated_at: new Date().toISOString()
      })
      .eq('id', gameId);
  }
}

/**
 * Subscribes to game state changes using Supabase Realtime
 */
export function subscribeToGameState(
  gameId: string,
  callback: (state: GameState | null) => void
): () => void {
  // Fetch initial state first
  supabase
    .from(TABLES.GAMES)
    .select('state')
    .eq('id', gameId)
    .single()
    .then(({ data, error }) => {
      if (error) {
        console.error('Error fetching initial game state:', error);
        callback(null);
      } else if (data && data.state) {
        callback(data.state as GameState);
      } else {
        callback(null);
      }
    });

  // Subscribe to changes
  const channel = supabase
    .channel(`game:${gameId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLES.GAMES,
        filter: `id=eq.${gameId}`
      },
      (payload) => {
        if (payload.new && 'state' in payload.new) {
          callback(payload.new.state as GameState);
        } else if (payload.eventType === 'DELETE') {
          callback(null);
        }
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribes to player data changes
 */
export function subscribeToPlayerData(
  gameId: string,
  playerId: 'player1' | 'player2',
  callback: (playerData: any) => void
): () => void {
  const channel = supabase
    .channel(`player:${gameId}:${playerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLES.PLAYERS,
        filter: `game_id=eq.${gameId} AND player_id=eq.${playerId}`
      },
      (payload) => {
        if (payload.new && 'data' in payload.new) {
          callback(payload.new.data);
        } else {
          callback(null);
        }
      }
    )
    .subscribe();

  // Fetch initial data
  supabase
    .from(TABLES.PLAYERS)
    .select('data')
    .eq('game_id', gameId)
    .eq('player_id', playerId)
    .single()
    .then(({ data, error }) => {
      if (!error && data) {
        callback(data.data);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Generates a unique game ID
 */
export function generateGameId(): string {
  // Generate a random ID
  return `game_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
}

/**
 * Checks if a game room exists
 */
export async function gameExists(gameId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(TABLES.GAMES)
    .select('id')
    .eq('id', gameId)
    .single();

  return !error && data !== null;
}


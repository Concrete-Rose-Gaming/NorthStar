import { supabase } from './config';
import { PlayerDeck } from '../game/DeckManager';
import { trackDeckCards, extractCardCodesFromDeck } from './cardTracking';

export interface SavedDeck {
  id: string;
  user_id: string | null;
  name: string;
  deck: PlayerDeck;
  created_at: string;
  updated_at: string;
  is_prebuilt?: boolean;
  description?: string;
  category?: string;
}

/**
 * Saves a deck for the current user
 */
export async function saveDeck(name: string, deck: PlayerDeck, deckId?: string): Promise<{ deck: SavedDeck | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { deck: null, error: new Error('User not authenticated') };
    }

    const deckData = {
      user_id: user.id,
      name,
      deck,
      updated_at: new Date().toISOString()
    };

    if (deckId) {
      // Update existing deck
      const { data, error } = await supabase
        .from('user_decks')
        .update(deckData)
        .eq('id', deckId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        return { deck: null, error: error as Error };
      }

      // Track cards in deck (only for new saves, not updates)
      const cardCounts = extractCardCodesFromDeck(deck);
      await trackDeckCards(cardCounts);

      return { deck: data as SavedDeck, error: null };
    } else {
      // Create new deck
      const { data, error } = await supabase
        .from('user_decks')
        .insert({
          ...deckData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return { deck: null, error: error as Error };
      }

      // Track cards in deck
      const cardCounts = extractCardCodesFromDeck(deck);
      await trackDeckCards(cardCounts);

      return { deck: data as SavedDeck, error: null };
    }
  } catch (error) {
    return { deck: null, error: error as Error };
  }
}

/**
 * Gets all decks for the current user
 */
export async function getUserDecks(): Promise<{ decks: SavedDeck[]; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { decks: [], error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase
      .from('user_decks')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      return { decks: [], error: error as Error };
    }

    return { decks: (data || []) as SavedDeck[], error: null };
  } catch (error) {
    return { decks: [], error: error as Error };
  }
}

/**
 * Gets a specific deck by ID
 */
export async function getDeck(deckId: string): Promise<{ deck: SavedDeck | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { deck: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase
      .from('user_decks')
      .select('*')
      .eq('id', deckId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return { deck: null, error: error as Error };
    }

    return { deck: data as SavedDeck, error: null };
  } catch (error) {
    return { deck: null, error: error as Error };
  }
}

/**
 * Deletes a deck
 */
export async function deleteDeck(deckId: string): Promise<{ error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    const { error } = await supabase
      .from('user_decks')
      .delete()
      .eq('id', deckId)
      .eq('user_id', user.id);

    return { error: error as Error | null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Exports a deck as JSON string
 */
export function exportDeck(deck: PlayerDeck, name: string): string {
  return JSON.stringify({ name, deck, version: '1.0' }, null, 2);
}

/**
 * Imports a deck from JSON string
 */
export function importDeck(jsonString: string): { name: string; deck: PlayerDeck; error: Error | null } {
  try {
    const data = JSON.parse(jsonString);
    if (!data.deck || !data.name) {
      return { name: '', deck: { mainDeck: [], chefCardId: '', restaurantCardIds: [] }, error: new Error('Invalid deck format') };
    }
    return { name: data.name, deck: data.deck, error: null };
  } catch (error) {
    return { name: '', deck: { mainDeck: [], chefCardId: '', restaurantCardIds: [] }, error: error as Error };
  }
}

/**
 * Gets all prebuilt decks (no authentication required)
 * Note: This requires a system account to be configured
 */
export async function getPrebuiltDecks(category?: string): Promise<{ decks: SavedDeck[]; error: Error | null }> {
  try {
    // For now, just return empty - system account implementation was removed
    // This will be implemented when system account is set up
    return { decks: [], error: null };
  } catch (error) {
    return { decks: [], error: error as Error };
  }
}

/**
 * Gets a specific prebuilt deck by ID (no authentication required)
 * Note: This requires a system account to be configured
 */
export async function getPrebuiltDeck(deckId: string): Promise<{ deck: SavedDeck | null; error: Error | null }> {
  try {
    // For now, just return null - system account implementation was removed
    // This will be implemented when system account is set up
    return { deck: null, error: null };
  } catch (error) {
    return { deck: null, error: error as Error };
  }
}

/**
 * Gets a prebuilt deck by name (no authentication required)
 * Useful for getting the practice deck by name
 * Note: This requires a system account to be configured
 */
export async function getPrebuiltDeckByName(name: string): Promise<{ deck: SavedDeck | null; error: Error | null }> {
  try {
    // For now, just return null - system account implementation was removed
    // This will be implemented when system account is set up
    return { deck: null, error: null };
  } catch (error) {
    return { deck: null, error: error as Error };
  }
}

import { supabase, isSupabaseConfigured } from './config';

export interface Card {
  code: string; // Format: EXPANSION-TYPE-NUMBER
  expansion: string;
  card_type: string; // CHEF, RESTAURANT, MEAL, STAFF, SUPPORT, EVENT
  card_number: number;
  name: string;
  description: string;
  effect: string | null;
  value: number | null;
  card_art: string | null;
  rarity: string | null;
  worth: number;
  created_at: string;
  updated_at: string;
  // Feeder table data (from LEFT JOINs - will be null if no matching feeder entry)
  chef_data?: {
    code: string;
    starting_influence?: number;
    star_bonus_influence?: number;
    Restaurant_Focus_1?: string; // Primary archetype
    Restaurant_Focus_2?: string; // Secondary archetype (if dual)
  } | null;
  restaurant_data?: {
    code: string;
    Restaurant_Focus_1?: string; // Primary archetype
    Restaurant_Focus_2?: string; // Secondary archetype (if dual)
    required_stars?: number; // Minimum star ranking required for effect to activate
  } | null;
  meal_data?: {
    code: string;
    food_type?: string;
    influence_cost?: number;
    second_enum?: string;
  } | null;
  staff_data?: {
    code: string;
    employee_type?: string;
    influence_cost?: number;
    second_enum?: string;
  } | null;
  event_data?: {
    code: string;
    influence_cost?: number;
    first_enum?: string;
    second_enum?: string;
  } | null;
}

export interface CardStats {
  card_code: string;
  times_played: number;
  decks_saved_in: number;
  total_copies_in_decks: number;
  times_in_winning_play: number;
  times_in_losing_play: number;
  updated_at: string;
}

export interface CardWithStats extends Card {
  stats: CardStats;
}

/**
 * Generates a card code from expansion, type, and number
 */
export function generateCardCode(expansion: string, cardType: string, cardNumber: number): string {
  return `${expansion}-${cardType}-${cardNumber.toString().padStart(3, '0')}`;
}

/**
 * Parses a card code into its components
 */
export function parseCardCode(code: string): { expansion: string; cardType: string; cardNumber: number } | null {
  const parts = code.split('-');
  if (parts.length !== 3) return null;
  
  const cardNumber = parseInt(parts[2], 10);
  if (isNaN(cardNumber)) return null;
  
  return {
    expansion: parts[0],
    cardType: parts[1],
    cardNumber
  };
}

/**
 * Gets all cards with feeder table data using LEFT JOINs
 */
export async function getAllCards(): Promise<{ cards: Card[]; error: Error | null }> {
  // If Supabase is not configured, immediately return error without making requests
  if (!isSupabaseConfigured()) {
    return { 
      cards: [], 
      error: new Error('Supabase not configured') 
    };
  }

  try {
    const { data, error } = await supabase
      .from('cards')
      .select(`
        *,
        chef_data:chef_cards(code, starting_influence, star_bonus_influence, Restaurant_Focus_1, Restaurant_Focus_2),
        restaurant_data:restaurant_cards(code, Restaurant_Focus_1, Restaurant_Focus_2, required_stars),
        meal_data:meal_cards(code, food_type, influence_cost, restaurant_type_1, restaurant_type_2),
        staff_data:staff_cards(code, employee_type, influence_cost, restaurant_type),
        event_data:event_cards(code, influence_cost)
      `)
      .order('expansion', { ascending: true })
      .order('card_type', { ascending: true })
      .order('card_number', { ascending: true });

    if (error) {
      return { cards: [], error: error as Error };
    }

    // #region agent log
    if (process.env.NODE_ENV === 'development') {
      const restaurantCards = (data || []).filter((c: any) => c.card_type === 'RESTAURANT');
      if (restaurantCards.length > 0) {
        const sampleCard = restaurantCards[0];
        fetch('http://127.0.0.1:7243/ingest/7a7fd3b5-e53c-4371-aace-6042bdec0cdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cards.ts:119',message:'Supabase query result for restaurant card',data:{cardCode:sampleCard.code,cardName:sampleCard.name,hasRestaurantData:!!sampleCard.restaurant_data,restaurantData:sampleCard.restaurant_data,restaurantFocus1:sampleCard.restaurant_data?.Restaurant_Focus_1,totalRestaurantCards:restaurantCards.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      }
    }
    // #endregion

    return { cards: (data || []) as Card[], error: null };
  } catch (error) {
    return { cards: [], error: error as Error };
  }
}

/**
 * Gets a card by code
 */
export async function getCardByCode(code: string): Promise<{ card: Card | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      return { card: null, error: error as Error };
    }

    return { card: data as Card, error: null };
  } catch (error) {
    return { card: null, error: error as Error };
  }
}

/**
 * Gets cards by type
 */
export async function getCardsByType(cardType: string): Promise<{ cards: Card[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('card_type', cardType)
      .order('card_number', { ascending: true });

    if (error) {
      return { cards: [], error: error as Error };
    }

    return { cards: (data || []) as Card[], error: null };
  } catch (error) {
    return { cards: [], error: error as Error };
  }
}

/**
 * Gets cards by expansion
 */
export async function getCardsByExpansion(expansion: string): Promise<{ cards: Card[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('expansion', expansion)
      .order('card_type', { ascending: true })
      .order('card_number', { ascending: true });

    if (error) {
      return { cards: [], error: error as Error };
    }

    return { cards: (data || []) as Card[], error: null };
  } catch (error) {
    return { cards: [], error: error as Error };
  }
}

/**
 * Gets a card with its statistics
 */
export async function getCardWithStats(code: string): Promise<{ card: CardWithStats | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select(`
        *,
        stats:card_stats(*)
      `)
      .eq('code', code)
      .single();

    if (error) {
      return { card: null, error: error as Error };
    }

    return { 
      card: {
        ...data as Card,
        stats: (data as any).stats as CardStats
      }, 
      error: null 
    };
  } catch (error) {
    return { card: null, error: error as Error };
  }
}

/**
 * Creates a new card
 */
export async function createCard(card: Omit<Card, 'code' | 'created_at' | 'updated_at'> & { code?: string }): Promise<{ card: Card | null; error: Error | null }> {
  try {
    // Generate code if not provided
    const code = card.code || generateCardCode(card.expansion, card.card_type, card.card_number);
    
    const { data, error } = await supabase
      .from('cards')
      .insert({
        code,
        expansion: card.expansion,
        card_type: card.card_type,
        card_number: card.card_number,
        name: card.name,
        description: card.description,
        effect: card.effect || null,
        value: card.value || null,
        card_art: card.card_art || null,
        rarity: card.rarity || null,
        worth: card.worth || 0
      })
      .select()
      .single();

    if (error) {
      return { card: null, error: error as Error };
    }

    return { card: data as Card, error: null };
  } catch (error) {
    return { card: null, error: error as Error };
  }
}

/**
 * Updates a card
 */
export async function updateCard(code: string, updates: Partial<Omit<Card, 'code' | 'created_at' | 'updated_at'>>): Promise<{ card: Card | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('cards')
      .update(updates)
      .eq('code', code)
      .select()
      .single();

    if (error) {
      return { card: null, error: error as Error };
    }

    return { card: data as Card, error: null };
  } catch (error) {
    return { card: null, error: error as Error };
  }
}

/**
 * Gets card statistics
 */
export async function getCardStats(code: string): Promise<{ stats: CardStats | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('card_stats')
      .select('*')
      .eq('card_code', code)
      .single();

    if (error) {
      return { stats: null, error: error as Error };
    }

    return { stats: data as CardStats, error: null };
  } catch (error) {
    return { stats: null, error: error as Error };
  }
}

/**
 * Increments card play count
 */
export async function incrementCardPlayed(code: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.rpc('increment_card_played', { card_code: code });
    
    if (error) {
      // Fallback to manual update if RPC doesn't exist
      const { data: current } = await supabase
        .from('card_stats')
        .select('times_played')
        .eq('card_code', code)
        .single();

      const newCount = ((current?.times_played as number) || 0) + 1;
      
      const { error: updateError } = await supabase
        .from('card_stats')
        .update({ times_played: newCount })
        .eq('card_code', code);

      return { error: updateError as Error | null };
    }

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Updates card deck statistics
 */
export async function updateCardDeckStats(code: string, copies: number): Promise<{ error: Error | null }> {
  try {
    // Get current stats
    const { data: current } = await supabase
      .from('card_stats')
      .select('decks_saved_in, total_copies_in_decks')
      .eq('card_code', code)
      .single();

    const currentDecks = (current?.decks_saved_in as number) || 0;
    const currentCopies = (current?.total_copies_in_decks as number) || 0;

    // Increment deck count if this is a new deck, add copies
    const newDecks = currentDecks + (copies > 0 ? 1 : 0);
    const newCopies = currentCopies + copies;

    const { error } = await supabase
      .from('card_stats')
      .update({
        decks_saved_in: newDecks,
        total_copies_in_decks: newCopies
      })
      .eq('card_code', code);

    return { error: error as Error | null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Increments winning play count
 */
export async function incrementWinningPlay(code: string): Promise<{ error: Error | null }> {
  try {
    const { data: current } = await supabase
      .from('card_stats')
      .select('times_in_winning_play')
      .eq('card_code', code)
      .single();

    const newCount = ((current?.times_in_winning_play as number) || 0) + 1;

    const { error } = await supabase
      .from('card_stats')
      .update({ times_in_winning_play: newCount })
      .eq('card_code', code);

    return { error: error as Error | null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Increments losing play count
 */
export async function incrementLosingPlay(code: string): Promise<{ error: Error | null }> {
  try {
    const { data: current } = await supabase
      .from('card_stats')
      .select('times_in_losing_play')
      .eq('card_code', code)
      .single();

    const newCount = ((current?.times_in_losing_play as number) || 0) + 1;

    const { error } = await supabase
      .from('card_stats')
      .update({ times_in_losing_play: newCount })
      .eq('card_code', code);

    return { error: error as Error | null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Batch update card statistics (for performance)
 */
export async function batchUpdateCardStats(updates: Array<{
  code: string;
  times_played?: number;
  decks_saved_in?: number;
  total_copies_in_decks?: number;
  times_in_winning_play?: number;
  times_in_losing_play?: number;
}>): Promise<{ error: Error | null }> {
  try {
    // Get current stats for all cards
    const codes = updates.map(u => u.code);
    const { data: currentStats } = await supabase
      .from('card_stats')
      .select('*')
      .in('card_code', codes);

    const statsMap = new Map((currentStats || []).map(s => [s.card_code, s]));

    // Prepare updates
    const dbUpdates = updates.map(update => {
      const current = statsMap.get(update.code) as any;
      return {
        card_code: update.code,
        times_played: update.times_played !== undefined 
          ? update.times_played 
          : (current?.times_played || 0),
        decks_saved_in: update.decks_saved_in !== undefined
          ? update.decks_saved_in
          : (current?.decks_saved_in || 0),
        total_copies_in_decks: update.total_copies_in_decks !== undefined
          ? update.total_copies_in_decks
          : (current?.total_copies_in_decks || 0),
        times_in_winning_play: update.times_in_winning_play !== undefined
          ? update.times_in_winning_play
          : (current?.times_in_winning_play || 0),
        times_in_losing_play: update.times_in_losing_play !== undefined
          ? update.times_in_losing_play
          : (current?.times_in_losing_play || 0)
      };
    });

    // Batch update (Supabase doesn't have native batch update, so we'll do individual updates)
    // For better performance, consider using a stored procedure
    for (const update of dbUpdates) {
      const { error } = await supabase
        .from('card_stats')
        .update(update)
        .eq('card_code', update.card_code);
      
      if (error) {
        return { error: error as Error };
      }
    }

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}


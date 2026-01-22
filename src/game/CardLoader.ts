import { getAllCards } from '../supabase/cards';
import { Card as SupabaseCard } from '../supabase/cards';
import { Card, CardType, CardRegistry, ChefCard, RestaurantCard, MealCard, StaffCard, SupportCard, EventCard } from './CardTypes';

/**
 * Converts a Supabase card to a game card
 * Extracts data from nested feeder table structures (from JOIN queries)
 */
function convertSupabaseCardToGameCard(supabaseCard: SupabaseCard): Card {
  const baseCard = {
    id: supabaseCard.code, // Use code as ID
    name: supabaseCard.name,
    description: supabaseCard.description,
    type: supabaseCard.card_type as CardType
  };

  switch (supabaseCard.card_type) {
    case 'CHEF': {
      const chefData = supabaseCard.chef_data;
      return {
        ...baseCard,
        type: CardType.CHEF,
        baseValue: supabaseCard.value || 0,
        ability: supabaseCard.effect || '',
        abilityDescription: supabaseCard.description,
        startingInfluence: chefData?.starting_influence ?? 3, // Default 3, from feeder table
        starBonusInfluence: chefData?.star_bonus_influence ?? 1, // Default 1, from feeder table
        primaryArchetype: chefData?.Restaurant_Focus_1 || undefined, // Primary archetype from Restaurant_Focus_1
        secondaryArchetype: chefData?.Restaurant_Focus_2 || undefined // Secondary archetype from Restaurant_Focus_2 (optional)
      } as ChefCard;
    }

    case 'RESTAURANT': {
      const restaurantData = supabaseCard.restaurant_data;
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7a7fd3b5-e53c-4371-aace-6042bdec0cdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CardLoader.ts:34',message:'Converting restaurant card',data:{cardCode:supabaseCard.code,cardName:supabaseCard.name,hasRestaurantData:!!restaurantData,restaurantData:restaurantData,restaurantFocus1:restaurantData?.Restaurant_Focus_1,primaryArchetypeResult:restaurantData?.Restaurant_Focus_1 || undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const primaryArchetype = restaurantData?.Restaurant_Focus_1 || undefined;
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7a7fd3b5-e53c-4371-aace-6042bdec0cdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CardLoader.ts:44',message:'Restaurant card conversion result',data:{cardCode:supabaseCard.code,primaryArchetype:primaryArchetype,hasPrimaryArchetype:!!primaryArchetype},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return {
        ...baseCard,
        type: CardType.RESTAURANT,
        baseScore: supabaseCard.value || 0,
        ability: supabaseCard.effect || '',
        abilityCondition: '', // TODO: Add abilityCondition field to Supabase schema
        abilityDescription: supabaseCard.description,
        primaryArchetype: primaryArchetype, // Restaurant archetype from Restaurant_Focus_1
        requiredStars: restaurantData?.required_stars ?? 0 // Default to 0 if not specified
      } as RestaurantCard;
    }

    case 'MEAL': {
      const mealData = supabaseCard.meal_data;
      return {
        ...baseCard,
        type: CardType.MEAL,
        value: supabaseCard.value || 0,
        effect: supabaseCard.effect || undefined,
        effectDescription: supabaseCard.effect ? supabaseCard.description : undefined,
        influenceCost: mealData?.influence_cost ?? 1, // Default 1, from feeder table
        mealArchetype: mealData?.food_type || undefined // Food type enum maps to meal archetype
      } as MealCard;
    }

    case 'STAFF': {
      const staffData = supabaseCard.staff_data;
      return {
        ...baseCard,
        type: CardType.STAFF,
        ability: supabaseCard.effect || '',
        abilityDescription: supabaseCard.description,
        modifier: supabaseCard.value || undefined,
        influenceCost: staffData?.influence_cost ?? 2, // Default 2, from feeder table
        staffArchetype: staffData?.employee_type || undefined // Employee type enum maps to staff archetype
      } as StaffCard;
    }

    case 'SUPPORT':
      return {
        ...baseCard,
        type: CardType.SUPPORT,
        ability: supabaseCard.effect || '',
        abilityDescription: supabaseCard.description,
        duration: 'instant' as const // Default, could be stored in effect field
      } as SupportCard;

    case 'EVENT': {
      const eventData = supabaseCard.event_data;
      return {
        ...baseCard,
        type: CardType.EVENT,
        effect: supabaseCard.effect || '',
        effectDescription: supabaseCard.description,
        target: 'opponent' as const, // Default, could be parsed from effect
        influenceCost: eventData?.influence_cost ?? 2 // Default 2, from feeder table
      } as EventCard;
    }

    default:
      throw new Error(`Unknown card type: ${supabaseCard.card_type}`);
  }
}

/**
 * Card registry that's populated from Supabase
 */
let cardRegistry: CardRegistry = {};
let cardRegistryPromise: Promise<CardRegistry> | null = null;
let isLoaded = false;

/**
 * Loads all cards from Supabase and populates the registry
 */
export async function loadCardsFromSupabase(): Promise<CardRegistry> {
  // If already loaded, return cached registry
  if (isLoaded) {
    return cardRegistry;
  }

  // If loading in progress, return the same promise
  if (cardRegistryPromise) {
    return cardRegistryPromise;
  }

  // Start loading
  cardRegistryPromise = (async () => {
    try {
      const { cards, error } = await getAllCards();

      if (error) {
        // Check if this is a "not configured" error (expected) vs actual connection error
        const isNotConfigured = error.message === 'Supabase not configured';
        
        // Only log actual errors, not expected "not configured" messages
        if (!isNotConfigured && process.env.NODE_ENV === 'development') {
          console.error('Failed to load cards from Supabase:', error);
          console.warn('Falling back to local card definitions');
        }
        
        // Silently fall back to local cards
        const { CARD_DEFINITIONS } = require('./CardTypes');
        cardRegistry = CARD_DEFINITIONS;
        isLoaded = true;
        return CARD_DEFINITIONS;
      }

      // Convert Supabase cards to game cards
      const registry: CardRegistry = {};
      const restaurantCardsFromSupabase = cards.filter(c => c.card_type === 'RESTAURANT');
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7a7fd3b5-e53c-4371-aace-6042bdec0cdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CardLoader.ts:139',message:'Starting card conversion',data:{totalCards:cards.length,restaurantCardCount:restaurantCardsFromSupabase.length,isUsingFallback:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      for (const supabaseCard of cards) {
        try {
          const gameCard = convertSupabaseCardToGameCard(supabaseCard);
          registry[gameCard.id] = gameCard;
          // #region agent log
          if (gameCard.type === CardType.RESTAURANT) {
            const restaurantCard = gameCard as RestaurantCard;
            fetch('http://127.0.0.1:7243/ingest/7a7fd3b5-e53c-4371-aace-6042bdec0cdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CardLoader.ts:145',message:'Restaurant card added to registry',data:{cardId:restaurantCard.id,cardName:restaurantCard.name,primaryArchetype:restaurantCard.primaryArchetype,hasPrimaryArchetype:!!restaurantCard.primaryArchetype},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          }
          // #endregion
        } catch (err) {
          console.error(`Failed to convert card ${supabaseCard.code}:`, err);
        }
      }

      // If no cards were loaded from Supabase, fallback to local
      if (Object.keys(registry).length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('No cards loaded from Supabase, falling back to local definitions');
        }
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/7a7fd3b5-e53c-4371-aace-6042bdec0cdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CardLoader.ts:149',message:'Using fallback local definitions',data:{reason:'No cards loaded from Supabase'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        const { CARD_DEFINITIONS } = require('./CardTypes');
        cardRegistry = CARD_DEFINITIONS;
        isLoaded = true;
        return CARD_DEFINITIONS;
      }

      cardRegistry = registry;
      isLoaded = true;
      if (process.env.NODE_ENV === 'development') {
        console.log(`Loaded ${Object.keys(registry).length} cards from Supabase`);
      }
      return registry;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading cards:', error);
      }
      // Fallback to local cards on any error
      try {
        const { CARD_DEFINITIONS } = require('./CardTypes');
        cardRegistry = CARD_DEFINITIONS;
        isLoaded = true;
        if (process.env.NODE_ENV === 'development') {
          console.warn('Using local card definitions as fallback');
        }
        return CARD_DEFINITIONS;
      } catch (fallbackError) {
        console.error('Failed to load fallback cards:', fallbackError);
        cardRegistryPromise = null; // Reset so we can retry
        throw error;
      }
    }
  })();

  return cardRegistryPromise;
}

/**
 * Gets the card registry (returns empty registry if not loaded yet)
 */
export function getCardRegistry(): CardRegistry {
  if (!isLoaded) {
    console.warn('Cards not loaded yet. Returning empty registry.');
    return {};
  }
  return cardRegistry;
}

/**
 * Checks if cards are loaded
 */
export function areCardsLoaded(): boolean {
  return isLoaded;
}

/**
 * Resets the card registry (useful for testing or reloading)
 */
export function resetCardRegistry(): void {
  cardRegistry = {};
  cardRegistryPromise = null;
  isLoaded = false;
}


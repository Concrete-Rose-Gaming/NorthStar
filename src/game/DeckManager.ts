import { CardType, getCardById, isValidCardId, ChefCard, RestaurantCard, MealCard, StaffCard } from './CardTypes';
import { getCardRegistry } from './CardLoader';

// Deck is represented as an array of card IDs (strings)
export type Deck = string[];

// Complete player deck structure - Chef and Restaurant cards are separate from main deck
export interface PlayerDeck {
  mainDeck: Deck;           // 30 cards: Meals, Staff, Support, Event only
  chefCardId: string;       // 1 Chef card (separate)
  restaurantCardIds: string[]; // 3 Restaurant cards (separate)
}

// Deck validation result
export interface DeckValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Deck statistics
export interface DeckStats {
  totalCards: number;
  chefCount: number;
  restaurantCount: number;
  mealCount: number;
  staffCount: number;
  supportCount: number;
  eventCount: number;
  cardCounts: Record<string, number>;
}

/**
 * Validates the main deck (30 cards - Meals, Staff, Support, Event only)
 * Chef and Restaurant cards are NOT part of the main deck
 */
export function validateMainDeck(deck: Deck): DeckValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check total card count
  if (deck.length !== 30) {
    errors.push(`Main deck must have exactly 30 cards, but has ${deck.length}`);
  }

  // Validate all card IDs exist
  const invalidIds = deck.filter(id => !isValidCardId(id));
  if (invalidIds.length > 0) {
    errors.push(`Invalid card IDs found: ${invalidIds.join(', ')}`);
  }

  // Count cards by type
  const stats = getDeckStats(deck);
  
  // Check that no Chef or Restaurant cards are in main deck
  if (stats.chefCount > 0) {
    errors.push(`Main deck cannot contain Chef cards. Found ${stats.chefCount}`);
  }

  if (stats.restaurantCount > 0) {
    errors.push(`Main deck cannot contain Restaurant cards. Found ${stats.restaurantCount}`);
  }

  // Check for duplicate limits (max 3 of same card ID)
  Object.entries(stats.cardCounts).forEach(([cardId, count]) => {
    if (count > 3) {
      errors.push(`Card ${cardId} appears ${count} times, maximum is 3`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates a complete player deck structure (main deck + Chef + Restaurants)
 */
export function validatePlayerDeck(playerDeck: PlayerDeck): DeckValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate main deck
  const mainDeckResult = validateMainDeck(playerDeck.mainDeck);
  errors.push(...mainDeckResult.errors);
  warnings.push(...mainDeckResult.warnings);

  // Validate Chef card
  if (!playerDeck.chefCardId) {
    errors.push('Chef card is required');
  } else if (!isValidCardId(playerDeck.chefCardId)) {
    errors.push(`Invalid Chef card ID: ${playerDeck.chefCardId}`);
  } else {
    const chefCard = getCardById(playerDeck.chefCardId);
    if (chefCard && chefCard.type !== CardType.CHEF) {
      errors.push(`Card ${playerDeck.chefCardId} is not a Chef card`);
    }
  }

  // Validate Restaurant cards
  if (playerDeck.restaurantCardIds.length !== 3) {
    errors.push(`Must have exactly 3 Restaurant cards, but have ${playerDeck.restaurantCardIds.length}`);
  } else {
    playerDeck.restaurantCardIds.forEach((restaurantId, index) => {
      if (!isValidCardId(restaurantId)) {
        errors.push(`Invalid Restaurant card ID at position ${index + 1}: ${restaurantId}`);
      } else {
        const restaurantCard = getCardById(restaurantId);
        if (restaurantCard && restaurantCard.type !== CardType.RESTAURANT) {
          errors.push(`Card ${restaurantId} is not a Restaurant card`);
        }
      }
    });

    // Check for duplicate restaurants
    const uniqueRestaurants = new Set(playerDeck.restaurantCardIds);
    if (uniqueRestaurants.size !== 3) {
      errors.push('Restaurant cards must be unique (no duplicates)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * @deprecated Use validateMainDeck or validatePlayerDeck instead
 * Kept for backward compatibility during migration
 */
export function validateDeck(deck: Deck): DeckValidationResult {
  return validateMainDeck(deck);
}

/**
 * Gets statistics about a deck
 */
export function getDeckStats(deck: Deck): DeckStats {
  const cardCounts: Record<string, number> = {};
  const typeCounts = {
    chef: 0,
    restaurant: 0,
    meal: 0,
    staff: 0,
    support: 0,
    event: 0
  };

  deck.forEach(cardId => {
    // Count occurrences of each card ID
    cardCounts[cardId] = (cardCounts[cardId] || 0) + 1;

    // Count by type
    const card = getCardById(cardId);
    if (card) {
      switch (card.type) {
        case CardType.CHEF:
          typeCounts.chef++;
          break;
        case CardType.RESTAURANT:
          typeCounts.restaurant++;
          break;
        case CardType.MEAL:
          typeCounts.meal++;
          break;
        case CardType.STAFF:
          typeCounts.staff++;
          break;
        case CardType.SUPPORT:
          typeCounts.support++;
          break;
        case CardType.EVENT:
          typeCounts.event++;
          break;
      }
    }
  });

  return {
    totalCards: deck.length,
    chefCount: typeCounts.chef,
    restaurantCount: typeCounts.restaurant,
    mealCount: typeCounts.meal,
    staffCount: typeCounts.staff,
    supportCount: typeCounts.support,
    eventCount: typeCounts.event,
    cardCounts
  };
}

/**
 * Shuffles a deck using Fisher-Yates algorithm
 */
export function shuffleDeck(deck: Deck): Deck {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Draws cards from the top of the deck
 */
export function drawCards(deck: Deck, count: number): { drawn: Deck; remaining: Deck } {
  const drawn = deck.slice(0, count);
  const remaining = deck.slice(count);
  return { drawn, remaining };
}

/**
 * Adds cards to the bottom of the deck
 */
export function addToBottom(deck: Deck, cards: Deck): Deck {
  return [...deck, ...cards];
}

/**
 * Removes specific card IDs from deck (returns first occurrence of each)
 */
export function removeCards(deck: Deck, cardIds: string[]): Deck {
  const result = [...deck];
  cardIds.forEach(cardId => {
    const index = result.indexOf(cardId);
    if (index !== -1) {
      result.splice(index, 1);
    }
  });
  return result;
}

/**
 * Creates a default starter player deck (for testing/quick start)
 * Includes: 1 Chef, 3 Restaurants (separate), and 30 main deck cards
 */
export function createDefaultPlayerDeck(): PlayerDeck {
  const registry = getCardRegistry();
  
  // Get Chef card
  const chefs = Object.keys(registry).filter(id => 
    registry[id].type === CardType.CHEF
  );
  const chefCardId = chefs.length > 0 ? chefs[0] : '';

  // Get 3 Restaurant cards
  const restaurants = Object.keys(registry).filter(id => 
    registry[id].type === CardType.RESTAURANT
  );
  const restaurantCardIds = restaurants.slice(0, 3);

  // Build main deck (30 cards - Meals, Staff, Support, Event only)
  const mainDeck: Deck = [];
  const otherCards = Object.keys(registry).filter(id => {
    const card = registry[id];
    return card.type !== CardType.CHEF && card.type !== CardType.RESTAURANT;
  });

  // Add cards up to 30
  const cardCounts: Record<string, number> = {};
  while (mainDeck.length < 30 && otherCards.length > 0) {
    // Pick a random card from available
    const randomIndex = Math.floor(Math.random() * otherCards.length);
    const cardId = otherCards[randomIndex];
    
    cardCounts[cardId] = (cardCounts[cardId] || 0) + 1;
    
    if (cardCounts[cardId] <= 3) {
      mainDeck.push(cardId);
    } else {
      // Remove this card from available list if we've reached max
      otherCards.splice(randomIndex, 1);
    }
  }

  return {
    mainDeck: shuffleDeck(mainDeck),
    chefCardId,
    restaurantCardIds
  };
}

/**
 * Creates "The Balanced Chef" starter deck
 * A well-rounded deck with good mix of all card types
 */
export function createStarterDeck1(): PlayerDeck {
  return {
    chefCardId: 'chef_001', // Master Chef Pierre - +2 to all Meal cards
    restaurantCardIds: ['restaurant_001', 'restaurant_003', 'restaurant_004'], // Le Grand Bistro, Ocean Breeze, Mountain View
    mainDeck: [
      // Meals - 12 cards (mix of values)
      'meal_001', 'meal_001', // Signature Burger x2
      'meal_003', 'meal_003', // Grilled Salmon x2
      'meal_005', 'meal_005', // Caesar Salad x2
      'meal_007', // Chocolate Soufflé
      'meal_008', 'meal_008', // Sushi Platter x2
      'meal_011', 'meal_011', // Ramen Bowl x2
      'meal_013', // Fish Tacos
      // Staff - 9 cards
      'staff_001', 'staff_001', 'staff_001', // Head Waiter x3
      'staff_002', 'staff_002', // Sous Chef x2
      'staff_003', // Sommelier
      'staff_005', // Host
      'staff_006', 'staff_006', // Line Cook x2
      // Support - 6 cards
      'support_001', 'support_001', // Fresh Ingredients x2
      'support_002', // Renovation
      'support_003', // Marketing Campaign
      'support_005', 'support_005', // VIP Service x2
      // Events - 3 cards
      'event_001', // Kitchen Fire
      'event_003', // Rush Hour
      'event_005', // Celebrity Visit
    ]
  };
}

/**
 * Creates "The High Roller" starter deck
 * Focus on high-value meals and aggressive playstyle
 */
export function createStarterDeck2(): PlayerDeck {
  return {
    chefCardId: 'chef_005', // Chef Marcus - Extra star on win
    restaurantCardIds: ['restaurant_002', 'restaurant_006', 'restaurant_007'], // The Spice Market, Skyline Terrace, The Rustic Inn
    mainDeck: [
      // Meals - 12 cards (higher value focus)
      'meal_002', 'meal_002', // Truffle Pasta x2
      'meal_004', 'meal_004', // Ribeye Steak x2
      'meal_006', 'meal_006', // Lobster Bisque x2
      'meal_008', 'meal_008', // Sushi Platter x2
      'meal_010', 'meal_010', // Wagyu Beef x2 (high value!)
      'meal_012', // Duck Confit
      'meal_014', // Beef Wellington
      // Staff - 8 cards
      'staff_001', 'staff_001', // Head Waiter x2
      'staff_002', 'staff_002', // Sous Chef x2
      'staff_003', 'staff_003', // Sommelier x2
      'staff_007', 'staff_007', // Bartender x2
      // Support - 7 cards
      'support_001', // Fresh Ingredients
      'support_002', 'support_002', // Renovation x2
      'support_003', 'support_003', // Marketing Campaign x2
      'support_004', // Special Menu
      'support_006', // Food Critic Visit
      // Events - 3 cards
      'event_002', // Health Inspection
      'event_004', // Food Shortage
      'event_008', // Bad Review
    ]
  };
}

/**
 * Creates a practice deck for new players (fallback hardcoded version)
 * A well-balanced deck designed for learning the game mechanics
 * Features a mix of all card types with clear, easy-to-understand effects
 * Uses PROTOTYPE-SET-NUMBER format for card IDs
 */
export function createPracticeDeckFallback(): PlayerDeck {
  return {
    chefCardId: 'PROTOTYPE-CHEF-001', // Master Chef Pierre - Simple +2 to all Meal cards ability
    restaurantCardIds: ['PROTOTYPE-RESTAURANT-001', 'PROTOTYPE-RESTAURANT-003', 'PROTOTYPE-RESTAURANT-004'], // Le Grand Bistro, Ocean Breeze, Mountain View
    mainDeck: [
      // Meals - 15 cards (good variety of values for learning)
      'PROTOTYPE-MEAL-001', 'PROTOTYPE-MEAL-001', 'PROTOTYPE-MEAL-001', // Signature Burger x3
      'PROTOTYPE-MEAL-003', 'PROTOTYPE-MEAL-003', // Grilled Salmon x2
      'PROTOTYPE-MEAL-005', 'PROTOTYPE-MEAL-005', // Caesar Salad x2
      'PROTOTYPE-MEAL-007', 'PROTOTYPE-MEAL-007', // Chocolate Soufflé x2
      'PROTOTYPE-MEAL-008', 'PROTOTYPE-MEAL-008', // Sushi Platter x2
      'PROTOTYPE-MEAL-011', 'PROTOTYPE-MEAL-011', // Ramen Bowl x2
      'PROTOTYPE-MEAL-013', 'PROTOTYPE-MEAL-013', // Fish Tacos x2
      // Staff - 9 cards (variety of staff abilities)
      'PROTOTYPE-STAFF-001', 'PROTOTYPE-STAFF-001', 'PROTOTYPE-STAFF-001', // Head Waiter x3 (simple +1 to all meals)
      'PROTOTYPE-STAFF-002', 'PROTOTYPE-STAFF-002', // Sous Chef x2 (add +2 to one meal)
      'PROTOTYPE-STAFF-003', // Sommelier (add +1 to restaurant base)
      'PROTOTYPE-STAFF-005', 'PROTOTYPE-STAFF-005', // Host x2 (draw extra card)
      'PROTOTYPE-STAFF-006', // Line Cook (reduce opponent score)
      // Support - 4 cards (different durations)
      'PROTOTYPE-SUPPORT-001', 'PROTOTYPE-SUPPORT-001', // Fresh Ingredients x2 (round duration)
      'PROTOTYPE-SUPPORT-002', // Renovation (permanent)
      'PROTOTYPE-SUPPORT-005', // VIP Service (round duration)
      // Events - 2 cards (different targets)
      'PROTOTYPE-EVENT-001', // Kitchen Fire (opponent)
      'PROTOTYPE-EVENT-003', // Rush Hour (both players)
    ]
  };
}

/**
 * Creates a practice deck for new players
 * Tries to load from Supabase first, falls back to hardcoded version if unavailable
 * A well-balanced deck designed for learning the game mechanics
 */
export async function createPracticeDeck(): Promise<PlayerDeck> {
  try {
    // Try to load from Supabase (dynamic import to avoid circular dependency)
    const { getPrebuiltDeckByName } = await import('../supabase/decks');
    const { deck, error } = await getPrebuiltDeckByName('Practice Deck');
    
    if (!error && deck && deck.deck) {
      // Validate the deck before returning
      const validation = validatePlayerDeck(deck.deck);
      if (validation.isValid) {
        return deck.deck;
      }
      // If invalid, fall through to fallback
      console.warn('Practice deck from Supabase failed validation, using fallback:', validation.errors);
    }
  } catch (error) {
    // Supabase not available or error loading - use fallback
    console.error('Practice deck not available from Supabase, using fallback:', error);
  }
  
  // Fallback to hardcoded version
  return createPracticeDeckFallback();
}

/**
 * Synchronous version for backwards compatibility
 * Use createPracticeDeck() (async) when possible
 */
export function createPracticeDeckSync(): PlayerDeck {
  return createPracticeDeckFallback();
}

/**
 * @deprecated Use createDefaultPlayerDeck instead
 * Kept for backward compatibility
 */
export function createDefaultDeck(): Deck {
  const playerDeck = createDefaultPlayerDeck();
  // Return just the main deck for backward compatibility
  return playerDeck.mainDeck;
}

/**
 * Randomly selects one Restaurant card from the player's 3 Restaurant cards
 */
export function selectRandomRestaurant(restaurantCardIds: string[]): string | null {
  if (restaurantCardIds.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * restaurantCardIds.length);
  return restaurantCardIds[randomIndex];
}

/**
 * Checks if a restaurant matches any of the chef's archetypes
 */
export function restaurantMatchesChefArchetype(
  restaurantCard: RestaurantCard,
  chefCard: ChefCard
): boolean {
  // If restaurant has no archetype, it doesn't match
  if (!restaurantCard.primaryArchetype) {
    return false;
  }
  
  // Get chef's archetypes (primary and optional secondary)
  const chefArchetypes = [chefCard.primaryArchetype];
  if (chefCard.secondaryArchetype) {
    chefArchetypes.push(chefCard.secondaryArchetype);
  }
  
  // Restaurant matches if its archetype matches any of the chef's archetypes
  return chefArchetypes.includes(restaurantCard.primaryArchetype);
}

/**
 * Checks if a meal card matches any of the chef's archetypes
 */
export function mealMatchesChefArchetype(
  mealCard: MealCard,
  chefCard: ChefCard
): boolean {
  if (!mealCard.mealArchetype) {
    return false; // Meal must have an archetype to match
  }
  
  const chefArchetypes = [chefCard.primaryArchetype];
  if (chefCard.secondaryArchetype) {
    chefArchetypes.push(chefCard.secondaryArchetype);
  }
  
  return chefArchetypes.includes(mealCard.mealArchetype);
}

/**
 * Checks if a staff card matches any of the chef's archetypes
 */
export function staffMatchesChefArchetype(
  staffCard: StaffCard,
  chefCard: ChefCard
): boolean {
  if (!staffCard.staffArchetype) {
    return false; // Staff must have an archetype to match
  }
  
  const chefArchetypes = [chefCard.primaryArchetype];
  if (chefCard.secondaryArchetype) {
    chefArchetypes.push(chefCard.secondaryArchetype);
  }
  
  return chefArchetypes.includes(staffCard.staffArchetype);
}

/**
 * Checks if a card (meal/staff) matches chef archetypes, or is universal (support/event)
 */
export function cardAllowedForChef(cardId: string, chefCard: ChefCard | null): boolean {
  const card = getCardById(cardId);
  if (!card) return false;
  
  // Don't allow Chef or Restaurant cards in main deck (handled separately)
  if (card.type === CardType.CHEF || card.type === CardType.RESTAURANT) {
    return false;
  }
  
  // Archetype matching disabled - allow all other cards for deck building
  return true;
}

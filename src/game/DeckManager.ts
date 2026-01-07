import { CardType, CARD_DEFINITIONS, getCardById, isValidCardId } from './CardTypes';

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
  // Get Chef card
  const chefs = Object.keys(CARD_DEFINITIONS).filter(id => 
    CARD_DEFINITIONS[id].type === CardType.CHEF
  );
  const chefCardId = chefs.length > 0 ? chefs[0] : '';

  // Get 3 Restaurant cards
  const restaurants = Object.keys(CARD_DEFINITIONS).filter(id => 
    CARD_DEFINITIONS[id].type === CardType.RESTAURANT
  );
  const restaurantCardIds = restaurants.slice(0, 3);

  // Build main deck (30 cards - Meals, Staff, Support, Event only)
  const mainDeck: Deck = [];
  const otherCards = Object.keys(CARD_DEFINITIONS).filter(id => {
    const card = CARD_DEFINITIONS[id];
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


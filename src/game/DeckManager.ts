import { Card, CardType, CARD_DEFINITIONS, getCardById, isValidCardId } from './CardTypes';

// Deck is represented as an array of card IDs (strings)
export type Deck = string[];

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
 * Validates a deck according to game rules:
 * - Must have exactly 30 cards
 * - Must have exactly 1 Chef card
 * - Must have exactly 3 Restaurant cards
 * - No more than 3 cards of the same type (by ID)
 * - All card IDs must be valid
 */
export function validateDeck(deck: Deck): DeckValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check total card count
  if (deck.length !== 30) {
    errors.push(`Deck must have exactly 30 cards, but has ${deck.length}`);
  }

  // Validate all card IDs exist
  const invalidIds = deck.filter(id => !isValidCardId(id));
  if (invalidIds.length > 0) {
    errors.push(`Invalid card IDs found: ${invalidIds.join(', ')}`);
  }

  // Count cards by type
  const stats = getDeckStats(deck);
  
  // Check Chef card count (must be exactly 1)
  if (stats.chefCount !== 1) {
    errors.push(`Deck must have exactly 1 Chef card, but has ${stats.chefCount}`);
  }

  // Check Restaurant card count (must be exactly 3)
  if (stats.restaurantCount !== 3) {
    errors.push(`Deck must have exactly 3 Restaurant cards, but has ${stats.restaurantCount}`);
  }

  // Check for duplicate limits (max 3 of same card ID)
  Object.entries(stats.cardCounts).forEach(([cardId, count]) => {
    if (count > 3) {
      errors.push(`Card ${cardId} appears ${count} times, maximum is 3`);
    }
  });

  // Check if deck has enough non-Chef/Restaurant cards
  const mainDeckCards = deck.length - stats.chefCount - stats.restaurantCount;
  if (mainDeckCards < 26) {
    warnings.push(`Deck has ${mainDeckCards} main deck cards, recommended minimum is 26`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
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
 * Creates a default starter deck (for testing/quick start)
 * Includes: 1 Chef, 3 Restaurants, and fills the rest with available cards
 */
export function createDefaultDeck(): Deck {
  const deck: Deck = [];

  // Add 1 Chef (first available)
  const chefs = Object.keys(CARD_DEFINITIONS).filter(id => 
    CARD_DEFINITIONS[id].type === CardType.CHEF
  );
  if (chefs.length > 0) {
    deck.push(chefs[0]);
  }

  // Add 3 Restaurants (first 3 available)
  const restaurants = Object.keys(CARD_DEFINITIONS).filter(id => 
    CARD_DEFINITIONS[id].type === CardType.RESTAURANT
  );
  for (let i = 0; i < 3 && i < restaurants.length; i++) {
    deck.push(restaurants[i]);
  }

  // Fill remaining slots with other cards (up to 3 of each)
  const otherCards = Object.keys(CARD_DEFINITIONS).filter(id => {
    const card = CARD_DEFINITIONS[id];
    return card.type !== CardType.CHEF && card.type !== CardType.RESTAURANT;
  });

  // Add cards up to limit, ensuring we have 30 total
  const cardCounts: Record<string, number> = {};
  while (deck.length < 30 && otherCards.length > 0) {
    // Pick a random card from available
    const randomIndex = Math.floor(Math.random() * otherCards.length);
    const cardId = otherCards[randomIndex];
    
    cardCounts[cardId] = (cardCounts[cardId] || 0) + 1;
    
    if (cardCounts[cardId] <= 3) {
      deck.push(cardId);
    } else {
      // Remove this card from available list if we've reached max
      otherCards.splice(randomIndex, 1);
    }
  }

  return shuffleDeck(deck);
}

/**
 * Gets the Chef card ID from a deck
 */
export function getChefCardId(deck: Deck): string | null {
  for (const cardId of deck) {
    const card = getCardById(cardId);
    if (card && card.type === CardType.CHEF) {
      return cardId;
    }
  }
  return null;
}

/**
 * Gets all Restaurant card IDs from a deck
 */
export function getRestaurantCardIds(deck: Deck): string[] {
  return deck.filter(cardId => {
    const card = getCardById(cardId);
    return card && card.type === CardType.RESTAURANT;
  });
}

/**
 * Randomly selects one Restaurant card from the deck
 */
export function selectRandomRestaurant(deck: Deck): string | null {
  const restaurants = getRestaurantCardIds(deck);
  if (restaurants.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * restaurants.length);
  return restaurants[randomIndex];
}


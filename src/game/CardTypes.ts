// Card type definitions and interfaces

export enum CardType {
  CHEF = 'CHEF',
  RESTAURANT = 'RESTAURANT',
  MEAL = 'MEAL',
  STAFF = 'STAFF',
  SUPPORT = 'SUPPORT',
  EVENT = 'EVENT'
}

// Base card interface
export interface BaseCard {
  id: string;
  name: string;
  description: string;
  type: CardType;
}

// Chef card - cannot be removed, has base value and special ability
export interface ChefCard extends BaseCard {
  type: CardType.CHEF;
  baseValue: number;
  ability: string;
  abilityDescription: string;
}

// Restaurant card - cannot be removed, has base score and conditional ability
export interface RestaurantCard extends BaseCard {
  type: CardType.RESTAURANT;
  baseScore: number;
  ability: string;
  abilityCondition: string;
  abilityDescription: string;
}

// Meal card - contributes to restaurant score
export interface MealCard extends BaseCard {
  type: CardType.MEAL;
  value: number;
  effect?: string;
  effectDescription?: string;
}

// Staff card - provides support abilities and modifiers
export interface StaffCard extends BaseCard {
  type: CardType.STAFF;
  ability: string;
  abilityDescription: string;
  modifier?: number;
}

// Support card - utility and enhancement effects
export interface SupportCard extends BaseCard {
  type: CardType.SUPPORT;
  ability: string;
  abilityDescription: string;
  duration?: 'instant' | 'round' | 'permanent';
}

// Event card - one-time effects and disruptions
export interface EventCard extends BaseCard {
  type: CardType.EVENT;
  effect: string;
  effectDescription: string;
  target?: 'self' | 'opponent' | 'both';
}

// Union type for all cards
export type Card = ChefCard | RestaurantCard | MealCard | StaffCard | SupportCard | EventCard;

// Card registry - stores all card definitions by ID
export type CardRegistry = Record<string, Card>;

// Card data is now loaded from Supabase via CardLoader
// This constant is kept for backward compatibility during migration
// DO NOT USE - use getCardRegistry() from CardLoader instead
export const CARD_DEFINITIONS: CardRegistry = {
  // Chef Cards
  'chef_001': {
    id: 'chef_001',
    name: 'Master Chef Pierre',
    description: 'A legendary chef known for perfection',
    type: CardType.CHEF,
    baseValue: 5,
    ability: 'perfectionist',
    abilityDescription: 'Add +2 to all Meal cards you play'
  },
  'chef_002': {
    id: 'chef_002',
    name: 'Chef Maria',
    description: 'Innovative chef with creative flair',
    type: CardType.CHEF,
    baseValue: 4,
    ability: 'innovation',
    abilityDescription: 'Once per round, double the value of one Meal card'
  },
  'chef_003': {
    id: 'chef_003',
    name: 'Chef Kenji',
    description: 'Speed and efficiency specialist',
    type: CardType.CHEF,
    baseValue: 3,
    ability: 'speed',
    abilityDescription: 'Draw an extra card at the start of each round'
  },
  'chef_004': {
    id: 'chef_004',
    name: 'Chef Sofia',
    description: 'Master of presentation',
    type: CardType.CHEF,
    baseValue: 4,
    ability: 'presentation',
    abilityDescription: 'Your Restaurant gains +1 base score'
  },
  'chef_005': {
    id: 'chef_005',
    name: 'Chef Marcus',
    description: 'Bold flavors and risk-taking',
    type: CardType.CHEF,
    baseValue: 5,
    ability: 'bold',
    abilityDescription: 'When you win a round, gain an extra star'
  },

  // Restaurant Cards
  'restaurant_001': {
    id: 'restaurant_001',
    name: 'Le Grand Bistro',
    description: 'Elegant French dining',
    type: CardType.RESTAURANT,
    baseScore: 10,
    ability: 'elegance',
    abilityCondition: 'If you play 3 or more Meal cards',
    abilityDescription: 'Gain +5 bonus score'
  },
  'restaurant_002': {
    id: 'restaurant_002',
    name: 'The Spice Market',
    description: 'Bold flavors and exotic dishes',
    type: CardType.RESTAURANT,
    baseScore: 8,
    ability: 'spice',
    abilityCondition: 'If opponent plays an Event card',
    abilityDescription: 'Negate the Event card effect'
  },
  'restaurant_003': {
    id: 'restaurant_003',
    name: 'Ocean Breeze',
    description: 'Fresh seafood specialties',
    type: CardType.RESTAURANT,
    baseScore: 9,
    ability: 'freshness',
    abilityCondition: 'If you have no Staff cards',
    abilityDescription: 'Double your base score'
  },
  'restaurant_004': {
    id: 'restaurant_004',
    name: 'Mountain View',
    description: 'Farm-to-table excellence',
    type: CardType.RESTAURANT,
    baseScore: 7,
    ability: 'sustainability',
    abilityCondition: 'If you play exactly 2 Meal cards',
    abilityDescription: 'Gain +3 bonus score'
  },
  'restaurant_005': {
    id: 'restaurant_005',
    name: 'The Cozy Corner',
    description: 'Comfort food at its finest',
    type: CardType.RESTAURANT,
    baseScore: 6,
    ability: 'comfort',
    abilityCondition: 'If you have more Staff cards than opponent',
    abilityDescription: 'Gain +4 bonus score'
  },
  'restaurant_006': {
    id: 'restaurant_006',
    name: 'Skyline Terrace',
    description: 'Modern fusion cuisine',
    type: CardType.RESTAURANT,
    baseScore: 8,
    ability: 'fusion',
    abilityCondition: 'If you play cards of 3 different types',
    abilityDescription: 'Gain +6 bonus score'
  },
  'restaurant_007': {
    id: 'restaurant_007',
    name: 'The Rustic Inn',
    description: 'Traditional home cooking',
    type: CardType.RESTAURANT,
    baseScore: 7,
    ability: 'tradition',
    abilityCondition: 'If opponent\'s score is higher',
    abilityDescription: 'Add +2 to all your Meal cards'
  },
  'restaurant_008': {
    id: 'restaurant_008',
    name: 'Midnight Diner',
    description: 'Late night favorites',
    type: CardType.RESTAURANT,
    baseScore: 5,
    ability: 'nightowl',
    abilityCondition: 'If this is round 3 or later',
    abilityDescription: 'Gain +7 bonus score'
  },
  'restaurant_009': {
    id: 'restaurant_009',
    name: 'Garden Fresh',
    description: 'Vegetarian and vegan options',
    type: CardType.RESTAURANT,
    baseScore: 6,
    ability: 'fresh',
    abilityCondition: 'If you play no Event cards',
    abilityDescription: 'Gain +5 bonus score'
  },

  // Meal Cards
  'meal_001': {
    id: 'meal_001',
    name: 'Signature Burger',
    description: 'A classic favorite',
    type: CardType.MEAL,
    value: 3
  },
  'meal_002': {
    id: 'meal_002',
    name: 'Truffle Pasta',
    description: 'Luxurious and rich',
    type: CardType.MEAL,
    value: 5
  },
  'meal_003': {
    id: 'meal_003',
    name: 'Grilled Salmon',
    description: 'Fresh and healthy',
    type: CardType.MEAL,
    value: 4
  },
  'meal_004': {
    id: 'meal_004',
    name: 'Ribeye Steak',
    description: 'Premium cut',
    type: CardType.MEAL,
    value: 6
  },
  'meal_005': {
    id: 'meal_005',
    name: 'Caesar Salad',
    description: 'Crisp and refreshing',
    type: CardType.MEAL,
    value: 2
  },
  'meal_006': {
    id: 'meal_006',
    name: 'Lobster Bisque',
    description: 'Elegant starter',
    type: CardType.MEAL,
    value: 4
  },
  'meal_007': {
    id: 'meal_007',
    name: 'Chocolate Soufflé',
    description: 'Decadent dessert',
    type: CardType.MEAL,
    value: 3
  },
  'meal_008': {
    id: 'meal_008',
    name: 'Sushi Platter',
    description: 'Artisanal selection',
    type: CardType.MEAL,
    value: 5
  },
  'meal_009': {
    id: 'meal_009',
    name: 'Margherita Pizza',
    description: 'Simple perfection',
    type: CardType.MEAL,
    value: 3
  },
  'meal_010': {
    id: 'meal_010',
    name: 'Wagyu Beef',
    description: 'Ultra-premium',
    type: CardType.MEAL,
    value: 7
  },
  'meal_011': {
    id: 'meal_011',
    name: 'Ramen Bowl',
    description: 'Comforting and warm',
    type: CardType.MEAL,
    value: 3
  },
  'meal_012': {
    id: 'meal_012',
    name: 'Duck Confit',
    description: 'French classic',
    type: CardType.MEAL,
    value: 5
  },
  'meal_013': {
    id: 'meal_013',
    name: 'Fish Tacos',
    description: 'Fresh and zesty',
    type: CardType.MEAL,
    value: 3
  },
  'meal_014': {
    id: 'meal_014',
    name: 'Beef Wellington',
    description: 'Elegant entrée',
    type: CardType.MEAL,
    value: 6
  },
  'meal_015': {
    id: 'meal_015',
    name: 'Tiramisu',
    description: 'Italian classic',
    type: CardType.MEAL,
    value: 3
  },

  // Staff Cards
  'staff_001': {
    id: 'staff_001',
    name: 'Head Waiter',
    description: 'Experienced service',
    type: CardType.STAFF,
    ability: 'service',
    abilityDescription: 'Add +1 to all Meal cards',
    modifier: 1
  },
  'staff_002': {
    id: 'staff_002',
    name: 'Sous Chef',
    description: 'Kitchen support',
    type: CardType.STAFF,
    ability: 'support',
    abilityDescription: 'Add +2 to one Meal card',
    modifier: 2
  },
  'staff_003': {
    id: 'staff_003',
    name: 'Sommelier',
    description: 'Wine pairing expert',
    type: CardType.STAFF,
    ability: 'pairing',
    abilityDescription: 'Add +1 to Restaurant base score',
    modifier: 1
  },
  'staff_004': {
    id: 'staff_004',
    name: 'Pastry Chef',
    description: 'Dessert specialist',
    type: CardType.STAFF,
    ability: 'dessert',
    abilityDescription: 'Double the value of dessert Meal cards',
    modifier: 2
  },
  'staff_005': {
    id: 'staff_005',
    name: 'Host',
    description: 'Welcoming presence',
    type: CardType.STAFF,
    ability: 'welcome',
    abilityDescription: 'Draw an extra card next round',
    modifier: 0
  },
  'staff_006': {
    id: 'staff_006',
    name: 'Line Cook',
    description: 'Efficient preparation',
    type: CardType.STAFF,
    ability: 'efficiency',
    abilityDescription: 'Reduce opponent\'s score by 1',
    modifier: -1
  },
  'staff_007': {
    id: 'staff_007',
    name: 'Bartender',
    description: 'Cocktail master',
    type: CardType.STAFF,
    ability: 'cocktails',
    abilityDescription: 'Add +1 to Restaurant base score',
    modifier: 1
  },
  'staff_008': {
    id: 'staff_008',
    name: 'Dishwasher',
    description: 'Essential support',
    type: CardType.STAFF,
    ability: 'cleanup',
    abilityDescription: 'Remove one Event card effect',
    modifier: 0
  },

  // Support Cards
  'support_001': {
    id: 'support_001',
    name: 'Fresh Ingredients',
    description: 'Quality boost',
    type: CardType.SUPPORT,
    ability: 'quality',
    abilityDescription: 'Add +2 to all Meal cards this round',
    duration: 'round'
  },
  'support_002': {
    id: 'support_002',
    name: 'Renovation',
    description: 'Upgrade the restaurant',
    type: CardType.SUPPORT,
    ability: 'upgrade',
    abilityDescription: 'Add +3 to Restaurant base score permanently',
    duration: 'permanent'
  },
  'support_003': {
    id: 'support_003',
    name: 'Marketing Campaign',
    description: 'Boost reputation',
    type: CardType.SUPPORT,
    ability: 'marketing',
    abilityDescription: 'Gain +1 star if you win this round',
    duration: 'instant'
  },
  'support_004': {
    id: 'support_004',
    name: 'Special Menu',
    description: 'Limited time offer',
    type: CardType.SUPPORT,
    ability: 'special',
    abilityDescription: 'Double one Meal card value',
    duration: 'instant'
  },
  'support_005': {
    id: 'support_005',
    name: 'VIP Service',
    description: 'Premium experience',
    type: CardType.SUPPORT,
    ability: 'vip',
    abilityDescription: 'Add +1 to Restaurant base score this round',
    duration: 'round'
  },
  'support_006': {
    id: 'support_006',
    name: 'Food Critic Visit',
    description: 'Make a good impression',
    type: CardType.SUPPORT,
    ability: 'critic',
    abilityDescription: 'If you win this round, gain 2 stars instead of 1',
    duration: 'instant'
  },

  // Event Cards
  'event_001': {
    id: 'event_001',
    name: 'Kitchen Fire',
    description: 'Disruptive incident',
    type: CardType.EVENT,
    effect: 'disrupt',
    effectDescription: 'Opponent loses 3 points from their score',
    target: 'opponent'
  },
  'event_002': {
    id: 'event_002',
    name: 'Health Inspection',
    description: 'Rigorous check',
    type: CardType.EVENT,
    effect: 'inspect',
    effectDescription: 'Opponent cannot use Staff card abilities this round',
    target: 'opponent'
  },
  'event_003': {
    id: 'event_003',
    name: 'Rush Hour',
    description: 'Busy period',
    type: CardType.EVENT,
    effect: 'rush',
    effectDescription: 'Both players draw 2 extra cards',
    target: 'both'
  },
  'event_004': {
    id: 'event_004',
    name: 'Food Shortage',
    description: 'Supply issues',
    type: CardType.EVENT,
    effect: 'shortage',
    effectDescription: 'Opponent discards one Meal card',
    target: 'opponent'
  },
  'event_005': {
    id: 'event_005',
    name: 'Celebrity Visit',
    description: 'Famous guest',
    type: CardType.EVENT,
    effect: 'celebrity',
    effectDescription: 'Add +5 to your Restaurant score',
    target: 'self'
  },
  'event_006': {
    id: 'event_006',
    name: 'Power Outage',
    description: 'Technical difficulties',
    type: CardType.EVENT,
    effect: 'outage',
    effectDescription: 'Opponent\'s Restaurant loses 2 base score this round',
    target: 'opponent'
  },
  'event_007': {
    id: 'event_007',
    name: 'Local Festival',
    description: 'Increased foot traffic',
    type: CardType.EVENT,
    effect: 'festival',
    effectDescription: 'Both players gain +2 to Restaurant base score',
    target: 'both'
  },
  'event_008': {
    id: 'event_008',
    name: 'Bad Review',
    description: 'Negative publicity',
    type: CardType.EVENT,
    effect: 'review',
    effectDescription: 'Opponent loses 1 star (minimum 0)',
    target: 'opponent'
  }
};

// Helper function to get card by ID
// Now uses CardLoader registry instead of local CARD_DEFINITIONS
export function getCardById(id: string): Card | undefined {
  try {
    // Use dynamic import to avoid circular dependency issues
    const cardLoader = require('./CardLoader');
    const registry: CardRegistry = cardLoader.getCardRegistry();
    const card = registry[id];
    // Fallback to local definitions if card not found in registry
    return card || CARD_DEFINITIONS[id];
  } catch (error) {
    // Fallback to local definitions if loader not available (for migration period)
    console.warn('CardLoader not available, using local definitions');
    return CARD_DEFINITIONS[id];
  }
}

// Helper function to get all cards of a type
// Now uses CardLoader registry instead of local CARD_DEFINITIONS
export function getCardsByType(type: CardType): Card[] {
  try {
    // Use dynamic import to avoid circular dependency issues
    const cardLoader = require('./CardLoader');
    const registry: CardRegistry = cardLoader.getCardRegistry();
    const cards = Object.values(registry).filter((card: Card) => card.type === type);
    // If registry is empty (cards not loaded), fallback to local definitions
    if (cards.length === 0 && Object.keys(registry).length === 0) {
      return Object.values(CARD_DEFINITIONS).filter(card => card.type === type);
    }
    return cards;
  } catch (error) {
    // Fallback to local definitions if loader not available (for migration period)
    console.warn('CardLoader not available, using local definitions');
    return Object.values(CARD_DEFINITIONS).filter(card => card.type === type);
  }
}

// Helper function to validate card ID exists
// Now uses CardLoader registry instead of local CARD_DEFINITIONS
export function isValidCardId(id: string): boolean {
  try {
    // Use dynamic import to avoid circular dependency issues
    const cardLoader = require('./CardLoader');
    const registry: CardRegistry = cardLoader.getCardRegistry();
    // Check registry first, fallback to local definitions if registry is empty
    if (id in registry) {
      return true;
    }
    if (Object.keys(registry).length === 0) {
      // Registry is empty (cards not loaded), check local definitions
      return id in CARD_DEFINITIONS;
    }
    return false;
  } catch (error) {
    // Fallback to local definitions if loader not available (for migration period)
    console.warn('CardLoader not available, using local definitions');
    return id in CARD_DEFINITIONS;
  }
}


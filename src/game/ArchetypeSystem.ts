// Archetype system for calculating synergies and bonuses

export type Archetype = 
  | 'Breakfast' | 'Lunch' | 'Dinner' | 'Brunch' | 'Buffet'  // Food Type enums
  | 'Diner' | 'Food Truck' | 'Sit Down' | 'Fast Casual'     // Restaurant Type enums
  | 'Chef' | 'Front End' | 'Celebrity' | 'Marketing' | 'Back End';  // Employee Type enums

export interface ArchetypeDefinition {
  name: string;
  displayName: string;
  color: string;
  icon?: string;
  description: string;
  synergies: string[]; // Other archetypes that synergize
}

/**
 * Archetype definitions with colors and synergies
 */
export const ARCHETYPE_DEFINITIONS: Record<string, ArchetypeDefinition> = {
  // Food Types
  'Breakfast': {
    name: 'Breakfast',
    displayName: 'Breakfast',
    color: '#FFA500', // Orange
    description: 'Breakfast foods and morning cuisine',
    synergies: ['Diner', 'Front End']
  },
  'Lunch': {
    name: 'Lunch',
    displayName: 'Lunch',
    color: '#FFD700', // Gold
    description: 'Lunch foods and midday meals',
    synergies: ['Fast Casual', 'Food Truck']
  },
  'Dinner': {
    name: 'Dinner',
    displayName: 'Dinner',
    color: '#8B4513', // Brown
    description: 'Dinner foods and evening cuisine',
    synergies: ['Sit Down', 'Chef']
  },
  'Brunch': {
    name: 'Brunch',
    displayName: 'Brunch',
    color: '#FF6347', // Tomato
    description: 'Brunch foods combining breakfast and lunch',
    synergies: ['Diner', 'Sit Down', 'Front End']
  },
  'Buffet': {
    name: 'Buffet',
    displayName: 'Buffet',
    color: '#9370DB', // Medium Purple
    description: 'Buffet-style service',
    synergies: ['Sit Down', 'Back End']
  },
  
  // Restaurant Types
  'Diner': {
    name: 'Diner',
    displayName: 'Diner',
    color: '#FF4500', // Orange Red
    description: 'Classic diner restaurants',
    synergies: ['Breakfast', 'Brunch', 'Front End']
  },
  'Food Truck': {
    name: 'Food Truck',
    displayName: 'Food Truck',
    color: '#FF1493', // Deep Pink
    description: 'Mobile food service',
    synergies: ['Lunch', 'Fast Casual', 'Marketing']
  },
  'Sit Down': {
    name: 'Sit Down',
    displayName: 'Sit Down',
    color: '#4169E1', // Royal Blue
    description: 'Full-service sit-down restaurants',
    synergies: ['Dinner', 'Brunch', 'Buffet', 'Chef']
  },
  'Fast Casual': {
    name: 'Fast Casual',
    displayName: 'Fast Casual',
    color: '#32CD32', // Lime Green
    description: 'Quick-service with quality',
    synergies: ['Lunch', 'Food Truck', 'Front End']
  },
  
  // Employee Types
  'Chef': {
    name: 'Chef',
    displayName: 'Chef',
    color: '#DC143C', // Crimson
    description: 'Head chefs and kitchen leadership',
    synergies: ['Dinner', 'Sit Down', 'Buffet']
  },
  'Front End': {
    name: 'Front End',
    displayName: 'Front End',
    color: '#00CED1', // Dark Turquoise
    description: 'Front-of-house staff',
    synergies: ['Breakfast', 'Diner', 'Fast Casual', 'Brunch']
  },
  'Celebrity': {
    name: 'Celebrity',
    displayName: 'Celebrity',
    color: '#FFD700', // Gold
    description: 'Celebrity chefs and personalities',
    synergies: ['Sit Down', 'Marketing']
  },
  'Marketing': {
    name: 'Marketing',
    displayName: 'Marketing',
    color: '#FF69B4', // Hot Pink
    description: 'Marketing and promotion staff',
    synergies: ['Food Truck', 'Fast Casual', 'Celebrity']
  },
  'Back End': {
    name: 'Back End',
    displayName: 'Back End',
    color: '#696969', // Dim Gray
    description: 'Back-of-house support staff',
    synergies: ['Buffet', 'Sit Down']
  }
};

/**
 * Gets the archetype definition for a given archetype name
 */
export function getArchetypeDefinition(archetype: string): ArchetypeDefinition | undefined {
  return ARCHETYPE_DEFINITIONS[archetype];
}

/**
 * Gets the color for an archetype
 */
export function getArchetypeColor(archetype: string): string {
  const definition = getArchetypeDefinition(archetype);
  return definition?.color || '#CCCCCC'; // Default gray
}

/**
 * Calculates archetype synergy bonuses
 * @param chefArchetypes Array of archetypes from the chef (primary and secondary)
 * @param restaurantArchetype Optional restaurant archetype
 * @param cardArchetypes Array of archetypes from played cards (meals, staff)
 * @returns Bonus points from archetype synergies
 */
export function calculateArchetypeBonus(
  chefArchetypes: string[],
  restaurantArchetype: string | undefined,
  cardArchetypes: string[]
): number {
  if (chefArchetypes.length === 0) {
    return 0;
  }

  let bonus = 0;
  const allPlayerArchetypes = new Set<string>([...chefArchetypes]);
  
  if (restaurantArchetype) {
    allPlayerArchetypes.add(restaurantArchetype);
  }

  // Check each chef archetype for synergies
  for (const chefArchetype of chefArchetypes) {
    const definition = getArchetypeDefinition(chefArchetype);
    if (!definition) continue;

    // Count how many played cards match this archetype's synergies
    for (const synergy of definition.synergies) {
      // Direct match: card archetype matches synergy
      const directMatches = cardArchetypes.filter(arch => arch === synergy).length;
      bonus += directMatches * 1; // +1 per matching card

      // Restaurant synergy: restaurant archetype matches
      if (restaurantArchetype === synergy) {
        bonus += 2; // +2 for restaurant synergy
      }
    }

    // Direct archetype matches: cards with same archetype as chef
    const directMatches = cardArchetypes.filter(arch => arch === chefArchetype).length;
    bonus += directMatches * 2; // +2 per direct match with chef archetype
  }

  // Restaurant archetype synergies with cards
  if (restaurantArchetype) {
    const restaurantDef = getArchetypeDefinition(restaurantArchetype);
    if (restaurantDef) {
      for (const synergy of restaurantDef.synergies) {
        const matches = cardArchetypes.filter(arch => arch === synergy).length;
        bonus += matches * 1; // +1 per card matching restaurant synergies
      }

      // Direct restaurant-card matches
      const directMatches = cardArchetypes.filter(arch => arch === restaurantArchetype).length;
      bonus += directMatches * 1; // +1 per direct match with restaurant
    }
  }

  return bonus;
}

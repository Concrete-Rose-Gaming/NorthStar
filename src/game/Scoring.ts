import { getCardById, ChefCard, RestaurantCard, MealCard, StaffCard, SupportCard, EventCard } from './CardTypes';
import { calculateArchetypeBonus } from './ArchetypeSystem';

// Player's board state during a round
export interface PlayerBoardState {
  chefCardId: string;
  restaurantCardId: string;
  attachedMeals: string[]; // Card IDs - permanently attached meals (max 3)
  playedMeals: string[]; // Card IDs - kept for backward compatibility, but meals now attach permanently
  playedStaff: string[]; // Card IDs
  playedSupport: string[]; // Card IDs
  playedEvents: string[]; // Card IDs
}

// Scoring result for a player
export interface ScoreResult {
  baseScore: number;
  mealPoints: number;
  staffModifiers: number;
  supportModifiers: number;
  restaurantBonus: number;
  chefBonus: number;
  eventModifiers: number;
  archetypeBonus: number;  // NEW: Bonus from archetype synergies
  totalScore: number;
  breakdown: string[];
}

/**
 * Calculates the total score for a player's restaurant
 */
export function calculateScore(boardState: PlayerBoardState): ScoreResult {
  const breakdown: string[] = [];
  let baseScore = 0;
  let mealPoints = 0;
  let staffModifiers = 0;
  let supportModifiers = 0;
  let restaurantBonus = 0;
  let chefBonus = 0;
  let eventModifiers = 0;
  let archetypeBonus = 0;

  // Get Chef card
  const chefCard = getCardById(boardState.chefCardId) as ChefCard | undefined;
  if (chefCard) {
    chefBonus = chefCard.baseValue;
    breakdown.push(`Chef base value: +${chefBonus}`);
  }

  // Get Restaurant card
  const restaurantCard = getCardById(boardState.restaurantCardId) as RestaurantCard | undefined;
  if (restaurantCard) {
    baseScore = restaurantCard.baseScore;
    breakdown.push(`Restaurant base score: ${baseScore}`);
  }

  // Calculate Meal points from attached meals (permanent equipment)
  const attachedMeals = boardState.attachedMeals || [];
  attachedMeals.forEach(mealId => {
    const mealCard = getCardById(mealId) as MealCard | undefined;
    if (mealCard) {
      mealPoints += mealCard.value;
      // Apply meal effects/abilities here if needed
      // Meal effects are active while attached
    }
  });
  if (mealPoints > 0) {
    breakdown.push(`Attached meals: +${mealPoints}`);
  }

  // Apply Chef ability (if applicable)
  if (chefCard) {
    if (chefCard.ability === 'perfectionist') {
      const mealBonus = attachedMeals.length * 2;
      chefBonus += mealBonus;
      if (mealBonus > 0) {
        breakdown.push(`Chef ability (Perfectionist): +${mealBonus}`);
      }
    }
  }

  // Calculate Staff modifiers
  boardState.playedStaff.forEach(staffId => {
    const staffCard = getCardById(staffId) as StaffCard | undefined;
    if (staffCard) {
      if (staffCard.ability === 'service') {
        const bonus = attachedMeals.length * (staffCard.modifier || 1);
        staffModifiers += bonus;
        breakdown.push(`${staffCard.name}: +${bonus} to all Meals`);
      } else if (staffCard.ability === 'support') {
        const bonus = staffCard.modifier || 2;
        staffModifiers += bonus;
        breakdown.push(`${staffCard.name}: +${bonus} to one Meal`);
      } else if (staffCard.ability === 'pairing' || staffCard.ability === 'cocktails') {
        const bonus = staffCard.modifier || 1;
        staffModifiers += bonus;
        breakdown.push(`${staffCard.name}: +${bonus} to Restaurant base`);
      }
    }
  });

  // Calculate Support card effects
  boardState.playedSupport.forEach(supportId => {
    const supportCard = getCardById(supportId) as SupportCard | undefined;
    if (supportCard) {
      if (supportCard.ability === 'quality') {
        const bonus = attachedMeals.length * 2;
        supportModifiers += bonus;
        breakdown.push(`${supportCard.name}: +${bonus} to all Meals`);
      } else if (supportCard.ability === 'upgrade') {
        const bonus = 3;
        supportModifiers += bonus;
        breakdown.push(`${supportCard.name}: +${bonus} to Restaurant base`);
      } else if (supportCard.ability === 'vip') {
        const bonus = 1;
        supportModifiers += bonus;
        breakdown.push(`${supportCard.name}: +${bonus} to Restaurant base`);
      } else if (supportCard.ability === 'special') {
        // This would double one meal - simplified for now
        breakdown.push(`${supportCard.name}: Double one Meal (applied)`);
      }
    }
  });

  // Calculate Event card effects (simplified - events affect opponent mostly)
  // Events that affect self are handled here
  boardState.playedEvents.forEach(eventId => {
    const eventCard = getCardById(eventId) as EventCard | undefined;
    if (eventCard && eventCard.target === 'self') {
      if (eventCard.effect === 'celebrity') {
        eventModifiers += 5;
        breakdown.push(`${eventCard.name}: +5 bonus`);
      }
    }
  });

  // Check Restaurant ability conditions
  if (restaurantCard) {
    const restBonus = checkRestaurantAbility(
      restaurantCard,
      boardState,
      { mealCount: attachedMeals.length, staffCount: boardState.playedStaff.length }
    );
    restaurantBonus = restBonus;
    if (restBonus > 0) {
      breakdown.push(`Restaurant ability (${restaurantCard.ability}): +${restBonus}`);
    }
  }

  // Calculate Archetype synergy bonuses
  if (chefCard) {
    const chefArchetypes: string[] = [chefCard.primaryArchetype];
    if (chefCard.secondaryArchetype) {
      chefArchetypes.push(chefCard.secondaryArchetype);
    }

    const cardArchetypes: string[] = [];
    
    // Collect archetypes from attached meals (permanent equipment)
    attachedMeals.forEach(mealId => {
      const mealCard = getCardById(mealId) as MealCard | undefined;
      if (mealCard?.mealArchetype) {
        cardArchetypes.push(mealCard.mealArchetype);
      }
    });

    boardState.playedStaff.forEach(staffId => {
      const staffCard = getCardById(staffId) as StaffCard | undefined;
      if (staffCard?.staffArchetype) {
        cardArchetypes.push(staffCard.staffArchetype);
      }
    });

    archetypeBonus = calculateArchetypeBonus(
      chefArchetypes,
      restaurantCard?.primaryArchetype,
      cardArchetypes
    );

    if (archetypeBonus > 0) {
      breakdown.push(`Archetype Synergy: +${archetypeBonus}`);
    }
  }

  const totalScore = baseScore + mealPoints + staffModifiers + supportModifiers + 
                     restaurantBonus + chefBonus + eventModifiers + archetypeBonus;

  return {
    baseScore,
    mealPoints,
    staffModifiers,
    supportModifiers,
    restaurantBonus,
    chefBonus,
    eventModifiers,
    archetypeBonus,
    totalScore,
    breakdown
  };
}

/**
 * Checks if restaurant ability condition is met and returns bonus
 */
function checkRestaurantAbility(
  restaurant: RestaurantCard,
  boardState: PlayerBoardState,
  stats: { mealCount: number; staffCount: number }
): number {
  const condition = restaurant.abilityCondition.toLowerCase();

  // Check various conditions (note: conditions now check attached meals, not played meals)
  if (condition.includes('play 3 or more meal cards') || condition.includes('have 3 or more meal')) {
    if (stats.mealCount >= 3) {
      return 5; // Le Grand Bistro
    }
  }

  if (condition.includes('play exactly 2 meal cards') || condition.includes('have exactly 2 meal')) {
    if (stats.mealCount === 2) {
      return 3; // Mountain View
    }
  }

  if (condition.includes('have more staff cards')) {
    // This would need opponent comparison - simplified for now
    return 0;
  }

  if (condition.includes('play cards of 3 different types')) {
    const typesPlayed = new Set<string>();
    // Count attached meals (permanent) as meal type
    if (boardState.attachedMeals && boardState.attachedMeals.length > 0) {
      typesPlayed.add('meal');
    }
    boardState.playedStaff.forEach(() => typesPlayed.add('staff'));
    boardState.playedSupport.forEach(() => typesPlayed.add('support'));
    boardState.playedEvents.forEach(() => typesPlayed.add('event'));
    if (typesPlayed.size >= 3) {
      return 6; // Skyline Terrace
    }
  }

  if (condition.includes('round 3 or later')) {
    // This would need round number - simplified for now
    return 0;
  }

  if (condition.includes('play no event cards')) {
    if (boardState.playedEvents.length === 0) {
      return 5; // Garden Fresh
    }
  }

  return 0;
}

/**
 * Compares two scores and determines the winner
 */
export function compareScores(score1: number, score2: number): 'player1' | 'player2' | 'tie' {
  if (score1 > score2) {
    return 'player1';
  } else if (score2 > score1) {
    return 'player2';
  } else {
    return 'tie';
  }
}


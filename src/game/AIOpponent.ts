import { Player } from './GameEngine';
import { PlayerDeck, createDefaultPlayerDeck } from './DeckManager';
import { CardType, getCardById } from './CardTypes';
import { playCard, completeTurn } from './GameEngine';

/**
 * AI Opponent class that handles AI decision-making
 */
export class AIOpponent {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  getName(): string {
    return this.name;
  }

  /**
   * Creates a deck for the AI opponent
   */
  createAIDeck(): PlayerDeck {
    // For now, use the default deck
    // In the future, this could have more sophisticated deck building logic
    return createDefaultPlayerDeck();
  }

  /**
   * Decides which cards to mulligan
   * AI will mulligan low-value cards (value 2 or less)
   */
  decideMulligan(player: Player): string[] {
    const cardsToMulligan: string[] = [];

    for (const cardId of player.hand) {
      const card = getCardById(cardId);
      if (!card) continue;

      // Mulligan low-value meal cards
      if (card.type === CardType.MEAL) {
        const mealCard = card as any;
        if (mealCard.value && mealCard.value <= 2) {
          cardsToMulligan.push(cardId);
        }
      }
      // Mulligan event cards that target self
      else if (card.type === CardType.EVENT) {
        const eventCard = card as any;
        if (eventCard.target === 'self') {
          cardsToMulligan.push(cardId);
        }
      }
    }

    // Limit mulligan to at most 3 cards
    return cardsToMulligan.slice(0, 3);
  }

  /**
   * Executes the AI's turn
   * AI will play cards strategically and then end its turn
   */
  executeTurn(aiPlayer: Player, opponent: Player): Player {
    let currentPlayer = { ...aiPlayer };

    // AI strategy: play up to 3-4 cards per turn
    const maxCardsToPlay = Math.min(4, currentPlayer.hand.length);
    const cardsToPlay: string[] = [];

    // Get meal cards and current attached meals
    const mealCards = currentPlayer.hand.filter(id => {
      const card = getCardById(id);
      return card?.type === CardType.MEAL || id.startsWith('meal_');
    });
    const attachedMeals = currentPlayer.boardState.attachedMeals || [];
    const staffCards = currentPlayer.hand.filter(id => {
      const card = getCardById(id);
      return card?.type === CardType.STAFF || id.startsWith('staff_');
    });
    const supportCards = currentPlayer.hand.filter(id => {
      const card = getCardById(id);
      return card?.type === CardType.SUPPORT || id.startsWith('support_');
    });
    const eventCards = currentPlayer.hand.filter(id => {
      const card = getCardById(id);
      return card?.type === CardType.EVENT || id.startsWith('event_');
    });

    // Prioritize attaching meals when restaurant has < 3 meals
    if (mealCards.length > 0 && attachedMeals.length < 3) {
      // Sort meals by value (higher first)
      const sortedMeals = [...mealCards].sort((a, b) => {
        const cardA = getCardById(a);
        const cardB = getCardById(b);
        const valueA = (cardA as any)?.value || 0;
        const valueB = (cardB as any)?.value || 0;
        return valueB - valueA; // Higher value first
      });
      
      // Attach the highest value meal available
      const mealToAttach = sortedMeals[0];
      if (mealToAttach) {
        const result = playCard(currentPlayer, mealToAttach, 'meal');
        if (result) {
          currentPlayer = result;
        }
      }
    } else if (mealCards.length > 0 && attachedMeals.length >= 3) {
      // Restaurant has 3 meals - decide if we should replace one
      // Sort new meals by value
      const sortedNewMeals = [...mealCards].sort((a, b) => {
        const cardA = getCardById(a);
        const cardB = getCardById(b);
        const valueA = (cardA as any)?.value || 0;
        const valueB = (cardB as any)?.value || 0;
        return valueB - valueA;
      });
      
      // Find the lowest value attached meal
      const attachedMealValues = attachedMeals.map(mealId => {
        const mealCard = getCardById(mealId);
        return { id: mealId, value: (mealCard as any)?.value || 0 };
      }).sort((a, b) => a.value - b.value); // Sort by value ascending
      
      const lowestAttachedMeal = attachedMealValues[0];
      const bestNewMeal = sortedNewMeals[0];
      
      if (lowestAttachedMeal && bestNewMeal) {
        const newMealCard = getCardById(bestNewMeal);
        const newMealValue = (newMealCard as any)?.value || 0;
        
        // Replace if new meal is better than lowest attached meal
        if (newMealValue > lowestAttachedMeal.value) {
          // Play the new meal with replacement
          const result = playCard(currentPlayer, bestNewMeal, 'meal', lowestAttachedMeal.id);
          if (result) {
            currentPlayer = result;
            // Remove from cardsToPlay since we already played it
            // (We'll handle other cards below)
          }
        }
      }
    }

    // Play 1 staff card if available
    if (staffCards.length > 0 && cardsToPlay.length < maxCardsToPlay) {
      cardsToPlay.push(staffCards[0]);
    }

    // Play 1 support card if available
    if (supportCards.length > 0 && cardsToPlay.length < maxCardsToPlay) {
      cardsToPlay.push(supportCards[0]);
    }

    // Play 1 event card if available (prefer opponent-targeting) and if one hasn't been played this round
    if (eventCards.length > 0 && cardsToPlay.length < maxCardsToPlay && !currentPlayer.eventCardPlayedThisRound) {
      // Prefer event cards that target opponent
      const opponentEvents = eventCards.filter(id => {
        const card = getCardById(id);
        return (card as any)?.target === 'opponent';
      });
      if (opponentEvents.length > 0) {
        cardsToPlay.push(opponentEvents[0]);
      } else {
        cardsToPlay.push(eventCards[0]);
      }
    }

    // Play the selected cards (excluding meals which are handled separately above)
    for (const cardId of cardsToPlay.slice(0, maxCardsToPlay)) {
      const card = getCardById(cardId);
      if (!card || card.type === CardType.MEAL) continue; // Skip meals, already handled

      let targetType: 'meal' | 'staff' | 'support' | 'event' | undefined;
      if (card.type === CardType.STAFF) targetType = 'staff';
      else if (card.type === CardType.SUPPORT) targetType = 'support';
      else if (card.type === CardType.EVENT) targetType = 'event';

      const result = playCard(currentPlayer, cardId, targetType);
      if (result) {
        currentPlayer = result;
      }
    }

    // End the turn
    currentPlayer = completeTurn(currentPlayer);

    return currentPlayer;
  }
}


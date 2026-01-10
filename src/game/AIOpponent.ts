import { Player, canAffordCard } from './GameEngine';
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

    // Prioritize playing Meal cards first
    const mealCards = currentPlayer.hand.filter(id => id.startsWith('meal_'));
    const staffCards = currentPlayer.hand.filter(id => id.startsWith('staff_'));
    const supportCards = currentPlayer.hand.filter(id => id.startsWith('support_'));
    const eventCards = currentPlayer.hand.filter(id => id.startsWith('event_'));

    // Filter cards that can be afforded (have enough influence)
    const affordableMeals = mealCards.filter(id => canAffordCard(currentPlayer, id));
    const affordableStaff = staffCards.filter(id => canAffordCard(currentPlayer, id));
    const affordableSupport = supportCards.filter(id => canAffordCard(currentPlayer, id));
    const affordableEvents = eventCards.filter(id => canAffordCard(currentPlayer, id));

    // Play meal cards (prioritize higher value, but only affordable ones)
    const sortedMeals = affordableMeals.sort((a, b) => {
      const cardA = getCardById(a);
      const cardB = getCardById(b);
      const valueA = (cardA as any)?.value || 0;
      const valueB = (cardB as any)?.value || 0;
      return valueB - valueA; // Higher value first
    });

    // Play 2-3 meal cards (as many as can afford)
    const mealsToPlay = sortedMeals.slice(0, Math.min(3, sortedMeals.length));
    cardsToPlay.push(...mealsToPlay);

    // Play 1 staff card if available and can afford
    if (affordableStaff.length > 0 && cardsToPlay.length < maxCardsToPlay) {
      cardsToPlay.push(affordableStaff[0]);
    }

    // Play 1 support card if available and can afford
    if (affordableSupport.length > 0 && cardsToPlay.length < maxCardsToPlay) {
      cardsToPlay.push(affordableSupport[0]);
    }

    // Play 1 event card if available (prefer opponent-targeting) and if one hasn't been played this round
    if (affordableEvents.length > 0 && cardsToPlay.length < maxCardsToPlay && !currentPlayer.eventCardPlayedThisRound) {
      // Prefer event cards that target opponent
      const opponentEvents = affordableEvents.filter(id => {
        const card = getCardById(id);
        return (card as any)?.target === 'opponent';
      });
      if (opponentEvents.length > 0) {
        cardsToPlay.push(opponentEvents[0]);
      } else {
        cardsToPlay.push(affordableEvents[0]);
      }
    }

    // Play the selected cards (only as many as can afford based on current influence)
    for (const cardId of cardsToPlay.slice(0, maxCardsToPlay)) {
      // Double-check affordability (influence may have been spent on previous cards)
      if (!canAffordCard(currentPlayer, cardId)) {
        continue; // Skip if can't afford after previous plays
      }

      const card = getCardById(cardId);
      if (!card) continue;

      let targetType: 'meal' | 'staff' | 'support' | 'event' | undefined;
      if (card.type === CardType.MEAL) targetType = 'meal';
      else if (card.type === CardType.STAFF) targetType = 'staff';
      else if (card.type === CardType.SUPPORT) targetType = 'support';
      else if (card.type === CardType.EVENT) targetType = 'event';

      const result = playCard(currentPlayer, cardId, targetType);
      if (result === null) {
        // Card couldn't be played (insufficient influence or event limit)
        continue;
      }
      currentPlayer = result;
    }

    // End the turn
    currentPlayer = completeTurn(currentPlayer);

    return currentPlayer;
  }
}


import { Player } from './GameEngine';
import { Deck, drawCards, shuffleDeck } from './DeckManager';
import { Card, CardType, getCardById, CARD_DEFINITIONS } from './CardTypes';
import { calculateScore, PlayerBoardState } from './Scoring';
import { playCard, completeTurn } from './GameEngine';
import { PlayerDeck, createDefaultPlayerDeck } from './DeckManager';

/**
 * AI Opponent - handles AI player decisions and actions
 */
export class AIOpponent {
  private name: string = 'AI Chef';

  constructor(name?: string) {
    if (name) {
      this.name = name;
    }
  }

  /**
   * Creates a default deck for the AI
   */
  createAIDeck(): PlayerDeck {
    return createDefaultPlayerDeck();
  }

  /**
   * AI decides which cards to mulligan
   * Strategy: Keep high-value cards, mulligan low-value cards
   */
  decideMulligan(player: Player): string[] {
    const cardsToMulligan: string[] = [];
    
    // Get card values
    const cardValues: Array<{ id: string; value: number }> = player.hand.map(cardId => {
      const card = getCardById(cardId);
      let value = 0;
      
      if (card) {
        if (card.type === CardType.MEAL && 'value' in card) {
          value = (card as any).value;
        } else if (card.type === CardType.STAFF || card.type === CardType.SUPPORT) {
          value = 2; // Medium value for utility cards
        } else if (card.type === CardType.EVENT) {
          value = 3; // Events can be valuable
        }
      }
      
      return { id: cardId, value };
    });

    // Sort by value and mulligan the lowest 1-2 cards
    cardValues.sort((a, b) => a.value - b.value);
    const mulliganCount = Math.min(2, Math.floor(player.hand.length / 2));
    
    for (let i = 0; i < mulliganCount; i++) {
      if (cardValues[i].value < 3) {
        cardsToMulligan.push(cardValues[i].id);
      }
    }

    return cardsToMulligan;
  }

  /**
   * AI decides which cards to play during a turn
   * Strategy: Play high-value meals, useful staff/support, strategic events
   */
  decideCardsToPlay(player: Player, opponent: Player): string[] {
    const cardsToPlay: string[] = [];
    const hand = [...player.hand];
    
    // Sort cards by priority
    const cardPriorities = hand.map(cardId => {
      const card = getCardById(cardId);
      let priority = 0;
      
      if (!card) return { id: cardId, priority: 0 };

      // High priority: High-value meals
      if (card.type === CardType.MEAL && 'value' in card) {
        priority = (card as any).value * 10;
      }
      // Medium priority: Staff and Support cards
      else if (card.type === CardType.STAFF || card.type === CardType.SUPPORT) {
        priority = 15;
      }
      // Strategic priority: Events (especially if opponent is ahead)
      else if (card.type === CardType.EVENT) {
        const playerScore = calculateScore(player.boardState).totalScore;
        const opponentScore = calculateScore(opponent.boardState).totalScore;
        if (opponentScore > playerScore) {
          priority = 20; // Higher priority if losing
        } else {
          priority = 10;
        }
      }

      return { id: cardId, priority };
    });

    // Sort by priority (highest first)
    cardPriorities.sort((a, b) => b.priority - a.priority);

    // Decide how many cards to play (AI plays 2-4 cards typically)
    const targetCards = Math.min(4, Math.max(2, Math.floor(hand.length * 0.6)));
    
    // Play top priority cards
    for (let i = 0; i < targetCards && i < cardPriorities.length; i++) {
      cardsToPlay.push(cardPriorities[i].id);
    }

    return cardsToPlay;
  }

  /**
   * Executes AI's turn - plays cards and completes turn
   */
  executeTurn(player: Player, opponent: Player): Player {
    let updatedPlayer = { ...player };
    
    // Decide which cards to play
    const cardsToPlay = this.decideCardsToPlay(updatedPlayer, opponent);
    
    // Play each card
    for (const cardId of cardsToPlay) {
      const card = getCardById(cardId);
      if (!card) continue;

      // Determine card type for placement
      let targetType: 'meal' | 'staff' | 'support' | 'event' | undefined;
      if (card.type === CardType.MEAL) {
        targetType = 'meal';
      } else if (card.type === CardType.STAFF) {
        targetType = 'staff';
      } else if (card.type === CardType.SUPPORT) {
        targetType = 'support';
      } else if (card.type === CardType.EVENT) {
        targetType = 'event';
      }

      updatedPlayer = playCard(updatedPlayer, cardId, targetType);
    }

    // Complete the turn
    updatedPlayer = completeTurn(updatedPlayer);

    return updatedPlayer;
  }

  /**
   * Gets the AI's name
   */
  getName(): string {
    return this.name;
  }
}


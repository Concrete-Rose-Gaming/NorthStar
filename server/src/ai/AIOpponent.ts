import { GameState, Player, GameAction, AnyCard, CardType, GamePhase } from '@culinary-game/shared';
import { GameEngine } from '../game/GameEngine';

export class AIOpponent {
  private difficulty: 'easy' | 'medium' | 'hard';

  constructor(difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.difficulty = difficulty;
  }

  makeDecision(gameState: GameState, engine: GameEngine): GameAction | null {
    const aiPlayer = gameState.players.find(p => p.isAI && p.id === gameState.players[gameState.currentPlayerIndex].id);
    if (!aiPlayer) {
      return null;
    }

    // If in mulligan phase, always mulligan
    if (gameState.phase === GamePhase.MULLIGAN && !aiPlayer.isReady) {
      return {
        type: 'MULLIGAN',
        playerId: aiPlayer.id
      };
    }

    // If in round phase, make play decisions
    if (gameState.phase === GamePhase.ROUND) {
      // Try to play cards
      const playableCards = this.getPlayableCards(aiPlayer, gameState);
      
      if (playableCards.length > 0) {
        const cardToPlay = this.selectCardToPlay(playableCards, aiPlayer, gameState);
        if (cardToPlay) {
          return {
            type: 'PLAY_CARD',
            playerId: aiPlayer.id,
            cardId: cardToPlay.id
          };
        }
      }

      // If no cards to play or strategy says to end turn, end turn
      return {
        type: 'END_TURN',
        playerId: aiPlayer.id
      };
    }

    return null;
  }

  private getPlayableCards(player: Player, gameState: GameState): AnyCard[] {
    return player.hand.filter(card => {
      // Check if card has activation conditions
      if (card.activationCondition) {
        const condition = card.activationCondition;
        if (condition.type === 'STAR_COUNT' && condition.value) {
          return player.legendaryStars >= condition.value;
        }
      }
      return true;
    });
  }

  private selectCardToPlay(cards: AnyCard[], player: Player, gameState: GameState): AnyCard | null {
    if (cards.length === 0) return null;

    // Simple AI strategy based on difficulty
    switch (this.difficulty) {
      case 'easy':
        // Play first available card
        return cards[0];
      
      case 'medium':
        // Prefer cards that can gain stars or remove opponent stars
        const starCards = cards.filter(card => 
          card.abilities?.some(a => a.effect === 'GAIN_STAR' || a.effect === 'REMOVE_STAR') ||
          (card as any).effects?.some((e: any) => e.effect === 'GAIN_STAR' || e.effect === 'REMOVE_STAR')
        );
        if (starCards.length > 0) {
          return starCards[0];
        }
        // Prefer character cards
        const characterCards = cards.filter(card => card.type === CardType.CHARACTER);
        if (characterCards.length > 0) {
          return characterCards[0];
        }
        return cards[0];
      
      case 'hard':
        // More sophisticated: prioritize based on game state
        const opponent = gameState.players.find(p => p.id !== player.id);
        
        // If opponent has more stars, prioritize star removal
        if (opponent && opponent.legendaryStars > player.legendaryStars) {
          const removeStarCards = cards.filter(card =>
            card.abilities?.some(a => a.effect === 'REMOVE_STAR') ||
            (card as any).effects?.some((e: any) => e.effect === 'REMOVE_STAR')
          );
          if (removeStarCards.length > 0) {
            return removeStarCards[0];
          }
        }
        
        // Otherwise, prioritize star gain
        const gainStarCards = cards.filter(card =>
          card.abilities?.some(a => a.effect === 'GAIN_STAR') ||
          (card as any).effects?.some((e: any) => e.effect === 'GAIN_STAR')
        );
        if (gainStarCards.length > 0) {
          return gainStarCards[0];
        }
        
        // Then character cards
        const characterCards = cards.filter(card => card.type === CardType.CHARACTER);
        if (characterCards.length > 0) {
          return characterCards[0];
        }
        
        return cards[0];
    }
  }
}


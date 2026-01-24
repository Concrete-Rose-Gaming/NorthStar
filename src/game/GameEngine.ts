import { Deck, PlayerDeck, shuffleDeck, drawCards, selectRandomRestaurant } from './DeckManager';
import { calculateScore, compareScores, PlayerBoardState } from './Scoring';
import { CardType, getCardById, ChefCard } from './CardTypes';

// Game phase
export enum GamePhase {
  LOBBY = 'LOBBY',
  DECK_BUILDING = 'DECK_BUILDING',
  INITIAL_DRAW = 'INITIAL_DRAW',
  RESTAURANT_SELECTION = 'RESTAURANT_SELECTION',
  MULLIGAN = 'MULLIGAN',
  COIN_FLIP = 'COIN_FLIP',
  ROUND_START = 'ROUND_START',
  TURN = 'TURN',
  FACE_OFF = 'FACE_OFF',
  ROUND_END = 'ROUND_END',
  GAME_END = 'GAME_END'
}

// Player data
export interface Player {
  id: string;
  name: string;
  deck: Deck;
  hand: Deck; // Card IDs in hand
  discardPile: Deck; // Card IDs in discard pile (for discarded meals)
  chefCardId: string | null;
  restaurantCardId: string | null;
  restaurantDeck: Deck; // Shuffled restaurant deck (3 cards)
  restaurantRevealed: boolean; // Whether restaurant has been revealed
  boardState: PlayerBoardState;
  stars: number;
  influence: number;        // Current influence available
  maxInfluence: number;     // Maximum influence this round (based on chef + stars)
  ready: boolean;
  turnComplete: boolean;
  eventCardPlayedThisRound: boolean;
}

// Faceoff state for sequential card reveal
export interface FaceoffState {
  revealedCards: { player1: string[], player2: string[] };
  currentRevealIndex: number;
  revealOrder: { player1: string[], player2: string[] };
}

// Game state
export interface GameState {
  gameId: string;
  phase: GamePhase;
  players: {
    player1: Player | null;
    player2: Player | null;
  };
  currentRound: number;
  firstPlayer: 'player1' | 'player2' | null;
  winner: 'player1' | 'player2' | null;
  coinFlipResult: 'heads' | 'tails' | null;
  faceoffState?: FaceoffState; // State for sequential card reveal during faceoff
}

/**
 * Creates a new game state
 */
export function createGameState(gameId: string): GameState {
  return {
    gameId,
    phase: GamePhase.LOBBY,
    players: {
      player1: null,
      player2: null
    },
    currentRound: 0,
    firstPlayer: null,
    winner: null,
    coinFlipResult: null
  };
}

/**
 * Calculates the maximum influence for a player based on their chef and stars
 */
export function calculateMaxInfluence(player: Player): number {
  if (!player.chefCardId) {
    return 0; // No chef selected
  }

  const chefCard = getCardById(player.chefCardId) as ChefCard | undefined;
  if (!chefCard) {
    return 3; // Default fallback
  }

  // Starting influence + (stars * star bonus influence)
  return chefCard.startingInfluence + (player.stars * chefCard.starBonusInfluence);
}

/**
 * Initializes a player with their deck
 */
export function initializePlayer(playerId: string, name: string, playerDeck: PlayerDeck): Player {
  // Shuffle the main deck
  const shuffledDeck = shuffleDeck([...playerDeck.mainDeck]);
  
  // Shuffle the restaurant deck (3 cards) - player will choose top or bottom
  const shuffledRestaurantDeck = shuffleDeck([...playerDeck.restaurantCardIds]);
  
  // Draw initial 5 cards from main deck
  const { drawn: initialHand, remaining: remainingDeck } = drawCards(shuffledDeck, 5);

  // Create initial player state - restaurant not selected yet
  const initialPlayer: Player = {
    id: playerId,
    name,
    deck: remainingDeck,
    hand: initialHand,
    discardPile: [],
    chefCardId: playerDeck.chefCardId,
    restaurantCardId: null, // Will be set when player selects
    restaurantDeck: shuffledRestaurantDeck,
    restaurantRevealed: false, // Start face-down
    boardState: {
      chefCardId: playerDeck.chefCardId,
      restaurantCardId: '', // Empty until selected
      attachedMeals: [],
      playedMeals: [],
      playedStaff: [],
      playedSupport: [],
      playedEvents: [],
      faceDownCards: [],
      activatedSupport: []
    },
    stars: 0,
    influence: 0,
    maxInfluence: 0,
    ready: false,
    turnComplete: false,
    eventCardPlayedThisRound: false
  };

  // Calculate initial influence based on chef
  initialPlayer.maxInfluence = calculateMaxInfluence(initialPlayer);
  initialPlayer.influence = initialPlayer.maxInfluence; // Start with full influence

  return initialPlayer;
}

/**
 * Selects a restaurant from the shuffled deck (top or bottom)
 */
export function selectRestaurantFromDeck(player: Player, position: 'top' | 'bottom'): Player {
  if (player.restaurantDeck.length === 0) {
    return player; // No restaurants available
  }

  let selectedRestaurantId: string;
  if (position === 'top') {
    // Take from top (first card)
    selectedRestaurantId = player.restaurantDeck[0];
  } else {
    // Take from bottom (last card)
    selectedRestaurantId = player.restaurantDeck[player.restaurantDeck.length - 1];
  }

  return {
    ...player,
    restaurantCardId: selectedRestaurantId,
    boardState: {
      ...player.boardState,
      restaurantCardId: selectedRestaurantId
    }
  };
}

/**
 * Reveals the restaurant cards for both players (after mulligan)
 */
export function revealRestaurants(gameState: GameState): GameState {
  const p1 = gameState.players.player1 ? {
    ...gameState.players.player1,
    restaurantRevealed: true
  } : null;

  const p2 = gameState.players.player2 ? {
    ...gameState.players.player2,
    restaurantRevealed: true
  } : null;

  return {
    ...gameState,
    players: {
      player1: p1,
      player2: p2
    }
  };
}

/**
 * Performs mulligan - player can redraw their hand
 */
export function performMulligan(player: Player, cardsToMulligan: string[]): Player {
  // Put mulliganed cards back in deck
  const newDeck = [...player.deck, ...cardsToMulligan];
  const shuffled = shuffleDeck(newDeck);
  
  // Remove mulliganed cards from hand
  const newHand = player.hand.filter(id => !cardsToMulligan.includes(id));
  
  // Draw replacement cards
  const { drawn: replacements, remaining: finalDeck } = drawCards(shuffled, cardsToMulligan.length);
  
  return {
    ...player,
    hand: [...newHand, ...replacements],
    deck: finalDeck
  };
}

/**
 * Flips a coin to determine first player
 */
export function flipCoin(): 'heads' | 'tails' {
  return Math.random() < 0.5 ? 'heads' : 'tails';
}

/**
 * Sets the first player based on coin flip
 */
export function setFirstPlayer(gameState: GameState, coinResult: 'heads' | 'tails'): GameState {
  // Simple: heads = player1, tails = player2 (or could be random assignment)
  const firstPlayer = coinResult === 'heads' ? 'player1' : 'player2';
  
  return {
    ...gameState,
    coinFlipResult: coinResult,
    firstPlayer,
    phase: GamePhase.ROUND_START
  };
}

/**
 * Starts a new round
 */
export function startRound(gameState: GameState): GameState {
  const newRound = gameState.currentRound + 1;
  
  // Both players reset board state, event card flag, and draw cards
  // Note: attachedMeals persist between rounds (they are permanent equipment)
  const player1 = gameState.players.player1 ? {
    ...gameState.players.player1,
    deck: gameState.players.player1.deck,
    hand: [...gameState.players.player1.hand],
    boardState: {
      ...gameState.players.player1.boardState,
      // Keep attachedMeals - they persist between rounds
      playedStaff: [],
      playedSupport: [],
      playedEvents: [],
      faceDownCards: [],
      activatedSupport: []
    },
    turnComplete: false,
    eventCardPlayedThisRound: false
  } : null;

  const player2 = gameState.players.player2 ? {
    ...gameState.players.player2,
    deck: gameState.players.player2.deck,
    hand: [...gameState.players.player2.hand],
    boardState: {
      ...gameState.players.player2.boardState,
      // Keep attachedMeals - they persist between rounds
      playedStaff: [],
      playedSupport: [],
      playedEvents: [],
      faceDownCards: [],
      activatedSupport: []
    },
    turnComplete: false,
    eventCardPlayedThisRound: false
  } : null;

  // Draw cards until each player has 5 cards (or deck runs out)
  if (player1) {
    const cardsNeeded = Math.max(0, 5 - player1.hand.length);
    if (cardsNeeded > 0 && player1.deck.length > 0) {
      const cardsToDraw = Math.min(cardsNeeded, player1.deck.length);
      const { drawn, remaining } = drawCards(player1.deck, cardsToDraw);
      player1.hand.push(...drawn);
      player1.deck = remaining;
    }
  }

  if (player2) {
    const cardsNeeded = Math.max(0, 5 - player2.hand.length);
    if (cardsNeeded > 0 && player2.deck.length > 0) {
      const cardsToDraw = Math.min(cardsNeeded, player2.deck.length);
      const { drawn, remaining } = drawCards(player2.deck, cardsToDraw);
      player2.hand.push(...drawn);
      player2.deck = remaining;
    }
  }

  // Recalculate and reset influence to max for new round
  if (player1) {
    player1.maxInfluence = calculateMaxInfluence(player1);
    player1.influence = player1.maxInfluence; // Reset to max at round start
  }

  if (player2) {
    player2.maxInfluence = calculateMaxInfluence(player2);
    player2.influence = player2.maxInfluence; // Reset to max at round start
  }

  return {
    ...gameState,
    currentRound: newRound,
    phase: GamePhase.TURN,
    players: {
      player1,
      player2
    }
  };
}

/**
 * Checks if a player can afford to play a card (has enough influence)
 */
export function canAffordCard(player: Player, cardId: string): boolean {
  const card = getCardById(cardId);
  if (!card) return false;

  // Chef and Restaurant cards don't cost influence (they're already played)
  if (card.type === 'CHEF' || card.type === 'RESTAURANT') {
    return true;
  }

  // Get influence cost based on card type
  let cost = 0;
  if (card.type === 'MEAL' && 'influenceCost' in card) {
    cost = (card as any).influenceCost || 1;
  } else if (card.type === 'STAFF' && 'influenceCost' in card) {
    cost = (card as any).influenceCost || 2;
  } else if ((card.type === 'EVENT' || card.type === 'SUPPORT') && 'influenceCost' in card) {
    cost = (card as any).influenceCost || 2;
  }

  return player.influence >= cost;
}

/**
 * Gets the influence cost of a card
 */
export function getCardInfluenceCost(cardId: string): number {
  const card = getCardById(cardId);
  if (!card) return 0;

  // Chef and Restaurant cards don't cost influence
  if (card.type === 'CHEF' || card.type === 'RESTAURANT') {
    return 0;
  }

  if ('influenceCost' in card) {
    return (card as any).influenceCost || 0;
  }

  return 0;
}

/**
 * Plays a card from hand to board
 * Returns null if the card cannot be played (insufficient influence or event card limit)
 * For meal cards: attaches to restaurant permanently (max 3). If at capacity, requires mealToDiscard parameter.
 * For Staff/Support/Event cards: plays face-down by default during Setup phase.
 * Support cards can be activated immediately if activateSupport is true.
 */
export function playCard(
  player: Player,
  cardId: string,
  targetType?: 'meal' | 'staff' | 'support' | 'event',
  mealToDiscard?: string, // Required when attaching a meal to a restaurant that already has 3 meals
  activateSupport?: boolean // If true, activate Support card immediately instead of playing face-down
): Player | null {
  const card = getCardById(cardId);
  if (!card) {
    return null; // Card not found
  }

  // Check if this is an event card
  const isEventCard = targetType === 'event' || card.type === CardType.EVENT || cardId.startsWith('event_');
  
  // Prevent playing multiple event cards per round
  if (isEventCard && player.eventCardPlayedThisRound) {
    return null; // Cannot play - event already played this round
  }

  // Check if this is a meal card
  const isMealCard = targetType === 'meal' || card.type === CardType.MEAL || cardId.startsWith('meal_');

  // Special handling for meal cards - attach to restaurant
  if (isMealCard) {
    // Check if restaurant already has 3 meals attached
    const currentAttachedMeals = player.boardState.attachedMeals || [];
    
    if (currentAttachedMeals.length >= 3) {
      // Restaurant is at capacity - need to discard one meal
      if (!mealToDiscard) {
        // UI should handle showing selection - return null to indicate replacement needed
        return null;
      }
      
      // Validate that mealToDiscard is actually attached
      if (!currentAttachedMeals.includes(mealToDiscard)) {
        return null; // Invalid meal to discard
      }
      
      // Remove the meal to discard from attached meals and add to discard pile
      const newAttachedMeals = currentAttachedMeals.filter(id => id !== mealToDiscard);
      const newDiscardPile = [...player.discardPile, mealToDiscard];
      
      // Add the new meal to attached meals
      newAttachedMeals.push(cardId);
      
      // Remove card from hand
      const newHand = player.hand.filter(id => id !== cardId);
      
      // Check if player can afford the card (influence cost)
      if (!canAffordCard(player, cardId)) {
        return null; // Cannot afford
      }
      
      // Get and deduct influence cost
      const cost = getCardInfluenceCost(cardId);
      const newInfluence = player.influence - cost;
      
      return {
        ...player,
        hand: newHand,
        discardPile: newDiscardPile,
        influence: newInfluence,
        boardState: {
          ...player.boardState,
          attachedMeals: newAttachedMeals
        }
      };
    } else {
      // Restaurant has space - attach meal directly
      // Check if player can afford the card (influence cost)
      if (!canAffordCard(player, cardId)) {
        return null; // Cannot afford
      }
      
      // Get and deduct influence cost
      const cost = getCardInfluenceCost(cardId);
      const newInfluence = player.influence - cost;
      
      // Remove card from hand
      const newHand = player.hand.filter(id => id !== cardId);
      
      // Add to attached meals
      const newAttachedMeals = [...currentAttachedMeals, cardId];
      
      return {
        ...player,
        hand: newHand,
        influence: newInfluence,
        boardState: {
          ...player.boardState,
          attachedMeals: newAttachedMeals
        }
      };
    }
  }

  // For non-meal cards, use the original logic
  // Check if player can afford the card (influence cost)
  if (!canAffordCard(player, cardId)) {
    return null; // Cannot afford
  }

  // Get and deduct influence cost
  const cost = getCardInfluenceCost(cardId);
  const newInfluence = player.influence - cost;

  // Remove card from hand
  const newHand = player.hand.filter(id => id !== cardId);
  
  // Add to appropriate board area
  const newBoardState = { ...player.boardState };
  
  // Determine card type and add to appropriate area
  if (!targetType) {
    // Infer from card type
    if (card.type === 'STAFF') {
      newBoardState.playedStaff.push(cardId);
    } else if (card.type === 'SUPPORT') {
      newBoardState.playedSupport.push(cardId);
    } else if (card.type === 'EVENT') {
      newBoardState.playedEvents.push(cardId);
    }
  } else {
    switch (targetType) {
      case 'staff':
        newBoardState.playedStaff.push(cardId);
        break;
      case 'support':
        newBoardState.playedSupport.push(cardId);
        break;
      case 'event':
        newBoardState.playedEvents.push(cardId);
        break;
    }
  }

  // Track face-down cards (Staff, Support, Event) - all played face-down during Setup
  // Support cards can be activated immediately if activateSupport is true
  const isSupportCard = targetType === 'support' || card.type === CardType.SUPPORT;
  
  if (isSupportCard && activateSupport) {
    // Support card activated immediately - add to activatedSupport, don't add to faceDownCards
    newBoardState.activatedSupport.push(cardId);
  } else {
    // Card played face-down - track play order
    const currentPlayOrder = newBoardState.faceDownCards.length;
    newBoardState.faceDownCards.push({
      cardId,
      isFaceDown: true,
      playOrder: currentPlayOrder
    });
  }

  return {
    ...player,
    hand: newHand,
    influence: newInfluence,
    boardState: newBoardState,
    eventCardPlayedThisRound: isEventCard ? true : player.eventCardPlayedThisRound
  };
}

/**
 * Marks a player's turn as complete
 */
export function completeTurn(player: Player): Player {
  return {
    ...player,
    turnComplete: true
  };
}

/**
 * Checks if both players have completed their turns
 */
export function bothPlayersReady(gameState: GameState): boolean {
  const p1 = gameState.players.player1;
  const p2 = gameState.players.player2;
  
  return (p1?.turnComplete ?? false) && (p2?.turnComplete ?? false);
}

/**
 * Determines the reveal order for faceoff (left to right based on board position)
 * Cards are ordered by play order (when they were played)
 */
function getRevealOrder(player: Player): string[] {
  // Get all played cards in play order (from faceDownCards)
  const playOrderMap = new Map<string, number>();
  player.boardState.faceDownCards.forEach(cardState => {
    playOrderMap.set(cardState.cardId, cardState.playOrder);
  });
  
  // Combine all played cards
  const allCards = [
    ...player.boardState.playedStaff,
    ...player.boardState.playedSupport,
    ...player.boardState.playedEvents
  ];
  
  // Sort by play order (left to right = first played to last played)
  return allCards.sort((a, b) => {
    const orderA = playOrderMap.get(a) ?? 999;
    const orderB = playOrderMap.get(b) ?? 999;
    return orderA - orderB;
  });
}

/**
 * Reveals the next pair of cards in the faceoff sequence
 */
export function revealNextCardPair(gameState: GameState): GameState {
  if (!gameState.faceoffState) {
    // Initialize faceoff state
    const p1 = gameState.players.player1;
    const p2 = gameState.players.player2;
    
    if (!p1 || !p2) return gameState;
    
    const revealOrder1 = getRevealOrder(p1);
    const revealOrder2 = getRevealOrder(p2);
    
    gameState.faceoffState = {
      revealedCards: { player1: [], player2: [] },
      currentRevealIndex: 0,
      revealOrder: { player1: revealOrder1, player2: revealOrder2 }
    };
  }
  
  const faceoffState = gameState.faceoffState;
  const p1 = gameState.players.player1;
  const p2 = gameState.players.player2;
  
  if (!p1 || !p2) return gameState;
  
  // Check if all cards are revealed
  const maxCards = Math.max(
    faceoffState.revealOrder.player1.length,
    faceoffState.revealOrder.player2.length
  );
  
  if (faceoffState.currentRevealIndex >= maxCards) {
    // All cards revealed - calculate final scores
    return performFaceOff(gameState);
  }
  
  // Reveal next card pair
  const newRevealed1 = [...faceoffState.revealedCards.player1];
  const newRevealed2 = [...faceoffState.revealedCards.player2];
  
  if (faceoffState.currentRevealIndex < faceoffState.revealOrder.player1.length) {
    newRevealed1.push(faceoffState.revealOrder.player1[faceoffState.currentRevealIndex]);
  }
  
  if (faceoffState.currentRevealIndex < faceoffState.revealOrder.player2.length) {
    newRevealed2.push(faceoffState.revealOrder.player2[faceoffState.currentRevealIndex]);
  }
  
  const newFaceoffState: FaceoffState = {
    ...faceoffState,
    revealedCards: { player1: newRevealed1, player2: newRevealed2 },
    currentRevealIndex: faceoffState.currentRevealIndex + 1
  };
  
  return {
    ...gameState,
    faceoffState: newFaceoffState
  };
}

/**
 * Performs the face-off - calculates scores and determines round winner
 * Now uses sequential reveal system
 */
export function performFaceOff(gameState: GameState): GameState {
  const p1 = gameState.players.player1;
  const p2 = gameState.players.player2;

  if (!p1 || !p2) {
    return gameState;
  }

  // If faceoff state exists and not all cards revealed, start/continue sequential reveal
  if (gameState.faceoffState) {
    const faceoffState = gameState.faceoffState;
    const maxCards = Math.max(
      faceoffState.revealOrder.player1.length,
      faceoffState.revealOrder.player2.length
    );
    
    // If not all cards revealed yet, continue revealing
    if (faceoffState.currentRevealIndex < maxCards) {
      return {
        ...gameState,
        phase: GamePhase.FACE_OFF
      };
    }
    // If all cards are revealed, fall through to calculate scores
  } else {
    // Start sequential reveal
    return {
      ...gameState,
      phase: GamePhase.FACE_OFF,
      faceoffState: {
        revealedCards: { player1: [], player2: [] },
        currentRevealIndex: 0,
        revealOrder: {
          player1: getRevealOrder(p1),
          player2: getRevealOrder(p2)
        }
      }
    };
  }

  // All cards revealed - calculate final scores
  const score1 = calculateScore(p1.boardState, p1.stars);
  const score2 = calculateScore(p2.boardState, p2.stars);

  // Determine winner
  const roundWinner = compareScores(score1.totalScore, score2.totalScore);
  
  // Award star
  const newP1 = { ...p1, stars: p1.stars + (roundWinner === 'player1' ? 1 : 0) };
  const newP2 = { ...p2, stars: p2.stars + (roundWinner === 'player2' ? 1 : 0) };

  // Check for game winner (5 stars)
  let winner: 'player1' | 'player2' | null = null;
  let phase = GamePhase.ROUND_END;

  if (newP1.stars >= 5) {
    winner = 'player1';
    phase = GamePhase.GAME_END;
  } else if (newP2.stars >= 5) {
    winner = 'player2';
    phase = GamePhase.GAME_END;
  }

  return {
    ...gameState,
    phase,
    players: {
      player1: newP1,
      player2: newP2
    },
    winner,
    faceoffState: undefined // Clear faceoff state
  };
}

/**
 * Advances to next round or ends game
 */
export function advanceToNextRound(gameState: GameState): GameState {
  if (gameState.winner) {
    return gameState; // Game already ended
  }

  return startRound(gameState);
}

/**
 * Resets turn completion status for new round
 */
export function resetTurnStatus(gameState: GameState): GameState {
  const p1 = gameState.players.player1 ? {
    ...gameState.players.player1,
    turnComplete: false
  } : null;

  const p2 = gameState.players.player2 ? {
    ...gameState.players.player2,
    turnComplete: false
  } : null;

  return {
    ...gameState,
    players: {
      player1: p1,
      player2: p2
    }
  };
}


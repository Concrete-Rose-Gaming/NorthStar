import { Deck, PlayerDeck, shuffleDeck, drawCards, selectRandomRestaurant } from './DeckManager';
import { calculateScore, compareScores, PlayerBoardState, ScoreResult } from './Scoring';

// Game phase
export enum GamePhase {
  LOBBY = 'LOBBY',
  DECK_BUILDING = 'DECK_BUILDING',
  INITIAL_DRAW = 'INITIAL_DRAW',
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
  chefCardId: string | null;
  restaurantCardId: string | null;
  boardState: PlayerBoardState;
  stars: number;
  ready: boolean;
  turnComplete: boolean;
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
 * Initializes a player with their deck
 */
export function initializePlayer(playerId: string, name: string, playerDeck: PlayerDeck): Player {
  // Shuffle the main deck
  const shuffledDeck = shuffleDeck([...playerDeck.mainDeck]);
  
  // Select a random Restaurant from the 3 available
  const restaurantCardId = selectRandomRestaurant(playerDeck.restaurantCardIds);
  
  // Draw initial 5 cards from main deck
  const { drawn: initialHand, remaining: remainingDeck } = drawCards(shuffledDeck, 5);

  return {
    id: playerId,
    name,
    deck: remainingDeck,
    hand: initialHand,
    chefCardId: playerDeck.chefCardId,
    restaurantCardId: restaurantCardId || null,
    boardState: {
      chefCardId: playerDeck.chefCardId,
      restaurantCardId: restaurantCardId || '',
      playedMeals: [],
      playedStaff: [],
      playedSupport: [],
      playedEvents: []
    },
    stars: 0,
    ready: false,
    turnComplete: false
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
  
  // Both players draw a card
  const player1 = gameState.players.player1 ? {
    ...gameState.players.player1,
    deck: gameState.players.player1.deck,
    hand: [...gameState.players.player1.hand],
    boardState: {
      ...gameState.players.player1.boardState,
      playedMeals: [],
      playedStaff: [],
      playedSupport: [],
      playedEvents: []
    },
    turnComplete: false
  } : null;

  const player2 = gameState.players.player2 ? {
    ...gameState.players.player2,
    deck: gameState.players.player2.deck,
    hand: [...gameState.players.player2.hand],
    boardState: {
      ...gameState.players.player2.boardState,
      playedMeals: [],
      playedStaff: [],
      playedSupport: [],
      playedEvents: []
    },
    turnComplete: false
  } : null;

  // Draw cards
  if (player1 && player1.deck.length > 0) {
    const { drawn, remaining } = drawCards(player1.deck, 1);
    player1.hand.push(...drawn);
    player1.deck = remaining;
  }

  if (player2 && player2.deck.length > 0) {
    const { drawn, remaining } = drawCards(player2.deck, 1);
    player2.hand.push(...drawn);
    player2.deck = remaining;
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
 * Plays a card from hand to board
 */
export function playCard(
  player: Player,
  cardId: string,
  targetType?: 'meal' | 'staff' | 'support' | 'event'
): Player {
  // Remove card from hand
  const newHand = player.hand.filter(id => id !== cardId);
  
  // Add to appropriate board area
  const newBoardState = { ...player.boardState };
  
  // Determine card type and add to appropriate area
  // This is simplified - in a real implementation, you'd check the card type
  // For now, we'll use the targetType parameter or infer from card ID
  if (!targetType) {
    // Infer from card ID prefix
    if (cardId.startsWith('meal_')) {
      newBoardState.playedMeals.push(cardId);
    } else if (cardId.startsWith('staff_')) {
      newBoardState.playedStaff.push(cardId);
    } else if (cardId.startsWith('support_')) {
      newBoardState.playedSupport.push(cardId);
    } else if (cardId.startsWith('event_')) {
      newBoardState.playedEvents.push(cardId);
    }
  } else {
    switch (targetType) {
      case 'meal':
        newBoardState.playedMeals.push(cardId);
        break;
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

  return {
    ...player,
    hand: newHand,
    boardState: newBoardState
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
 * Performs the face-off - calculates scores and determines round winner
 */
export function performFaceOff(gameState: GameState): GameState {
  const p1 = gameState.players.player1;
  const p2 = gameState.players.player2;

  if (!p1 || !p2) {
    return gameState;
  }

  // Calculate scores
  const score1 = calculateScore(p1.boardState);
  const score2 = calculateScore(p2.boardState);

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
    winner
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


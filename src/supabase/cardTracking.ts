import { incrementCardPlayed, incrementWinningPlay, incrementLosingPlay, updateCardDeckStats } from './cards';

/**
 * Tracks when a card is played in a game
 */
export async function trackCardPlayed(cardCode: string): Promise<void> {
  try {
    await incrementCardPlayed(cardCode);
  } catch (error) {
    console.error('Error tracking card played:', error);
  }
}

/**
 * Tracks when cards are used in a winning play
 */
export async function trackWinningCards(cardCodes: string[]): Promise<void> {
  try {
    await Promise.all(cardCodes.map(code => incrementWinningPlay(code)));
  } catch (error) {
    console.error('Error tracking winning cards:', error);
  }
}

/**
 * Tracks when cards are used in a losing play
 */
export async function trackLosingCards(cardCodes: string[]): Promise<void> {
  try {
    await Promise.all(cardCodes.map(code => incrementLosingPlay(code)));
  } catch (error) {
    console.error('Error tracking losing cards:', error);
  }
}

/**
 * Tracks cards when a deck is saved
 * Counts how many copies of each card are in the deck
 */
export async function trackDeckCards(cardCounts: Record<string, number>): Promise<void> {
  try {
    await Promise.all(
      Object.entries(cardCounts).map(([cardCode, count]) =>
        updateCardDeckStats(cardCode, count)
      )
    );
  } catch (error) {
    console.error('Error tracking deck cards:', error);
  }
}

/**
 * Helper to extract card codes from a deck
 */
export function extractCardCodesFromDeck(deck: { mainDeck: string[]; chefCardId: string; restaurantCardIds: string[] }): Record<string, number> {
  const counts: Record<string, number> = {};

  // Count main deck cards
  deck.mainDeck.forEach(cardCode => {
    counts[cardCode] = (counts[cardCode] || 0) + 1;
  });

  // Add chef card
  if (deck.chefCardId) {
    counts[deck.chefCardId] = (counts[deck.chefCardId] || 0) + 1;
  }

  // Add restaurant cards
  deck.restaurantCardIds.forEach(cardCode => {
    counts[cardCode] = (counts[cardCode] || 0) + 1;
  });

  return counts;
}


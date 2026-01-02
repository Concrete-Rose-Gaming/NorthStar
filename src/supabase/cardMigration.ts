import { createCard, generateCardCode } from './cards';
import { CARD_DEFINITIONS, CardType } from '../game/CardTypes';

/**
 * Helper to migrate existing hardcoded cards to the database
 * This can be run once to populate the cards table with existing card data
 */
export async function migrateCardsToDatabase(expansion: string = 'BASE'): Promise<{ success: number; errors: number }> {
  let success = 0;
  let errors = 0;

  for (const [cardId, card] of Object.entries(CARD_DEFINITIONS)) {
    try {
      // Parse the existing card ID to get type and number
      // Existing format: chef_001, meal_001, etc.
      const parts = cardId.split('_');
      if (parts.length !== 2) {
        console.warn(`Skipping card with invalid ID format: ${cardId}`);
        errors++;
        continue;
      }

      const [typePrefix, numberStr] = parts;
      const cardNumber = parseInt(numberStr, 10);
      
      if (isNaN(cardNumber)) {
        console.warn(`Skipping card with invalid number: ${cardId}`);
        errors++;
        continue;
      }

      // Map type prefix to card type
      const typeMap: Record<string, string> = {
        'chef': 'CHEF',
        'restaurant': 'RESTAURANT',
        'meal': 'MEAL',
        'staff': 'STAFF',
        'support': 'SUPPORT',
        'event': 'EVENT'
      };

      const cardType = typeMap[typePrefix] || card.type;

      // Extract value based on card type
      let value: number | null = null;
      if (card.type === CardType.MEAL) {
        value = (card as any).value || null;
      } else if (card.type === CardType.CHEF) {
        value = (card as any).baseValue || null;
      }

      // Extract effect/ability
      let effect: string | null = null;
      if (card.type === CardType.STAFF || card.type === CardType.SUPPORT) {
        effect = (card as any).ability || null;
      } else if (card.type === CardType.EVENT) {
        effect = (card as any).effect || null;
      } else if (card.type === CardType.CHEF) {
        effect = (card as any).ability || null;
      } else if (card.type === CardType.RESTAURANT) {
        effect = (card as any).ability || null;
      }

      // Create card in database
      const result = await createCard({
        expansion,
        card_type: cardType,
        card_number: cardNumber,
        name: card.name,
        description: card.description,
        effect,
        value,
        card_art: null, // Can be added later
        rarity: 'COMMON', // Default, can be updated later
        worth: 0 // Default, can be updated later
      });

      if (result.error) {
        console.error(`Error creating card ${cardId}:`, result.error);
        errors++;
      } else {
        console.log(`Migrated card: ${cardId} -> ${result.card?.code}`);
        success++;
      }
    } catch (error) {
      console.error(`Error processing card ${cardId}:`, error);
      errors++;
    }
  }

  return { success, errors };
}


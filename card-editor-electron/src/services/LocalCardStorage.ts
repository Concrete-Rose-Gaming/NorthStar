// Local card storage service for JSON file operations

export interface LocalCard {
  code: string;
  expansion: string;
  card_type: string;
  card_number: number;
  name: string;
  description: string;
  effect: string | null;
  value: number | null;
  card_art: string | null;
  rarity: string | null;
  worth: number;
  // Local-only fields
  synced?: boolean;
  lastSynced?: string | null;
  artwork_local_path?: string | null;
  artwork_synced?: boolean;
  // Feeder table data
  chef_data?: {
    code: string;
    starting_influence?: number;
    star_bonus_influence?: number;
    Restaurant_Focus_1?: string;
    Restaurant_Focus_2?: string;
  } | null;
  restaurant_data?: {
    code: string;
    Restaurant_Focus_1?: string;
    Restaurant_Focus_2?: string;
    required_stars?: number;
  } | null;
  meal_data?: {
    code: string;
    food_type?: string;
    influence_cost?: number;
    restaurant_type_1?: string;
    restaurant_type_2?: string;
  } | null;
  staff_data?: {
    code: string;
    employee_type?: string;
    influence_cost?: number;
    restaurant_type?: string;
  } | null;
  event_data?: {
    code: string;
    influence_cost?: number;
    first_enum?: string;
    second_enum?: string;
  } | null;
}

export interface LocalCardData {
  version: string;
  lastUpdated: string;
  cards: LocalCard[];
}

export class LocalCardStorage {
  private static cardsFilePath: string | null = null;

  static async getCardsFilePath(): Promise<string> {
    if (!this.cardsFilePath) {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      this.cardsFilePath = await window.electronAPI.getCardsFilePath();
    }
    return this.cardsFilePath;
  }

  static async loadCardsFromFile(): Promise<{ cards: LocalCard[]; error: Error | null }> {
    try {
      if (!window.electronAPI) {
        return { cards: [], error: new Error('Electron API not available') };
      }
      const filePath = await this.getCardsFilePath();
      const exists = await window.electronAPI.fileExists(filePath);
      
      if (!exists) {
        // Return empty array if file doesn't exist
        return { cards: [], error: null };
      }

      const result = await window.electronAPI.readFile(filePath);
      
      if (!result.success) {
        return { cards: [], error: new Error(result.error || 'Failed to read file') };
      }

      const data: LocalCardData = JSON.parse(result.data || '{}');
      return { cards: data.cards || [], error: null };
    } catch (error) {
      return { cards: [], error: error as Error };
    }
  }

  static async saveCardToFile(card: LocalCard): Promise<{ success: boolean; error: Error | null }> {
    try {
      if (!window.electronAPI) {
        return { success: false, error: new Error('Electron API not available') };
      }
      
      const { cards } = await this.loadCardsFromFile();
      const existingIndex = cards.findIndex(c => c.code === card.code);
      
      if (existingIndex !== -1) {
        cards[existingIndex] = card;
      } else {
        cards.push(card);
      }

      const data: LocalCardData = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        cards
      };

      const filePath = await this.getCardsFilePath();
      const result = await window.electronAPI.writeFile(filePath, JSON.stringify(data, null, 2));
      
      if (!result.success) {
        return { success: false, error: new Error(result.error || 'Failed to write file') };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  static async saveAllCardsToFile(cards: LocalCard[]): Promise<{ success: boolean; error: Error | null }> {
    try {
      if (!window.electronAPI) {
        return { success: false, error: new Error('Electron API not available') };
      }
      
      const data: LocalCardData = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        cards
      };

      const filePath = await this.getCardsFilePath();
      const result = await window.electronAPI.writeFile(filePath, JSON.stringify(data, null, 2));
      
      if (!result.success) {
        return { success: false, error: new Error(result.error || 'Failed to write file') };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  static async deleteCard(cardCode: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      if (!window.electronAPI) {
        return { success: false, error: new Error('Electron API not available') };
      }
      
      const { cards } = await this.loadCardsFromFile();
      const filteredCards = cards.filter(c => c.code !== cardCode);
      
      if (filteredCards.length === cards.length) {
        return { success: false, error: new Error('Card not found') };
      }

      return await this.saveAllCardsToFile(filteredCards);
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}



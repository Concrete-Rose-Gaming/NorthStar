// Local card storage service for JSON file operations

import { LocalCard, CardStorage } from '../types/Card';

export class LocalStorage {
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

      const data: CardStorage = JSON.parse(result.data || '{}');
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

      const data: CardStorage = {
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
      
      const data: CardStorage = {
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


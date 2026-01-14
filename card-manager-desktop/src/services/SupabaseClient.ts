// Supabase client service for card sync and image storage

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Card, LocalCard } from '../types/Card';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export class SupabaseService {
  private static client: SupabaseClient | null = null;
  private static config: SupabaseConfig | null = null;

  static initialize(config: SupabaseConfig): void {
    this.config = config;
    this.client = createClient(config.url, config.anonKey);
  }

  static getClient(): SupabaseClient | null {
    return this.client;
  }

  static getConfig(): SupabaseConfig | null {
    return this.config;
  }

  static async checkConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      if (!this.client) {
        return { connected: false, error: 'Not initialized' };
      }

      // Try a simple query to test connection
      const { error } = await this.client.from('cards').select('code').limit(1);
      
      if (error) {
        return { connected: false, error: error.message };
      }

      return { connected: true };
    } catch (error) {
      return { connected: false, error: (error as Error).message };
    }
  }

  static async getAllCards(): Promise<{ cards: Card[]; error: Error | null }> {
    try {
      if (!this.client) {
        return { cards: [], error: new Error('Supabase not initialized') };
      }

      const { data, error } = await this.client
        .from('cards')
        .select(`
          *,
          chef_data:chef_cards(code, starting_influence, star_bonus_influence, Restaurant_Focus_1, Restaurant_Focus_2),
          restaurant_data:restaurant_cards(code, Restaurant_Focus_1, Restaurant_Focus_2, required_stars),
          meal_data:meal_cards(code, food_type, influence_cost, restaurant_type_1, restaurant_type_2),
          staff_data:staff_cards(code, employee_type, influence_cost, restaurant_type, second_enum),
          event_data:event_cards(code, influence_cost, first_enum, second_enum)
        `)
        .order('expansion', { ascending: true })
        .order('card_type', { ascending: true })
        .order('card_number', { ascending: true });

      if (error) {
        return { cards: [], error: error as Error };
      }

      return { cards: (data || []) as Card[], error: null };
    } catch (error) {
      return { cards: [], error: error as Error };
    }
  }

  static async getCardByCode(code: string): Promise<{ card: Card | null; error: Error | null }> {
    try {
      if (!this.client) {
        return { card: null, error: new Error('Supabase not initialized') };
      }

      const { data, error } = await this.client
        .from('cards')
        .select('*')
        .eq('code', code)
        .single();

      if (error) {
        return { card: null, error: error as Error };
      }

      return { card: data as Card, error: null };
    } catch (error) {
      return { card: null, error: error as Error };
    }
  }

  static async createCard(card: Omit<Card, 'created_at' | 'updated_at'>): Promise<{ card: Card | null; error: Error | null }> {
    try {
      if (!this.client) {
        return { card: null, error: new Error('Supabase not initialized') };
      }

      const { data, error } = await this.client
        .from('cards')
        .insert({
          code: card.code,
          expansion: card.expansion,
          card_type: card.card_type,
          card_number: card.card_number,
          name: card.name,
          description: card.description,
          effect: card.effect || null,
          value: card.value || null,
          card_art: card.card_art || null,
          rarity: card.rarity || null,
          worth: card.worth || 0
        })
        .select()
        .single();

      if (error) {
        return { card: null, error: error as Error };
      }

      // Create type-specific data if present
      if (card.chef_data) {
        await this.client.from('chef_cards').upsert({ ...card.chef_data, code: card.code });
      }
      if (card.restaurant_data) {
        await this.client.from('restaurant_cards').upsert({ ...card.restaurant_data, code: card.code });
      }
      if (card.meal_data) {
        await this.client.from('meal_cards').upsert({ ...card.meal_data, code: card.code });
      }
      if (card.staff_data) {
        await this.client.from('staff_cards').upsert({ ...card.staff_data, code: card.code });
      }
      if (card.event_data) {
        await this.client.from('event_cards').upsert({ ...card.event_data, code: card.code });
      }

      return { card: data as Card, error: null };
    } catch (error) {
      return { card: null, error: error as Error };
    }
  }

  static async updateCard(code: string, updates: Partial<Omit<Card, 'code' | 'created_at' | 'updated_at'>>): Promise<{ card: Card | null; error: Error | null }> {
    try {
      if (!this.client) {
        return { card: null, error: new Error('Supabase not initialized') };
      }

      const { data, error } = await this.client
        .from('cards')
        .update(updates)
        .eq('code', code)
        .select()
        .single();

      if (error) {
        return { card: null, error: error as Error };
      }

      // Update type-specific data if present
      if (updates.chef_data) {
        await this.client.from('chef_cards').upsert({ ...updates.chef_data, code }, { onConflict: 'code' });
      }
      if (updates.restaurant_data) {
        await this.client.from('restaurant_cards').upsert({ ...updates.restaurant_data, code }, { onConflict: 'code' });
      }
      if (updates.meal_data) {
        await this.client.from('meal_cards').upsert({ ...updates.meal_data, code }, { onConflict: 'code' });
      }
      if (updates.staff_data) {
        await this.client.from('staff_cards').upsert({ ...updates.staff_data, code }, { onConflict: 'code' });
      }
      if (updates.event_data) {
        await this.client.from('event_cards').upsert({ ...updates.event_data, code }, { onConflict: 'code' });
      }

      return { card: data as Card, error: null };
    } catch (error) {
      return { card: null, error: error as Error };
    }
  }

  static async deleteCard(code: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      if (!this.client) {
        return { success: false, error: new Error('Supabase not initialized') };
      }

      // Delete type-specific data first
      await this.client.from('chef_cards').delete().eq('code', code);
      await this.client.from('restaurant_cards').delete().eq('code', code);
      await this.client.from('meal_cards').delete().eq('code', code);
      await this.client.from('staff_cards').delete().eq('code', code);
      await this.client.from('event_cards').delete().eq('code', code);

      // Delete main card
      const { error } = await this.client
        .from('cards')
        .delete()
        .eq('code', code);

      if (error) {
        return { success: false, error: error as Error };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  static async syncCardToSupabase(localCard: LocalCard): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Check if card exists
      const { card: existingCard } = await this.getCardByCode(localCard.code);

      if (existingCard) {
        // Update existing card
        const { error } = await this.updateCard(localCard.code, localCard);
        if (error) {
          return { success: false, error };
        }
      } else {
        // Create new card
        const { error } = await this.createCard(localCard);
        if (error) {
          return { success: false, error };
        }
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}


// Supabase sync service for per-card synchronization

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LocalCard } from './LocalCardStorage';
import { ArtworkStorage } from './ArtworkStorage';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    if (supabaseUrl && supabaseAnonKey) {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    } else {
      throw new Error('Supabase configuration is missing. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
    }
  }
  return supabaseInstance;
}

export class SupabaseSync {
  private supabase: SupabaseClient;

  constructor() {
    try {
      this.supabase = getSupabaseClient();
    } catch (error) {
      // Create a dummy client to prevent errors
      this.supabase = new Proxy({} as SupabaseClient, {
        get: () => () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
      });
    }
  }

  async checkSupabaseConnection(): Promise<{ connected: boolean; error: string | null }> {
    try {
      if (!supabaseUrl || !supabaseAnonKey) {
        return { connected: false, error: 'Supabase not configured' };
      }
      const { error } = await this.supabase.from('cards').select('code').limit(1);
      
      if (error) {
        return { connected: false, error: error.message };
      }
      
      return { connected: true, error: null };
    } catch (error) {
      return { connected: false, error: (error as Error).message };
    }
  }

  async uploadArtworkToSupabase(
    localFilePath: string,
    cardCode: string
  ): Promise<{ success: boolean; url: string | null; error: Error | null }> {
    try {
      if (!window.electronAPI) {
        return { success: false, url: null, error: new Error('Electron API not available') };
      }

      // Read image file
      const result = await window.electronAPI.readImageFile(localFilePath);
      if (!result.success || !result.data) {
        return { success: false, url: null, error: new Error('Failed to read image file') };
      }

      // Extract base64 and mime type
      const match = result.data.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) {
        return { success: false, url: null, error: new Error('Invalid image data format') };
      }

      const mimeType = match[1];
      const base64Data = match[2];
      
      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      // Get file extension
      const ext = localFilePath.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `${cardCode}-${Date.now()}.${ext}`;
      const filePath = `${cardCode}/${fileName}`;

      // Upload to Supabase storage
      const { error } = await this.supabase.storage
        .from('card-artwork')
        .upload(filePath, blob, {
          contentType: mimeType,
          upsert: false
        });

      if (error) {
        return { success: false, url: null, error: error as Error };
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('card-artwork')
        .getPublicUrl(filePath);

      return { success: true, url: urlData.publicUrl, error: null };
    } catch (error) {
      return { success: false, url: null, error: error as Error };
    }
  }

  async syncCardToSupabase(card: LocalCard): Promise<{ success: boolean; error: Error | null }> {
    try {
      // 1. Upload artwork if it exists locally and is not synced
      let cardArtUrl = card.card_art;
      
      if (card.artwork_local_path && !card.artwork_synced) {
        const uploadResult = await this.uploadArtworkToSupabase(card.artwork_local_path, card.code);
        if (uploadResult.success && uploadResult.url) {
          cardArtUrl = uploadResult.url;
        } else if (uploadResult.error) {
          return { success: false, error: new Error(`Failed to upload artwork: ${uploadResult.error.message}`) };
        }
      }

      // 2. Prepare card data for Supabase (remove local-only fields)
      const { synced, lastSynced, artwork_local_path, artwork_synced, ...supabaseCardData } = card;
      
      // Update card_art if artwork was uploaded
      if (cardArtUrl) {
        supabaseCardData.card_art = cardArtUrl;
      }

      // 3. Check if card exists
      const { data: existingCard, error: fetchError } = await this.supabase
        .from('cards')
        .select('code')
        .eq('code', card.code)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
        return { success: false, error: fetchError as Error };
      }

      if (existingCard) {
        // Update existing card
        const { error } = await this.supabase
          .from('cards')
          .update(supabaseCardData)
          .eq('code', card.code);

        if (error) {
          return { success: false, error: error as Error };
        }
      } else {
        // Create new card
        const { error } = await this.supabase
          .from('cards')
          .insert(supabaseCardData);

        if (error) {
          return { success: false, error: error as Error };
        }
      }

      // 4. Handle feeder table data
      if (card.chef_data) {
        const { error } = await this.supabase
          .from('chef_cards')
          .upsert({ ...card.chef_data, code: card.code }, { onConflict: 'code' });
        if (error) {
          console.warn('Failed to sync chef_data:', error);
        }
      }

      if (card.restaurant_data) {
        const { error } = await this.supabase
          .from('restaurant_cards')
          .upsert({ ...card.restaurant_data, code: card.code }, { onConflict: 'code' });
        if (error) {
          console.warn('Failed to sync restaurant_data:', error);
        }
      }

      if (card.meal_data) {
        const { error } = await this.supabase
          .from('meal_cards')
          .upsert({ ...card.meal_data, code: card.code }, { onConflict: 'code' });
        if (error) {
          console.warn('Failed to sync meal_data:', error);
        }
      }

      if (card.staff_data) {
        const { error } = await this.supabase
          .from('staff_cards')
          .upsert({ ...card.staff_data, code: card.code }, { onConflict: 'code' });
        if (error) {
          console.warn('Failed to sync staff_data:', error);
        }
      }

      if (card.event_data) {
        const { error } = await this.supabase
          .from('event_cards')
          .upsert({ ...card.event_data, code: card.code }, { onConflict: 'code' });
        if (error) {
          console.warn('Failed to sync event_data:', error);
        }
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}


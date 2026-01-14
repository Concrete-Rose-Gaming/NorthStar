// Image service for uploading/downloading images to/from Supabase Storage

import { SupabaseService } from './SupabaseClient';

export interface ImageValidation {
  valid: boolean;
  error?: string;
}

export class ImageService {
  private static readonly BUCKET_NAME = 'card-artwork';
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

  static validateImageFile(file: File): ImageValidation {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Allowed: PNG, JPG, WebP' };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: `File too large. Maximum size: ${this.MAX_FILE_SIZE / 1024 / 1024}MB` };
    }

    return { valid: true };
  }

  static async uploadImage(file: File, cardCode: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const client = SupabaseService.getClient();
      if (!client) {
        return { success: false, error: 'Supabase not initialized' };
      }

      // Validate file
      const validation = this.validateImageFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate file path: card-artwork/{cardCode}.{ext}
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `${cardCode}.${fileExt}`;
      const filePath = `${cardCode}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await client.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: urlData } = client.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async deleteImage(cardCode: string): Promise<{ success: boolean; error?: string }> {
    try {
      const client = SupabaseService.getClient();
      if (!client) {
        return { success: false, error: 'Supabase not initialized' };
      }

      // List files for this card
      const { data: files, error: listError } = await client.storage
        .from(this.BUCKET_NAME)
        .list(cardCode);

      if (listError) {
        return { success: false, error: listError.message };
      }

      if (!files || files.length === 0) {
        return { success: true }; // Nothing to delete
      }

      // Delete all files for this card
      const filePaths = files.map(file => `${cardCode}/${file.name}`);
      const { error: deleteError } = await client.storage
        .from(this.BUCKET_NAME)
        .remove(filePaths);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async downloadImage(url: string): Promise<{ success: boolean; blob?: Blob; error?: string }> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return { success: false, error: `Failed to download image: ${response.statusText}` };
      }

      const blob = await response.blob();
      return { success: true, blob };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static getImageUrl(cardCode: string, fileName?: string): string {
    const client = SupabaseService.getClient();
    if (!client) {
      return '';
    }

    const filePath = fileName ? `${cardCode}/${fileName}` : `${cardCode}`;
    const { data } = client.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
}


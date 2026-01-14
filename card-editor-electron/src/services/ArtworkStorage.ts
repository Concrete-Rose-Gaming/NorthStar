// Artwork storage service for managing card artwork images

export class ArtworkStorage {
  private static artworkPath: string | null = null;

  static async getArtworkPath(): Promise<string> {
    if (!this.artworkPath) {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      const path = await window.electronAPI.getArtworkPath();
      await window.electronAPI.ensureDirectory(path);
      this.artworkPath = path;
    }
    return this.artworkPath;
  }

  static async getLocalArtworkPath(cardCode: string, extension: string = 'png'): Promise<string> {
    const artworkPath = await this.getArtworkPath();
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI.pathJoin(artworkPath, `${cardCode}.${extension}`);
  }

  static validateImageFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`
      };
    }

    return { valid: true };
  }

  static async saveArtworkLocally(
    file: File,
    cardCode: string
  ): Promise<{ success: boolean; filePath: string | null; error: Error | null }> {
    try {
      if (!window.electronAPI) {
        return { success: false, filePath: null, error: new Error('Electron API not available') };
      }

      // Validate file
      const validation = this.validateImageFile(file);
      if (!validation.valid) {
        return { success: false, filePath: null, error: new Error(validation.error) };
      }

      // Convert file to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64 = result.replace(/^data:image\/\w+;base64,/, '');
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Get file extension
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filePath = await this.getLocalArtworkPath(cardCode, ext);

      // Write file
      const result = await window.electronAPI.writeImageFile(filePath, base64);
      
      if (!result.success) {
        return { success: false, filePath: null, error: new Error(result.error || 'Failed to save file') };
      }

      return { success: true, filePath, error: null };
    } catch (error) {
      return { success: false, filePath: null, error: error as Error };
    }
  }

  static async getArtworkAsDataUrl(
    cardCode: string
  ): Promise<{ success: boolean; dataUrl: string | null; error: Error | null }> {
    try {
      if (!window.electronAPI) {
        return { success: false, dataUrl: null, error: new Error('Electron API not available') };
      }

      // Try common extensions
      const extensions = ['png', 'jpg', 'jpeg', 'webp'];
      
      for (const ext of extensions) {
        const filePath = await this.getLocalArtworkPath(cardCode, ext);
        const exists = await window.electronAPI.fileExists(filePath);
        
        if (exists) {
          const result = await window.electronAPI.readImageFile(filePath);
          if (result.success && result.data) {
            return { success: true, dataUrl: result.data, error: null };
          }
        }
      }

      return { success: false, dataUrl: null, error: new Error('Artwork not found') };
    } catch (error) {
      return { success: false, dataUrl: null, error: error as Error };
    }
  }

  static async deleteArtwork(cardCode: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      if (!window.electronAPI) {
        return { success: false, error: new Error('Electron API not available') };
      }

      // Try to delete with common extensions
      const extensions = ['png', 'jpg', 'jpeg', 'webp'];
      let deleted = false;

      for (const ext of extensions) {
        const filePath = await this.getLocalArtworkPath(cardCode, ext);
        const exists = await window.electronAPI.fileExists(filePath);
        
        if (exists) {
          const result = await window.electronAPI.deleteFile(filePath);
          if (result.success) {
            deleted = true;
          }
        }
      }

      if (!deleted) {
        return { success: false, error: new Error('Artwork not found') };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}



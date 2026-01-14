// Unified type definition for Electron API

declare global {
  interface Window {
    electronAPI: {
      // Path operations
      getAppDataPath: () => Promise<string>;
      getCardsFilePath: () => Promise<string>;
      getArtworkPath: () => Promise<string>;
      
      // File operations
      readFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
      writeFile: (filePath: string, data: string) => Promise<{ success: boolean; error?: string }>;
      fileExists: (filePath: string) => Promise<boolean>;
      deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      ensureDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
      
      // Image file operations
      readImageFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
      writeImageFile: (filePath: string, base64Data: string) => Promise<{ success: boolean; error?: string }>;
      pathJoin: (...args: string[]) => Promise<string>;
    };
  }
}

export {};



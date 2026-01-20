const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Path operations
  getAppDataPath: () => ipcRenderer.invoke('get-app-data-path'),
  getCardsFilePath: () => ipcRenderer.invoke('get-cards-file-path'),
  getArtworkPath: () => ipcRenderer.invoke('get-artwork-path'),
  
  // File operations
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),
  fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  ensureDirectory: (dirPath) => ipcRenderer.invoke('ensure-directory', dirPath),
  
  // Image file operations
  readImageFile: (filePath) => ipcRenderer.invoke('read-image-file', filePath),
  writeImageFile: (filePath, base64Data) => ipcRenderer.invoke('write-image-file', filePath, base64Data),
  pathJoin: (...args) => ipcRenderer.invoke('path-join', ...args),
});


const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { existsSync } = require('fs');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
    },
    title: 'Chef Card Editor',
    show: false
  });

  const isDev = process.env.ELECTRON_IS_DEV === '1' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for file operations
ipcMain.handle('get-app-data-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('get-cards-file-path', async () => {
  const userDataPath = app.getPath('userData');
  const appDataDir = path.join(userDataPath, 'chef-card-editor');
  const cardsFilePath = path.join(appDataDir, 'cards.json');
  
  // Ensure directory exists
  await fs.mkdir(appDataDir, { recursive: true });
  
  return cardsFilePath;
});

ipcMain.handle('get-artwork-path', async () => {
  const userDataPath = app.getPath('userData');
  const artworkPath = path.join(userDataPath, 'chef-card-editor', 'artwork');
  
  // Ensure directory exists
  await fs.mkdir(artworkPath, { recursive: true });
  
  return artworkPath;
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (event, filePath, data) => {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(filePath, data, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file-exists', async (event, filePath) => {
  return existsSync(filePath);
});

ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ensure-directory', async (event, dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-image-file', async (event, filePath) => {
  try {
    const data = await fs.readFile(filePath);
    const base64 = data.toString('base64');
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    const dataUrl = `data:${mimeType};base64,${base64}`;
    return { success: true, data: dataUrl };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-image-file', async (event, filePath, base64Data) => {
  try {
    // Remove data URL prefix if present
    const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(filePath, buffer);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('path-join', (event, ...args) => {
  return path.join(...args);
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});



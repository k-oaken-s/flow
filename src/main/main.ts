const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

let mainWindow = null;
let store;
let storeManager;

async function loadStore() {
  try {
    const Store = (await import('electron-store')).default;
    store = new Store({
      name: 'flow-data',
      defaults: {
        videos: [],
        watchFolders: [],
        settings: {
          thumbnails: {
            maxCount: 20,
            quality: 80,
            width: 320,
            height: 180
          }
        }
      }
    });

    const StoreManagerClass = require('./store.js');
    storeManager = new StoreManagerClass();
    await storeManager.initializeStore();

    return Promise.resolve();
  } catch (error) {
    console.error('Error in loadStore:', error);
    return Promise.reject(error);
  }
}

function createWindow() {
  console.log('Creating window...');
  
  const preloadPath = path.join(__dirname, '..', 'preload', 'index.js');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      devTools: true,
      sandbox: false,
      webSecurity: true
    }
  });

  mainWindow.webContents.openDevTools({ mode: 'detach' });
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Load failure:', errorCode, errorDescription);
  });

  console.log('Preload script path:', preloadPath);

  const indexPath = path.join(__dirname, '..', 'index.html');
  console.log('Loading index from:', indexPath);

  mainWindow.loadFile(indexPath);

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window loaded successfully');
  });
}

function setupIpcHandlers() {
  ipcMain.handle('select-files', async () => {
    if (!mainWindow) return [];
    
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Videos', extensions: ['mp4', 'avi', 'mkv', 'mov', 'wmv'] }]
    });
  
    if ('canceled' in result && 'filePaths' in result) {
      return result.canceled ? [] : result.filePaths;
    }
    
    return [];
  });

  ipcMain.handle('get-user-data-path', () => app.getPath('userData'));

  ipcMain.handle('get-videos', () => {
    if (!storeManager) {
      console.error('StoreManager not initialized');
      return [];
    }
    return storeManager.getVideos();
  });

  ipcMain.handle('get-watch-folders', () => store.get('watchFolders'));

  ipcMain.handle('update-video-metadata', async (_, videoId, metadata, thumbnails) => {
    const videos = store.get('videos');
    const videoIndex = videos.findIndex(v => v.id === videoId);
    if (videoIndex !== -1) {
      videos[videoIndex] = {
        ...videos[videoIndex],
        metadata,
        thumbnails,
        processingStatus: 'completed',
        processingProgress: 100
      };
      store.set('videos', videos);
    }
  });

  ipcMain.handle('remove-video', async (_, id) => {
    const videos = store.get('videos').filter(v => v.id !== id);
    store.set('videos', videos);
  });

  ipcMain.handle('retry-thumbnails', async (_, id) => {
    try {
      // サムネイル再生成の処理
    } catch (error) {
      console.error('Failed to retry thumbnails:', error);
    }
  });
}

// 重複したapp.whenReady()を削除し、1つにまとめる
app.whenReady().then(() => {
  loadStore().then(() => {
    console.log('App is ready');
    createWindow();
    setupIpcHandlers();
  }).catch(error => {
    console.error('Failed to initialize app:', error);
    app.quit();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

module.exports = {
  createWindow,
  setupIpcHandlers
};
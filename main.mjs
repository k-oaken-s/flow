import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import StoreManager from './dist/main/store.js';

let mainWindow;
let store;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  console.log('Creating window...');
  // ウィンドウの作成
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // インデックスファイルのロード
  const indexPath = path.join(__dirname, 'index.html');
  console.log('Loading index from:', indexPath);
  mainWindow.loadFile(indexPath);

  // 開発ツールを開く
  mainWindow.webContents.openDevTools();

  // ウィンドウが閉じられたときの処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  // ウィンドウの準備ができたときの処理
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window loaded successfully');
  });
}

// Electron の初期化完了後に実行
app.whenReady().then(() => {
  console.log('App is ready');
  store = new StoreManager();
  createWindow();
});

// アプリケーションがアクティブになった時の処理（macOS）
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 全てのウィンドウが閉じられたときの処理
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPCイベントハンドラー
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Videos', extensions: ['mp4', 'avi', 'mkv', 'mov', 'wmv'] }
    ]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return store.addVideos(result.filePaths);
  }
  return [];
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return store.addWatchFolder(result.filePaths[0]);
  }
  return null;
});

ipcMain.handle('get-videos', () => {
  return store.getVideos();
});

ipcMain.handle('get-watch-folders', () => {
  return store.getWatchFolders();
});

// デバッグ用のエラーハンドリング
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
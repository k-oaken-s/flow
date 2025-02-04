const { app, BrowserWindow, protocol } = require('electron')
const path = require('path')

// Enable hot reload
require('electron-reload')(__dirname, {
  electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
  hardResetMethod: 'exit'
});

function createWindow() {
  // プロトコルの設定
  protocol.registerFileProtocol('file', (request, callback) => {
    const url = request.url.replace('file:///', '')
    try {
      return callback(decodeURIComponent(path.join(__dirname, url)))
    } catch (error) {
      console.error('ERROR:', error)
      return callback(404)
    }
  })

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false  // ローカルファイルへのアクセスを許可
    }
  })

  win.loadFile('index.html')
  win.webContents.openDevTools()

  // デバッグ用：読み込みエラーをキャッチ
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log('Failed to load:', errorCode, errorDescription)
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
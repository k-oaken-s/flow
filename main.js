const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // プロジェクトルートのindex.htmlを指定
  const indexPath = path.join(__dirname, 'index.html')
  console.log('Loading index from:', indexPath)
  
  // デバッグ用：ファイルの存在確認
  const fs = require('fs')
  if (fs.existsSync(indexPath)) {
    console.log('index.html exists at:', indexPath)
  } else {
    console.log('index.html not found at:', indexPath)
    console.log('Current directory:', __dirname)
  }

  win.loadFile('index.html')  // 相対パスで指定
  win.webContents.openDevTools()
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
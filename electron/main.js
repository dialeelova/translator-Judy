const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 330,
    height: 420,
    frame: false,
    resizable: false,
    backgroundColor: '#c9d2ee',
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  })

  win.loadURL('http://127.0.0.1:5173')

  ipcMain.on('win:minimize', () => win.minimize())
  ipcMain.on('win:close', () => win.close())
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => app.quit())

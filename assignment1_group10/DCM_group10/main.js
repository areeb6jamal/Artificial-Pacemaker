const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 980,
    height: 800,
    minWidth: 768,
    center: true,
    icon: 'assets/mcmaster-small.png',
    webPreferences: {
      nodeIntegration: true, // to allow require
      contextIsolation: false, // allow serialport use with Electron 12+
      //preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('index.html')
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

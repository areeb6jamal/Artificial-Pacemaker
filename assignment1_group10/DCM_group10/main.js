const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const bcrypt = require('bcrypt')

const saltRounds = 10

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    icon: 'assets/mcmaster-small.png',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('index.html')
}

async function bcryptHash(_channel, plaintextPassword) {
  // Hash password
  return bcrypt.hashSync(plaintextPassword, saltRounds)
}

async function bcryptCompare(_channel, plaintextPassword, hash) {
  // Compare plaintext password with hash from database
  return bcrypt.compareSync(plaintextPassword, hash);
}

app.whenReady().then(() => {
  ipcMain.handle('bcryptHash', bcryptHash)
  ipcMain.handle('bcryptCompare', bcryptCompare)

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

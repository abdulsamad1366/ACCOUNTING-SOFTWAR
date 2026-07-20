const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Vyapar Accounting Software - Desktop ERP',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../public/favicon.ico'),
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handler for Native File Save Backup
ipcMain.handle('save-backup-file', async (event, jsonContent) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Accounting Database Backup',
    defaultPath: `Accounting_Backup_${new Date().toISOString().split('T')[0]}.json`,
    filters: [{ name: 'JSON Backup', extensions: ['json'] }],
  });

  if (filePath) {
    fs.writeFileSync(filePath, jsonContent, 'utf-8');
    return { success: true, filePath };
  }
  return { success: false };
});

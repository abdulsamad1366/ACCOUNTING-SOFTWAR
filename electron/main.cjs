const { app, BrowserWindow } = require('electron');
const path = require('path');
const { initSchema } = require('./database/schema.cjs');
const { seedDatabase } = require('./database/seed.cjs');
const { closeDb } = require('./database/connection.cjs');
const { registerIpcHandlers } = require('./ipc/index.cjs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 700,
    title: 'Vyapar Accounting Software - Offline ERP',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
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

  registerIpcHandlers(mainWindow);
}

app.whenReady().then(async () => {
  try {
    // 1. Initialize SQLite Database Schema & Create Tables
    initSchema();

    // 2. Seed Default Business Profile & Admin User
    seedDatabase();
  } catch (err) {
    console.error('Database initialization warning:', err);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  closeDb();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

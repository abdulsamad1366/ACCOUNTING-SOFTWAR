const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let dbInstance = null;

function getDatabasePath() {
  let dbDir;
  if (!app.isPackaged) {
    dbDir = path.join(__dirname, '../../data');
  } else {
    dbDir = path.join(app.getPath('userData'), 'database');
  }

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  return path.join(dbDir, 'accounting_erp.db');
}

function getDb() {
  if (!dbInstance) {
    const dbPath = getDatabasePath();
    dbInstance = new Database(dbPath, {
      verbose: process.env.NODE_ENV === 'development' ? console.log : null,
    });

    // Enforce WAL mode for speed and enable foreign keys
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    dbInstance.pragma('synchronous = NORMAL');
  }
  return dbInstance;
}

function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

module.exports = {
  getDb,
  getDatabasePath,
  closeDb,
};

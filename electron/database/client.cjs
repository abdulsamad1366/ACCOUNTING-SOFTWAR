const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let prismaClient = null;

function getDatabasePath() {
  if (!app.isPackaged) {
    return path.join(__dirname, '../../prisma/dev.db');
  }

  const userDataPath = app.getPath('userData');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  const targetDbPath = path.join(userDataPath, 'accounting_erp.db');

  // Copy template database if target DB does not exist yet
  if (!fs.existsSync(targetDbPath)) {
    const templateDbPath = path.join(__dirname, '../../prisma/dev.db');
    if (fs.existsSync(templateDbPath)) {
      try {
        fs.copyFileSync(templateDbPath, targetDbPath);
      } catch (err) {
        console.error('Failed to copy template database:', err);
      }
    }
  }

  return targetDbPath;
}

function getPrismaClient() {
  if (!prismaClient) {
    const dbPath = getDatabasePath();
    const dbUrl = `file:${dbPath}`;

    prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
  }
  return prismaClient;
}

module.exports = {
  getPrismaClient,
  getDatabasePath,
};

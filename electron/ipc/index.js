const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const companyService = require('../services/CompanyService');
const partyService = require('../services/PartyService');
const productService = require('../services/ProductService');
const invoiceService = require('../services/InvoiceService');
const voucherService = require('../services/VoucherService');
const reportService = require('../services/ReportService');
const backupService = require('../services/BackupService');
const authService = require('../services/AuthService');

function registerIpcHandlers(mainWindow) {
  // --- Auth IPC ---
  ipcMain.handle('auth:login', async (event, { username, password }) => {
    return await authService.login(username, password);
  });

  ipcMain.handle('auth:getUsers', async () => {
    return await authService.getUsers();
  });

  ipcMain.handle('auth:createUser', async (event, data) => {
    return await authService.createUser(data);
  });

  // --- Company IPC ---
  ipcMain.handle('company:get', async () => {
    return await companyService.getCompany();
  });

  ipcMain.handle('company:update', async (event, data) => {
    return await companyService.updateCompany(data);
  });

  // --- Party IPC ---
  ipcMain.handle('party:list', async (event, type) => {
    return await partyService.getParties(type);
  });

  ipcMain.handle('party:getById', async (event, id) => {
    return await partyService.getPartyById(id);
  });

  ipcMain.handle('party:create', async (event, data) => {
    return await partyService.createParty(data);
  });

  ipcMain.handle('party:update', async (event, { id, data }) => {
    return await partyService.updateParty(id, data);
  });

  ipcMain.handle('party:delete', async (event, id) => {
    return await partyService.deleteParty(id);
  });

  // --- Product & Category IPC ---
  ipcMain.handle('product:list', async () => {
    return await productService.getProducts();
  });

  ipcMain.handle('product:getCategories', async () => {
    return await productService.getCategories();
  });

  ipcMain.handle('product:getUnits', async () => {
    return await productService.getUnits();
  });

  ipcMain.handle('product:create', async (event, data) => {
    return await productService.createProduct(data);
  });

  ipcMain.handle('product:update', async (event, { id, data }) => {
    return await productService.updateProduct(id, data);
  });

  ipcMain.handle('product:adjustStock', async (event, { productId, quantity, type, notes }) => {
    return await productService.adjustStock(productId, quantity, type, notes);
  });

  ipcMain.handle('product:delete', async (event, id) => {
    return await productService.deleteProduct(id);
  });

  // --- Invoice IPC ---
  ipcMain.handle('invoice:list', async (event, type) => {
    return await invoiceService.getInvoices(type);
  });

  ipcMain.handle('invoice:getById', async (event, id) => {
    return await invoiceService.getInvoiceById(id);
  });

  ipcMain.handle('invoice:create', async (event, data) => {
    return await invoiceService.createInvoice(data);
  });

  ipcMain.handle('invoice:updateStatus', async (event, { id, status, paidAmount }) => {
    return await invoiceService.updateInvoiceStatus(id, status, paidAmount);
  });

  ipcMain.handle('invoice:delete', async (event, id) => {
    return await invoiceService.deleteInvoice(id);
  });

  // --- Voucher IPC ---
  ipcMain.handle('voucher:list', async (event, type) => {
    return await voucherService.getVouchers(type);
  });

  ipcMain.handle('voucher:create', async (event, data) => {
    return await voucherService.createVoucher(data);
  });

  ipcMain.handle('voucher:delete', async (event, id) => {
    return await voucherService.deleteVoucher(id);
  });

  // --- Reports & Analytics IPC ---
  ipcMain.handle('reports:summary', async () => {
    return await reportService.getFinancialSummary();
  });

  ipcMain.handle('reports:trialBalance', async () => {
    return await reportService.getTrialBalance();
  });

  // --- Backup IPC ---
  ipcMain.handle('backup:exportJSON', async () => {
    const backupData = await backupService.exportBackupJSON();
    const jsonString = JSON.stringify(backupData, null, 2);

    if (mainWindow) {
      const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Save Accounting Database Backup',
        defaultPath: `Vyapar_ERP_Backup_${new Date().toISOString().split('T')[0]}.json`,
        filters: [{ name: 'JSON Backup', extensions: ['json'] }],
      });

      if (filePath) {
        fs.writeFileSync(filePath, jsonString, 'utf-8');
        return { success: true, filePath };
      }
    }
    return { success: false, jsonData: backupData };
  });

  ipcMain.handle('backup:importJSON', async (event, jsonString) => {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      const success = await backupService.restoreBackupJSON(parsed);
      return { success };
    } catch {
      return { success: false };
    }
  });
}

module.exports = { registerIpcHandlers };

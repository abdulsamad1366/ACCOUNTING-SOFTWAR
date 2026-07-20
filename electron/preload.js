const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Auth
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  getUsers: () => ipcRenderer.invoke('auth:getUsers'),
  createUser: (data) => ipcRenderer.invoke('auth:createUser', data),

  // Company
  getCompany: () => ipcRenderer.invoke('company:get'),
  updateCompany: (data) => ipcRenderer.invoke('company:update', data),

  // Parties
  getParties: (type) => ipcRenderer.invoke('party:list', type),
  getPartyById: (id) => ipcRenderer.invoke('party:getById', id),
  createParty: (data) => ipcRenderer.invoke('party:create', data),
  updateParty: (id, data) => ipcRenderer.invoke('party:update', { id, data }),
  deleteParty: (id) => ipcRenderer.invoke('party:delete', id),

  // Products
  getProducts: () => ipcRenderer.invoke('product:list'),
  getCategories: () => ipcRenderer.invoke('product:getCategories'),
  getUnits: () => ipcRenderer.invoke('product:getUnits'),
  createProduct: (data) => ipcRenderer.invoke('product:create', data),
  updateProduct: (id, data) => ipcRenderer.invoke('product:update', { id, data }),
  adjustStock: (productId, quantity, type, notes) =>
    ipcRenderer.invoke('product:adjustStock', { productId, quantity, type, notes }),
  deleteProduct: (id) => ipcRenderer.invoke('product:delete', id),

  // Invoices
  getInvoices: (type) => ipcRenderer.invoke('invoice:list', type),
  getInvoiceById: (id) => ipcRenderer.invoke('invoice:getById', id),
  createInvoice: (data) => ipcRenderer.invoke('invoice:create', data),
  updateInvoiceStatus: (id, status, paidAmount) =>
    ipcRenderer.invoke('invoice:updateStatus', { id, status, paidAmount }),
  deleteInvoice: (id) => ipcRenderer.invoke('invoice:delete', id),

  // Vouchers
  getVouchers: (type) => ipcRenderer.invoke('voucher:list', type),
  createVoucher: (data) => ipcRenderer.invoke('voucher:create', data),
  deleteVoucher: (id) => ipcRenderer.invoke('voucher:delete', id),

  // Reports
  getFinancialSummary: () => ipcRenderer.invoke('reports:summary'),
  getHsnSummary: () => ipcRenderer.invoke('reports:hsnSummary'),
  getTrialBalance: () => ipcRenderer.invoke('reports:trialBalance'),

  // Backup
  exportBackupJSON: () => ipcRenderer.invoke('backup:exportJSON'),
  importBackupJSON: (jsonString) => ipcRenderer.invoke('backup:importJSON', jsonString),
});

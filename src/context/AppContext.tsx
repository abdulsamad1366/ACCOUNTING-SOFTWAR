import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Company, Party, Product, Invoice, Voucher, FinancialSummary } from '../types';
import { initialCompany, initialParties, initialProducts, initialInvoices, initialVouchers } from '../utils/initialData';

interface AppContextType {
  company: Company;
  updateCompany: (updated: Company) => Promise<void>;

  parties: Party[];
  addParty: (party: Omit<Party, 'id' | 'createdDate'>) => Promise<void>;
  updateParty: (id: string, updated: Partial<Party>) => Promise<void>;
  deleteParty: (id: string) => Promise<void>;

  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updated: Partial<Product>) => Promise<void>;
  adjustStock: (productId: string, qty: number, type: 'IN' | 'OUT', notes?: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  invoices: Invoice[];
  createInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => Promise<Invoice>;
  updateInvoiceStatus: (id: string, status: Invoice['status'], paidAmount?: number) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  vouchers: Voucher[];
  addVoucher: (voucher: Omit<Voucher, 'id' | 'voucherNumber'>) => Promise<void>;
  deleteVoucher: (id: string) => Promise<void>;

  summary: FinancialSummary | null;
  refreshAllData: () => Promise<void>;

  exportDataJSON: () => Promise<void>;
  importDataJSON: (jsonString: string) => Promise<boolean>;
  resetToDemoData: () => Promise<void>;

  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  COMPANY: 'vyapar_app_company',
  PARTIES: 'vyapar_app_parties',
  PRODUCTS: 'vyapar_app_products',
  INVOICES: 'vyapar_app_invoices',
  VOUCHERS: 'vyapar_app_vouchers',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [company, setCompany] = useState<Company>(initialCompany);
  const [parties, setParties] = useState<Party[]>(initialParties);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [vouchers, setVouchers] = useState<Voucher[]>(initialVouchers);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isElectron = Boolean(window.electronAPI);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const refreshAllData = useCallback(async () => {
    if (isElectron && window.electronAPI) {
      try {
        const [compData, partiesData, prodData, invData, vouData, sumData] = await Promise.all([
          window.electronAPI.getCompany(),
          window.electronAPI.getParties(),
          window.electronAPI.getProducts(),
          window.electronAPI.getInvoices(),
          window.electronAPI.getVouchers(),
          window.electronAPI.getFinancialSummary(),
        ]);
        if (compData) setCompany(compData);
        if (partiesData) setParties(partiesData);
        if (prodData) setProducts(prodData);
        if (invData) setInvoices(invData);
        if (vouData) setVouchers(vouData);
        if (sumData) setSummary(sumData);
      } catch (err) {
        console.error('Error fetching Electron SQLite data:', err);
      }
    } else {
      // LocalStorage Fallback for dev mode
      const savedComp = localStorage.getItem(STORAGE_KEYS.COMPANY);
      const savedParties = localStorage.getItem(STORAGE_KEYS.PARTIES);
      const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      const savedInvoices = localStorage.getItem(STORAGE_KEYS.INVOICES);
      const savedVouchers = localStorage.getItem(STORAGE_KEYS.VOUCHERS);

      if (savedComp) setCompany(JSON.parse(savedComp));
      if (savedParties) setParties(JSON.parse(savedParties));
      if (savedProducts) setProducts(JSON.parse(savedProducts));
      if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
      if (savedVouchers) setVouchers(JSON.parse(savedVouchers));
    }
  }, [isElectron]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Company Actions
  const updateCompany = async (updated: Company) => {
    if (isElectron && window.electronAPI) {
      const saved = await window.electronAPI.updateCompany(updated);
      setCompany(saved);
    } else {
      setCompany(updated);
      localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(updated));
    }
    showToast('Company profile updated successfully!');
  };

  // Party Actions
  const addParty = async (newPartyData: Omit<Party, 'id' | 'createdDate'>) => {
    if (isElectron && window.electronAPI) {
      await window.electronAPI.createParty(newPartyData);
      await refreshAllData();
    } else {
      const newId = `P-${Date.now().toString().slice(-4)}`;
      const newParty: Party = {
        ...newPartyData,
        id: newId,
        createdDate: new Date().toISOString().split('T')[0],
      };
      setParties((prev) => [newParty, ...prev]);
    }
    showToast(`Added Party: ${newPartyData.name}`);
  };

  const updateParty = async (id: string, updated: Partial<Party>) => {
    if (isElectron && window.electronAPI) {
      await window.electronAPI.updateParty(id, updated);
      await refreshAllData();
    } else {
      setParties((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    }
    showToast('Party details updated');
  };

  const deleteParty = async (id: string) => {
    if (isElectron && window.electronAPI) {
      await window.electronAPI.deleteParty(id);
      await refreshAllData();
    } else {
      setParties((prev) => prev.filter((p) => p.id !== id));
    }
    showToast('Party removed');
  };

  // Product Actions
  const addProduct = async (newProdData: Omit<Product, 'id'>) => {
    if (isElectron && window.electronAPI) {
      await window.electronAPI.createProduct(newProdData);
      await refreshAllData();
    } else {
      const newId = `PRD-${Date.now().toString().slice(-4)}`;
      const newProduct: Product = { ...newProdData, id: newId };
      setProducts((prev) => [newProduct, ...prev]);
    }
    showToast(`Added Item: ${newProdData.name}`);
  };

  const updateProduct = async (id: string, updated: Partial<Product>) => {
    if (isElectron && window.electronAPI) {
      await window.electronAPI.updateProduct(id, updated);
      await refreshAllData();
    } else {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    }
    showToast('Item updated');
  };

  const adjustStock = async (productId: string, quantity: number, type: 'IN' | 'OUT', notes?: string) => {
    if (isElectron && window.electronAPI) {
      await window.electronAPI.adjustStock(productId, quantity, type, notes);
      await refreshAllData();
    } else {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === productId) {
            const newStock = type === 'IN' ? p.currentStock + quantity : Math.max(0, p.currentStock - quantity);
            return { ...p, currentStock: newStock };
          }
          return p;
        })
      );
    }
    showToast('Stock quantity updated');
  };

  const deleteProduct = async (id: string) => {
    if (isElectron && window.electronAPI) {
      await window.electronAPI.deleteProduct(id);
      await refreshAllData();
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
    showToast('Item deleted');
  };

  // Invoice Actions
  const createInvoice = async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>): Promise<Invoice> => {
    if (isElectron && window.electronAPI) {
      const created = await window.electronAPI.createInvoice(invoiceData);
      await refreshAllData();
      showToast(`Bill ${created.invoiceNumber} created successfully!`);
      return created;
    } else {
      const seq = (invoices.length + 1).toString().padStart(3, '0');
      const invoiceNumber = `INV-2026-${seq}`;
      const newInvoice: Invoice = {
        ...invoiceData,
        id: `INV-${Date.now()}`,
        invoiceNumber,
      };

      setInvoices((prev) => [newInvoice, ...prev]);

      // Update Stock Inventory & Ledger locally
      setProducts((prev) =>
        prev.map((prod) => {
          const lineItem = newInvoice.items.find((item) => item.productId === prod.id);
          if (lineItem) {
            const stockDiff = newInvoice.type === 'SALES' ? -lineItem.quantity : lineItem.quantity;
            return { ...prod, currentStock: Math.max(0, prod.currentStock + stockDiff) };
          }
          return prod;
        })
      );

      const unpaidAmount = newInvoice.grandTotal - newInvoice.paidAmount;
      if (unpaidAmount > 0 && newInvoice.partyId) {
        setParties((prev) =>
          prev.map((party) => {
            if (party.id === newInvoice.partyId) {
              const balanceChange = newInvoice.type === 'SALES' ? unpaidAmount : -unpaidAmount;
              return { ...party, balance: party.balance + balanceChange };
            }
            return party;
          })
        );
      }

      showToast(`Bill ${invoiceNumber} created successfully!`);
      return newInvoice;
    }
  };

  const updateInvoiceStatus = async (id: string, status: Invoice['status'], paidAmount?: number) => {
    if (isElectron && window.electronAPI) {
      await window.electronAPI.updateInvoiceStatus(id, status, paidAmount);
      await refreshAllData();
    } else {
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, status, paidAmount: paidAmount ?? inv.paidAmount } : inv))
      );
    }
    showToast('Invoice status updated');
  };

  const deleteInvoice = async (id: string) => {
    if (isElectron && window.electronAPI) {
      await window.electronAPI.deleteInvoice(id);
      await refreshAllData();
    } else {
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    }
    showToast('Invoice deleted');
  };

  // Voucher Actions
  const addVoucher = async (voucherData: Omit<Voucher, 'id' | 'voucherNumber'>) => {
    if (isElectron && window.electronAPI) {
      await window.electronAPI.createVoucher(voucherData);
      await refreshAllData();
    } else {
      const seq = (vouchers.length + 1).toString().padStart(3, '0');
      const prefix = voucherData.type === 'PAYMENT_IN' ? 'RCT' : voucherData.type === 'EXPENSE' ? 'EXP' : 'VOU';
      const newVoucher: Voucher = {
        ...voucherData,
        id: `VOU-${Date.now()}`,
        voucherNumber: `${prefix}-${seq}`,
      };

      setVouchers((prev) => [newVoucher, ...prev]);

      if (newVoucher.partyId) {
        setParties((prev) =>
          prev.map((party) => {
            if (party.id === newVoucher.partyId) {
              const delta = newVoucher.type === 'PAYMENT_IN' ? -newVoucher.amount : newVoucher.amount;
              return { ...party, balance: party.balance + delta };
            }
            return party;
          })
        );
      }
    }
    showToast('Voucher entry saved!');
  };

  const deleteVoucher = async (id: string) => {
    if (isElectron && window.electronAPI) {
      await window.electronAPI.deleteVoucher(id);
      await refreshAllData();
    } else {
      setVouchers((prev) => prev.filter((v) => v.id !== id));
    }
    showToast('Voucher entry deleted');
  };

  // Backup & Restore
  const exportDataJSON = async () => {
    if (isElectron && window.electronAPI) {
      const res = await window.electronAPI.exportBackupJSON();
      if (res.success) {
        showToast(`Database backup exported to: ${res.filePath}`);
        return;
      }
    }
    // Web Fallback
    const fullData = {
      company,
      parties,
      products,
      invoices,
      vouchers,
      backupDate: new Date().toISOString(),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Accounting_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Local Database Backup exported to JSON!');
  };

  const importDataJSON = async (jsonString: string): Promise<boolean> => {
    if (isElectron && window.electronAPI) {
      const res = await window.electronAPI.importBackupJSON(jsonString);
      if (res.success) {
        await refreshAllData();
        showToast('SQLite Database restored successfully!');
        return true;
      }
      showToast('Database restore failed');
      return false;
    } else {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed.company && parsed.parties && parsed.products) {
          setCompany(parsed.company);
          setParties(parsed.parties);
          setProducts(parsed.products);
          if (parsed.invoices) setInvoices(parsed.invoices);
          if (parsed.vouchers) setVouchers(parsed.vouchers);
          showToast('Database restored successfully!');
          return true;
        }
        return false;
      } catch {
        showToast('Invalid backup file format!');
        return false;
      }
    }
  };

  const resetToDemoData = async () => {
    setCompany(initialCompany);
    setParties(initialParties);
    setProducts(initialProducts);
    setInvoices(initialInvoices);
    setVouchers(initialVouchers);
    showToast('Reset to default sample demo data!');
  };

  return (
    <AppContext.Provider
      value={{
        company,
        updateCompany,
        parties,
        addParty,
        updateParty,
        deleteParty,
        products,
        addProduct,
        updateProduct,
        adjustStock,
        deleteProduct,
        invoices,
        createInvoice,
        updateInvoiceStatus,
        deleteInvoice,
        vouchers,
        addVoucher,
        deleteVoucher,
        summary,
        refreshAllData,
        exportDataJSON,
        importDataJSON,
        resetToDemoData,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

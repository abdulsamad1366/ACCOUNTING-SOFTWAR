import React, { createContext, useContext, useState, useEffect } from 'react';
import { Company, Party, Product, Invoice, Voucher } from '../types';
import { initialCompany, initialParties, initialProducts, initialInvoices, initialVouchers } from '../utils/initialData';

interface AppContextType {
  company: Company;
  updateCompany: (updated: Company) => void;
  
  parties: Party[];
  addParty: (party: Omit<Party, 'id' | 'createdDate'>) => void;
  updateParty: (id: string, updated: Partial<Party>) => void;
  deleteParty: (id: string) => void;
  
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updated: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  invoices: Invoice[];
  createInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => Invoice;
  updateInvoiceStatus: (id: string, status: Invoice['status'], paidAmount?: number) => void;
  deleteInvoice: (id: string) => void;
  
  vouchers: Voucher[];
  addVoucher: (voucher: Omit<Voucher, 'id' | 'voucherNumber'>) => void;
  deleteVoucher: (id: string) => void;
  
  exportDataJSON: () => void;
  importDataJSON: (jsonString: string) => boolean;
  resetToDemoData: () => void;
  
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
  const [company, setCompany] = useState<Company>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMPANY);
    return saved ? JSON.parse(saved) : initialCompany;
  });

  const [parties, setParties] = useState<Party[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PARTIES);
    return saved ? JSON.parse(saved) : initialParties;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  const [vouchers, setVouchers] = useState<Voucher[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VOUCHERS);
    return saved ? JSON.parse(saved) : initialVouchers;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Auto-sync with LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(company));
  }, [company]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PARTIES, JSON.stringify(parties));
  }, [parties]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(vouchers));
  }, [vouchers]);

  // Company Actions
  const updateCompany = (updated: Company) => {
    setCompany(updated);
    showToast('Company profile updated successfully!');
  };

  // Party Actions
  const addParty = (newPartyData: Omit<Party, 'id' | 'createdDate'>) => {
    const newId = `P-${Date.now().toString().slice(-4)}`;
    const newParty: Party = {
      ...newPartyData,
      id: newId,
      createdDate: new Date().toISOString().split('T')[0],
    };
    setParties((prev) => [newParty, ...prev]);
    showToast(`Added Party: ${newParty.name}`);
  };

  const updateParty = (id: string, updated: Partial<Party>) => {
    setParties((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    showToast('Party details updated');
  };

  const deleteParty = (id: string) => {
    setParties((prev) => prev.filter((p) => p.id !== id));
    showToast('Party removed');
  };

  // Product Actions
  const addProduct = (newProdData: Omit<Product, 'id'>) => {
    const newId = `PRD-${Date.now().toString().slice(-4)}`;
    const newProduct: Product = { ...newProdData, id: newId };
    setProducts((prev) => [newProduct, ...prev]);
    showToast(`Added Item: ${newProduct.name}`);
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    showToast('Item updated');
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('Item deleted');
  };

  // Invoice Creation with Auto Stock & Party Ledger Updates!
  const createInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>): Invoice => {
    const seq = (invoices.length + 1).toString().padStart(3, '0');
    const invoiceNumber = `INV-2026-${seq}`;
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `INV-${Date.now()}`,
      invoiceNumber,
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    // 1. Update Stock Inventory
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

    // 2. Update Party Balance (Khata Book Ledger)
    const unpaidAmount = newInvoice.grandTotal - newInvoice.paidAmount;
    if (unpaidAmount > 0 && newInvoice.partyId) {
      setParties((prev) =>
        prev.map((party) => {
          if (party.id === newInvoice.partyId) {
            // For Sales: Balance increases (They owe us money +)
            // For Purchase: Balance decreases (We owe them money -)
            const balanceChange = newInvoice.type === 'SALES' ? unpaidAmount : -unpaidAmount;
            return { ...party, balance: party.balance + balanceChange };
          }
          return party;
        })
      );
    }

    showToast(`Bill ${invoiceNumber} created successfully!`);
    return newInvoice;
  };

  const updateInvoiceStatus = (id: string, status: Invoice['status'], paidAmount?: number) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status, paidAmount: paidAmount ?? inv.paidAmount } : inv))
    );
    showToast('Invoice status updated');
  };

  const deleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    showToast('Invoice deleted');
  };

  // Voucher Actions
  const addVoucher = (voucherData: Omit<Voucher, 'id' | 'voucherNumber'>) => {
    const seq = (vouchers.length + 1).toString().padStart(3, '0');
    const prefix = voucherData.type === 'PAYMENT_IN' ? 'RCT' : voucherData.type === 'EXPENSE' ? 'EXP' : 'VOU';
    const newVoucher: Voucher = {
      ...voucherData,
      id: `VOU-${Date.now()}`,
      voucherNumber: `${prefix}-${seq}`,
    };

    setVouchers((prev) => [newVoucher, ...prev]);

    // If Payment In from a party, reduce their receivable balance!
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

    showToast('Voucher entry saved!');
  };

  const deleteVoucher = (id: string) => {
    setVouchers((prev) => prev.filter((v) => v.id !== id));
    showToast('Voucher entry deleted');
  };

  // 1-Click Backup Export
  const exportDataJSON = () => {
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

  // 1-Click Backup Restore
  const importDataJSON = (jsonString: string): boolean => {
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
  };

  const resetToDemoData = () => {
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
        deleteProduct,
        invoices,
        createInvoice,
        updateInvoiceStatus,
        deleteInvoice,
        vouchers,
        addVoucher,
        deleteVoucher,
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

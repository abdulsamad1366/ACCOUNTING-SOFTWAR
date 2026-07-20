export type PartyType = 'CUSTOMER' | 'SUPPLIER';
export type InvoiceType = 'SALES' | 'PURCHASE' | 'QUOTATION' | 'SALES_RETURN' | 'PURCHASE_RETURN';
export type InvoiceStatus = 'PAID' | 'UNPAID' | 'PARTIAL' | 'DRAFT' | 'CANCELLED';
export type VoucherType = 'PAYMENT_IN' | 'PAYMENT_OUT' | 'CONTRA' | 'EXPENSE';

export interface Company {
  id?: string;
  name: string;
  tagline: string;
  phone: string;
  email: string;
  gstin: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  bankName: string;
  accountNo: string;
  ifsc: string;
  branch: string;
  upiId: string;
  terms: string;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'ACCOUNTANT' | 'VIEWER';
  status: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Unit {
  id: string;
  name: string;
  symbol: string;
}

export interface Party {
  id: string;
  type: PartyType;
  name: string;
  companyName?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  stateCode?: string;
  creditLimit: number;
  balance: number; // Positive = Receive (+), Negative = Pay (-)
  createdDate: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category?: string;
  categoryId?: string;
  unit?: string;
  unitId?: string;
  unitName?: string;
  hsnCode: string;
  gstRate: number;
  salePrice: number;
  purchasePrice: number;
  currentStock: number;
  minStockAlert: number;
  barcode?: string;
  imageUrl?: string;
}

export interface InvoiceItem {
  id?: string;
  productId: string;
  productName: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  price: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  partyId?: string;
  partyName: string;
  partyPhone?: string;
  partyGstin?: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  status: InvoiceStatus;
  notes?: string;
  isInterstate?: boolean;
}

export interface Voucher {
  id: string;
  voucherNumber: string;
  type: VoucherType;
  date: string;
  partyId?: string;
  partyName?: string;
  category: string;
  amount: number;
  paymentMode: 'CASH' | 'HDFC_BANK' | 'ICICI_BANK' | 'UPI';
  referenceNo?: string;
  notes?: string;
}

export interface TrialBalanceItem {
  accountName: string;
  debit: number;
  credit: number;
}

export interface FinancialSummary {
  totalSalesTaxable: number;
  totalSalesGST: number;
  totalPurchasesCost: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  totalStockValuation: number;
  totalReceivables: number;
  totalPayables: number;
  productCount: number;
  partyCount: number;
  invoiceCount: number;
}

export interface HsnSummaryItem {
  hsnCode: string;
  gstRate: number;
  totalQty: number;
  unit: string;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
}

declare global {
  interface Window {
    electronAPI?: {
      login: (credentials: { username: string; password: string }) => Promise<{ success: boolean; user?: User; message?: string }>;
      getUsers: () => Promise<User[]>;
      createUser: (data: Partial<User> & { password: string }) => Promise<User>;

      getCompany: () => Promise<Company>;
      updateCompany: (data: Company) => Promise<Company>;

      getParties: (type?: PartyType) => Promise<Party[]>;
      getPartyById: (id: string) => Promise<Party | null>;
      createParty: (data: Partial<Party>) => Promise<Party>;
      updateParty: (id: string, data: Partial<Party>) => Promise<Party>;
      deleteParty: (id: string) => Promise<Party>;

      getProducts: () => Promise<Product[]>;
      getCategories: () => Promise<Category[]>;
      getUnits: () => Promise<Unit[]>;
      createProduct: (data: Partial<Product>) => Promise<Product>;
      updateProduct: (id: string, data: Partial<Product>) => Promise<Product>;
      adjustStock: (productId: string, quantity: number, type: 'IN' | 'OUT', notes?: string) => Promise<{ success: boolean; newStock: number }>;
      deleteProduct: (id: string) => Promise<Product>;

      getInvoices: (type?: InvoiceType) => Promise<Invoice[]>;
      getInvoiceById: (id: string) => Promise<Invoice | null>;
      createInvoice: (data: Partial<Invoice>) => Promise<Invoice>;
      updateInvoiceStatus: (id: string, status: InvoiceStatus, paidAmount?: number) => Promise<Invoice>;
      deleteInvoice: (id: string) => Promise<Invoice>;

      getVouchers: (type?: VoucherType) => Promise<Voucher[]>;
      createVoucher: (data: Partial<Voucher>) => Promise<Voucher>;
      deleteVoucher: (id: string) => Promise<Voucher>;

      getFinancialSummary: () => Promise<FinancialSummary>;
      getHsnSummary: () => Promise<HsnSummaryItem[]>;
      getTrialBalance: () => Promise<TrialBalanceItem[]>;

      exportBackupJSON: () => Promise<{ success: boolean; filePath?: string; jsonData?: any }>;
      importBackupJSON: (jsonString: string | any) => Promise<{ success: boolean }>;
    };
  }
}

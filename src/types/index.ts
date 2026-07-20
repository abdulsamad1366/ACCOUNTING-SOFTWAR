export type PartyType = 'CUSTOMER' | 'SUPPLIER';
export type InvoiceType = 'SALES' | 'PURCHASE' | 'QUOTATION' | 'SALES_RETURN' | 'PURCHASE_RETURN';
export type InvoiceStatus = 'PAID' | 'UNPAID' | 'PARTIAL' | 'DRAFT' | 'CANCELLED';
export type VoucherType = 'PAYMENT_IN' | 'PAYMENT_OUT' | 'CONTRA' | 'EXPENSE';

export interface Company {
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

export interface Party {
  id: string;
  type: PartyType;
  name: string;
  companyName: string;
  phone: string;
  email?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  creditLimit: number;
  balance: number; // Positive = You Receive (+), Negative = You Pay (-)
  createdDate: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string; // Pcs, Kg, Box, Ltr, Mtr
  hsnCode: string;
  gstRate: number; // e.g. 18, 12, 5, 0
  salePrice: number;
  purchasePrice: number;
  currentStock: number;
  minStockAlert: number;
  barcode?: string;
}

export interface InvoiceItem {
  id: string;
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
  partyId: string;
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
  category: string; // Rent, Salary, Tea & Snacks, Utility, Customer Payment, Supplier Payment
  amount: number;
  paymentMode: 'CASH' | 'HDFC_BANK' | 'ICICI_BANK' | 'UPI';
  referenceNo?: string;
  notes?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  referenceType: 'SALES' | 'PURCHASE' | 'MANUAL';
  referenceId: string;
  date: string;
  notes?: string;
}

const { getPrismaClient } = require('../database/client');

class ReportService {
  async getFinancialSummary() {
    const prisma = getPrismaClient();

    const invoices = await prisma.invoice.findMany({
      include: { items: true },
    });

    const vouchers = await prisma.voucher.findMany();
    const products = await prisma.product.findMany();
    const parties = await prisma.party.findMany();

    // Sales Calculations
    const salesInvoices = invoices.filter((i) => i.type === 'SALES');
    const totalSalesTaxable = salesInvoices.reduce((sum, i) => sum + i.subtotal, 0);
    const totalSalesGST = salesInvoices.reduce((sum, i) => sum + i.cgstTotal + i.sgstTotal + i.igstTotal, 0);

    // Purchase Calculations
    const purchaseInvoices = invoices.filter((i) => i.type === 'PURCHASE');
    const totalPurchasesCost = purchaseInvoices.reduce((sum, i) => sum + i.subtotal, 0);

    // Expense Calculations
    const expenseVouchers = vouchers.filter((v) => v.type === 'EXPENSE');
    const totalExpenses = expenseVouchers.reduce((sum, v) => sum + v.amount, 0);

    // Profit Metrics
    const grossProfit = totalSalesTaxable - totalPurchasesCost;
    const netProfit = grossProfit - totalExpenses;

    // Stock Valuation
    const totalStockValuation = products.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);

    // Receivables & Payables
    const totalReceivables = parties.filter((p) => p.balance > 0).reduce((sum, p) => sum + p.balance, 0);
    const totalPayables = parties.filter((p) => p.balance < 0).reduce((sum, p) => sum + Math.abs(p.balance), 0);

    return {
      totalSalesTaxable,
      totalSalesGST,
      totalPurchasesCost,
      totalExpenses,
      grossProfit,
      netProfit,
      totalStockValuation,
      totalReceivables,
      totalPayables,
      productCount: products.length,
      partyCount: parties.length,
      invoiceCount: invoices.length,
    };
  }

  async getTrialBalance() {
    const prisma = getPrismaClient();
    const ledgerEntries = await prisma.ledgerEntry.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const accountMap = {};

    ledgerEntries.forEach((entry) => {
      if (!accountMap[entry.accountName]) {
        accountMap[entry.accountName] = { accountName: entry.accountName, debit: 0, credit: 0 };
      }
      accountMap[entry.accountName].debit += entry.debit;
      accountMap[entry.accountName].credit += entry.credit;
    });

    return Object.values(accountMap);
  }
}

module.exports = new ReportService();

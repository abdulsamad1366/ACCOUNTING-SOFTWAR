const { getDb } = require('../database/connection.cjs');

class ReportRepository {
  getFinancialSummary() {
    const db = getDb();

    // Sales metrics
    const salesRow = db.prepare(`
      SELECT 
        COALESCE(SUM(subtotal), 0) as totalSalesTaxable,
        COALESCE(SUM(cgst_total + sgst_total + igst_total), 0) as totalSalesGST,
        COUNT(*) as invoiceCount
      FROM invoices WHERE type = 'SALES'
    `).get();

    // Purchase metrics
    const purchaseRow = db.prepare(`
      SELECT COALESCE(SUM(subtotal), 0) as totalPurchasesCost
      FROM invoices WHERE type = 'PURCHASE'
    `).get();

    // Expense metrics
    const expenseRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as totalExpenses
      FROM vouchers WHERE type = 'EXPENSE'
    `).get();

    // Product & Party counts & stock valuation
    const stockRow = db.prepare(`
      SELECT 
        COUNT(*) as productCount,
        COALESCE(SUM(current_stock * purchase_price), 0) as totalStockValuation
      FROM products
    `).get();

    const partyRow = db.prepare(`
      SELECT 
        COUNT(*) as partyCount,
        COALESCE(SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END), 0) as totalReceivables,
        COALESCE(SUM(CASE WHEN balance < 0 THEN ABS(balance) ELSE 0 END), 0) as totalPayables
      FROM parties
    `).get();

    const grossProfit = salesRow.totalSalesTaxable - purchaseRow.totalPurchasesCost;
    const netProfit = grossProfit - expenseRow.totalExpenses;

    return {
      totalSalesTaxable: salesRow.totalSalesTaxable,
      totalSalesGST: salesRow.totalSalesGST,
      totalPurchasesCost: purchaseRow.totalPurchasesCost,
      totalExpenses: expenseRow.totalExpenses,
      grossProfit,
      netProfit,
      totalStockValuation: stockRow.totalStockValuation,
      totalReceivables: partyRow.totalReceivables,
      totalPayables: partyRow.totalPayables,
      productCount: stockRow.productCount,
      partyCount: partyRow.partyCount,
      invoiceCount: salesRow.invoiceCount,
    };
  }

  getHsnSummary() {
    const db = getDb();
    const rows = db.prepare(`
      SELECT 
        ii.hsn_code as hsnCode,
        ii.gst_rate as gstRate,
        ii.unit as unit,
        SUM(ii.quantity) as totalQty,
        SUM(ii.quantity * ii.price) as taxableValue,
        SUM(ii.cgst_amount) as cgstAmount,
        SUM(ii.sgst_amount) as sgstAmount,
        SUM(ii.igst_amount) as igstAmount,
        SUM(ii.cgst_amount + ii.sgst_amount + ii.igst_amount) as totalTax
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      WHERE i.type = 'SALES'
      GROUP BY ii.hsn_code, ii.gst_rate
    `).all();

    return rows.map((r) => ({
      hsnCode: r.hsnCode || 'N/A',
      gstRate: Number(r.gstRate) || 0,
      totalQty: Number(r.totalQty) || 0,
      unit: r.unit || 'Pcs',
      taxableValue: Number(r.taxableValue) || 0,
      cgstAmount: Number(r.cgstAmount) || 0,
      sgstAmount: Number(r.sgstAmount) || 0,
      igstAmount: Number(r.igstAmount) || 0,
      totalTax: Number(r.totalTax) || 0,
    }));
  }

  getTrialBalance() {
    const db = getDb();
    return db.prepare(`
      SELECT 
        account_name as accountName,
        SUM(debit) as debit,
        SUM(credit) as credit
      FROM ledger_entries
      GROUP BY account_name
    `).all();
  }
}

module.exports = new ReportRepository();

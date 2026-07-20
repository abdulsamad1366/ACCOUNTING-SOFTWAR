const { getDb } = require('../database/connection.cjs');
const partyRepository = require('./PartyRepository.cjs');
const productRepository = require('./ProductRepository.cjs');

class InvoiceRepository {
  mapInvoiceRow(row, items = []) {
    if (!row) return null;
    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      type: row.type,
      partyId: row.party_id,
      partyName: row.party_name,
      partyPhone: row.party_phone,
      partyGstin: row.party_gstin,
      date: row.date,
      dueDate: row.due_date,
      subtotal: Number(row.subtotal) || 0,
      cgstTotal: Number(row.cgst_total) || 0,
      sgstTotal: Number(row.sgst_total) || 0,
      igstTotal: Number(row.igst_total) || 0,
      discount: Number(row.discount) || 0,
      grandTotal: Number(row.grand_total) || 0,
      paidAmount: Number(row.paid_amount) || 0,
      status: row.status,
      notes: row.notes,
      isInterstate: Boolean(row.is_interstate),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      items: items.map((itm) => ({
        id: itm.id,
        invoiceId: itm.invoice_id,
        productId: itm.product_id,
        productName: itm.product_name,
        hsnCode: itm.hsn_code,
        quantity: Number(itm.quantity) || 1,
        unit: itm.unit,
        price: Number(itm.price) || 0,
        gstRate: Number(itm.gst_rate) || 0,
        cgstAmount: Number(itm.cgst_amount) || 0,
        sgstAmount: Number(itm.sgst_amount) || 0,
        igstAmount: Number(itm.igst_amount) || 0,
        total: Number(itm.total) || 0,
      })),
    };
  }

  getInvoices(type) {
    const db = getDb();
    let rows;
    if (type) {
      rows = db.prepare('SELECT * FROM invoices WHERE type = ? ORDER BY created_at DESC').all(type);
    } else {
      rows = db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all();
    }

    const getItemStmt = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?');
    return rows.map((r) => this.mapInvoiceRow(r, getItemStmt.all(r.id)));
  }

  getInvoiceById(id) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
    if (!row) return null;

    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(id);
    return this.mapInvoiceRow(row, items);
  }

  createInvoice(data) {
    const db = getDb();
    const type = data.type || 'SALES';

    // 1. Sequential Invoice Number
    const year = new Date().getFullYear();
    const countRow = db.prepare('SELECT COUNT(*) as count FROM invoices WHERE type = ?').get(type);
    const count = countRow ? countRow.count : 0;
    const prefix =
      type === 'SALES'
        ? 'INV'
        : type === 'PURCHASE'
        ? 'PUR'
        : type === 'QUOTATION'
        ? 'QTN'
        : type === 'SALES_RETURN'
        ? 'SRT'
        : 'PRT';
    const invoiceNumber = `${prefix}-${year}-${(count + 1).toString().padStart(3, '0')}`;

    const paidAmount = Number(data.paidAmount) || 0;
    const grandTotal = Number(data.grandTotal) || 0;
    const unpaidAmount = Math.max(0, grandTotal - paidAmount);

    let status = data.status || 'UNPAID';
    if (paidAmount >= grandTotal && grandTotal > 0) {
      status = 'PAID';
    } else if (paidAmount > 0) {
      status = 'PARTIAL';
    }

    const invoiceId = `inv-${Date.now()}`;
    const dateStr = data.date || new Date().toISOString().split('T')[0];
    const dueDateStr = data.dueDate || dateStr;

    // Execute in Atomic Transaction
    db.transaction(() => {
      // A. Insert Invoice Master
      db.prepare(`
        INSERT INTO invoices (
          id, invoice_number, type, party_id, party_name, party_phone, party_gstin,
          date, due_date, subtotal, cgst_total, sgst_total, igst_total, discount,
          grand_total, paid_amount, status, notes, is_interstate
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `).run(
        invoiceId,
        invoiceNumber,
        type,
        data.partyId || null,
        data.partyName || 'Cash Sale',
        data.partyPhone || null,
        data.partyGstin || null,
        dateStr,
        dueDateStr,
        Number(data.subtotal) || 0,
        Number(data.cgstTotal) || 0,
        Number(data.sgstTotal) || 0,
        Number(data.igstTotal) || 0,
        Number(data.discount) || 0,
        grandTotal,
        paidAmount,
        status,
        data.notes || null,
        data.isInterstate ? 1 : 0
      );

      // B. Insert Line Items & Adjust Stock
      const insertItemStmt = db.prepare(`
        INSERT INTO invoice_items (
          id, invoice_id, product_id, product_name, hsn_code, quantity, unit,
          price, gst_rate, cgst_amount, sgst_amount, igst_amount, total
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `);

      const insertStockStmt = db.prepare(`
        INSERT INTO stock_movements (id, product_id, type, quantity, reference_type, reference_id, date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of data.items || []) {
        const itemId = `itm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        insertItemStmt.run(
          itemId,
          invoiceId,
          item.productId,
          item.productName,
          item.hsnCode || '8504',
          Number(item.quantity) || 1,
          item.unit || 'Pcs',
          Number(item.price) || 0,
          Number(item.gstRate) || 0,
          Number(item.cgstAmount) || 0,
          Number(item.sgstAmount) || 0,
          Number(item.igstAmount) || 0,
          Number(item.total) || 0
        );

        // Adjust product stock
        if (type === 'SALES' || type === 'PURCHASE' || type === 'SALES_RETURN' || type === 'PURCHASE_RETURN') {
          const isStockOut = type === 'SALES' || type === 'PURCHASE_RETURN';
          const qtyChange = isStockOut ? -item.quantity : item.quantity;
          productRepository.updateStock(item.productId, qtyChange, db);

          insertStockStmt.run(
            `stm-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            item.productId,
            isStockOut ? 'OUT' : 'IN',
            item.quantity,
            type,
            invoiceId,
            dateStr,
            `Invoice ${invoiceNumber}`
          );
        }
      }

      // C. Update Party Ledger Balance
      if (data.partyId && unpaidAmount > 0 && type !== 'QUOTATION') {
        let balanceChange = 0;
        if (type === 'SALES' || type === 'PURCHASE_RETURN') {
          balanceChange = unpaidAmount; // Customer owes (+)
        } else if (type === 'PURCHASE' || type === 'SALES_RETURN') {
          balanceChange = -unpaidAmount; // Supplier owed (-)
        }
        if (balanceChange !== 0) {
          partyRepository.updateBalance(data.partyId, balanceChange, db);
        }
      }

      // D. General Ledger Entry
      if (type !== 'QUOTATION') {
        db.prepare(`
          INSERT INTO ledger_entries (
            id, invoice_id, party_id, account_name, date, debit, credit, balance, narration
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `led-${Date.now()}`,
          invoiceId,
          data.partyId || null,
          type === 'SALES'
            ? 'Sales Revenue Account'
            : type === 'PURCHASE'
            ? 'Purchase Cost Account'
            : type === 'SALES_RETURN'
            ? 'Sales Returns Account'
            : 'Purchase Returns Account',
          dateStr,
          type === 'PURCHASE' || type === 'SALES_RETURN' ? grandTotal : 0,
          type === 'SALES' || type === 'PURCHASE_RETURN' ? grandTotal : 0,
          grandTotal,
          `Bill #${invoiceNumber} - ${data.partyName}`
        );
      }
    })();

    return this.getInvoiceById(invoiceId);
  }

  updateInvoiceStatus(id, newStatus, newPaidAmount) {
    const db = getDb();
    const invoice = this.getInvoiceById(id);
    if (!invoice) throw new Error('Invoice not found');

    const oldPaid = invoice.paidAmount;
    const updatedPaid = newPaidAmount !== undefined ? Number(newPaidAmount) : oldPaid;
    const paidDelta = updatedPaid - oldPaid;

    db.transaction(() => {
      if (invoice.partyId && paidDelta !== 0 && invoice.type !== 'QUOTATION') {
        const balanceDelta = invoice.type === 'SALES' ? -paidDelta : paidDelta;
        partyRepository.updateBalance(invoice.partyId, balanceDelta, db);
      }

      db.prepare(`
        UPDATE invoices SET status = ?, paid_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(newStatus, updatedPaid, id);
    })();

    return this.getInvoiceById(id);
  }

  deleteInvoice(id) {
    const db = getDb();
    const invoice = this.getInvoiceById(id);
    if (!invoice) return { success: false };

    const type = invoice.type;
    const unpaidAmount = Math.max(0, invoice.grandTotal - invoice.paidAmount);

    db.transaction(() => {
      // 1. Reverse Stock Deductions
      if (type === 'SALES' || type === 'PURCHASE' || type === 'SALES_RETURN' || type === 'PURCHASE_RETURN') {
        for (const item of invoice.items) {
          const isStockOut = type === 'SALES' || type === 'PURCHASE_RETURN';
          const reverseQtyChange = isStockOut ? item.quantity : -item.quantity;
          productRepository.updateStock(item.productId, reverseQtyChange, db);
        }
      }

      // 2. Reverse Party Balance
      if (invoice.partyId && unpaidAmount > 0 && type !== 'QUOTATION') {
        let reverseBalanceDelta = 0;
        if (type === 'SALES' || type === 'PURCHASE_RETURN') {
          reverseBalanceDelta = -unpaidAmount;
        } else if (type === 'PURCHASE' || type === 'SALES_RETURN') {
          reverseBalanceDelta = unpaidAmount;
        }
        if (reverseBalanceDelta !== 0) {
          partyRepository.updateBalance(invoice.partyId, reverseBalanceDelta, db);
        }
      }

      // 3. Delete Stock Movements, Ledger Entries, Items & Invoice
      db.prepare('DELETE FROM stock_movements WHERE reference_id = ?').run(id);
      db.prepare('DELETE FROM ledger_entries WHERE invoice_id = ?').run(id);
      db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(id);
      db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
    })();

    return { success: true };
  }
}

module.exports = new InvoiceRepository();

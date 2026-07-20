const { getDb } = require('../database/connection.cjs');
const partyRepository = require('./PartyRepository.cjs');

class VoucherRepository {
  mapVoucherRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      voucherNumber: row.voucher_number,
      type: row.type,
      date: row.date,
      partyId: row.party_id,
      partyName: row.party_name,
      category: row.category,
      amount: Number(row.amount) || 0,
      paymentMode: row.payment_mode,
      referenceNo: row.reference_no,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }

  getVouchers(type) {
    const db = getDb();
    let rows;
    if (type) {
      rows = db.prepare('SELECT * FROM vouchers WHERE type = ? ORDER BY created_at DESC').all(type);
    } else {
      rows = db.prepare('SELECT * FROM vouchers ORDER BY created_at DESC').all();
    }
    return rows.map(this.mapVoucherRow);
  }

  getVoucherById(id) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM vouchers WHERE id = ?').get(id);
    return this.mapVoucherRow(row);
  }

  createVoucher(data) {
    const db = getDb();
    const type = data.type || 'PAYMENT_IN';

    const countRow = db.prepare('SELECT COUNT(*) as count FROM vouchers WHERE type = ?').get(type);
    const count = countRow ? countRow.count : 0;
    const prefix =
      type === 'PAYMENT_IN' ? 'RCT' : type === 'EXPENSE' ? 'EXP' : type === 'PAYMENT_OUT' ? 'PAY' : 'JRN';
    const voucherNumber = `${prefix}-${(count + 1).toString().padStart(3, '0')}`;

    const amount = Number(data.amount) || 0;
    const id = `vch-${Date.now()}`;
    const dateStr = data.date || new Date().toISOString().split('T')[0];

    db.transaction(() => {
      db.prepare(`
        INSERT INTO vouchers (
          id, voucher_number, type, date, party_id, party_name, category, amount, payment_mode, reference_no, notes
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `).run(
        id,
        voucherNumber,
        type,
        dateStr,
        data.partyId || null,
        data.partyName || null,
        data.category || 'General Voucher',
        amount,
        data.paymentMode || 'CASH',
        data.referenceNo || null,
        data.notes || null
      );

      if (data.partyId) {
        const delta = type === 'PAYMENT_IN' ? -amount : type === 'PAYMENT_OUT' ? amount : 0;
        if (delta !== 0) {
          partyRepository.updateBalance(data.partyId, delta, db);
        }
      }

      db.prepare(`
        INSERT INTO ledger_entries (
          id, voucher_id, party_id, account_name, date, debit, credit, balance, narration
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `led-${Date.now()}`,
        id,
        data.partyId || null,
        `${data.paymentMode || 'CASH'} Account`,
        dateStr,
        type === 'PAYMENT_IN' ? amount : 0,
        type === 'PAYMENT_OUT' || type === 'EXPENSE' ? amount : 0,
        amount,
        `Voucher #${voucherNumber}: ${data.category}`
      );
    })();

    return this.getVoucherById(id);
  }

  deleteVoucher(id) {
    const db = getDb();
    const voucher = this.getVoucherById(id);
    if (!voucher) return { success: false };

    const { type, amount, partyId } = voucher;

    db.transaction(() => {
      if (partyId) {
        const reverseDelta = type === 'PAYMENT_IN' ? amount : type === 'PAYMENT_OUT' ? -amount : 0;
        if (reverseDelta !== 0) {
          partyRepository.updateBalance(partyId, reverseDelta, db);
        }
      }

      db.prepare('DELETE FROM ledger_entries WHERE voucher_id = ?').run(id);
      db.prepare('DELETE FROM vouchers WHERE id = ?').run(id);
    })();

    return { success: true };
  }
}

module.exports = new VoucherRepository();

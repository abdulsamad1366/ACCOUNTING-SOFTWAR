const { getDb } = require('../database/connection.cjs');

class PartyRepository {
  mapRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      type: row.type,
      name: row.name,
      companyName: row.company_name,
      phone: row.phone,
      email: row.email,
      gstin: row.gstin,
      address: row.address,
      city: row.city,
      state: row.state,
      pincode: row.pincode,
      stateCode: row.state_code,
      creditLimit: Number(row.credit_limit) || 0,
      balance: Number(row.balance) || 0,
      createdDate: row.created_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  getParties(type) {
    const db = getDb();
    let rows;
    if (type) {
      rows = db.prepare('SELECT * FROM parties WHERE type = ? ORDER BY created_at DESC').all(type);
    } else {
      rows = db.prepare('SELECT * FROM parties ORDER BY created_at DESC').all();
    }
    return rows.map(this.mapRow);
  }

  getPartyById(id) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM parties WHERE id = ?').get(id);
    return this.mapRow(row);
  }

  createParty(data) {
    const db = getDb();
    const id = `pty-${Date.now()}`;
    const createdDate = data.createdDate || new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO parties (
        id, type, name, company_name, phone, email, gstin, address, city, state,
        pincode, state_code, credit_limit, balance, created_date
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).run(
      id,
      data.type || 'CUSTOMER',
      data.name,
      data.companyName || null,
      data.phone || null,
      data.email || null,
      data.gstin || null,
      data.address || null,
      data.city || null,
      data.state || null,
      data.pincode || null,
      data.stateCode || null,
      Number(data.creditLimit) || 0,
      Number(data.balance) || 0,
      createdDate
    );

    return this.getPartyById(id);
  }

  updateParty(id, data) {
    const db = getDb();
    db.prepare(`
      UPDATE parties SET
        name = COALESCE(?, name),
        company_name = COALESCE(?, company_name),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        gstin = COALESCE(?, gstin),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        pincode = COALESCE(?, pincode),
        credit_limit = COALESCE(?, credit_limit),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.name || null,
      data.companyName || null,
      data.phone || null,
      data.email || null,
      data.gstin || null,
      data.address || null,
      data.city || null,
      data.state || null,
      data.pincode || null,
      data.creditLimit !== undefined ? Number(data.creditLimit) : null,
      id
    );

    return this.getPartyById(id);
  }

  updateBalance(id, delta, dbTx) {
    const db = dbTx || getDb();
    db.prepare('UPDATE parties SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(delta, id);
  }

  deleteParty(id) {
    const db = getDb();
    db.prepare('DELETE FROM parties WHERE id = ?').run(id);
    return { success: true };
  }
}

module.exports = new PartyRepository();

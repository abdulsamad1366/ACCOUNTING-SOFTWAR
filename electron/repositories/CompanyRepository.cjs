const { getDb } = require('../database/connection.cjs');

class CompanyRepository {
  getCompany() {
    const db = getDb();
    const row = db.prepare('SELECT * FROM companies LIMIT 1').get();
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      tagline: row.tagline,
      phone: row.phone,
      email: row.email,
      gstin: row.gstin,
      pan: row.pan,
      address: row.address,
      city: row.city,
      state: row.state,
      pincode: row.pincode,
      bankName: row.bank_name,
      accountNo: row.account_no,
      ifsc: row.ifsc,
      branch: row.branch,
      upiId: row.upi_id,
      terms: row.terms,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  updateCompany(data) {
    const db = getDb();
    const existing = this.getCompany();
    if (!existing) return null;

    db.prepare(`
      UPDATE companies SET
        name = ?, tagline = ?, phone = ?, email = ?, gstin = ?, pan = ?,
        address = ?, city = ?, state = ?, pincode = ?, bank_name = ?,
        account_no = ?, ifsc = ?, branch = ?, upi_id = ?, terms = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.name,
      data.tagline || null,
      data.phone || null,
      data.email || null,
      data.gstin || null,
      data.pan || null,
      data.address || null,
      data.city || null,
      data.state || null,
      data.pincode || null,
      data.bankName || null,
      data.accountNo || null,
      data.ifsc || null,
      data.branch || null,
      data.upiId || null,
      data.terms || null,
      existing.id
    );

    return this.getCompany();
  }
}

module.exports = new CompanyRepository();

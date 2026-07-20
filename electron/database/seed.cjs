const { getDb } = require('./connection.cjs');
const bcrypt = require('bcryptjs');

function seedDatabase() {
  const db = getDb();

  // 1. Seed Company Profile
  const companyCount = db.prepare('SELECT COUNT(*) as count FROM companies').get().count;
  if (companyCount === 0) {
    db.prepare(`
      INSERT INTO companies (
        id, name, tagline, phone, email, gstin, pan, address, city, state, pincode,
        bank_name, account_no, ifsc, branch, upi_id, terms
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).run(
      'comp-001',
      'Malik Enterprises & Traders',
      'Wholesale & Retail Distributors',
      '+91 98765 43210',
      'contact@maliktraders.com',
      '07AAAAA0000A1Z5',
      'AAAAA0000A',
      'Plot No 42, Industrial Area, Phase II',
      'New Delhi',
      'Delhi',
      '110020',
      'HDFC Bank',
      '50200012345678',
      'HDFC0001234',
      'Okhla Phase II',
      'maliktraders@hdfcbank',
      '1. Goods once sold will not be taken back.\n2. Interest @18% p.a. charged if bill not paid on due date.'
    );
  }

  // 2. Seed Admin User
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (id, username, password, full_name, role, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('usr-admin', 'admin', hashedPassword, 'System Administrator', 'ADMIN', 'ACTIVE');
  }

  // 3. Seed Default Categories
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  if (categoryCount === 0) {
    const insertCat = db.prepare('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)');
    insertCat.run('cat-001', 'Electronics', 'Gadgets, Chargers & Cables');
    insertCat.run('cat-002', 'Office Supplies', 'Paper, Pens & Stationery');
    insertCat.run('cat-003', 'General Goods', 'Miscellaneous Products');
  }

  // 4. Seed Default Units
  const unitCount = db.prepare('SELECT COUNT(*) as count FROM units').get().count;
  if (unitCount === 0) {
    const insertUnit = db.prepare('INSERT INTO units (id, name, symbol) VALUES (?, ?, ?)');
    insertUnit.run('unit-001', 'Pieces', 'Pcs');
    insertUnit.run('unit-002', 'Kilograms', 'Kg');
    insertUnit.run('unit-003', 'Boxes', 'Box');
    insertUnit.run('unit-004', 'Meters', 'Mtr');
    insertUnit.run('unit-005', 'Liters', 'Ltr');
  }
}

module.exports = { seedDatabase };

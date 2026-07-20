const { getDb } = require('./connection.cjs');

function initSchema() {
  const db = getDb();

  const ddlStatements = [
    // 1. Schema Version Tracking
    `CREATE TABLE IF NOT EXISTS schema_versions (
      version INTEGER PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    // 2. Company Profile Table
    `CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tagline TEXT,
      phone TEXT,
      email TEXT,
      gstin TEXT,
      pan TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      pincode TEXT,
      bank_name TEXT,
      account_no TEXT,
      ifsc TEXT,
      branch TEXT,
      upi_id TEXT,
      terms TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    // 3. User Accounts Table
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'ADMIN',
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    // 4. Categories Table
    `CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    // 5. Units Table
    `CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      symbol TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    // 6. Parties (Customers & Suppliers) Table
    `CREATE TABLE IF NOT EXISTS parties (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL, -- CUSTOMER or SUPPLIER
      name TEXT NOT NULL,
      company_name TEXT,
      phone TEXT,
      email TEXT,
      gstin TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      pincode TEXT,
      state_code TEXT,
      credit_limit REAL DEFAULT 0,
      balance REAL DEFAULT 0,
      created_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    // 7. Products Catalog Table
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category_id TEXT,
      unit_id TEXT,
      unit_name TEXT DEFAULT 'Pcs',
      hsn_code TEXT NOT NULL,
      gst_rate REAL DEFAULT 18,
      sale_price REAL DEFAULT 0,
      purchase_price REAL DEFAULT 0,
      current_stock REAL DEFAULT 0,
      min_stock_alert REAL DEFAULT 5,
      barcode TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
    );`,

    // 8. Invoices Table
    `CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL, -- SALES, PURCHASE, QUOTATION, SALES_RETURN, PURCHASE_RETURN
      party_id TEXT,
      party_name TEXT NOT NULL,
      party_phone TEXT,
      party_gstin TEXT,
      date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      subtotal REAL DEFAULT 0,
      cgst_total REAL DEFAULT 0,
      sgst_total REAL DEFAULT 0,
      igst_total REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      grand_total REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'UNPAID',
      notes TEXT,
      is_interstate INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE SET NULL
    );`,

    // 9. Invoice Items Table
    `CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      hsn_code TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      price REAL NOT NULL,
      gst_rate REAL NOT NULL,
      cgst_amount REAL DEFAULT 0,
      sgst_amount REAL DEFAULT 0,
      igst_amount REAL DEFAULT 0,
      total REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    );`,

    // 10. Vouchers Table
    `CREATE TABLE IF NOT EXISTS vouchers (
      id TEXT PRIMARY KEY,
      voucher_number TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL, -- PAYMENT_IN, PAYMENT_OUT, CONTRA, EXPENSE
      date TEXT NOT NULL,
      party_id TEXT,
      party_name TEXT,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_mode TEXT DEFAULT 'CASH',
      reference_no TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE SET NULL
    );`,

    // 11. General Ledger Entries Table
    `CREATE TABLE IF NOT EXISTS ledger_entries (
      id TEXT PRIMARY KEY,
      voucher_id TEXT,
      invoice_id TEXT,
      party_id TEXT,
      account_name TEXT NOT NULL,
      date TEXT NOT NULL,
      debit REAL DEFAULT 0,
      credit REAL DEFAULT 0,
      balance REAL DEFAULT 0,
      narration TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE SET NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
      FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE SET NULL
    );`,

    // 12. Stock Movements Table
    `CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      type TEXT NOT NULL, -- IN, OUT, ADJUSTMENT
      quantity REAL NOT NULL,
      reference_type TEXT NOT NULL,
      reference_id TEXT,
      date TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );`,

    // Indexes for fast querying
    `CREATE INDEX IF NOT EXISTS idx_parties_type ON parties(type);`,
    `CREATE INDEX IF NOT EXISTS idx_parties_name ON parties(name);`,
    `CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);`,
    `CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(type);`,
    `CREATE INDEX IF NOT EXISTS idx_invoices_party ON invoices(party_id);`,
    `CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);`,
    `CREATE INDEX IF NOT EXISTS idx_vouchers_type ON vouchers(type);`,
    `CREATE INDEX IF NOT EXISTS idx_vouchers_date ON vouchers(date);`,
    `CREATE INDEX IF NOT EXISTS idx_ledger_account ON ledger_entries(account_name);`,
    `CREATE INDEX IF NOT EXISTS idx_ledger_date ON ledger_entries(date);`,
    `CREATE INDEX IF NOT EXISTS idx_stock_product ON stock_movements(product_id);`,
  ];

  // Execute DDL inside transaction
  db.transaction(() => {
    for (const sql of ddlStatements) {
      db.prepare(sql).run();
    }
  })();
}

module.exports = { initSchema };

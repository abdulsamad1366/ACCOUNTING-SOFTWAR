const { getDb } = require('../database/connection.cjs');

class ProductRepository {
  mapRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      categoryId: row.category_id,
      unitId: row.unit_id,
      unitName: row.unit_name || 'Pcs',
      hsnCode: row.hsn_code,
      gstRate: Number(row.gst_rate) || 18,
      salePrice: Number(row.sale_price) || 0,
      purchasePrice: Number(row.purchase_price) || 0,
      currentStock: Number(row.current_stock) || 0,
      minStockAlert: Number(row.min_stock_alert) || 5,
      barcode: row.barcode,
      imageUrl: row.image_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  getProducts() {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
    return rows.map(this.mapRow);
  }

  getProductById(id) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    return this.mapRow(row);
  }

  getCategories() {
    const db = getDb();
    return db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
  }

  getUnits() {
    const db = getDb();
    return db.prepare('SELECT * FROM units ORDER BY name ASC').all();
  }

  createProduct(data) {
    const db = getDb();
    const id = `prd-${Date.now()}`;

    const count = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const code = data.code || `PRD-${(count + 1).toString().padStart(4, '0')}`;

    db.prepare(`
      INSERT INTO products (
        id, code, name, category_id, unit_id, unit_name, hsn_code, gst_rate,
        sale_price, purchase_price, current_stock, min_stock_alert, barcode, image_url
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).run(
      id,
      code,
      data.name,
      data.categoryId || null,
      data.unitId || null,
      data.unitName || 'Pcs',
      data.hsnCode || '8504',
      Number(data.gstRate) || 18,
      Number(data.salePrice) || 0,
      Number(data.purchasePrice) || 0,
      Number(data.currentStock) || 0,
      Number(data.minStockAlert) || 5,
      data.barcode || null,
      data.imageUrl || null
    );

    return this.getProductById(id);
  }

  updateProduct(id, data) {
    const db = getDb();
    db.prepare(`
      UPDATE products SET
        name = ?, code = ?, category_id = ?, unit_id = ?, unit_name = ?,
        hsn_code = ?, gst_rate = ?, sale_price = ?, purchase_price = ?,
        current_stock = ?, min_stock_alert = ?, barcode = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.name,
      data.code,
      data.categoryId || null,
      data.unitId || null,
      data.unitName || 'Pcs',
      data.hsnCode || '8504',
      Number(data.gstRate) || 18,
      Number(data.salePrice) || 0,
      Number(data.purchasePrice) || 0,
      Number(data.currentStock) || 0,
      Number(data.minStockAlert) || 5,
      data.barcode || null,
      id
    );

    return this.getProductById(id);
  }

  updateStock(id, qtyChange, dbTx) {
    const db = dbTx || getDb();
    db.prepare('UPDATE products SET current_stock = MAX(0, current_stock + ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(qtyChange, id);
  }

  adjustStock(productId, quantity, type, notes) {
    const db = getDb();
    const prod = this.getProductById(productId);
    if (!prod) throw new Error('Product not found');

    const qtyChange = type === 'IN' ? quantity : -quantity;

    db.transaction(() => {
      this.updateStock(productId, qtyChange, db);
      db.prepare(`
        INSERT INTO stock_movements (id, product_id, type, quantity, reference_type, date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(`stm-${Date.now()}`, productId, type, quantity, 'MANUAL', new Date().toISOString().split('T')[0], notes || 'Manual adjustment');
    })();

    const updated = this.getProductById(productId);
    return { success: true, newStock: updated ? updated.currentStock : 0 };
  }

  deleteProduct(id) {
    const db = getDb();
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return { success: true };
  }
}

module.exports = new ProductRepository();

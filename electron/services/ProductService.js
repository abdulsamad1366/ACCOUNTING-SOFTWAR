const { getPrismaClient } = require('../database/client');

class ProductService {
  async getProducts() {
    const prisma = getPrismaClient();
    return await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        unit: true,
      },
    });
  }

  async getCategories() {
    const prisma = getPrismaClient();
    let categories = await prisma.category.findMany();
    if (categories.length === 0) {
      await prisma.category.createMany({
        data: [
          { name: 'Electronics', description: 'Gadgets, Chargers & Cables' },
          { name: 'Office Supplies', description: 'Paper, Pens & Stationery' },
          { name: 'General Goods', description: 'Miscellaneous Products' },
        ],
      });
      categories = await prisma.category.findMany();
    }
    return categories;
  }

  async getUnits() {
    const prisma = getPrismaClient();
    let units = await prisma.unit.findMany();
    if (units.length === 0) {
      await prisma.unit.createMany({
        data: [
          { name: 'Pieces', symbol: 'Pcs' },
          { name: 'Kilograms', symbol: 'Kg' },
          { name: 'Boxes', symbol: 'Box' },
          { name: 'Meters', symbol: 'Mtr' },
          { name: 'Liters', symbol: 'Ltr' },
        ],
      });
      units = await prisma.unit.findMany();
    }
    return units;
  }

  async createProduct(data) {
    const prisma = getPrismaClient();
    const count = await prisma.product.count();
    const code = data.code || `PRD-${(count + 1).toString().padStart(4, '0')}`;

    return await prisma.product.create({
      data: {
        code,
        name: data.name,
        categoryId: data.categoryId || null,
        unitId: data.unitId || null,
        unitName: data.unitName || 'Pcs',
        hsnCode: data.hsnCode || '8504',
        gstRate: Number(data.gstRate) || 18,
        salePrice: Number(data.salePrice) || 0,
        purchasePrice: Number(data.purchasePrice) || 0,
        currentStock: Number(data.currentStock) || 0,
        minStockAlert: Number(data.minStockAlert) || 5,
        barcode: data.barcode || null,
        imageUrl: data.imageUrl || null,
      },
    });
  }

  async updateProduct(id, data) {
    const prisma = getPrismaClient();
    return await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        categoryId: data.categoryId,
        unitId: data.unitId,
        unitName: data.unitName,
        hsnCode: data.hsnCode,
        gstRate: Number(data.gstRate),
        salePrice: Number(data.salePrice),
        purchasePrice: Number(data.purchasePrice),
        currentStock: Number(data.currentStock),
        minStockAlert: Number(data.minStockAlert),
        barcode: data.barcode,
      },
    });
  }

  async adjustStock(productId, quantity, type, notes) {
    const prisma = getPrismaClient();
    const prod = await prisma.product.findUnique({ where: { id: productId } });
    if (!prod) throw new Error('Product not found');

    const newStock = type === 'IN' ? prod.currentStock + quantity : Math.max(0, prod.currentStock - quantity);

    await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      }),
      prisma.stockMovement.create({
        data: {
          productId,
          type,
          quantity,
          referenceType: 'MANUAL',
          date: new Date().toISOString().split('T')[0],
          notes: notes || 'Manual stock adjustment',
        },
      }),
    ]);

    return { success: true, newStock };
  }

  async deleteProduct(id) {
    const prisma = getPrismaClient();
    return await prisma.product.delete({
      where: { id },
    });
  }
}

module.exports = new ProductService();

const { getPrismaClient } = require('../database/client.cjs');

class BackupService {
  async exportBackupJSON() {
    const prisma = getPrismaClient();

    const company = await prisma.company.findFirst();
    const users = await prisma.user.findMany();
    const parties = await prisma.party.findMany();
    const products = await prisma.product.findMany();
    const categories = await prisma.category.findMany();
    const units = await prisma.unit.findMany();
    const invoices = await prisma.invoice.findMany({ include: { items: true } });
    const vouchers = await prisma.voucher.findMany();
    const ledgerEntries = await prisma.ledgerEntry.findMany();
    const stockMovements = await prisma.stockMovement.findMany();

    return {
      version: '1.0.0',
      backupDate: new Date().toISOString(),
      company,
      users,
      parties,
      products,
      categories,
      units,
      invoices,
      vouchers,
      ledgerEntries,
      stockMovements,
    };
  }

  async restoreBackupJSON(jsonData) {
    const prisma = getPrismaClient();
    try {
      if (!jsonData || typeof jsonData !== 'object') return false;

      await prisma.$transaction(async (tx) => {
        await tx.invoiceItem.deleteMany();
        await tx.ledgerEntry.deleteMany();
        await tx.stockMovement.deleteMany();
        await tx.invoice.deleteMany();
        await tx.voucher.deleteMany();
        await tx.party.deleteMany();
        await tx.product.deleteMany();
        await tx.category.deleteMany();
        await tx.unit.deleteMany();

        if (jsonData.company) {
          const { id: _, createdAt: __, updatedAt: ___, ...compData } = jsonData.company;
          await tx.company.deleteMany();
          await tx.company.create({ data: compData });
        }

        if (Array.isArray(jsonData.categories)) {
          for (const cat of jsonData.categories) {
            const { createdAt: _, ...data } = cat;
            await tx.category.create({ data });
          }
        }
        if (Array.isArray(jsonData.units)) {
          for (const u of jsonData.units) {
            const { createdAt: _, ...data } = u;
            await tx.unit.create({ data });
          }
        }

        if (Array.isArray(jsonData.parties)) {
          for (const p of jsonData.parties) {
            const { createdAt: _, updatedAt: __, invoices: ___, vouchers: ____, ledgerEntries: _____, ...data } = p;
            await tx.party.create({ data });
          }
        }

        if (Array.isArray(jsonData.products)) {
          for (const prod of jsonData.products) {
            const { createdAt: _, updatedAt: __, category: ___, unit: ____, invoiceItems: _____, stockMovements: ______, ...data } = prod;
            await tx.product.create({ data });
          }
        }

        if (Array.isArray(jsonData.invoices)) {
          for (const inv of jsonData.invoices) {
            const { createdAt: _, updatedAt: __, party: ___, ledgerEntries: ____, items, ...data } = inv;
            await tx.invoice.create({
              data: {
                ...data,
                items: {
                  create: (items || []).map((itm) => {
                    const { id: _, invoiceId: __, product: ___, ...itmData } = itm;
                    return itmData;
                  }),
                },
              },
            });
          }
        }

        if (Array.isArray(jsonData.vouchers)) {
          for (const v of jsonData.vouchers) {
            const { createdAt: _, party: __, ledgerEntries: ___, ...data } = v;
            await tx.voucher.create({ data });
          }
        }
      });

      return true;
    } catch (err) {
      console.error('Backup Restore Failed:', err);
      return false;
    }
  }
}

module.exports = new BackupService();

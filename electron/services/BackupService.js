const { getPrismaClient, getDatabasePath } = require('../database/client');
const fs = require('fs');
const path = require('path');

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
        // Clear existing data safely
        await tx.invoiceItem.deleteMany();
        await tx.ledgerEntry.deleteMany();
        await tx.stockMovement.deleteMany();
        await tx.invoice.deleteMany();
        await tx.voucher.deleteMany();
        await tx.party.deleteMany();
        await tx.product.deleteMany();
        await tx.category.deleteMany();
        await tx.unit.deleteMany();

        // Restore Company
        if (jsonData.company) {
          const { id, createdAt, updatedAt, ...compData } = jsonData.company;
          await tx.company.deleteMany();
          await tx.company.create({ data: compData });
        }

        // Restore Categories & Units
        if (Array.isArray(jsonData.categories)) {
          for (const cat of jsonData.categories) {
            const { createdAt, ...data } = cat;
            await tx.category.create({ data });
          }
        }
        if (Array.isArray(jsonData.units)) {
          for (const u of jsonData.units) {
            const { createdAt, ...data } = u;
            await tx.unit.create({ data });
          }
        }

        // Restore Parties
        if (Array.isArray(jsonData.parties)) {
          for (const p of jsonData.parties) {
            const { createdAt, updatedAt, invoices, vouchers, ledgerEntries, ...data } = p;
            await tx.party.create({ data });
          }
        }

        // Restore Products
        if (Array.isArray(jsonData.products)) {
          for (const prod of jsonData.products) {
            const { createdAt, updatedAt, category, unit, invoiceItems, stockMovements, ...data } = prod;
            await tx.product.create({ data });
          }
        }

        // Restore Invoices
        if (Array.isArray(jsonData.invoices)) {
          for (const inv of jsonData.invoices) {
            const { createdAt, updatedAt, party, ledgerEntries, items, ...data } = inv;
            await tx.invoice.create({
              data: {
                ...data,
                items: {
                  create: (items || []).map((itm) => {
                    const { id, invoiceId, product, ...itmData } = itm;
                    return itmData;
                  }),
                },
              },
            });
          }
        }

        // Restore Vouchers
        if (Array.isArray(jsonData.vouchers)) {
          for (const v of jsonData.vouchers) {
            const { createdAt, party, ledgerEntries, ...data } = v;
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

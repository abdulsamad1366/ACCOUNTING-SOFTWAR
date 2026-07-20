const { getPrismaClient } = require('../database/client');

class InvoiceService {
  async getInvoices(type) {
    const prisma = getPrismaClient();
    const where = type ? { type } : {};
    return await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        party: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async getInvoiceById(id) {
    const prisma = getPrismaClient();
    return await prisma.invoice.findUnique({
      where: { id },
      include: {
        party: true,
        items: true,
        ledgerEntries: true,
      },
    });
  }

  async createInvoice(data) {
    const prisma = getPrismaClient();
    const type = data.type || 'SALES';
    
    // Generate Invoice Number
    const count = await prisma.invoice.count({ where: { type } });
    const year = new Date().getFullYear();
    const prefix = type === 'SALES' ? 'INV' : type === 'PURCHASE' ? 'PUR' : type === 'QUOTATION' ? 'QTN' : 'RET';
    const invoiceNumber = `${prefix}-${year}-${(count + 1).toString().padStart(3, '0')}`;

    const paidAmount = Number(data.paidAmount) || 0;
    const grandTotal = Number(data.grandTotal) || 0;
    const unpaidAmount = Math.max(0, grandTotal - paidAmount);

    let status = 'UNPAID';
    if (paidAmount >= grandTotal && grandTotal > 0) {
      status = 'PAID';
    } else if (paidAmount > 0) {
      status = 'PARTIAL';
    }

    // Execute in Prisma Transaction
    return await prisma.$transaction(async (tx) => {
      // 1. Create Invoice with Items
      const createdInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          type,
          partyId: data.partyId || null,
          partyName: data.partyName || 'Cash Customer',
          partyPhone: data.partyPhone || null,
          partyGstin: data.partyGstin || null,
          date: data.date || new Date().toISOString().split('T')[0],
          dueDate: data.dueDate || new Date().toISOString().split('T')[0],
          subtotal: Number(data.subtotal) || 0,
          cgstTotal: Number(data.cgstTotal) || 0,
          sgstTotal: Number(data.sgstTotal) || 0,
          igstTotal: Number(data.igstTotal) || 0,
          discount: Number(data.discount) || 0,
          grandTotal,
          paidAmount,
          status,
          notes: data.notes || null,
          isInterstate: Boolean(data.isInterstate),
          items: {
            create: (data.items || []).map((item) => ({
              productId: item.productId,
              productName: item.productName,
              hsnCode: item.hsnCode || '8504',
              quantity: Number(item.quantity) || 1,
              unit: item.unit || 'Pcs',
              price: Number(item.price) || 0,
              gstRate: Number(item.gstRate) || 0,
              cgstAmount: Number(item.cgstAmount) || 0,
              sgstAmount: Number(item.sgstAmount) || 0,
              igstAmount: Number(item.igstAmount) || 0,
              total: Number(item.total) || 0,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // 2. Update Product Stock & Record Stock Movement
      if (type === 'SALES' || type === 'PURCHASE' || type === 'SALES_RETURN' || type === 'PURCHASE_RETURN') {
        for (const item of createdInvoice.items) {
          const isStockOut = type === 'SALES' || type === 'PURCHASE_RETURN';
          const qtyChange = isStockOut ? -item.quantity : item.quantity;

          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (prod) {
            const updatedStock = Math.max(0, prod.currentStock + qtyChange);
            await tx.product.update({
              where: { id: prod.id },
              data: { currentStock: updatedStock },
            });

            await tx.stockMovement.create({
              data: {
                productId: prod.id,
                type: isStockOut ? 'OUT' : 'IN',
                quantity: item.quantity,
                referenceType: type,
                referenceId: createdInvoice.id,
                date: createdInvoice.date,
                notes: `Invoice ${createdInvoice.invoiceNumber}`,
              },
            });
          }
        }
      }

      // 3. Update Party Ledger Balance
      if (data.partyId && unpaidAmount > 0) {
        const balanceChange = type === 'SALES' ? unpaidAmount : type === 'PURCHASE' ? -unpaidAmount : 0;
        if (balanceChange !== 0) {
          await tx.party.update({
            where: { id: data.partyId },
            data: {
              balance: { increment: balanceChange },
            },
          });
        }
      }

      // 4. Create Ledger Entries
      await tx.ledgerEntry.create({
        data: {
          invoiceId: createdInvoice.id,
          partyId: data.partyId || null,
          accountName: type === 'SALES' ? 'Sales Revenue Account' : 'Purchase Account',
          date: createdInvoice.date,
          debit: type === 'PURCHASE' ? grandTotal : 0,
          credit: type === 'SALES' ? grandTotal : 0,
          balance: grandTotal,
          narration: `Invoice #${invoiceNumber} for ${createdInvoice.partyName}`,
        },
      });

      return createdInvoice;
    });
  }

  async updateInvoiceStatus(id, status, paidAmount) {
    const prisma = getPrismaClient();
    return await prisma.invoice.update({
      where: { id },
      data: {
        status,
        paidAmount: paidAmount !== undefined ? Number(paidAmount) : undefined,
      },
    });
  }

  async deleteInvoice(id) {
    const prisma = getPrismaClient();
    return await prisma.invoice.delete({
      where: { id },
    });
  }
}

module.exports = new InvoiceService();

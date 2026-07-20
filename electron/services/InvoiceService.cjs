const { getPrismaClient } = require('../database/client.cjs');

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

    const count = await prisma.invoice.count({ where: { type } });
    const year = new Date().getFullYear();
    const prefix =
      type === 'SALES'
        ? 'INV'
        : type === 'PURCHASE'
        ? 'PUR'
        : type === 'QUOTATION'
        ? 'QTN'
        : type === 'SALES_RETURN'
        ? 'SRT'
        : 'PRT';
    const invoiceNumber = `${prefix}-${year}-${(count + 1).toString().padStart(3, '0')}`;

    const paidAmount = Number(data.paidAmount) || 0;
    const grandTotal = Number(data.grandTotal) || 0;
    const unpaidAmount = Math.max(0, grandTotal - paidAmount);

    let status = data.status || 'UNPAID';
    if (paidAmount >= grandTotal && grandTotal > 0) {
      status = 'PAID';
    } else if (paidAmount > 0) {
      status = 'PARTIAL';
    }

    return await prisma.$transaction(async (tx) => {
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

      if (data.partyId && unpaidAmount > 0 && type !== 'QUOTATION') {
        let balanceChange = 0;
        if (type === 'SALES' || type === 'PURCHASE_RETURN') {
          balanceChange = unpaidAmount;
        } else if (type === 'PURCHASE' || type === 'SALES_RETURN') {
          balanceChange = -unpaidAmount;
        }

        if (balanceChange !== 0) {
          await tx.party.update({
            where: { id: data.partyId },
            data: {
              balance: { increment: balanceChange },
            },
          });
        }
      }

      if (type !== 'QUOTATION') {
        await tx.ledgerEntry.create({
          data: {
            invoiceId: createdInvoice.id,
            partyId: data.partyId || null,
            accountName:
              type === 'SALES'
                ? 'Sales Revenue Account'
                : type === 'PURCHASE'
                ? 'Purchase Cost Account'
                : type === 'SALES_RETURN'
                ? 'Sales Returns Account'
                : 'Purchase Returns Account',
            date: createdInvoice.date,
            debit: type === 'PURCHASE' || type === 'SALES_RETURN' ? grandTotal : 0,
            credit: type === 'SALES' || type === 'PURCHASE_RETURN' ? grandTotal : 0,
            balance: grandTotal,
            narration: `Bill #${invoiceNumber} - ${createdInvoice.partyName}`,
          },
        });
      }

      return createdInvoice;
    });
  }

  async updateInvoiceStatus(id, newStatus, newPaidAmount) {
    const prisma = getPrismaClient();

    return await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id } });
      if (!invoice) throw new Error('Invoice not found');

      const oldPaid = invoice.paidAmount;
      const updatedPaid = newPaidAmount !== undefined ? Number(newPaidAmount) : oldPaid;
      const paidDelta = updatedPaid - oldPaid;

      if (invoice.partyId && paidDelta !== 0 && invoice.type !== 'QUOTATION') {
        const balanceDelta = invoice.type === 'SALES' ? -paidDelta : paidDelta;
        await tx.party.update({
          where: { id: invoice.partyId },
          data: { balance: { increment: balanceDelta } },
        });
      }

      return await tx.invoice.update({
        where: { id },
        data: {
          status: newStatus,
          paidAmount: updatedPaid,
        },
      });
    });
  }

  async deleteInvoice(id) {
    const prisma = getPrismaClient();

    return await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!invoice) return { success: false };

      const type = invoice.type;
      const unpaidAmount = Math.max(0, invoice.grandTotal - invoice.paidAmount);

      if (type === 'SALES' || type === 'PURCHASE' || type === 'SALES_RETURN' || type === 'PURCHASE_RETURN') {
        for (const item of invoice.items) {
          const isStockOut = type === 'SALES' || type === 'PURCHASE_RETURN';
          const reverseQtyChange = isStockOut ? item.quantity : -item.quantity;

          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (prod) {
            const restoredStock = Math.max(0, prod.currentStock + reverseQtyChange);
            await tx.product.update({
              where: { id: prod.id },
              data: { currentStock: restoredStock },
            });
          }
        }
      }

      if (invoice.partyId && unpaidAmount > 0 && type !== 'QUOTATION') {
        let reverseBalanceDelta = 0;
        if (type === 'SALES' || type === 'PURCHASE_RETURN') {
          reverseBalanceDelta = -unpaidAmount;
        } else if (type === 'PURCHASE' || type === 'SALES_RETURN') {
          reverseBalanceDelta = unpaidAmount;
        }

        if (reverseBalanceDelta !== 0) {
          await tx.party.update({
            where: { id: invoice.partyId },
            data: { balance: { increment: reverseBalanceDelta } },
          });
        }
      }

      await tx.stockMovement.deleteMany({ where: { referenceId: id } });
      await tx.ledgerEntry.deleteMany({ where: { invoiceId: id } });
      await tx.invoice.delete({ where: { id } });

      return { success: true };
    });
  }
}

module.exports = new InvoiceService();

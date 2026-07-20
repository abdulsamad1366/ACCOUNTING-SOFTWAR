const { getPrismaClient } = require('../database/client');

class VoucherService {
  async getVouchers(type) {
    const prisma = getPrismaClient();
    const where = type ? { type } : {};
    return await prisma.voucher.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        party: true,
      },
    });
  }

  async createVoucher(data) {
    const prisma = getPrismaClient();
    const type = data.type || 'PAYMENT_IN';

    const count = await prisma.voucher.count({ where: { type } });
    const prefix =
      type === 'PAYMENT_IN' ? 'RCT' : type === 'EXPENSE' ? 'EXP' : type === 'PAYMENT_OUT' ? 'PAY' : 'JRN';
    const voucherNumber = `${prefix}-${(count + 1).toString().padStart(3, '0')}`;

    const amount = Number(data.amount) || 0;

    return await prisma.$transaction(async (tx) => {
      // 1. Create Voucher Record
      const voucher = await tx.voucher.create({
        data: {
          voucherNumber,
          type,
          date: data.date || new Date().toISOString().split('T')[0],
          partyId: data.partyId || null,
          partyName: data.partyName || null,
          category: data.category || 'General Voucher',
          amount,
          paymentMode: data.paymentMode || 'CASH',
          referenceNo: data.referenceNo || null,
          notes: data.notes || null,
        },
      });

      // 2. Update Party Balance if applicable
      if (data.partyId) {
        // PAYMENT_IN reduces receivable balance (-)
        // PAYMENT_OUT increases receivable / reduces payable (+)
        const delta = type === 'PAYMENT_IN' ? -amount : type === 'PAYMENT_OUT' ? amount : 0;
        if (delta !== 0) {
          await tx.party.update({
            where: { id: data.partyId },
            data: { balance: { increment: delta } },
          });
        }
      }

      // 3. Ledger Entry
      await tx.ledgerEntry.create({
        data: {
          voucherId: voucher.id,
          partyId: data.partyId || null,
          accountName: `${data.paymentMode || 'CASH'} Account`,
          date: voucher.date,
          debit: type === 'PAYMENT_IN' ? amount : 0,
          credit: type === 'PAYMENT_OUT' || type === 'EXPENSE' ? amount : 0,
          balance: amount,
          narration: `Voucher #${voucherNumber}: ${data.category}`,
        },
      });

      return voucher;
    });
  }

  async deleteVoucher(id) {
    const prisma = getPrismaClient();

    return await prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.findUnique({ where: { id } });
      if (!voucher) return { success: false };

      const { type, amount, partyId } = voucher;

      // 1. Reverse Party Balance if applicable
      if (partyId) {
        // Reversing PAYMENT_IN adds amount back (+)
        // Reversing PAYMENT_OUT subtracts amount (-)
        const reverseDelta = type === 'PAYMENT_IN' ? amount : type === 'PAYMENT_OUT' ? -amount : 0;
        if (reverseDelta !== 0) {
          await tx.party.update({
            where: { id: partyId },
            data: { balance: { increment: reverseDelta } },
          });
        }
      }

      // 2. Delete associated Ledger Entries
      await tx.ledgerEntry.deleteMany({ where: { voucherId: id } });

      // 3. Delete Voucher Record
      await tx.voucher.delete({ where: { id } });

      return { success: true };
    });
  }
}

module.exports = new VoucherService();

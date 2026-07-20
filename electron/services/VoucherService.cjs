const { getPrismaClient } = require('../database/client.cjs');

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

      if (data.partyId) {
        const delta = type === 'PAYMENT_IN' ? -amount : type === 'PAYMENT_OUT' ? amount : 0;
        if (delta !== 0) {
          await tx.party.update({
            where: { id: data.partyId },
            data: { balance: { increment: delta } },
          });
        }
      }

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

      if (partyId) {
        const reverseDelta = type === 'PAYMENT_IN' ? amount : type === 'PAYMENT_OUT' ? -amount : 0;
        if (reverseDelta !== 0) {
          await tx.party.update({
            where: { id: partyId },
            data: { balance: { increment: reverseDelta } },
          });
        }
      }

      await tx.ledgerEntry.deleteMany({ where: { voucherId: id } });
      await tx.voucher.delete({ where: { id } });

      return { success: true };
    });
  }
}

module.exports = new VoucherService();

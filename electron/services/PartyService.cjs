const { getPrismaClient } = require('../database/client.cjs');

class PartyService {
  async getParties(type) {
    const prisma = getPrismaClient();
    const where = type ? { type } : {};
    return await prisma.party.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        invoices: { take: 5, orderBy: { createdAt: 'desc' } },
        vouchers: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async getPartyById(id) {
    const prisma = getPrismaClient();
    return await prisma.party.findUnique({
      where: { id },
      include: {
        invoices: { orderBy: { createdAt: 'desc' } },
        vouchers: { orderBy: { createdAt: 'desc' } },
        ledgerEntries: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async createParty(data) {
    const prisma = getPrismaClient();
    return await prisma.party.create({
      data: {
        type: data.type || 'CUSTOMER',
        name: data.name,
        companyName: data.companyName || null,
        phone: data.phone || null,
        email: data.email || null,
        gstin: data.gstin || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        creditLimit: Number(data.creditLimit) || 0,
        balance: Number(data.balance) || 0,
        createdDate: data.createdDate || new Date().toISOString().split('T')[0],
      },
    });
  }

  async updateParty(id, data) {
    const prisma = getPrismaClient();
    return await prisma.party.update({
      where: { id },
      data,
    });
  }

  async deleteParty(id) {
    const prisma = getPrismaClient();
    return await prisma.party.delete({
      where: { id },
    });
  }
}

module.exports = new PartyService();

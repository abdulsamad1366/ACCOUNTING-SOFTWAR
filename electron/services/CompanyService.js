const { getPrismaClient } = require('../database/client');

class CompanyService {
  async getCompany() {
    const prisma = getPrismaClient();
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'Malik Enterprises & Traders',
          tagline: 'Wholesale & Retail Distributors',
          phone: '+91 98765 43210',
          email: 'contact@maliktraders.com',
          gstin: '07AAAAA0000A1Z5',
          pan: 'AAAAA0000A',
          address: 'Plot No 42, Industrial Area, Phase II',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110020',
          bankName: 'HDFC Bank',
          accountNo: '50200012345678',
          ifsc: 'HDFC0001234',
          branch: 'Okhla Phase II',
          upiId: 'maliktraders@hdfcbank',
          terms: '1. Goods once sold will not be taken back.\n2. Interest @18% p.a. charged if bill not paid on due date.',
        },
      });
    }
    return company;
  }

  async updateCompany(data) {
    const prisma = getPrismaClient();
    const existing = await this.getCompany();
    return await prisma.company.update({
      where: { id: existing.id },
      data,
    });
  }
}

module.exports = new CompanyService();

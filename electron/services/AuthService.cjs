const { getPrismaClient } = require('../database/client.cjs');
const bcrypt = require('bcryptjs');

class AuthService {
  async ensureAdminUser() {
    const prisma = getPrismaClient();
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          fullName: 'System Administrator',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });
    }
  }

  async login(username, password) {
    const prisma = getPrismaClient();
    await this.ensureAdminUser();

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return { success: false, message: 'Invalid username or password' };
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return { success: false, message: 'Invalid username or password' };
    }

    const { password: _, ...safeUser } = user;
    return { success: true, user: safeUser };
  }

  async getUsers() {
    const prisma = getPrismaClient();
    const users = await prisma.user.findMany();
    return users.map(({ password: _, ...u }) => u);
  }

  async createUser(data) {
    const prisma = getPrismaClient();
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        fullName: data.fullName,
        role: data.role || 'ACCOUNTANT',
      },
    });
    const { password: _, ...safeUser } = user;
    return safeUser;
  }
}

module.exports = new AuthService();

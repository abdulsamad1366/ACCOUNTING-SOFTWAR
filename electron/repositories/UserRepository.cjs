const { getDb } = require('../database/connection.cjs');
const bcrypt = require('bcryptjs');

class UserRepository {
  findByUsername(username) {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  }

  getUsers() {
    const db = getDb();
    return db.prepare('SELECT id, username, full_name as fullName, role, status, created_at as createdAt FROM users').all();
  }

  createUser(data) {
    const db = getDb();
    const id = `usr-${Date.now()}`;
    const hashedPassword = bcrypt.hashSync(data.password, 10);

    db.prepare(`
      INSERT INTO users (id, username, password, full_name, role, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.username, hashedPassword, data.fullName, data.role || 'ACCOUNTANT', 'ACTIVE');

    return this.findByUsername(data.username);
  }

  verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }
}

module.exports = new UserRepository();

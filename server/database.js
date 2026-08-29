const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// 连接 PostgreSQL（通过环境变量）
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

class Database {
  constructor() {
    this.initTables();
  }

  async initTables() {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE,
          phone TEXT UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          is_vip INTEGER DEFAULT 0,
          vip_expires_at BIGINT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 管理员账号（密码用 bcrypt 加密）
      const adminPassword = bcrypt.hashSync('liuliu', 10);
      await client.query(
        `INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING`,
        ['admin', adminPassword, 'admin']
      );

      await client.query(`
        CREATE TABLE IF NOT EXISTS conversations (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          sender TEXT NOT NULL,
          content TEXT NOT NULL,
          role TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS agents (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          personality TEXT DEFAULT '',
          avatar TEXT DEFAULT '',
          system_prompt TEXT DEFAULT '',
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS agent_friends (
          id SERIAL PRIMARY KEY,
          agent_id_1 INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
          agent_id_2 INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(agent_id_1, agent_id_2)
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS agent_conversations (
          id SERIAL PRIMARY KEY,
          agent_id_1 INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
          agent_id_2 INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
          message TEXT NOT NULL,
          reply TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('数据库表初始化完成');
    } finally {
      client.release();
    }
  }

  async query(sql, params = []) {
    const client = await pool.connect();
    try {
      return await client.query(sql, params);
    } finally {
      client.release();
    }
  }

  async get(sql, params = []) {
    const client = await pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async run(sql, params = []) {
    const client = await pool.connect();
    try {
      const result = await client.query(sql, params);
      return { id: result.rows[0]?.id, changes: result.rowCount };
    } finally {
      client.release();
    }
  }
}

module.exports = new Database();

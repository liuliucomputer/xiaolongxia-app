const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// 数据目录：优先使用环境变量，兼容 Render 持久化磁盘
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
const DB_PATH = path.join(DATA_DIR, 'xiaolongxia.db');

// 确保数据目录存在
fs.mkdirSync(DATA_DIR, { recursive: true });

class Database {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH);
    this.initTables();
  }

  initTables() {
    this.db.serialize(() => {
      // 用户表
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE,
          phone TEXT UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          is_vip INTEGER DEFAULT 0,
          vip_expires_at INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 管理员账号（密码用 bcrypt 加密）
      const adminPassword = bcrypt.hashSync('liuliu', 10);
      this.db.run(`INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)`,
        ['admin', adminPassword, 'admin']);

      // 对话表
      this.db.run(`
        CREATE TABLE IF NOT EXISTS conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // 消息表
      this.db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id INTEGER NOT NULL,
          sender TEXT NOT NULL,
          content TEXT NOT NULL,
          role TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        )
      `);

      // Agent 表
      this.db.run(`
        CREATE TABLE IF NOT EXISTS agents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          personality TEXT DEFAULT '',
          avatar TEXT DEFAULT '',
          system_prompt TEXT DEFAULT '',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Agent 好友关系表
      this.db.run(`
        CREATE TABLE IF NOT EXISTS agent_friends (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          agent_id_1 INTEGER NOT NULL,
          agent_id_2 INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (agent_id_1) REFERENCES agents(id) ON DELETE CASCADE,
          FOREIGN KEY (agent_id_2) REFERENCES agents(id) ON DELETE CASCADE,
          UNIQUE(agent_id_1, agent_id_2)
        )
      `);

      // Agent 对话记录表
      this.db.run(`
        CREATE TABLE IF NOT EXISTS agent_conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          agent_id_1 INTEGER NOT NULL,
          agent_id_2 INTEGER NOT NULL,
          message TEXT NOT NULL,
          reply TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (agent_id_1) REFERENCES agents(id) ON DELETE CASCADE,
          FOREIGN KEY (agent_id_2) REFERENCES agents(id) ON DELETE CASCADE
        )
      `);

      console.log('数据库表初始化完成');
    });
  }

  async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  close() {
    this.db.close();
  }
}

module.exports = new Database();

const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('./database');
const { authMiddleware, adminMiddleware } = require('./auth');

// ==================== 用户管理 ====================

// 获取所有用户列表
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await db.query('SELECT id, username, phone, email, role, is_vip, vip_expires_at, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// 添加新用户
router.post('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { username, password, phone, email, role = 'user' } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const existingUser = await db.get('SELECT * FROM users WHERE username = ? OR phone = ? OR email = ?', [username, phone, email]);
    if (existingUser) {
      return res.status(400).json({ error: '用户名、手机号或邮箱已被注册' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const result = await db.run(
      'INSERT INTO users (username, password_hash, phone, email, role) VALUES (?, ?, ?, ?, ?)',
      [username, passwordHash, phone || null, email || null, role]
    );

    const user = await db.get('SELECT id, username, phone, email, role, created_at FROM users WHERE id = ?', [result.id]);
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '添加用户失败' });
  }
});

// 删除用户
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (userId === 1) {
      return res.status(400).json({ error: '不能删除管理员账户' });
    }
    await db.run('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ success: true, message: '用户已删除' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '删除用户失败' });
  }
});

// ==================== VIP 管理 ====================

// 获取所有 VIP 用户
router.get('/vip-users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const vipUsers = await db.query(
      'SELECT id, username, phone, email, is_vip, vip_expires_at, created_at FROM users WHERE is_vip = 1 AND vip_expires_at > ? ORDER BY vip_expires_at DESC',
      [Math.floor(Date.now() / 1000)]
    );
    res.json(vipUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取 VIP 用户列表失败' });
  }
});

// 设置用户 VIP 状态
router.put('/users/:id/vip', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { is_vip, days } = req.body;
    const now = Math.floor(Date.now() / 1000);

    let vipExpiresAt = null;
    if (is_vip && days) {
      vipExpiresAt = now + days * 86400;
    }

    await db.run(
      'UPDATE users SET is_vip = ?, vip_expires_at = ? WHERE id = ?',
      [is_vip ? 1 : 0, vipExpiresAt, req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '更新 VIP 状态失败' });
  }
});

module.exports = router;

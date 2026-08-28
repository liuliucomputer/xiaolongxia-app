const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('./database');
const { authMiddleware, adminMiddleware, generateToken } = require('./auth');

// 注册 - 手机号
router.post('/register/phone', async (req, res) => {
  try {
    const { phone, username, password, code } = req.body;

    // 这里可以添加短信验证码验证逻辑
    // if (!code) return res.status(400).json({ error: '请输入验证码' });

    const existingUser = await db.get('SELECT * FROM users WHERE phone = ? OR username = ?', [phone, username]);
    if (existingUser) {
      return res.status(400).json({ error: '手机号或用户名已被注册' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const result = await db.run(
      'INSERT INTO users (phone, username, password_hash, role) VALUES (?, ?, ?, ?)',
      [phone, username, passwordHash, 'user']
    );

    const user = await db.get('SELECT * FROM users WHERE id = ?', [result.id]);
    const token = generateToken(user);

    res.json({ token, user: { id: user.id, username: user.username, phone: user.phone, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '注册失败' });
  }
});

// 注册 - 邮箱
router.post('/register/email', async (req, res) => {
  try {
    const { email, username, password, code } = req.body;

    // 这里可以添加邮箱验证码验证逻辑
    // if (!code) return res.status(400).json({ error: '请输入验证码' });

    const existingUser = await db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existingUser) {
      return res.status(400).json({ error: '邮箱或用户名已被注册' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const result = await db.run(
      'INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, ?)',
      [email, username, passwordHash, 'user']
    );

    const user = await db.get('SELECT * FROM users WHERE id = ?', [result.id]);
    const token = generateToken(user);

    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '注册失败' });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { account, password } = req.body;
    let user;

    if (account.includes('@')) {
      user = await db.get('SELECT * FROM users WHERE email = ?', [account]);
    } else if (/^\d+$/.test(account)) {
      user = await db.get('SELECT * FROM users WHERE phone = ?', [account]);
    } else {
      user = await db.get('SELECT * FROM users WHERE username = ?', [account]);
    }

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: '账号或密码错误' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        is_vip: user.is_vip,
        vip_expires_at: user.vip_expires_at
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '登录失败' });
  }
});

// 获取当前用户信息
router.get('/me', authMiddleware, async (req, res) => {
  res.json(req.user);
});

// 注销账号
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    await db.run('DELETE FROM users WHERE id = ?', [req.user.id]);
    res.json({ success: true, message: '账号已注销' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '注销失败' });
  }
});

// 更新密码
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!bcrypt.compareSync(oldPassword, req.user.password_hash)) {
      return res.status(400).json({ error: '原密码错误' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    res.json({ success: true, message: '密码修改成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '密码修改失败' });
  }
});

module.exports = router;

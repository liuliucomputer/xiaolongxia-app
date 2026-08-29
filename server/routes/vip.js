const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware } = require('./auth');

// VIP 套餐配置
const VIP_PLANS = {
  monthly: { duration: 30, price: 30 },
  quarterly: { duration: 90, price: 80 },
  yearly: { duration: 365, price: 280 }
};

// 获取 VIP 套餐列表
router.get('/plans', (req, res) => {
  res.json(VIP_PLANS);
});

// 开通 VIP
router.post('/activate', authMiddleware, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!VIP_PLANS[plan]) {
      return res.status(400).json({ error: '无效的套餐' });
    }

    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const currentExpiresAt = user.vip_expires_at || 0;
    const now = Math.floor(Date.now() / 1000);

    // 如果当前 VIP 还未过期，则延长有效期
    let newExpiresAt;
    if (currentExpiresAt > now) {
      newExpiresAt = currentExpiresAt + VIP_PLANS[plan].duration * 86400;
    } else {
      newExpiresAt = now + VIP_PLANS[plan].duration * 86400;
    }

    await db.run(
      'UPDATE users SET is_vip = 1, vip_expires_at = ? WHERE id = ?',
      [newExpiresAt, req.user.id]
    );

    res.json({
      success: true,
      message: `VIP 已开通，有效期至 ${new Date(newExpiresAt * 1000).toLocaleDateString('zh-CN')}`,
      expiresAt: newExpiresAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '开通 VIP 失败' });
  }
});

// 检查 VIP 状态
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const user = await db.get('SELECT is_vip, vip_expires_at FROM users WHERE id = ?', [req.user.id]);
    const now = Math.floor(Date.now() / 1000);
    const isExpired = user.vip_expires_at && user.vip_expires_at <= now;

    res.json({
      is_vip: user.is_vip && !isExpired,
      vip_expires_at: user.vip_expires_at,
      days_remaining: user.vip_expires_at ? Math.max(0, Math.ceil((user.vip_expires_at - now) / 86400)) : 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取 VIP 状态失败' });
  }
});

module.exports = router;

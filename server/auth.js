const jwt = require('jsonwebtoken');
const db = require('./database');

const JWT_SECRET = 'xiaolongxia_secret_key_2024';

// 验证用户是否登录
async function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '请先登录' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await db.get('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    if (!req.user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

// 验证是否为管理员
async function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权访问' });
  }
  next();
}

// 生成JWT Token
function generateToken(user) {
  return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { authMiddleware, adminMiddleware, generateToken, JWT_SECRET };

const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware } = require('./auth');

// AI 配置（这里可以配置为环境变量）
const AI_CONFIG = {
  apiKey: 'sk-FwaH511AsiLrNbMvPC6lnzZzDjLBDHNKvuAuAKzS5puLY8HO',
  baseUrl: 'https://apihub.agnes-ai.cn/v1',
  model: 'agnes-2.5-flash'
};

// 获取对话列表
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const conversations = await db.query(
      'SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC',
      [req.user.id]
    );
    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取对话列表失败' });
  }
});

// 创建新对话
router.post('/conversations', authMiddleware, async (req, res) => {
  try {
    const { title = '新对话' } = req.body;
    const result = await db.run(
      'INSERT INTO conversations (user_id, title) VALUES (?, ?)',
      [req.user.id, title]
    );
    const conversation = await db.get('SELECT * FROM conversations WHERE id = ?', [result.id]);
    res.json(conversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '创建对话失败' });
  }
});

// 获取对话消息
router.get('/conversations/:id/messages', authMiddleware, async (req, res) => {
  try {
    const conversation = await db.get('SELECT * FROM conversations WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!conversation) {
      return res.status(404).json({ error: '对话不存在' });
    }
    const messages = await db.query(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [conversation.id]
    );
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取消息失败' });
  }
});

// 发送消息
router.post('/conversations/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }

    const conversation = await db.get('SELECT * FROM conversations WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!conversation) {
      return res.status(404).json({ error: '对话不存在' });
    }

    // 保存用户消息
    await db.run(
      'INSERT INTO messages (conversation_id, sender, content, role) VALUES (?, ?, ?, ?)',
      [conversation.id, req.user.id, content, 'user']
    );

    // 调用 AI 接口获取回复
    const aiResponse = await callAI(content, conversation);

    // 保存 AI 回复
    const msgResult = await db.run(
      'INSERT INTO messages (conversation_id, sender, content, role) VALUES (?, ?, ?, ?)',
      [conversation.id, 'ai', aiResponse, 'assistant']
    );

    // 更新对话更新时间
    await db.run('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [conversation.id]);

    const message = await db.get('SELECT * FROM messages WHERE id = ?', [msgResult.id]);
    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '发送消息失败' });
  }
});

// 删除对话
router.delete('/conversations/:id', authMiddleware, async (req, res) => {
  try {
    const conversation = await db.get('SELECT * FROM conversations WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!conversation) {
      return res.status(404).json({ error: '对话不存在' });
    }
    await db.run('DELETE FROM conversations WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '删除对话失败' });
  }
});

// 清空所有对话
router.post('/conversations/clear', authMiddleware, async (req, res) => {
  try {
    await db.run('DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE user_id = ?)', [req.user.id]);
    await db.run('DELETE FROM conversations WHERE user_id = ?', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '清空对话失败' });
  }
});

// 调用 AI 接口
async function callAI(message, conversation) {
  try {
    const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: '你是小龙虾助手，一个友好、专业的 AI 助手。请用中文回答用户的问题。'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '抱歉，我暂时无法回复。';
  } catch (err) {
    console.error('AI 调用失败:', err);
    return '抱歉，AI 服务暂时不可用，请稍后重试。';
  }
}

module.exports = router;

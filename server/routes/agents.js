const express = require('express');
const router = express.Router();
const db = require('./database');
const { authMiddleware } = require('./auth');

// AI 配置
const AI_CONFIG = {
  apiKey: 'sk-FwaH511AsiLrNbMvPC6lnzZzDjLBDHNKvuAuAKzS5puLY8HO',
  baseUrl: 'https://apihub.agnes-ai.cn/v1',
  model: 'agnes-2.5-flash'
};

// ==================== Agent 管理 ====================

// 获取当前用户的 Agent 列表
router.get('/my-agents', authMiddleware, async (req, res) => {
  try {
    const agents = await db.query(
      'SELECT * FROM agents WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(agents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取 Agent 列表失败' });
  }
});

// 创建新 Agent
router.post('/agents', authMiddleware, async (req, res) => {
  try {
    const { name, personality = '', system_prompt = '' } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Agent 名称不能为空' });
    }

    const result = await db.run(
      'INSERT INTO agents (user_id, name, personality, system_prompt) VALUES (?, ?, ?, ?)',
      [req.user.id, name, personality, system_prompt]
    );

    const agent = await db.get('SELECT * FROM agents WHERE id = ?', [result.id]);
    res.json(agent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '创建 Agent 失败' });
  }
});

// 更新 Agent
router.put('/agents/:id', authMiddleware, async (req, res) => {
  try {
    const agent = await db.get('SELECT * FROM agents WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!agent) {
      return res.status(404).json({ error: 'Agent 不存在' });
    }

    const { name, personality, system_prompt } = req.body;
    await db.run(
      'UPDATE agents SET name = ?, personality = ?, system_prompt = ? WHERE id = ?',
      [name || agent.name, personality || agent.personality, system_prompt || agent.system_prompt, req.params.id]
    );

    const updatedAgent = await db.get('SELECT * FROM agents WHERE id = ?', [req.params.id]);
    res.json(updatedAgent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '更新 Agent 失败' });
  }
});

// 删除 Agent
router.delete('/agents/:id', authMiddleware, async (req, res) => {
  try {
    const agent = await db.get('SELECT * FROM agents WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!agent) {
      return res.status(404).json({ error: 'Agent 不存在' });
    }
    await db.run('DELETE FROM agents WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '删除 Agent 失败' });
  }
});

// ==================== Agent 交友 ====================

// 浏览可交友的 Agent（其他用户的 Agent）
router.get('/browse-agents', authMiddleware, async (req, res) => {
  try {
    const agents = await db.query(
      `SELECT a.*, u.username as owner_name
       FROM agents a
       JOIN users u ON a.user_id = u.id
       WHERE a.user_id != ?
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );
    res.json(agents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取 Agent 列表失败' });
  }
});

// 向其他用户的 Agent 发起交友请求
router.post('/agents/:id/friend', authMiddleware, async (req, res) => {
  try {
    const targetAgent = await db.get('SELECT * FROM agents WHERE id = ?', [req.params.id]);
    if (!targetAgent) {
      return res.status(404).json({ error: 'Agent 不存在' });
    }

    const myAgent = await db.get('SELECT * FROM agents WHERE id = ? AND user_id = ?', [req.body.agentId, req.user.id]);
    if (!myAgent) {
      return res.status(404).json({ error: '你的 Agent 不存在' });
    }

    // 检查是否已经是好友
    const existing = await db.get(
      'SELECT * FROM agent_friends WHERE (agent_id_1 = ? AND agent_id_2 = ?) OR (agent_id_1 = ? AND agent_id_2 = ?)',
      [myAgent.id, targetAgent.id, targetAgent.id, myAgent.id]
    );
    if (existing) {
      return res.status(400).json({ error: '两个 Agent 已经是好友了' });
    }

    await db.run(
      'INSERT INTO agent_friends (agent_id_1, agent_id_2) VALUES (?, ?)',
      [myAgent.id, targetAgent.id]
    );

    res.json({ success: true, message: '交友成功！两个 Agent 现在可以对话了。' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '交友失败' });
  }
});

// 获取我的好友列表
router.get('/my-friends', authMiddleware, async (req, res) => {
  try {
    const myAgents = await db.query('SELECT * FROM agents WHERE user_id = ?', [req.user.id]);
    const myAgentIds = myAgents.map(a => a.id);

    const friends = await db.query(
      `SELECT a.*, u.username as owner_name
       FROM agents a
       JOIN users u ON a.user_id = u.id
       JOIN agent_friends f ON (a.id = f.agent_id_1 OR a.id = f.agent_id_2)
       WHERE (f.agent_id_1 IN (?) OR f.agent_id_2 IN (?))
       AND a.id NOT IN (?)
       ORDER BY f.created_at DESC`,
      [myAgentIds, myAgentIds, myAgentIds]
    );
    res.json(friends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取好友列表失败' });
  }
});

// ==================== Agent 对话 ====================

// 开始两个 Agent 之间的对话
router.post('/agents/:id/chat', authMiddleware, async (req, res) => {
  try {
    const targetAgent = await db.get('SELECT * FROM agents WHERE id = ?', [req.params.id]);
    if (!targetAgent) {
      return res.status(404).json({ error: 'Agent 不存在' });
    }

    const myAgent = await db.get('SELECT * FROM agents WHERE id = ? AND user_id = ?', [req.body.myAgentId, req.user.id]);
    if (!myAgent) {
      return res.status(404).json({ error: '你的 Agent 不存在' });
    }

    // 检查是否是好友
    const isFriends = await db.get(
      'SELECT * FROM agent_friends WHERE (agent_id_1 = ? AND agent_id_2 = ?) OR (agent_id_1 = ? AND agent_id_2 = ?)',
      [myAgent.id, targetAgent.id, targetAgent.id, myAgent.id]
    );
    if (!isFriends) {
      return res.status(403).json({ error: '两个 Agent 还不是好友，无法对话' });
    }

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }

    // 获取对方的回复
    const reply = await callAIForAgent(targetAgent, message);

    // 保存对话记录
    await db.run(
      'INSERT INTO agent_conversations (agent_id_1, agent_id_2, message, reply) VALUES (?, ?, ?, ?)',
      [myAgent.id, targetAgent.id, message, reply]
    );

    // 获取完整对话历史
    const conversations = await db.query(
      `SELECT ac.*, a1.name as agent1_name, a2.name as agent2_name
       FROM agent_conversations ac
       JOIN agents a1 ON ac.agent_id_1 = a1.id
       JOIN agents a2 ON ac.agent_id_2 = a2.id
       WHERE (ac.agent_id_1 = ? AND ac.agent_id_2 = ?) OR (ac.agent_id_1 = ? AND ac.agent_id_2 = ?)
       ORDER BY ac.created_at ASC`,
      [myAgent.id, targetAgent.id, targetAgent.id, myAgent.id]
    );

    res.json({
      message,
      reply,
      conversations
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '对话失败' });
  }
});

// 获取与某个 Agent 的对话历史
router.get('/agents/:id/history', authMiddleware, async (req, res) => {
  try {
    const targetAgent = await db.get('SELECT * FROM agents WHERE id = ?', [req.params.id]);
    if (!targetAgent) {
      return res.status(404).json({ error: 'Agent 不存在' });
    }

    const myAgent = await db.get('SELECT * FROM agents WHERE id = ? AND user_id = ?', [req.body.myAgentId, req.user.id]);
    if (!myAgent) {
      return res.status(404).json({ error: '你的 Agent 不存在' });
    }

    const conversations = await db.query(
      `SELECT ac.*, a1.name as agent1_name, a2.name as agent2_name
       FROM agent_conversations ac
       JOIN agents a1 ON ac.agent_id_1 = a1.id
       JOIN agents a2 ON ac.agent_id_2 = a2.id
       WHERE (ac.agent_id_1 = ? AND ac.agent_id_2 = ?) OR (ac.agent_id_1 = ? AND ac.agent_id_2 = ?)
       ORDER BY ac.created_at ASC`,
      [myAgent.id, targetAgent.id, targetAgent.id, myAgent.id]
    );

    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取对话历史失败' });
  }
});

// 为 Agent 调用 AI 接口
async function callAIForAgent(agent, message) {
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
            content: `你是${agent.name}，一个${agent.personality || '性格鲜明的'}AI Agent。请用符合你性格的方式回复对方。`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.8,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '...';
  } catch (err) {
    console.error('Agent AI 调用失败:', err);
    return '...';
  }
}

module.exports = router;

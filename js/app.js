<<<<<<< HEAD
// 小龙虾 App - 主应用逻辑

const API_BASE = '/api';

class XiaolongxiaApp {
  constructor() {
    this.user = null;
    this.token = localStorage.getItem('token');
    this.currentConversationId = null;
    this.currentAgentChat = null;
    this.isSending = false;
    
    this.init();
  }
  
  init() {
    this.cacheElements();
    this.bindEvents();
    this.checkAuth();
  }
  
  cacheElements() {
    // 页面
    this.pages = {
      auth: document.getElementById('auth-page'),
      main: document.getElementById('main-page')
    };
    
    // 认证
    this.authTabs = document.querySelectorAll('.auth-tabs .tab');
    this.authForms = document.querySelectorAll('.auth-form');
    this.methodTabs = document.querySelectorAll('.method-tab');
    this.registerMethods = document.querySelectorAll('.register-method');
    
    // 主页面
    this.sidebar = document.getElementById('sidebar');
    this.menuToggle = document.getElementById('menu-toggle');
    this.views = document.querySelectorAll('.view');
    
    // 侧边栏标签
    this.sidebarTabs = document.querySelectorAll('.sidebar-tab');
    this.panels = document.querySelectorAll('.panel');
    
    // 对话
    this.conversationList = document.getElementById('conversation-list');
    this.chatTitle = document.getElementById('chat-title');
    this.chatMessages = document.getElementById('chat-messages');
    this.chatInput = document.getElementById('chat-input');
    this.sendBtn = document.getElementById('send-btn');
    
    // Agent
    this.agentChatView = document.getElementById('agent-chat-view');
    this.agentChatMessages = document.getElementById('agent-chat-messages');
    this.agentChatInput = document.getElementById('chat-input');
    this.agentSendBtn = document.getElementById('agent-send-btn');
    this.agentChatTitle = document.getElementById('agent-chat-title');
    this.myAgentsList = document.getElementById('my-agents-list');
    this.myFriendsList = document.getElementById('my-friends-list');
    this.browseAgentsList = document.getElementById('browse-agents-list');
    
    // VIP
    this.vipBtn = document.getElementById('vip-btn');
    this.vipStatus = document.getElementById('vip-status');
    
    // 用户菜单
    this.userMenuBtn = document.getElementById('user-menu-btn');
    
    // 弹窗
    this.modalOverlay = document.getElementById('modal-overlay');
    this.modalContent = document.getElementById('modal-content');
    
    // Toast
    this.toast = document.getElementById('toast');
  }
  
  bindEvents() {
    // 认证标签切换
    this.authTabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchAuthTab(tab.dataset.tab));
    });
    
    // 注册方式切换
    this.methodTabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchRegisterMethod(tab.dataset.method));
    });
    
    // 登录表单
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.login();
    });
    
    // 注册表单
    document.getElementById('register-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.register();
    });
    
    // 发送验证码
    document.getElementById('send-phone-code').addEventListener('click', () => {
      this.sendCode('phone');
    });
    document.getElementById('send-email-code').addEventListener('click', () => {
      this.sendCode('email');
    });
    
    // 侧边栏菜单
    this.menuToggle.addEventListener('click', () => {
      this.sidebar.classList.toggle('open');
    });
    
    // 新对话
    document.getElementById('new-chat-btn').addEventListener('click', () => {
      this.createNewConversation();
    });
    
    // 侧边栏标签
    this.sidebarTabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchSidebarTab(tab.dataset.tab));
    });
    
    // 发送消息
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // Agent 聊天发送
    this.agentSendBtn.addEventListener('click', () => this.sendAgentMessage());
    document.getElementById('agent-chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendAgentMessage();
      }
    });
    
    // 返回按钮
    document.getElementById('back-to-agents').addEventListener('click', () => {
      this.showView('chat');
    });
    
    // VIP 按钮
    this.vipBtn.addEventListener('click', () => this.showView('vip'));
    
    // 用户菜单
    this.userMenuBtn.addEventListener('click', () => this.showSettings());
    
    // 创建 Agent 按钮
    document.getElementById('create-agent-btn').addEventListener('click', () => {
      this.showCreateAgentModal();
    });
    
    // 添加用户按钮
    document.getElementById('add-user-btn').addEventListener('click', () => {
      this.showAddUserModal();
    });
    
    // 管理员标签
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchAdminTab(e.target.dataset.tab));
    });
    
    // 修改密码
    document.getElementById('change-password-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.changePassword();
    });
    
    // 退出登录
    document.getElementById('logout-btn').addEventListener('click', () => {
      this.logout();
    });
    
    // 注销账号
    document.getElementById('delete-account-btn').addEventListener('click', () => {
      this.confirmDeleteAccount();
    });
    
    // 关闭弹窗
    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) {
        this.hideModal();
      }
    });
  }
  
  async checkAuth() {
    if (!this.token) {
      this.showPage('auth');
      return;
    }
    
    try {
      const user = await this.api('/auth/me');
      this.user = user;
      this.showPage('main');
      this.updateUserInfo();
      this.loadConversations();
      this.loadAgents();
      this.checkVIPStatus();
    } catch (err) {
      this.logout();
    }
  }
  
  showPage(page) {
    Object.values(this.pages).forEach(p => p.classList.remove('active'));
    this.pages[page].classList.add('active');
  }
  
  async login() {
    const account = document.getElementById('login-account').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!account || !password) {
      this.showToast('请填写完整信息', 'error');
      return;
    }
    
    try {
      const data = await this.api('/auth/login', 'POST', { account, password });
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('token', this.token);
      this.showPage('main');
      this.updateUserInfo();
      this.loadConversations();
      this.loadAgents();
      this.checkVIPStatus();
      this.showToast('登录成功！', 'success');
    } catch (err) {
      this.showToast(err.message || '登录失败', 'error');
    }
  }
  
  async register() {
    const method = document.querySelector('.method-tab.active').dataset.method;
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    
    if (!username || !password) {
      this.showToast('请填写完整信息', 'error');
      return;
    }
    
    try {
      let data;
      if (method === 'phone') {
        const phone = document.getElementById('reg-phone').value.trim();
        const code = document.getElementById('reg-phone-code').value.trim();
        data = await this.api('/auth/register/phone', 'POST', { phone, username, password, code });
      } else {
        const email = document.getElementById('reg-email').value.trim();
        const code = document.getElementById('reg-email-code').value.trim();
        data = await this.api('/auth/register/email', 'POST', { email, username, password, code });
      }
      
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('token', this.token);
      this.showPage('main');
      this.updateUserInfo();
      this.loadConversations();
      this.loadAgents();
      this.showToast('注册成功！', 'success');
    } catch (err) {
      this.showToast(err.message || '注册失败', 'error');
    }
  }
  
  async sendCode(type) {
    const input = document.getElementById(`${type}-code`);
    const value = input.value.trim();
    
    if (!value) {
      this.showToast('请先输入手机号/邮箱', 'warning');
      return;
    }
    
    // 模拟发送验证码（实际项目应调用短信/邮件服务）
    this.showToast(`${type === 'phone' ? '短信' : '邮箱'}验证码已发送`, 'success');
    
    // 倒计时
    let seconds = 60;
    const btn = document.getElementById(`send-${type}-code`);
    btn.disabled = true;
    btn.textContent = `${seconds}秒后重发`;
    
    const timer = setInterval(() => {
      seconds--;
      btn.textContent = `${seconds}秒后重发`;
      if (seconds <= 0) {
        clearInterval(timer);
        btn.disabled = false;
        btn.textContent = '获取验证码';
      }
    }, 1000);
  }
  
  switchAuthTab(tab) {
    this.authTabs.forEach(t => t.classList.remove('active'));
    this.authForms.forEach(f => f.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(`${tab}-form`).classList.add('active');
  }
  
  switchRegisterMethod(method) {
    this.methodTabs.forEach(t => t.classList.remove('active'));
    this.registerMethods.forEach(m => m.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(`${method}-register`).classList.add('active');
  }
  
  switchSidebarTab(tab) {
    this.sidebarTabs.forEach(t => t.classList.remove('active'));
    this.panels.forEach(p => p.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(`${tab}-panel`).classList.add('active');
  }
  
  async loadConversations() {
    try {
      const conversations = await this.api('/conversations/conversations');
      this.renderConversationList(conversations);
    } catch (err) {
      console.error('加载对话失败:', err);
    }
  }
  
  renderConversationList(conversations) {
    this.conversationList.innerHTML = '';
    
    if (conversations.length === 0) {
      this.conversationList.innerHTML = '<li style="padding:20px;text-align:center;color:var(--text-muted)">暂无对话记录</li>';
      return;
    }
    
    conversations.forEach(conv => {
      const li = document.createElement('li');
      li.className = 'conversation-item';
      li.innerHTML = `
        <span class="title">${this.escapeHtml(conv.title)}</span>
        <button class="delete-btn" data-id="${conv.id}"><i class="fas fa-trash"></i></button>
      `;
      li.addEventListener('click', (e) => {
        if (!e.target.closest('.delete-btn')) {
          this.selectConversation(conv.id, conv.title);
        }
      });
      
      const deleteBtn = li.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', () => this.deleteConversation(conv.id));
      
      this.conversationList.appendChild(li);
    });
  }
  
  async createNewConversation() {
    try {
      const conv = await this.api('/conversations/conversations', 'POST', { title: '新对话' });
      this.selectConversation(conv.id, conv.title);
      await this.loadConversations();
    } catch (err) {
      this.showToast('创建对话失败', 'error');
    }
  }
  
  selectConversation(id, title) {
    this.currentConversationId = id;
    this.chatTitle.textContent = title;
    this.showView('chat');
    this.loadMessages(id);
    
    // 高亮当前对话
    document.querySelectorAll('.conversation-item').forEach(item => {
      item.classList.remove('active');
    });
    const activeItem = [...this.conversationList.children].find(li => 
      li.querySelector('.delete-btn')?.dataset.id == id
    );
    if (activeItem) activeItem.classList.add('active');
  }
  
  async loadMessages(conversationId) {
    try {
      const messages = await this.api(`/conversations/${conversationId}/messages`);
      this.renderMessages(messages);
    } catch (err) {
      this.showToast('加载消息失败', 'error');
    }
  }
  
  renderMessages(messages) {
    this.chatMessages.innerHTML = '';
    
    if (messages.length === 0) {
      this.chatMessages.innerHTML = `
        <div class="welcome-message">
          <p>👋 你好！我是小龙虾 AI 助手</p>
          <p>有什么我可以帮助你的吗？</p>
        </div>
      `;
      return;
    }
    
    messages.forEach(msg => {
      const div = document.createElement('div');
      div.className = `message ${msg.role}`;
      div.textContent = msg.content;
      this.chatMessages.appendChild(div);
    });
    
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }
  
  async sendMessage() {
    if (this.isSending || !this.currentConversationId) return;
    
    const content = this.chatInput.value.trim();
    if (!content) return;
    
    this.isSending = true;
    this.sendBtn.disabled = true;
    this.sendBtn.innerHTML = '<span class="loading"></span>';
    
    // 添加用户消息
    this.chatMessages.appendChild(this.createMessageElement(content, 'user'));
    this.chatInput.value = '';
    this.chatInput.style.height = 'auto';
    
    try {
      const response = await this.api(`/conversations/${this.currentConversationId}/messages`, 'POST', { content });
      this.renderMessages([response]);
    } catch (err) {
      this.chatMessages.appendChild(this.createMessageElement('发送失败，请重试', 'system'));
      this.showToast('发送消息失败', 'error');
    } finally {
      this.isSending = false;
      this.sendBtn.disabled = false;
      this.sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 发送';
    }
  }
  
  createMessageElement(content, role) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    div.textContent = content;
    return div;
  }
  
  async deleteConversation(id) {
    if (!confirm('确定要删除这条对话吗？')) return;
    
    try {
      await this.api(`/conversations/${id}`, 'DELETE');
      await this.loadConversations();
      if (this.currentConversationId == id) {
        this.currentConversationId = null;
        this.chatTitle.textContent = '新对话';
        this.chatMessages.innerHTML = `
          <div class="welcome-message">
            <p>👋 你好！我是小龙虾 AI 助手</p>
            <p>有什么我可以帮助你的吗？</p>
          </div>
        `;
      }
      this.showToast('对话已删除', 'success');
    } catch (err) {
      this.showToast('删除失败', 'error');
    }
  }
  
  async showView(viewName) {
    this.views.forEach(v => v.classList.remove('active'));
    
    const viewMap = {
      'chat': 'chat-view',
      'agent-chat': 'agent-chat-view',
      'vip': 'vip-view',
      'admin': 'admin-view',
      'settings': 'settings-view'
    };
    
    document.getElementById(viewMap[viewName]).classList.add('active');
    
    // 关闭移动端侧边栏
    this.sidebar.classList.remove('open');
  }
  
  updateUserInfo() {
    if (!this.user) return;
    
    // 更新设置页面
    document.getElementById('settings-username').textContent = this.user.username;
    document.getElementById('settings-role').textContent = this.user.role === 'admin' ? '管理员' : '普通用户';
    
    // VIP 状态
    const vipEl = document.getElementById('settings-vip');
    const now = Math.floor(Date.now() / 1000);
    if (this.user.is_vip && this.user.vip_expires_at > now) {
      const days = Math.ceil((this.user.vip_expires_at - now) / 86400);
      vipEl.innerHTML = `<span class="vip-badge">VIP (${days}天)</span>`;
    } else {
      vipEl.textContent = '非 VIP';
    }
    
    // 管理员显示后台入口
    const adminBtn = document.getElementById('admin-btn');
    if (this.user.role === 'admin') {
      if (!adminBtn) {
        const nav = document.querySelector('.topbar-right');
        const btn = document.createElement('button');
        btn.id = 'admin-btn';
        btn.className = 'btn-icon';
        btn.innerHTML = '<i class="fas fa-cog"></i>';
        btn.title = '管理后台';
        btn.addEventListener('click', () => this.loadAdminData());
        nav.appendChild(btn);
      }
    } else {
      const btn = document.getElementById('admin-btn');
      if (btn) btn.remove();
    }
  }
  
  async loadAgents() {
    try {
      const [myAgents, friends, browse] = await Promise.all([
        this.api('/agents/my-agents'),
        this.api('/agents/my-friends'),
        this.api('/agents/browse-agents')
      ]);
      
      this.renderAgentList(this.myAgentsList, myAgents, 'my');
      this.renderAgentList(this.myFriendsList, friends, 'friend');
      this.renderAgentList(this.browseAgentsList, browse, 'browse');
    } catch (err) {
      console.error('加载 Agent 失败:', err);
    }
  }
  
  renderAgentList(container, agents, type) {
    container.innerHTML = '';
    
    if (agents.length === 0) {
      container.innerHTML = '<li style="padding:10px;text-align:center;color:var(--text-muted);font-size:13px">暂无</li>';
      return;
    }
    
    agents.forEach(agent => {
      const li = document.createElement('li');
      li.className = 'agent-item';
      
      if (type === 'my') {
        li.innerHTML = `
          <div class="name">${this.escapeHtml(agent.name)}</div>
          <div class="owner">${this.escapeHtml(agent.personality || '性格鲜明')}</div>
        `;
      } else if (type === 'friend') {
        li.innerHTML = `
          <div class="name">${this.escapeHtml(agent.name)}</div>
          <div class="owner"> owner: ${this.escapeHtml(agent.owner_name)}</div>
        `;
        li.addEventListener('click', () => this.startAgentChat(agent));
      } else {
        li.innerHTML = `
          <div class="name">${this.escapeHtml(agent.name)}</div>
          <div class="owner">by ${this.escapeHtml(agent.owner_name)}</div>
          <button class="btn-friend" data-id="${agent.id}" data-agent-id="${agent.id}">交友</button>
        `;
        const btn = li.querySelector('.btn-friend');
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.friendWithAgent(agent.id);
        });
      }
      
      container.appendChild(li);
    });
  }
  
  async friendWithAgent(agentId) {
    const myAgent = await this.api('/agents/my-agents');
    if (myAgent.length === 0) {
      this.showToast('请先创建你的 Agent', 'warning');
      return;
    }
    
    try {
      const result = await this.api(`/agents/${agentId}/friend`, 'POST', { agentId: myAgent[0].id });
      this.showToast(result.message || '交友成功！', 'success');
      this.loadAgents();
    } catch (err) {
      this.showToast(err.message || '交友失败', 'error');
    }
  }
  
  startAgentChat(agent) {
    this.currentAgentChat = agent;
    this.agentChatTitle.textContent = agent.name;
    this.showView('agent-chat');
    this.loadAgentChatHistory(agent.id);
  }
  
  async loadAgentChatHistory(agentId) {
    try {
      const myAgents = await this.api('/agents/my-agents');
      const history = await this.api(`/agents/${agentId}/history`, 'POST', { myAgentId: myAgents[0]?.id });
      
      this.agentChatMessages.innerHTML = '';
      history.forEach(conv => {
        this.agentChatMessages.appendChild(this.createMessageElement(conv.message, 'user'));
        this.agentChatMessages.appendChild(this.createMessageElement(conv.reply, 'agent'));
      });
      this.agentChatMessages.scrollTop = this.agentChatMessages.scrollHeight;
    } catch (err) {
      console.error('加载历史失败:', err);
    }
  }
  
  async sendAgentMessage() {
    if (!this.currentAgentChat || this.isSending) return;
    
    const input = document.getElementById('agent-chat-input');
    const message = input.value.trim();
    if (!message) return;
    
    this.isSending = true;
    this.agentSendBtn.disabled = true;
    
    this.agentChatMessages.appendChild(this.createMessageElement(message, 'user'));
    input.value = '';
    input.style.height = 'auto';
    
    try {
      const myAgents = await this.api('/agents/my-agents');
      const result = await this.api(`/agents/${this.currentAgentChat.id}/chat`, 'POST', {
        myAgentId: myAgents[0]?.id,
        message
      });
      
      this.agentChatMessages.appendChild(this.createMessageElement(result.reply, 'agent'));
      this.agentChatMessages.scrollTop = this.agentChatMessages.scrollHeight;
    } catch (err) {
      this.showToast('发送失败', 'error');
    } finally {
      this.isSending = false;
      this.agentSendBtn.disabled = false;
    }
  }
  
  showCreateAgentModal() {
    this.modalContent.innerHTML = `
      <h3>创建 Agent</h3>
      <div class="form-group">
        <label>Agent 名称</label>
        <input type="text" id="agent-name" placeholder="给 Agent 取个名字">
      </div>
      <div class="form-group">
        <label>性格描述</label>
        <input type="text" id="agent-personality" placeholder="例如：活泼开朗、温柔体贴">
      </div>
      <div class="form-group">
        <label>系统提示词（可选）</label>
        <textarea id="agent-system-prompt" placeholder="可以设置 Agent 的行为规则..." rows="3"></textarea>
      </div>
      <div class="modal-btns">
        <button class="btn btn-secondary" onclick="app.hideModal()">取消</button>
        <button class="btn btn-primary" onclick="app.createAgent()">创建</button>
      </div>
    `;
    this.modalOverlay.style.display = 'flex';
  }
  
  async createAgent() {
    const name = document.getElementById('agent-name').value.trim();
    const personality = document.getElementById('agent-personality').value.trim();
    const systemPrompt = document.getElementById('agent-system-prompt').value.trim();
    
    if (!name) {
      this.showToast('请输入 Agent 名称', 'error');
      return;
    }
    
    try {
      await this.api('/agents/agents', 'POST', { name, personality, system_prompt: systemPrompt });
      this.hideModal();
      this.loadAgents();
      this.showToast('Agent 创建成功！', 'success');
    } catch (err) {
      this.showToast('创建失败', 'error');
    }
  }
  
  async checkVIPStatus() {
    try {
      const status = await this.api('/vip/status');
      const vipEl = document.getElementById('settings-vip');
      if (status.is_vip) {
        vipEl.innerHTML = `<span class="vip-badge">VIP (${status.days_remaining}天)</span>`;
      }
    } catch (err) {
      console.error('获取 VIP 状态失败:', err);
    }
  }
  
  async activateVIP(plan) {
    try {
      const result = await this.api('/vip/activate', 'POST', { plan });
      this.showToast(result.message, 'success');
      this.checkVIPStatus();
    } catch (err) {
      this.showToast(err.message || '开通失败', 'error');
    }
  }
  
  async loadAdminData() {
    try {
      const [users, vipUsers] = await Promise.all([
        this.api('/admin/users'),
        this.api('/admin/vip-users')
      ]);
      
      this.renderUsersTable(users);
      this.renderVipTable(vipUsers);
      this.showView('admin');
    } catch (err) {
      this.showToast('加载数据失败', 'error');
    }
  }
  
  renderUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';
    
    users.forEach(user => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user.id}</td>
        <td>${this.escapeHtml(user.username)}</td>
        <td>${user.phone || user.email || '-'}</td>
        <td>${user.role === 'admin' ? '管理员' : '普通用户'}</td>
        <td>${user.is_vip ? '<span class="vip-badge">VIP</span>' : '-'}</td>
        <td>${new Date(user.created_at).toLocaleDateString('zh-CN')}</td>
        <td class="action-btns">
          <button class="btn-sm btn-delete" data-id="${user.id}" data-type="user">删除</button>
        </td>
      `;
      tbody.appendChild(tr);
      
      tr.querySelector('.btn-delete').addEventListener('click', () => this.deleteUser(user.id));
    });
  }
  
  renderVipTable(vipUsers) {
    const tbody = document.getElementById('vip-table-body');
    tbody.innerHTML = '';
    
    vipUsers.forEach(user => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user.id}</td>
        <td>${this.escapeHtml(user.username)}</td>
        <td>${user.phone || user.email || '-'}</td>
        <td>${user.vip_expires_at ? new Date(user.vip_expires_at * 1000).toLocaleDateString('zh-CN') : '-'}</td>
        <td class="action-btns">
          <button class="btn-sm btn-vip-toggle" data-id="${user.id}">取消VIP</button>
        </td>
      `;
      tbody.appendChild(tr);
      
      tr.querySelector('.btn-vip-toggle').addEventListener('click', () => this.toggleVIP(user.id, false));
    });
  }
  
  async deleteUser(id) {
    if (!confirm('确定要删除这个用户吗？')) return;
    
    try {
      await this.api(`/admin/users/${id}`, 'DELETE');
      this.loadAdminData();
      this.showToast('用户已删除', 'success');
    } catch (err) {
      this.showToast(err.message || '删除失败', 'error');
    }
  }
  
  async toggleVIP(userId, isActive) {
    try {
      await this.api(`/admin/users/${userId}/vip`, 'PUT', { is_vip: isActive, days: isActive ? 30 : null });
      this.loadAdminData();
      this.showToast(isActive ? '已设置为 VIP' : '已取消 VIP', 'success');
    } catch (err) {
      this.showToast('操作失败', 'error');
    }
  }
  
  showAddUserModal() {
    this.modalContent.innerHTML = `
      <h3>添加新用户</h3>
      <div class="form-group">
        <label>用户名</label>
        <input type="text" id="new-username" placeholder="请输入用户名">
      </div>
      <div class="form-group">
        <label>密码</label>
        <input type="password" id="new-password" placeholder="请输入密码">
      </div>
      <div class="form-group">
        <label>手机号（可选）</label>
        <input type="tel" id="new-phone" placeholder="请输入手机号">
      </div>
      <div class="form-group">
        <label>邮箱（可选）</label>
        <input type="email" id="new-email" placeholder="请输入邮箱">
      </div>
      <div class="modal-btns">
        <button class="btn btn-secondary" onclick="app.hideModal()">取消</button>
        <button class="btn btn-primary" onclick="app.addUser()">添加</button>
      </div>
    `;
    this.modalOverlay.style.display = 'flex';
  }
  
  async addUser() {
    const username = document.getElementById('new-username').value.trim();
    const password = document.getElementById('new-password').value;
    const phone = document.getElementById('new-phone').value.trim();
    const email = document.getElementById('new-email').value.trim();
    
    if (!username || !password) {
      this.showToast('用户名和密码不能为空', 'error');
      return;
    }
    
    try {
      await this.api('/admin/users', 'POST', { username, password, phone: phone || null, email: email || null });
      this.hideModal();
      this.loadAdminData();
      this.showToast('用户添加成功', 'success');
    } catch (err) {
      this.showToast(err.message || '添加失败', 'error');
    }
  }
  
  switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(`admin-${tab}`).classList.add('active');
  }
  
  showSettings() {
    this.updateUserInfo();
    this.showView('settings');
  }
  
  async changePassword() {
    const oldPassword = document.getElementById('old-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (!oldPassword || !newPassword || !confirmPassword) {
      this.showToast('请填写完整信息', 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      this.showToast('两次输入的新密码不一致', 'error');
      return;
    }
    
    if (newPassword.length < 6) {
      this.showToast('新密码至少6位', 'error');
      return;
    }
    
    try {
      await this.api('/auth/password', 'PUT', { oldPassword, newPassword });
      this.showToast('密码修改成功', 'success');
      document.getElementById('change-password-form').reset();
    } catch (err) {
      this.showToast(err.message || '修改失败', 'error');
    }
  }
  
  async logout() {
    try {
      await this.api('/auth/logout', 'POST');
    } catch (err) {
      console.error('注销请求失败:', err);
    }
    
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    this.showPage('auth');
    this.showToast('已退出登录', 'success');
  }
  
  async confirmDeleteAccount() {
    if (!confirm('确定要注销账号吗？此操作不可恢复！')) return;
    if (!confirm('再次确认：注销后将清除所有数据！')) return;
    
    try {
      await this.api('/auth/logout', 'POST');
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      this.showPage('auth');
      this.showToast('账号已注销', 'success');
    } catch (err) {
      this.showToast('注销失败', 'error');
    }
  }
  
  hideModal() {
    this.modalOverlay.style.display = 'none';
  }
  
  showToast(message, type = 'success') {
    this.toast.textContent = message;
    this.toast.className = `toast ${type}`;
    this.toast.style.display = 'block';
    
    setTimeout(() => {
      this.toast.style.display = 'none';
    }, 3000);
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  async api(endpoint, method = 'GET', data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || '请求失败');
    }
    
    return result;
  }
}

// 初始化应用
const app = new XiaolongxiaApp();

// 自动调整 textarea 高度
document.getElementById('chat-input')?.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

document.getElementById('agent-chat-input')?.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});
=======
// 小龙虾 App - 主应用逻辑

const API_BASE = '/api';

class XiaolongxiaApp {
  constructor() {
    this.user = null;
    this.token = localStorage.getItem('token');
    this.currentConversationId = null;
    this.currentAgentChat = null;
    this.isSending = false;
    
    this.init();
  }
  
  init() {
    this.cacheElements();
    this.bindEvents();
    this.checkAuth();
  }
  
  cacheElements() {
    // 页面
    this.pages = {
      auth: document.getElementById('auth-page'),
      main: document.getElementById('main-page')
    };
    
    // 认证
    this.authTabs = document.querySelectorAll('.auth-tabs .tab');
    this.authForms = document.querySelectorAll('.auth-form');
    this.methodTabs = document.querySelectorAll('.method-tab');
    this.registerMethods = document.querySelectorAll('.register-method');
    
    // 主页面
    this.sidebar = document.getElementById('sidebar');
    this.menuToggle = document.getElementById('menu-toggle');
    this.views = document.querySelectorAll('.view');
    
    // 侧边栏标签
    this.sidebarTabs = document.querySelectorAll('.sidebar-tab');
    this.panels = document.querySelectorAll('.panel');
    
    // 对话
    this.conversationList = document.getElementById('conversation-list');
    this.chatTitle = document.getElementById('chat-title');
    this.chatMessages = document.getElementById('chat-messages');
    this.chatInput = document.getElementById('chat-input');
    this.sendBtn = document.getElementById('send-btn');
    
    // Agent
    this.agentChatView = document.getElementById('agent-chat-view');
    this.agentChatMessages = document.getElementById('agent-chat-messages');
    this.agentChatInput = document.getElementById('chat-input');
    this.agentSendBtn = document.getElementById('agent-send-btn');
    this.agentChatTitle = document.getElementById('agent-chat-title');
    this.myAgentsList = document.getElementById('my-agents-list');
    this.myFriendsList = document.getElementById('my-friends-list');
    this.browseAgentsList = document.getElementById('browse-agents-list');
    
    // VIP
    this.vipBtn = document.getElementById('vip-btn');
    this.vipStatus = document.getElementById('vip-status');
    
    // 用户菜单
    this.userMenuBtn = document.getElementById('user-menu-btn');
    
    // 弹窗
    this.modalOverlay = document.getElementById('modal-overlay');
    this.modalContent = document.getElementById('modal-content');
    
    // Toast
    this.toast = document.getElementById('toast');
  }
  
  bindEvents() {
    // 认证标签切换
    this.authTabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchAuthTab(tab.dataset.tab));
    });
    
    // 注册方式切换
    this.methodTabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchRegisterMethod(tab.dataset.method));
    });
    
    // 登录表单
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.login();
    });
    
    // 注册表单
    document.getElementById('register-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.register();
    });
    
    // 发送验证码
    document.getElementById('send-phone-code').addEventListener('click', () => {
      this.sendCode('phone');
    });
    document.getElementById('send-email-code').addEventListener('click', () => {
      this.sendCode('email');
    });
    
    // 侧边栏菜单
    this.menuToggle.addEventListener('click', () => {
      this.sidebar.classList.toggle('open');
    });
    
    // 新对话
    document.getElementById('new-chat-btn').addEventListener('click', () => {
      this.createNewConversation();
    });
    
    // 侧边栏标签
    this.sidebarTabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchSidebarTab(tab.dataset.tab));
    });
    
    // 发送消息
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // Agent 聊天发送
    this.agentSendBtn.addEventListener('click', () => this.sendAgentMessage());
    document.getElementById('agent-chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendAgentMessage();
      }
    });
    
    // 返回按钮
    document.getElementById('back-to-agents').addEventListener('click', () => {
      this.showView('chat');
    });
    
    // VIP 按钮
    this.vipBtn.addEventListener('click', () => this.showView('vip'));
    
    // 用户菜单
    this.userMenuBtn.addEventListener('click', () => this.showSettings());
    
    // 创建 Agent 按钮
    document.getElementById('create-agent-btn').addEventListener('click', () => {
      this.showCreateAgentModal();
    });
    
    // 添加用户按钮
    document.getElementById('add-user-btn').addEventListener('click', () => {
      this.showAddUserModal();
    });
    
    // 管理员标签
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchAdminTab(e.target.dataset.tab));
    });
    
    // 修改密码
    document.getElementById('change-password-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.changePassword();
    });
    
    // 退出登录
    document.getElementById('logout-btn').addEventListener('click', () => {
      this.logout();
    });
    
    // 注销账号
    document.getElementById('delete-account-btn').addEventListener('click', () => {
      this.confirmDeleteAccount();
    });
    
    // 关闭弹窗
    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) {
        this.hideModal();
      }
    });
  }
  
  async checkAuth() {
    if (!this.token) {
      this.showPage('auth');
      return;
    }
    
    try {
      const user = await this.api('/auth/me');
      this.user = user;
      this.showPage('main');
      this.updateUserInfo();
      this.loadConversations();
      this.loadAgents();
      this.checkVIPStatus();
    } catch (err) {
      this.logout();
    }
  }
  
  showPage(page) {
    Object.values(this.pages).forEach(p => p.classList.remove('active'));
    this.pages[page].classList.add('active');
  }
  
  async login() {
    const account = document.getElementById('login-account').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!account || !password) {
      this.showToast('请填写完整信息', 'error');
      return;
    }
    
    try {
      const data = await this.api('/auth/login', 'POST', { account, password });
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('token', this.token);
      this.showPage('main');
      this.updateUserInfo();
      this.loadConversations();
      this.loadAgents();
      this.checkVIPStatus();
      this.showToast('登录成功！', 'success');
    } catch (err) {
      this.showToast(err.message || '登录失败', 'error');
    }
  }
  
  async register() {
    const method = document.querySelector('.method-tab.active').dataset.method;
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    
    if (!username || !password) {
      this.showToast('请填写完整信息', 'error');
      return;
    }
    
    try {
      let data;
      if (method === 'phone') {
        const phone = document.getElementById('reg-phone').value.trim();
        const code = document.getElementById('reg-phone-code').value.trim();
        data = await this.api('/auth/register/phone', 'POST', { phone, username, password, code });
      } else {
        const email = document.getElementById('reg-email').value.trim();
        const code = document.getElementById('reg-email-code').value.trim();
        data = await this.api('/auth/register/email', 'POST', { email, username, password, code });
      }
      
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('token', this.token);
      this.showPage('main');
      this.updateUserInfo();
      this.loadConversations();
      this.loadAgents();
      this.showToast('注册成功！', 'success');
    } catch (err) {
      this.showToast(err.message || '注册失败', 'error');
    }
  }
  
  async sendCode(type) {
    const input = document.getElementById(`${type}-code`);
    const value = input.value.trim();
    
    if (!value) {
      this.showToast('请先输入手机号/邮箱', 'warning');
      return;
    }
    
    // 模拟发送验证码（实际项目应调用短信/邮件服务）
    this.showToast(`${type === 'phone' ? '短信' : '邮箱'}验证码已发送`, 'success');
    
    // 倒计时
    let seconds = 60;
    const btn = document.getElementById(`send-${type}-code`);
    btn.disabled = true;
    btn.textContent = `${seconds}秒后重发`;
    
    const timer = setInterval(() => {
      seconds--;
      btn.textContent = `${seconds}秒后重发`;
      if (seconds <= 0) {
        clearInterval(timer);
        btn.disabled = false;
        btn.textContent = '获取验证码';
      }
    }, 1000);
  }
  
  switchAuthTab(tab) {
    this.authTabs.forEach(t => t.classList.remove('active'));
    this.authForms.forEach(f => f.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(`${tab}-form`).classList.add('active');
  }
  
  switchRegisterMethod(method) {
    this.methodTabs.forEach(t => t.classList.remove('active'));
    this.registerMethods.forEach(m => m.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(`${method}-register`).classList.add('active');
  }
  
  switchSidebarTab(tab) {
    this.sidebarTabs.forEach(t => t.classList.remove('active'));
    this.panels.forEach(p => p.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(`${tab}-panel`).classList.add('active');
  }
  
  async loadConversations() {
    try {
      const conversations = await this.api('/conversations/conversations');
      this.renderConversationList(conversations);
    } catch (err) {
      console.error('加载对话失败:', err);
    }
  }
  
  renderConversationList(conversations) {
    this.conversationList.innerHTML = '';
    
    if (conversations.length === 0) {
      this.conversationList.innerHTML = '<li style="padding:20px;text-align:center;color:var(--text-muted)">暂无对话记录</li>';
      return;
    }
    
    conversations.forEach(conv => {
      const li = document.createElement('li');
      li.className = 'conversation-item';
      li.innerHTML = `
        <span class="title">${this.escapeHtml(conv.title)}</span>
        <button class="delete-btn" data-id="${conv.id}"><i class="fas fa-trash"></i></button>
      `;
      li.addEventListener('click', (e) => {
        if (!e.target.closest('.delete-btn')) {
          this.selectConversation(conv.id, conv.title);
        }
      });
      
      const deleteBtn = li.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', () => this.deleteConversation(conv.id));
      
      this.conversationList.appendChild(li);
    });
  }
  
  async createNewConversation() {
    try {
      const conv = await this.api('/conversations/conversations', 'POST', { title: '新对话' });
      this.selectConversation(conv.id, conv.title);
      await this.loadConversations();
    } catch (err) {
      this.showToast('创建对话失败', 'error');
    }
  }
  
  selectConversation(id, title) {
    this.currentConversationId = id;
    this.chatTitle.textContent = title;
    this.showView('chat');
    this.loadMessages(id);
    
    // 高亮当前对话
    document.querySelectorAll('.conversation-item').forEach(item => {
      item.classList.remove('active');
    });
    const activeItem = [...this.conversationList.children].find(li => 
      li.querySelector('.delete-btn')?.dataset.id == id
    );
    if (activeItem) activeItem.classList.add('active');
  }
  
  async loadMessages(conversationId) {
    try {
      const messages = await this.api(`/conversations/${conversationId}/messages`);
      this.renderMessages(messages);
    } catch (err) {
      this.showToast('加载消息失败', 'error');
    }
  }
  
  renderMessages(messages) {
    this.chatMessages.innerHTML = '';
    
    if (messages.length === 0) {
      this.chatMessages.innerHTML = `
        <div class="welcome-message">
          <p>👋 你好！我是小龙虾 AI 助手</p>
          <p>有什么我可以帮助你的吗？</p>
        </div>
      `;
      return;
    }
    
    messages.forEach(msg => {
      const div = document.createElement('div');
      div.className = `message ${msg.role}`;
      div.textContent = msg.content;
      this.chatMessages.appendChild(div);
    });
    
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }
  
  async sendMessage() {
    if (this.isSending || !this.currentConversationId) return;
    
    const content = this.chatInput.value.trim();
    if (!content) return;
    
    this.isSending = true;
    this.sendBtn.disabled = true;
    this.sendBtn.innerHTML = '<span class="loading"></span>';
    
    // 添加用户消息
    this.chatMessages.appendChild(this.createMessageElement(content, 'user'));
    this.chatInput.value = '';
    this.chatInput.style.height = 'auto';
    
    try {
      const response = await this.api(`/conversations/${this.currentConversationId}/messages`, 'POST', { content });
      this.renderMessages([response]);
    } catch (err) {
      this.chatMessages.appendChild(this.createMessageElement('发送失败，请重试', 'system'));
      this.showToast('发送消息失败', 'error');
    } finally {
      this.isSending = false;
      this.sendBtn.disabled = false;
      this.sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 发送';
    }
  }
  
  createMessageElement(content, role) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    div.textContent = content;
    return div;
  }
  
  async deleteConversation(id) {
    if (!confirm('确定要删除这条对话吗？')) return;
    
    try {
      await this.api(`/conversations/${id}`, 'DELETE');
      await this.loadConversations();
      if (this.currentConversationId == id) {
        this.currentConversationId = null;
        this.chatTitle.textContent = '新对话';
        this.chatMessages.innerHTML = `
          <div class="welcome-message">
            <p>👋 你好！我是小龙虾 AI 助手</p>
            <p>有什么我可以帮助你的吗？</p>
          </div>
        `;
      }
      this.showToast('对话已删除', 'success');
    } catch (err) {
      this.showToast('删除失败', 'error');
    }
  }
  
  async showView(viewName) {
    this.views.forEach(v => v.classList.remove('active'));
    
    const viewMap = {
      'chat': 'chat-view',
      'agent-chat': 'agent-chat-view',
      'vip': 'vip-view',
      'admin': 'admin-view',
      'settings': 'settings-view'
    };
    
    document.getElementById(viewMap[viewName]).classList.add('active');
    
    // 关闭移动端侧边栏
    this.sidebar.classList.remove('open');
  }
  
  updateUserInfo() {
    if (!this.user) return;
    
    // 更新设置页面
    document.getElementById('settings-username').textContent = this.user.username;
    document.getElementById('settings-role').textContent = this.user.role === 'admin' ? '管理员' : '普通用户';
    
    // VIP 状态
    const vipEl = document.getElementById('settings-vip');
    const now = Math.floor(Date.now() / 1000);
    if (this.user.is_vip && this.user.vip_expires_at > now) {
      const days = Math.ceil((this.user.vip_expires_at - now) / 86400);
      vipEl.innerHTML = `<span class="vip-badge">VIP (${days}天)</span>`;
    } else {
      vipEl.textContent = '非 VIP';
    }
    
    // 管理员显示后台入口
    const adminBtn = document.getElementById('admin-btn');
    if (this.user.role === 'admin') {
      if (!adminBtn) {
        const nav = document.querySelector('.topbar-right');
        const btn = document.createElement('button');
        btn.id = 'admin-btn';
        btn.className = 'btn-icon';
        btn.innerHTML = '<i class="fas fa-cog"></i>';
        btn.title = '管理后台';
        btn.addEventListener('click', () => this.loadAdminData());
        nav.appendChild(btn);
      }
    } else {
      const btn = document.getElementById('admin-btn');
      if (btn) btn.remove();
    }
  }
  
  async loadAgents() {
    try {
      const [myAgents, friends, browse] = await Promise.all([
        this.api('/agents/my-agents'),
        this.api('/agents/my-friends'),
        this.api('/agents/browse-agents')
      ]);
      
      this.renderAgentList(this.myAgentsList, myAgents, 'my');
      this.renderAgentList(this.myFriendsList, friends, 'friend');
      this.renderAgentList(this.browseAgentsList, browse, 'browse');
    } catch (err) {
      console.error('加载 Agent 失败:', err);
    }
  }
  
  renderAgentList(container, agents, type) {
    container.innerHTML = '';
    
    if (agents.length === 0) {
      container.innerHTML = '<li style="padding:10px;text-align:center;color:var(--text-muted);font-size:13px">暂无</li>';
      return;
    }
    
    agents.forEach(agent => {
      const li = document.createElement('li');
      li.className = 'agent-item';
      
      if (type === 'my') {
        li.innerHTML = `
          <div class="name">${this.escapeHtml(agent.name)}</div>
          <div class="owner">${this.escapeHtml(agent.personality || '性格鲜明')}</div>
        `;
      } else if (type === 'friend') {
        li.innerHTML = `
          <div class="name">${this.escapeHtml(agent.name)}</div>
          <div class="owner"> owner: ${this.escapeHtml(agent.owner_name)}</div>
        `;
        li.addEventListener('click', () => this.startAgentChat(agent));
      } else {
        li.innerHTML = `
          <div class="name">${this.escapeHtml(agent.name)}</div>
          <div class="owner">by ${this.escapeHtml(agent.owner_name)}</div>
          <button class="btn-friend" data-id="${agent.id}" data-agent-id="${agent.id}">交友</button>
        `;
        const btn = li.querySelector('.btn-friend');
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.friendWithAgent(agent.id);
        });
      }
      
      container.appendChild(li);
    });
  }
  
  async friendWithAgent(agentId) {
    const myAgent = await this.api('/agents/my-agents');
    if (myAgent.length === 0) {
      this.showToast('请先创建你的 Agent', 'warning');
      return;
    }
    
    try {
      const result = await this.api(`/agents/${agentId}/friend`, 'POST', { agentId: myAgent[0].id });
      this.showToast(result.message || '交友成功！', 'success');
      this.loadAgents();
    } catch (err) {
      this.showToast(err.message || '交友失败', 'error');
    }
  }
  
  startAgentChat(agent) {
    this.currentAgentChat = agent;
    this.agentChatTitle.textContent = agent.name;
    this.showView('agent-chat');
    this.loadAgentChatHistory(agent.id);
  }
  
  async loadAgentChatHistory(agentId) {
    try {
      const myAgents = await this.api('/agents/my-agents');
      const history = await this.api(`/agents/${agentId}/history`, 'POST', { myAgentId: myAgents[0]?.id });
      
      this.agentChatMessages.innerHTML = '';
      history.forEach(conv => {
        this.agentChatMessages.appendChild(this.createMessageElement(conv.message, 'user'));
        this.agentChatMessages.appendChild(this.createMessageElement(conv.reply, 'agent'));
      });
      this.agentChatMessages.scrollTop = this.agentChatMessages.scrollHeight;
    } catch (err) {
      console.error('加载历史失败:', err);
    }
  }
  
  async sendAgentMessage() {
    if (!this.currentAgentChat || this.isSending) return;
    
    const input = document.getElementById('agent-chat-input');
    const message = input.value.trim();
    if (!message) return;
    
    this.isSending = true;
    this.agentSendBtn.disabled = true;
    
    this.agentChatMessages.appendChild(this.createMessageElement(message, 'user'));
    input.value = '';
    input.style.height = 'auto';
    
    try {
      const myAgents = await this.api('/agents/my-agents');
      const result = await this.api(`/agents/${this.currentAgentChat.id}/chat`, 'POST', {
        myAgentId: myAgents[0]?.id,
        message
      });
      
      this.agentChatMessages.appendChild(this.createMessageElement(result.reply, 'agent'));
      this.agentChatMessages.scrollTop = this.agentChatMessages.scrollHeight;
    } catch (err) {
      this.showToast('发送失败', 'error');
    } finally {
      this.isSending = false;
      this.agentSendBtn.disabled = false;
    }
  }
  
  showCreateAgentModal() {
    this.modalContent.innerHTML = `
      <h3>创建 Agent</h3>
      <div class="form-group">
        <label>Agent 名称</label>
        <input type="text" id="agent-name" placeholder="给 Agent 取个名字">
      </div>
      <div class="form-group">
        <label>性格描述</label>
        <input type="text" id="agent-personality" placeholder="例如：活泼开朗、温柔体贴">
      </div>
      <div class="form-group">
        <label>系统提示词（可选）</label>
        <textarea id="agent-system-prompt" placeholder="可以设置 Agent 的行为规则..." rows="3"></textarea>
      </div>
      <div class="modal-btns">
        <button class="btn btn-secondary" onclick="app.hideModal()">取消</button>
        <button class="btn btn-primary" onclick="app.createAgent()">创建</button>
      </div>
    `;
    this.modalOverlay.style.display = 'flex';
  }
  
  async createAgent() {
    const name = document.getElementById('agent-name').value.trim();
    const personality = document.getElementById('agent-personality').value.trim();
    const systemPrompt = document.getElementById('agent-system-prompt').value.trim();
    
    if (!name) {
      this.showToast('请输入 Agent 名称', 'error');
      return;
    }
    
    try {
      await this.api('/agents/agents', 'POST', { name, personality, system_prompt: systemPrompt });
      this.hideModal();
      this.loadAgents();
      this.showToast('Agent 创建成功！', 'success');
    } catch (err) {
      this.showToast('创建失败', 'error');
    }
  }
  
  async checkVIPStatus() {
    try {
      const status = await this.api('/vip/status');
      const vipEl = document.getElementById('settings-vip');
      if (status.is_vip) {
        vipEl.innerHTML = `<span class="vip-badge">VIP (${status.days_remaining}天)</span>`;
      }
    } catch (err) {
      console.error('获取 VIP 状态失败:', err);
    }
  }
  
  async activateVIP(plan) {
    try {
      const result = await this.api('/vip/activate', 'POST', { plan });
      this.showToast(result.message, 'success');
      this.checkVIPStatus();
    } catch (err) {
      this.showToast(err.message || '开通失败', 'error');
    }
  }
  
  async loadAdminData() {
    try {
      const [users, vipUsers] = await Promise.all([
        this.api('/admin/users'),
        this.api('/admin/vip-users')
      ]);
      
      this.renderUsersTable(users);
      this.renderVipTable(vipUsers);
      this.showView('admin');
    } catch (err) {
      this.showToast('加载数据失败', 'error');
    }
  }
  
  renderUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';
    
    users.forEach(user => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user.id}</td>
        <td>${this.escapeHtml(user.username)}</td>
        <td>${user.phone || user.email || '-'}</td>
        <td>${user.role === 'admin' ? '管理员' : '普通用户'}</td>
        <td>${user.is_vip ? '<span class="vip-badge">VIP</span>' : '-'}</td>
        <td>${new Date(user.created_at).toLocaleDateString('zh-CN')}</td>
        <td class="action-btns">
          <button class="btn-sm btn-delete" data-id="${user.id}" data-type="user">删除</button>
        </td>
      `;
      tbody.appendChild(tr);
      
      tr.querySelector('.btn-delete').addEventListener('click', () => this.deleteUser(user.id));
    });
  }
  
  renderVipTable(vipUsers) {
    const tbody = document.getElementById('vip-table-body');
    tbody.innerHTML = '';
    
    vipUsers.forEach(user => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user.id}</td>
        <td>${this.escapeHtml(user.username)}</td>
        <td>${user.phone || user.email || '-'}</td>
        <td>${user.vip_expires_at ? new Date(user.vip_expires_at * 1000).toLocaleDateString('zh-CN') : '-'}</td>
        <td class="action-btns">
          <button class="btn-sm btn-vip-toggle" data-id="${user.id}">取消VIP</button>
        </td>
      `;
      tbody.appendChild(tr);
      
      tr.querySelector('.btn-vip-toggle').addEventListener('click', () => this.toggleVIP(user.id, false));
    });
  }
  
  async deleteUser(id) {
    if (!confirm('确定要删除这个用户吗？')) return;
    
    try {
      await this.api(`/admin/users/${id}`, 'DELETE');
      this.loadAdminData();
      this.showToast('用户已删除', 'success');
    } catch (err) {
      this.showToast(err.message || '删除失败', 'error');
    }
  }
  
  async toggleVIP(userId, isActive) {
    try {
      await this.api(`/admin/users/${userId}/vip`, 'PUT', { is_vip: isActive, days: isActive ? 30 : null });
      this.loadAdminData();
      this.showToast(isActive ? '已设置为 VIP' : '已取消 VIP', 'success');
    } catch (err) {
      this.showToast('操作失败', 'error');
    }
  }
  
  showAddUserModal() {
    this.modalContent.innerHTML = `
      <h3>添加新用户</h3>
      <div class="form-group">
        <label>用户名</label>
        <input type="text" id="new-username" placeholder="请输入用户名">
      </div>
      <div class="form-group">
        <label>密码</label>
        <input type="password" id="new-password" placeholder="请输入密码">
      </div>
      <div class="form-group">
        <label>手机号（可选）</label>
        <input type="tel" id="new-phone" placeholder="请输入手机号">
      </div>
      <div class="form-group">
        <label>邮箱（可选）</label>
        <input type="email" id="new-email" placeholder="请输入邮箱">
      </div>
      <div class="modal-btns">
        <button class="btn btn-secondary" onclick="app.hideModal()">取消</button>
        <button class="btn btn-primary" onclick="app.addUser()">添加</button>
      </div>
    `;
    this.modalOverlay.style.display = 'flex';
  }
  
  async addUser() {
    const username = document.getElementById('new-username').value.trim();
    const password = document.getElementById('new-password').value;
    const phone = document.getElementById('new-phone').value.trim();
    const email = document.getElementById('new-email').value.trim();
    
    if (!username || !password) {
      this.showToast('用户名和密码不能为空', 'error');
      return;
    }
    
    try {
      await this.api('/admin/users', 'POST', { username, password, phone: phone || null, email: email || null });
      this.hideModal();
      this.loadAdminData();
      this.showToast('用户添加成功', 'success');
    } catch (err) {
      this.showToast(err.message || '添加失败', 'error');
    }
  }
  
  switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(`admin-${tab}`).classList.add('active');
  }
  
  showSettings() {
    this.updateUserInfo();
    this.showView('settings');
  }
  
  async changePassword() {
    const oldPassword = document.getElementById('old-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (!oldPassword || !newPassword || !confirmPassword) {
      this.showToast('请填写完整信息', 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      this.showToast('两次输入的新密码不一致', 'error');
      return;
    }
    
    if (newPassword.length < 6) {
      this.showToast('新密码至少6位', 'error');
      return;
    }
    
    try {
      await this.api('/auth/password', 'PUT', { oldPassword, newPassword });
      this.showToast('密码修改成功', 'success');
      document.getElementById('change-password-form').reset();
    } catch (err) {
      this.showToast(err.message || '修改失败', 'error');
    }
  }
  
  async logout() {
    try {
      await this.api('/auth/logout', 'POST');
    } catch (err) {
      console.error('注销请求失败:', err);
    }
    
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    this.showPage('auth');
    this.showToast('已退出登录', 'success');
  }
  
  async confirmDeleteAccount() {
    if (!confirm('确定要注销账号吗？此操作不可恢复！')) return;
    if (!confirm('再次确认：注销后将清除所有数据！')) return;
    
    try {
      await this.api('/auth/logout', 'POST');
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      this.showPage('auth');
      this.showToast('账号已注销', 'success');
    } catch (err) {
      this.showToast('注销失败', 'error');
    }
  }
  
  hideModal() {
    this.modalOverlay.style.display = 'none';
  }
  
  showToast(message, type = 'success') {
    this.toast.textContent = message;
    this.toast.className = `toast ${type}`;
    this.toast.style.display = 'block';
    
    setTimeout(() => {
      this.toast.style.display = 'none';
    }, 3000);
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  async api(endpoint, method = 'GET', data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || '请求失败');
    }
    
    return result;
  }
}

// 初始化应用
const app = new XiaolongxiaApp();

// 自动调整 textarea 高度
document.getElementById('chat-input')?.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

document.getElementById('agent-chat-input')?.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});
>>>>>>> d807a816869d7e93a701b255dedc332d525cf07e

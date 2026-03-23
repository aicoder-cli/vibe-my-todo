// Vibe My Todo - Chrome Extension Popup App

const API_BASE_URL = 'http://localhost:8080/api';
const STORAGE_KEYS = {
  USER: 'user',
  TODOS: 'todos',
  SYNC_QUEUE: 'syncQueue',
  LAST_SYNC_TIME: 'lastSyncTime',
  IS_ONLINE: 'isOnline'
};

const SYNC_STATUS = {
  SYNCED: 'synced',
  PENDING: 'pending',
  CONFLICT: 'conflict'
};

// Utility functions
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Storage Service
const storage = {
  get(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (result) => resolve(result));
    });
  },
  
  set(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, () => resolve());
    });
  },

  async getUser() {
    const result = await this.get([STORAGE_KEYS.USER]);
    return result[STORAGE_KEYS.USER] || null;
  },

  async setUser(user) {
    await this.set({ [STORAGE_KEYS.USER]: user });
  },

  async removeUser() {
    await this.set({ [STORAGE_KEYS.USER]: null });
  },

  async getTodos() {
    const result = await this.get([STORAGE_KEYS.TODOS]);
    return result[STORAGE_KEYS.TODOS] || [];
  },

  async setTodos(todos) {
    await this.set({ [STORAGE_KEYS.TODOS]: todos });
  },

  async addTodo(todo) {
    const todos = await this.getTodos();
    todos.unshift(todo);
    await this.setTodos(todos);
    return todo;
  },

  async updateTodo(id, updates) {
    const todos = await this.getTodos();
    const index = todos.findIndex(t => t.id === id);
    if (index !== -1) {
      todos[index] = { ...todos[index], ...updates, updatedAt: new Date().toISOString() };
      await this.setTodos(todos);
      return todos[index];
    }
    return null;
  },

  async deleteTodo(id) {
    const todos = await this.getTodos();
    const filtered = todos.filter(t => t.id !== id);
    await this.setTodos(filtered);
  },

  async getSyncQueue() {
    const result = await this.get([STORAGE_KEYS.SYNC_QUEUE]);
    return result[STORAGE_KEYS.SYNC_QUEUE] || [];
  },

  async addToSyncQueue(action) {
    const queue = await this.getSyncQueue();
    const item = { id: generateUUID(), timestamp: new Date().toISOString(), ...action };
    queue.push(item);
    await this.set({ [STORAGE_KEYS.SYNC_QUEUE]: queue });
    return item;
  },

  async removeFromSyncQueue(id) {
    const queue = await this.getSyncQueue();
    const filtered = queue.filter(item => item.id !== id);
    await this.set({ [STORAGE_KEYS.SYNC_QUEUE]: filtered });
  }
};

// API Service
async function getToken() {
  const user = await storage.getUser();
  return user?.token || null;
}

async function apiRequest(endpoint, options = {}) {
  const token = await getToken();
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    if (!response.ok) throw { status: response.status, ...data };
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

const api = {
  async register(username, email, password) {
    return apiRequest('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) });
  },
  async login(email, password) {
    return apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  },
  async getTodos(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/todos?${queryString}` : '/todos';
    return apiRequest(endpoint, { method: 'GET' });
  },
  async createTodo(todoData) {
    return apiRequest('/todos', { method: 'POST', body: JSON.stringify(todoData) });
  },
  async updateTodo(id, todoData) {
    return apiRequest(`/todos/${id}`, { method: 'PUT', body: JSON.stringify(todoData) });
  },
  async deleteTodo(id) {
    return apiRequest(`/todos/${id}`, { method: 'DELETE' });
  },
  async checkConnection() {
    try {
      await fetch(API_BASE_URL + '/auth/me', { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      return true;
    } catch { return false; }
  }
};

// Sync Engine
async function syncEngine() {
  const isOnline = await api.checkConnection();
  await storage.set({ [STORAGE_KEYS.IS_ONLINE]: isOnline });
  
  if (!isOnline) return;

  try {
    const queue = await storage.getSyncQueue();
    const todos = await storage.getTodos();
    
    for (const item of queue) {
      try {
        if (item.action === 'create') {
          const localTodo = todos.find(t => t.id === item.todoId);
          if (localTodo?.remoteId) continue;
          const response = await api.createTodo(item.data);
          if (response.success && response.data) {
            await storage.updateTodo(item.todoId, { remoteId: response.data.id, syncStatus: SYNC_STATUS.SYNCED });
          }
        } else if (item.action === 'update') {
          const todo = todos.find(t => t.id === item.todoId);
          if (todo?.remoteId) {
            await api.updateTodo(todo.remoteId, item.data);
            await storage.updateTodo(item.todoId, { syncStatus: SYNC_STATUS.SYNCED });
          }
        } else if (item.action === 'delete') {
          const todo = todos.find(t => t.id === item.todoId);
          if (todo?.remoteId) await api.deleteTodo(todo.remoteId);
        }
        await storage.removeFromSyncQueue(item.id);
      } catch (e) {
        console.error('Sync item error:', e);
      }
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
  
  await updateBadge();
}

// Update Badge
async function updateBadge() {
  const todos = await storage.getTodos();
  const incomplete = todos.filter(t => !t.completed).length;
  await chrome.action.setBadgeText({ text: incomplete > 0 ? String(incomplete) : '' });
}

// App State
let state = {
  user: null,
  todos: [],
  filter: 'all',
  selectedCategory: 'all',
  isOnline: true,
  view: 'list'
};

// Render Functions
function render() {
  const app = document.getElementById('app');
  
  if (!state.user) {
    app.innerHTML = renderAuth();
    setupAuthListeners();
  } else {
    app.innerHTML = renderMain();
    setupMainListeners();
  }
}

function renderAuth() {
  return `
    <div class="auth-container">
      <div class="auth-header">
        <h2>${state.view === 'login' ? '登录' : '注册'}</h2>
      </div>
      <form id="auth-form" class="auth-form">
        <div id="error-message" class="error-message" style="display:none"></div>
        ${state.view === 'register' ? `
          <div class="form-group">
            <input type="text" id="username" placeholder="用户名" required minlength="3">
          </div>
        ` : ''}
        <div class="form-group">
          <input type="email" id="email" placeholder="邮箱" required>
        </div>
        <div class="form-group">
          <input type="password" id="password" placeholder="密码" required minlength="6">
        </div>
        ${state.view === 'register' ? `
          <div class="form-group">
            <input type="password" id="confirm-password" placeholder="确认密码" required>
          </div>
        ` : ''}
        <button type="submit" class="auth-btn" id="auth-btn">
          ${state.view === 'login' ? '登录' : '注册'}
        </button>
      </form>
      <p class="auth-link">
        ${state.view === 'login' ? '还没有账号？ ' : '已有账号？ '}
        <button class="link-btn" id="switch-view">
          ${state.view === 'login' ? '立即注册' : '立即登录'}
        </button>
      </p>
      ${!state.isOnline ? '<div class="offline-banner">当前离线模式</div>' : ''}
    </div>
  `;
}

function renderMain() {
  const filteredTodos = state.todos.filter(todo => {
    if (state.filter === 'active' && todo.completed) return false;
    if (state.filter === 'completed' && !todo.completed) return false;
    if (state.selectedCategory !== 'all' && todo.category !== state.selectedCategory) return false;
    return true;
  });

  const categories = [...new Set(state.todos.map(t => t.category))];
  const stats = {
    total: state.todos.length,
    active: state.todos.filter(t => !t.completed).length,
    completed: state.todos.filter(t => t.completed).length
  };

  return `
    <header class="header">
      <div class="header-top">
        <h1>待办事项</h1>
        <button class="logout-btn" id="logout-btn">退出</button>
      </div>
      <div class="user-info">
        <span>👤 ${state.user.username}</span>
        ${!state.isOnline ? '<span class="offline-tag">离线</span>' : ''}
      </div>
      <div class="stats">
        <span>总计: ${stats.total}</span>
        <span>未完成: ${stats.active}</span>
        <span>已完成: ${stats.completed}</span>
      </div>
    </header>

    <form class="todo-form" id="todo-form">
      <input type="text" id="todo-input" class="todo-input" placeholder="添加待办..." required>
      <select id="todo-category" class="category-select">
        <option value="工作">工作</option>
        <option value="学习">学习</option>
        <option value="生活">生活</option>
        <option value="其他">其他</option>
      </select>
      <select id="todo-priority" class="priority-select">
        <option value="low">低</option>
        <option value="medium" selected>中</option>
        <option value="high">高</option>
      </select>
      <button type="submit" class="add-btn">+</button>
    </form>

    ${state.todos.length > 0 ? `
      <div class="filter-bar">
        <div class="filter-group">
          <button class="filter-btn ${state.filter === 'all' ? 'active' : ''}" data-filter="all">全部</button>
          <button class="filter-btn ${state.filter === 'active' ? 'active' : ''}" data-filter="active">未完成</button>
          <button class="filter-btn ${state.filter === 'completed' ? 'active' : ''}" data-filter="completed">已完成</button>
        </div>
        <select id="category-filter" class="category-filter">
          <option value="all">全部分类</option>
          ${categories.map(cat => `<option value="${cat}" ${state.selectedCategory === cat ? 'selected' : ''}>${cat}</option>`).join('')}
        </select>
      </div>
    ` : ''}

    <div class="todo-list">
      ${filteredTodos.length === 0 ? `
        <div class="empty-state">
          <p>暂无待办，快去添加一个吧！</p>
        </div>
      ` : filteredTodos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
          <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
          <div class="todo-content">
            <span class="todo-text">${todo.text}</span>
            <div class="todo-meta">
              <span class="todo-category" style="background-color: ${getCategoryColor(todo.category)}">${todo.category}</span>
              <span class="todo-priority" style="background-color: ${getPriorityColor(todo.priority)}">${getPriorityLabel(todo.priority)}</span>
              ${todo.syncStatus === 'pending' ? '<span class="sync-pending">⏳</span>' : ''}
            </div>
          </div>
          <button class="delete-btn">×</button>
        </div>
      `).join('')}
    </div>
  `;
}

function getCategoryColor(category) {
  const colors = { '工作': '#4CAF50', '学习': '#2196F3', '生活': '#FF9800', '其他': '#9C27B0' };
  return colors[category] || '#9C27B0';
}

function getPriorityColor(priority) {
  const colors = { 'low': '#8BC34A', 'medium': '#FFC107', 'high': '#F44336' };
  return colors[priority] || '#FFC107';
}

function getPriorityLabel(priority) {
  const labels = { 'low': '低', 'medium': '中', 'high': '高' };
  return labels[priority] || '中';
}

// Event Listeners
function setupAuthListeners() {
  document.getElementById('auth-form').addEventListener('submit', handleAuthSubmit);
  document.getElementById('switch-view').addEventListener('click', () => {
    state.view = state.view === 'login' ? 'register' : 'login';
    render();
  });
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('error-message');
  const btn = document.getElementById('auth-btn');
  
  errorEl.style.display = 'none';
  btn.disabled = true;
  btn.textContent = state.view === 'login' ? '登录中...' : '注册中...';

  try {
    let response;
    if (state.view === 'login') {
      response = await api.login(email, password);
    } else {
      const username = document.getElementById('username').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      if (password !== confirmPassword) throw { message: '两次密码不一致' };
      response = await api.register(username, email, password);
    }

    if (response.success) {
      const { access_token, user } = response.data;
      await storage.setUser({ ...user, token: access_token });
      state.user = { ...user, token: access_token };
      await loadTodos();
      render();
    } else {
      errorEl.textContent = response.message || '操作失败';
      errorEl.style.display = 'block';
    }
  } catch (err) {
    errorEl.textContent = err.message || '操作失败，请检查网络';
    errorEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = state.view === 'login' ? '登录' : '注册';
  }
}

function setupMainListeners() {
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('todo-form').addEventListener('submit', handleAddTodo);
  
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.filter = btn.dataset.filter;
      render();
    });
  });

  document.getElementById('category-filter')?.addEventListener('change', (e) => {
    state.selectedCategory = e.target.value;
    render();
  });

  document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', async (e) => {
      const id = e.target.closest('.todo-item').dataset.id;
      await handleToggleComplete(id);
    });
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.closest('.todo-item').dataset.id;
      await handleDeleteTodo(id);
    });
  });
}

async function handleLogout() {
  await storage.removeUser();
  await storage.setTodos([]);
  state.user = null;
  state.todos = [];
  render();
}

async function handleAddTodo(e) {
  e.preventDefault();
  const input = document.getElementById('todo-input');
  const category = document.getElementById('todo-category').value;
  const priority = document.getElementById('todo-priority').value;
  
  const todo = {
    id: generateUUID(),
    remoteId: null,
    text: input.value.trim(),
    category,
    priority,
    dueDate: null,
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: SYNC_STATUS.PENDING
  };

  await storage.addTodo(todo);
  await storage.addToSyncQueue({ action: 'create', todoId: todo.id, data: todo });
  state.todos.unshift(todo);
  input.value = '';
  
  await syncEngine();
  render();
}

async function handleToggleComplete(id) {
  const todo = state.todos.find(t => t.id === id);
  if (todo) {
    const completed = !todo.completed;
    await storage.updateTodo(id, { completed, syncStatus: SYNC_STATUS.PENDING });
    await storage.addToSyncQueue({ action: 'update', todoId: id, data: { completed } });
    todo.completed = completed;
    
    await syncEngine();
    render();
  }
}

async function handleDeleteTodo(id) {
  await storage.deleteTodo(id);
  await storage.addToSyncQueue({ action: 'delete', todoId: id, data: {} });
  state.todos = state.todos.filter(t => t.id !== id);
  
  await syncEngine();
  render();
}

async function loadTodos() {
  state.todos = await storage.getTodos();
}

// Initialize
async function init() {
  state.isOnline = await api.checkConnection();
  const user = await storage.getUser();
  if (user?.token) {
    state.user = user;
    await loadTodos();
  }
  await updateBadge();
  render();
}

init();

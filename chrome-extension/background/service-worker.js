// Service Worker - 后台服务脚本

const API_BASE_URL = 'http://localhost:8080/api';

// 存储服务
const storage = {
  async get(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (result) => resolve(result));
    });
  },
  
  async set(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, () => resolve());
    });
  },

  async getUser() {
    const result = await this.get(['user']);
    return result.user || null;
  },

  async getTodos() {
    const result = await this.get(['todos']);
    return result.todos || [];
  }
};

// 检查网络连接
async function checkOnline() {
  try {
    const response = await fetch(API_BASE_URL + '/auth/me', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch {
    return false;
  }
}

// 更新 Badge
async function updateBadge() {
  const todos = await storage.getTodos();
  const incomplete = todos.filter(t => !t.completed).length;
  
  await chrome.action.setBadgeText({
    text: incomplete > 0 ? String(incomplete) : ''
  });
  
  await chrome.action.setBadgeBackgroundColor({
    color: '#4CAF50'
  });
}

// 同步数据
async function syncData() {
  const isOnline = await checkOnline();
  
  await chrome.storage.local.set({ isOnline });
  
  if (!isOnline) {
    console.log('当前离线，延迟同步');
    return;
  }

  const user = await storage.getUser();
  if (!user?.token) {
    console.log('用户未登录，跳过同步');
    return;
  }

  console.log('开始同步数据...');
  // 触发 popup 中的同步（通过消息传递）
  chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' });
}

// 监听网络状态变化
chrome.runtime.onStartup.addListener(async () => {
  console.log('插件启动');
  await updateBadge();
  await syncData();
});

// 定期同步（每 5 分钟）
chrome.alarms.create('sync', {
  periodInMinutes: 5
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'sync') {
    await syncData();
  }
});

// 监听快捷键
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'add-todo') {
    // 打开插件弹窗
    await chrome.action.openPopup();
  }
});

// 监听安装/更新
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('插件首次安装');
  } else if (details.reason === 'update') {
    console.log('插件更新');
  }
  
  await updateBadge();
});

// 监听存储变化
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === 'local' && changes.todos) {
    await updateBadge();
  }
});

console.log('Service Worker 已启动');

// Chrome Storage Service - 本地数据存储服务

const STORAGE_KEYS = {
  USER: 'user',
  TODOS: 'todos',
  SYNC_QUEUE: 'syncQueue',
  LAST_SYNC_TIME: 'lastSyncTime',
  IS_ONLINE: 'isOnline',
  SETTINGS: 'settings'
};

// 生成 UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 存储服务类
class StorageService {
  constructor() {
    this.isChrome = typeof chrome !== 'undefined' && chrome.storage;
  }

  // 获取存储数据
  async get(keys) {
    return new Promise((resolve, reject) => {
      if (this.isChrome) {
        chrome.storage.local.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result);
          }
        });
      } else {
        // 开发环境 fallback
        const result = {};
        keys.forEach(key => {
          const data = localStorage.getItem(key);
          result[key] = data ? JSON.parse(data) : null;
        });
        resolve(result);
      }
    });
  }

  // 设置存储数据
  async set(data) {
    return new Promise((resolve, reject) => {
      if (this.isChrome) {
        chrome.storage.local.set(data, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      } else {
        // 开发环境 fallback
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value));
        });
        resolve();
      }
    });
  }

  // 删除存储数据
  async remove(keys) {
    return new Promise((resolve, reject) => {
      if (this.isChrome) {
        chrome.storage.local.remove(keys, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      } else {
        keys.forEach(key => localStorage.removeItem(key));
        resolve();
      }
    });
  }

  // 清除所有数据
  async clear() {
    return new Promise((resolve, reject) => {
      if (this.isChrome) {
        chrome.storage.local.clear(() => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      } else {
        localStorage.clear();
        resolve();
      }
    });
  }

  // 用户相关
  async getUser() {
    const result = await this.get([STORAGE_KEYS.USER]);
    return result[STORAGE_KEYS.USER] || null;
  }

  async setUser(user) {
    await this.set({ [STORAGE_KEYS.USER]: user });
  }

  async removeUser() {
    await this.remove([STORAGE_KEYS.USER]);
  }

  // 待办相关
  async getTodos() {
    const result = await this.get([STORAGE_KEYS.TODOS]);
    return result[STORAGE_KEYS.TODOS] || [];
  }

  async setTodos(todos) {
    await this.set({ [STORAGE_KEYS.TODOS]: todos });
  }

  async addTodo(todo) {
    const todos = await this.getTodos();
    todos.unshift(todo);
    await this.setTodos(todos);
    return todo;
  }

  async updateTodo(id, updates) {
    const todos = await this.getTodos();
    const index = todos.findIndex(t => t.id === id);
    if (index !== -1) {
      todos[index] = { ...todos[index], ...updates, updatedAt: new Date().toISOString() };
      await this.setTodos(todos);
      return todos[index];
    }
    return null;
  }

  async deleteTodo(id) {
    const todos = await this.getTodos();
    const filtered = todos.filter(t => t.id !== id);
    await this.setTodos(filtered);
  }

  // 同步队列相关
  async getSyncQueue() {
    const result = await this.get([STORAGE_KEYS.SYNC_QUEUE]);
    return result[STORAGE_KEYS.SYNC_QUEUE] || [];
  }

  async addToSyncQueue(action) {
    const queue = await this.getSyncQueue();
    const item = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      ...action
    };
    queue.push(item);
    await this.set({ [STORAGE_KEYS.SYNC_QUEUE]: queue });
    return item;
  }

  async removeFromSyncQueue(id) {
    const queue = await this.getSyncQueue();
    const filtered = queue.filter(item => item.id !== id);
    await this.set({ [STORAGE_KEYS.SYNC_QUEUE]: filtered });
  }

  async clearSyncQueue() {
    await this.set({ [STORAGE_KEYS.SYNC_QUEUE]: [] });
  }

  // 最后同步时间
  async getLastSyncTime() {
    const result = await this.get([STORAGE_KEYS.LAST_SYNC_TIME]);
    return result[STORAGE_KEYS.LAST_SYNC_TIME] || null;
  }

  async setLastSyncTime(time) {
    await this.set({ [STORAGE_KEYS.LAST_SYNC_TIME]: time });
  }

  // 在线状态
  async getOnlineStatus() {
    const result = await this.get([STORAGE_KEYS.IS_ONLINE]);
    return result[STORAGE_KEYS.IS_ONLINE] ?? true;
  }

  async setOnlineStatus(isOnline) {
    await this.set({ [STORAGE_KEYS.IS_ONLINE]: isOnline });
  }
}

export const storageService = new StorageService();
export default storageService;

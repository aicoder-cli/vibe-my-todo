// Sync Engine - 离线同步引擎

import storageService from '../services/storage.js';
import apiService from '../services/api.js';

const SYNC_STATUS = {
  SYNCED: 'synced',
  PENDING: 'pending',
  CONFLICT: 'conflict'
};

class SyncEngine {
  constructor() {
    this.isSyncing = false;
    this.listeners = [];
  }

  // 添加同步监听器
  addListener(callback) {
    this.listeners.push(callback);
  }

  // 通知监听器
  notifyListeners(event, data) {
    this.listeners.forEach(callback => callback(event, data));
  }

  // 检查网络状态
  async checkOnline() {
    const isOnline = await apiService.checkConnection();
    await storageService.setOnlineStatus(isOnline);
    return isOnline;
  }

  // 生成 UUID
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // 创建待办（本地 + 队列）
  async createTodoLocal(todoData) {
    const todo = {
      id: this.generateUUID(),
      remoteId: null,
      text: todoData.text,
      category: todoData.category || '其他',
      priority: todoData.priority || 'medium',
      dueDate: todoData.dueDate || null,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: SYNC_STATUS.PENDING
    };

    // 保存到本地
    await storageService.addTodo(todo);

    // 加入同步队列
    await storageService.addToSyncQueue({
      action: 'create',
      todoId: todo.id,
      data: todo
    });

    // 尝试同步
    const isOnline = await this.checkOnline();
    if (isOnline) {
      await this.sync();
    }

    // 更新 Badge
    await this.updateBadge();

    return todo;
  }

  // 更新待办（本地 + 队列）
  async updateTodoLocal(id, updates) {
    const todo = await storageService.updateTodo(id, {
      ...updates,
      syncStatus: SYNC_STATUS.PENDING,
      updatedAt: new Date().toISOString()
    });

    if (!todo) return null;

    // 加入同步队列
    await storageService.addToSyncQueue({
      action: 'update',
      todoId: id,
      data: updates
    });

    // 尝试同步
    const isOnline = await this.checkOnline();
    if (isOnline) {
      await this.sync();
    }

    // 更新 Badge
    await this.updateBadge();

    return todo;
  }

  // 删除待办（本地 + 队列）
  async deleteTodoLocal(id) {
    await storageService.deleteTodo(id);

    // 加入同步队列
    await storageService.addToSyncQueue({
      action: 'delete',
      todoId: id,
      data: {}
    });

    // 尝试同步
    const isOnline = await this.checkOnline();
    if (isOnline) {
      await this.sync();
    }

    // 更新 Badge
    await this.updateBadge();
  }

  // 同步核心逻辑
  async sync() {
    if (this.isSyncing) return;
    
    const isOnline = await this.checkOnline();
    if (!isOnline) {
      this.notifyListeners('offline', { message: '当前离线' });
      return;
    }

    this.isSyncing = true;
    this.notifyListeners('sync:start', {});

    try {
      // 1. 处理同步队列
      await this.processSyncQueue();

      // 2. 拉取远程数据
      await this.pullRemoteTodos();

      // 3. 更新最后同步时间
      await storageService.setLastSyncTime(new Date().toISOString());

      this.notifyListeners('sync:complete', {});
    } catch (error) {
      console.error('Sync error:', error);
      this.notifyListeners('sync:error', { error });
    } finally {
      this.isSyncing = false;
    }
  }

  // 处理同步队列
  async processSyncQueue() {
    const queue = await storageService.getSyncQueue();
    
    for (const item of queue) {
      try {
        switch (item.action) {
          case 'create':
            // 如果有 remoteId，说明已同步，跳过
            const todos = await storageService.getTodos();
            const localTodo = todos.find(t => t.id === item.todoId);
            if (localTodo?.remoteId) continue;
            
            const response = await apiService.createTodo(item.data);
            if (response.success && response.data) {
              // 更新本地数据的 remoteId
              await storageService.updateTodo(item.todoId, {
                remoteId: response.data.id,
                syncStatus: SYNC_STATUS.SYNCED
              });
            }
            break;

          case 'update':
            const todos2 = await storageService.getTodos();
            const todo2 = todos2.find(t => t.id === item.todoId);
            if (todo2?.remoteId) {
              await apiService.updateTodo(todo2.remoteId, item.data);
              await storageService.updateTodo(item.todoId, {
                syncStatus: SYNC_STATUS.SYNCED
              });
            }
            break;

          case 'delete':
            const todos3 = await storageService.getTodos();
            const todo3 = todos3.find(t => t.id === item.todoId);
            if (todo3?.remoteId) {
              await apiService.deleteTodo(todo3.remoteId);
            }
            break;
        }
        
        // 处理成功，移除队列
        await storageService.removeFromSyncQueue(item.id);
      } catch (error) {
        console.error('Sync queue item error:', error);
        
        // 如果是 404，说明远程已删除，移除队列
        if (error.status === 404) {
          await storageService.removeFromQueue(item.id);
        }
        
        // 如果是 409 冲突，标记为冲突
        if (error.status === 409) {
          await storageService.updateTodo(item.todoId, {
            syncStatus: SYNC_STATUS.CONFLICT
          });
        }
      }
    }
  }

  // 拉取远程数据
  async pullRemoteTodos() {
    try {
      const response = await apiService.getTodos();
      if (response.success && response.data) {
        const remoteTodos = response.data.map(todo => ({
          ...todo,
          id: this.generateUUID(),
          remoteId: todo.id,
          syncStatus: SYNC_STATUS.SYNCED
        }));
        
        // 获取本地数据
        const localTodos = await storageService.getTodos();
        
        // 合并：远程数据 + 本地未同步的创建
        const syncedTodos = remoteTodos;
        const pendingCreates = localTodos.filter(t => 
          t.syncStatus === SYNC_STATUS.PENDING && !t.remoteId
        );
        
        const allTodos = [...syncedTodos, ...pendingCreates];
        await storageService.setTodos(allTodos);
      }
    } catch (error) {
      console.error('Pull remote todos error:', error);
    }
  }

  // 更新 Badge（显示未完成数量）
  async updateBadge() {
    const todos = await storageService.getTodos();
    const incomplete = todos.filter(t => !t.completed).length;
    
    if (typeof chrome !== 'undefined' && chrome.action) {
      await chrome.action.setBadgeText({
        text: incomplete > 0 ? String(incomplete) : ''
      });
    }
  }

  // 初始化
  async init() {
    await this.checkOnline();
    await this.updateBadge();
  }
}

export const syncEngine = new SyncEngine();
export default syncEngine;

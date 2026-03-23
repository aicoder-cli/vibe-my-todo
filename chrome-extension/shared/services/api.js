// API Service - 与后端通信服务

const API_BASE_URL = 'http://localhost:8080/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // 获取 token
  getToken() {
    return new Promise(async (resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['user']);
        resolve(result.user?.token || null);
      } else {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        resolve(user.token || null);
      }
    });
  }

  // 发起请求
  async request(endpoint, options = {}) {
    const token = await this.getToken();
    const url = `${this.baseURL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw { status: response.status, ...data };
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // 认证相关
  async register(username, email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
  }

  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async getMe() {
    return this.request('/auth/me', {
      method: 'GET'
    });
  }

  // 待办相关
  async getTodos(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/todos?${queryString}` : '/todos';
    return this.request(endpoint, {
      method: 'GET'
    });
  }

  async createTodo(todoData) {
    return this.request('/todos', {
      method: 'POST',
      body: JSON.stringify(todoData)
    });
  }

  async updateTodo(id, todoData) {
    return this.request(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(todoData)
    });
  }

  async deleteTodo(id) {
    return this.request(`/todos/${id}`, {
      method: 'DELETE'
    });
  }

  // 检查网络连接
  async checkConnection() {
    try {
      await fetch(this.baseURL + '/auth/me', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return true;
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiService();
export default apiService;

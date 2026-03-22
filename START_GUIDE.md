# Vibe My Todo - 本地启动指南

## 前置要求

- Go 1.24+
- Node.js 20+
- PostgreSQL 16+
- (可选) Docker

---

## 方式一：使用 Docker（最简单）

### 1. 安装 Docker Desktop
下载并安装：https://www.docker.com/products/docker-desktop/

### 2. 启动所有服务
```bash
cd /Users/huhu/workspace/vibe
cp .env.example .env
docker-compose up -d
```

### 3. 访问应用
- 前端：http://localhost:3000
- 后端 API：http://localhost:8080
- Swagger 文档：http://localhost:8080/swagger/index.html

---

## 方式二：本地开发环境

### 1. 安装 PostgreSQL

#### 使用 Homebrew
```bash
# 先接受 Xcode 许可协议
sudo xcodebuild -license accept

# 安装 PostgreSQL
brew install postgresql@16

# 启动 PostgreSQL 服务
brew services start postgresql@16
```

#### 创建数据库和用户
```bash
# 连接到 PostgreSQL
psql postgres

# 在 psql 中执行：
CREATE USER postgres WITH PASSWORD 'postgres';
CREATE DATABASE vibe_todo;
GRANT ALL PRIVILEGES ON DATABASE vibe_todo TO postgres;
\q
```

### 2. 启动后端

```bash
cd /Users/huhu/workspace/vibe/backend

# 复制环境变量文件
cp .env.example .env

# 启动后端服务
go run cmd/server/main.go
```

后端将在 http://localhost:8080 启动

### 3. 启动前端

打开新的终端窗口：
```bash
cd /Users/huhu/workspace/vibe/frontend
npm install
npm run dev
```

前端将在 http://localhost:5173 启动

---

## 访问应用

### 开发环境
- 前端：http://localhost:5173
- 后端 API：http://localhost:8080
- Swagger 文档：http://localhost:8080/swagger/index.html

### Docker 环境
- 前端：http://localhost:3000
- 后端 API：http://localhost:8080
- Swagger 文档：http://localhost:8080/swagger/index.html

---

## 测试流程

1. **注册账号**
   - 访问前端页面
   - 点击「注册」
   - 填写用户名、邮箱、密码
   - 完成注册

2. **登录**
   - 使用注册的邮箱和密码登录

3. **创建待办事项**
   - 输入待办内容
   - 选择分类
   - 选择优先级
   - (可选) 设置截止日期
   - 点击「添加」

4. **使用 Swagger 文档测试 API**
   - 访问 http://localhost:8080/swagger/index.html
   - 使用 `/api/auth/login` 接口获取 token
   - 点击「Authorize」按钮，输入 `Bearer {你的token}`
   - 测试其他 API 接口

---

## 停止服务

### Docker 环境
```bash
cd /Users/huhu/workspace/vibe
docker-compose down
```

### 本地开发
- 前端：在终端按 `Ctrl+C`
- 后端：在终端按 `Ctrl+C`
- PostgreSQL：`brew services stop postgresql@16`

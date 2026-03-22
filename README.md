# Vibe My Todo - 待办事项应用

一个功能完整的待办事项管理应用，包含用户认证、优先级设置、截止日期等功能。

## 技术栈

### 前端
- React 19
- Vite
- React Router
- Axios

### 后端
- Go 1.24
- Gin Web 框架
- GORM (ORM)
- PostgreSQL
- JWT 认证

### 部署
- Docker
- Docker Compose

## 功能特性

- ✅ 用户注册和登录
- ✅ JWT 令牌认证
- ✅ 添加、编辑、删除待办事项
- ✅ 标记待办为已完成
- ✅ 优先级设置（低/中/高）
- ✅ 截止日期设置
- ✅ 任务分类（工作/学习/生活/其他）
- ✅ 按状态和分类筛选
- ✅ 数据持久化到 PostgreSQL
- ✅ Docker 一键部署

## 快速开始

### 使用 Docker Compose（推荐）

1. 克隆项目并进入目录：
```bash
cd /Users/huhu/workspace/vibe
```

2. 复制环境变量文件：
```bash
cp .env.example .env
```

3. 根据需要修改 `.env` 文件中的配置

4. 启动所有服务：
```bash
docker-compose up -d
```

5. 访问应用：
- 前端：http://localhost:3000
- 后端 API：http://localhost:8080
- Swagger API 文档：http://localhost:8080/swagger/index.html

### 本地开发

#### 前置要求
- Go 1.24+
- Node.js 20+
- PostgreSQL 16+

#### 后端设置

1. 进入后端目录：
```bash
cd backend
```

2. 复制环境变量：
```bash
cp .env.example .env
```

3. 修改 `.env` 文件中的数据库连接信息

4. 启动后端：
```bash
go run cmd/server/main.go
```

后端将在 http://localhost:8080 启动

#### 前端设置

1. 进入前端目录：
```bash
cd frontend
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
```

前端将在 http://localhost:5173 启动

## API 文档

### Swagger UI
完整的交互式 API 文档可通过 Swagger UI 访问：
- 本地开发：http://localhost:8080/swagger/index.html
- Docker 部署：http://localhost:8080/swagger/index.html

### 认证端点

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| GET | `/api/auth/me` | 获取当前用户信息 |

### 待办事项端点（需要认证）

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/todos` | 获取待办列表 |
| POST | `/api/todos` | 创建待办 |
| GET | `/api/todos/:id` | 获取单个待办 |
| PUT | `/api/todos/:id` | 更新待办 |
| DELETE | `/api/todos/:id` | 删除待办 |

### 查询参数（GET /api/todos）

- `status`: 筛选状态 - `all` (默认) / `active` / `completed`
- `category`: 筛选分类 - `all` (默认) / `工作` / `学习` / `生活` / `其他`

## 项目结构

```
vibe/
├── frontend/                 # React 前端
│   ├── src/
│   │   ├── components/       # React 组件
│   │   ├── context/          # React Context
│   │   ├── pages/            # 页面组件
│   │   ├── services/         # API 服务
│   │   └── App.jsx
│   └── package.json
│
├── backend/                  # Go 后端
│   ├── cmd/
│   │   └── server/           # 主程序入口
│   ├── internal/
│   │   ├── handlers/         # API 处理器
│   │   ├── middleware/       # 中间件
│   │   ├── models/           # 数据模型
│   │   ├── repository/       # 数据库操作
│   │   └── auth/             # JWT 认证
│   ├── go.mod
│   └── go.sum
│
├── docker/                   # Docker 配置
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml        # Docker Compose 配置
└── .env.example             # 环境变量示例
```

## 数据模型

### User（用户）
```go
{
  id: uint
  username: string
  email: string
  password_hash: string
  created_at: timestamp
  updated_at: timestamp
}
```

### Todo（待办事项）
```go
{
  id: uint
  user_id: uint
  text: string
  category: string
  priority: string (low/medium/high)
  due_date: timestamp (可选)
  completed: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

## 许可证

MIT

# Vibe My Todo - Chrome 浏览器插件

一个功能完整的待办事项管理 Chrome 插件，支持离线使用和数据同步。

## 功能特性

- ✅ 用户登录/注册
- ✅ 待办事项 CRUD 操作
- ✅ 优先级设置（低/中/高）
- ✅ 任务分类（工作/学习/生活/其他）
- ✅ 状态筛选（全部/未完成/已完成）
- ✅ **离线支持** - 无网络时数据存储在本地
- ✅ **智能同步** - 网络恢复后自动同步数据
- ✅ Badge 显示未完成数量

## 安装方法

### 方式一：开发者模式安装（推荐开发测试）

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择 `chrome-extension` 文件夹

### 方式二：打包安装

1. 将 `chrome-extension` 文件夹打包为 `.zip` 文件
2. 打开 `chrome://extensions/`
3. 开启「开发者模式」
4. 点击「打包扩展程序」
5. 选择扩展程序根目录为 `chrome-extension` 文件夹
6. 生成 `.crx` 文件后拖入 Chrome 安装

## 发布到 Chrome Web Store

### 1. 准备材料

- 插件图标（128x128 PNG）
- 商店截图（1280x800 或 640x400 PNG，至少 1 张）
- 推广图（440x280 PNG）
- 开发者账户（$5 注册费）

### 2. 发布流程

1. 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
2. 登录你的 Google 开发者账户
3. 点击「添加新商品」
4. 上传打包好的 `.zip` 文件（小于 100MB）
5. 填写商店信息：
   - 应用名称：Vibe My Todo
   - 描述：功能完整的待办事项管理插件，支持离线使用
   - 类别：工具
6. 上传图标和截图
7. 设置价格（免费）
8. 点击「发布」

## 项目结构

```
chrome-extension/
├── manifest.json           # 插件配置文件
├── _locales/              # 国际化
├── icons/                 # 插件图标
├── background/            # Service Worker
├── popup/                 # 弹出窗口
│   ├── index.html         # 入口 HTML
│   ├── app.js             # 主应用逻辑
│   └── styles.css         # 样式
└── shared/                # 共享服务
    ├── services/          # API 和存储服务
    └── utils/             # 同步引擎
```

## 后端配置

插件默认连接本地后端 `http://localhost:8080/api`

如需修改后端地址，编辑 `popup/app.js` 中的 `API_BASE_URL` 常量。

## 技术实现

### 离线同步策略

1. 所有操作先写入 Chrome 本地存储
2. 同时加入同步队列
3. 网络恢复后自动处理队列
4. 冲突处理：本地优先，标记冲突等待确认

### 数据模型

```javascript
{
  id: string,           // 本地 UUID
  remoteId: number,     // 后端 ID（同步后填充）
  text: string,
  category: string,
  priority: string,     // low/medium/high
  completed: boolean,
  syncStatus: string,   // synced/pending/conflict
  createdAt: string,
  updatedAt: string
}
```

## 快捷键

- `Ctrl+Shift+T` (Mac: `Command+Shift+T`) - 快速打开插件

## 注意事项

1. 首次使用需要后端服务运行在 `http://localhost:8080`
2. 离线时数据存储在 Chrome 本地存储
3. 重新上线后自动同步数据

## 许可证

MIT

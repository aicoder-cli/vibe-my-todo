# GitHub 上传指南

## 步骤 1：在 GitHub 上创建新仓库

1. 访问 https://github.com/new
2. 仓库名称填写：`vibe-my-todo`
3. 选择 Public 或 Private（根据你的需求）
4. **不要**勾选 "Initialize this repository with a README"
5. **不要**勾选 "Add .gitignore"
6. **不要**勾选 "Choose a license"
7. 点击 "Create repository"

## 步骤 2：连接本地仓库到 GitHub

创建仓库后，GitHub 会显示一些命令，按照以下步骤操作：

```bash
cd /Users/huhu/workspace/vibe

# 添加远程仓库（将 YOUR_GITHUB_USERNAME 替换为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/vibe-my-todo.git

# 重命名分支为 main（可选，GitHub 默认使用 main）
git branch -M main

# 推送到 GitHub
git push -u origin main
```

## 步骤 3：验证上传

刷新你的 GitHub 仓库页面，你应该能看到所有代码了！

## 常用 Git 命令

```bash
# 查看状态
git status

# 查看修改
git diff

# 添加文件
git add .

# 提交
git commit -m "你的提交信息"

# 推送到 GitHub
git push

# 拉取最新代码
git pull
```

## 示例（完整流程）

假设你的 GitHub 用户名是 `john-doe`：

```bash
cd /Users/huhu/workspace/vibe
git remote add origin https://github.com/john-doe/vibe-my-todo.git
git branch -M main
git push -u origin main
```

完成！🎉

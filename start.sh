#!/bin/bash

# Vibe My Todo - Docker 启动脚本

echo "🚀 启动 Vibe My Todo..."
echo ""

# 设置 Docker 路径
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker Desktop"
    echo "   打开应用程序文件夹，双击 Docker.app"
    exit 1
fi

echo "✅ Docker 运行正常"
echo ""

# 进入项目目录
cd "$(dirname "$0")"

# 复制环境变量文件
if [ ! -f .env ]; then
    echo "📋 复制环境变量文件..."
    cp .env.example .env
fi

echo "🐳 启动 Docker Compose 服务..."
echo ""

# 启动服务
docker compose up -d

echo ""
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo ""
echo "📊 服务状态："
docker compose ps

echo ""
echo "🎉 启动完成！"
echo ""
echo "📱 访问地址："
echo "   前端：http://localhost:3000"
echo "   后端 API：http://localhost:8080"
echo "   Swagger 文档：http://localhost:8080/swagger/index.html"
echo ""
echo "🛑 停止服务："
echo "   docker compose down"
echo ""

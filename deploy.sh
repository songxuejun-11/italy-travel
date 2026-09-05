#!/bin/bash

# 意大利出行小助手 - 快速部署脚本
# 使用方法：chmod +x deploy.sh && ./deploy.sh

set -e

echo "🇹 意大利出行小助手 - 部署准备"
echo "================================"
echo ""

# 检查必要工具
echo "📋 检查必要工具..."
command -v git >/dev/null 2>&1 || { echo "❌ 需要安装 Git"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ 需要安装 Node.js"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "❌ 需要安装 pnpm"; exit 1; }
echo "✅ 必要工具已安装"
echo ""

# 构建前端
echo " 构建前端..."
cd client
pnpm install
npx expo export --platform web
cd ..
echo "✅ 前端构建完成"
echo ""

# 构建后端
echo "🔨 构建后端..."
cd server
pnpm install
pnpm build
cd ..
echo "✅ 后端构建完成"
echo ""

echo " 构建完成！"
echo ""
echo "📖 下一步："
echo "1. 将代码推送到 GitHub"
echo "   git add ."
echo "   git commit -m '准备部署'"
echo "   git push"
echo ""
echo "2. 部署后端到 Render"
echo "   - 访问 https://render.com"
echo "   - 创建 Web Service，连接 GitHub 仓库"
echo "   - Root Directory: server"
echo "   - Build Command: pnpm install && pnpm build"
echo "   - Start Command: pnpm start"
echo ""
echo "3. 部署前端到 Vercel"
echo "   - 访问 https://vercel.com"
echo "   - 导入 GitHub 仓库"
echo "   - Root Directory: client"
echo "   - 添加环境变量：EXPO_PUBLIC_BACKEND_BASE_URL"
echo ""
echo "📖 详细步骤请查看 DEPLOY.md"

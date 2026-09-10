#!/bin/bash
# 从本机部署到服务器（在本机执行）
# 用法：SERVER_IP=1.2.3.4 ./deploy-to-server.sh
set -e

SERVER_IP="${SERVER_IP:?用法: SERVER_IP=服务器IP ./deploy-to-server.sh}"
SERVER_USER="${SERVER_USER:-root}"
APP_DIR="/opt/italy-travel"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== 构建前端 ==="
cd "$ROOT/client"
pnpm install
# 部署后通过 nginx 反代同域访问，API 走相对路径即可
EXPO_PUBLIC_BACKEND_BASE_URL="" npx expo export --platform web

echo "=== 构建后端 ==="
cd "$ROOT/server"
pnpm install
pnpm build

echo "=== 上传文件到服务器 ==="
ssh "$SERVER_USER@$SERVER_IP" "mkdir -p $APP_DIR"

# 后端（dist + package.json，node_modules 在服务器上装）
rsync -az --delete "$ROOT/server/dist" "$ROOT/server/package.json" "$ROOT/server/tsconfig.json" "$SERVER_USER@$SERVER_IP:$APP_DIR/server/"

# 数据和已上传附件（不删除服务器上已有的运行数据）
rsync -az "$ROOT/server/data/" "$SERVER_USER@$SERVER_IP:$APP_DIR/server/data/"
rsync -az "$ROOT/server/uploads/" "$SERVER_USER@$SERVER_IP:$APP_DIR/server/uploads/" 2>/dev/null || ssh "$SERVER_USER@$SERVER_IP" "mkdir -p $APP_DIR/server/uploads"

# 前端静态产物
rsync -az --delete "$ROOT/client/dist/" "$SERVER_USER@$SERVER_IP:$APP_DIR/client-dist/"

echo "=== 服务器上安装依赖并启动 ==="
ssh "$SERVER_USER@$SERVER_IP" "cd $APP_DIR/server && npm install --omit=dev && pm2 delete italy-server 2>/dev/null; cd $APP_DIR/server && PORT=9091 pm2 start dist/index.js --name italy-server && pm2 save && pm2 restart italy-server --update-env"

echo "=== 部署完成 ==="
echo "访问: http://$SERVER_IP"
echo "数据目录（记得定期备份）: $APP_DIR/server/data"

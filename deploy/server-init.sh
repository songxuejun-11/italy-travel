#!/bin/bash
# 服务器首次初始化脚本（Ubuntu/Debian，root 执行）
# 用法：bash server-init.sh
set -e

echo "=== 意大利出行小助手 - 服务器初始化 ==="

APP_DIR="/opt/italy-travel"

# 1. 系统依赖
echo "[1/6] 安装基础软件..."
apt-get update
apt-get install -y nginx git
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
npm install -g pm2

# 2. 应用目录
echo "[2/6] 创建应用目录..."
mkdir -p "$APP_DIR"

# 3. nginx 配置
echo "[3/6] 配置 nginx..."
cp "$(dirname "$0")/nginx.conf" /etc/nginx/sites-available/italy-travel
ln -sf /etc/nginx/sites-available/italy-travel /etc/nginx/sites-enabled/italy-travel
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 4. pm2 开机自启
echo "[4/6] 配置 pm2..."
pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1 || true

# 5. 防火墙（放行 80 端口）
echo "[5/6] 配置防火墙..."
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH || true
  ufw allow 80/tcp || true
  echo "y" | ufw enable || true
fi

echo "[6/6] 初始化完成！"
echo ""
echo "后续步骤："
echo "1. 在本机执行 ./deploy-to-server.sh 上传代码和数据"
echo "2. 访问 http://<服务器IP> 验证"

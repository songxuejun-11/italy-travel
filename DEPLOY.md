# 意大利出行小助手 - 部署指南

## 项目结构

```
├── client/          # Expo Web 前端
├── server/          # Express.js 后端
└── server/data/     # JSON 数据存储
```

## 部署方案

### 方案一：Vercel (前端) + Render (后端) - 推荐

#### 1. 部署后端到 Render

1. 将代码推送到 GitHub
2. 访问 [Render](https://render.com) 并登录
3. 点击 "New +" → "Web Service"
4. 连接你的 GitHub 仓库
5. 配置：
   - **Name**: italy-travel-backend
   - **Root Directory**: server
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`
   - **Environment Variables**:
     - `NODE_ENV`: `production`
     - `PORT`: `9091`
6. 点击 "Create Web Service"
7. 部署完成后，复制后端 URL（如 `https://italy-travel-backend.onrender.com`）

#### 2. 部署前端到 Vercel

1. 访问 [Vercel](https://vercel.com) 并登录
2. 点击 "Add New..." → "Project"
3. 连接你的 GitHub 仓库
4. 配置：
   - **Framework Preset**: Expo
   - **Root Directory**: client
   - **Build Command**: `npx expo export --platform web`
   - **Output Directory**: dist
5. 添加环境变量：
   - `EXPO_PUBLIC_BACKEND_BASE_URL`: `https://italy-travel-backend.onrender.com`（你的 Render 后端 URL）
6. 点击 "Deploy"

#### 3. 更新前端 API 配置

部署完成后，前端会自动使用 `EXPO_PUBLIC_BACKEND_BASE_URL` 环境变量连接后端。

---

### 方案二：Railway (全栈部署)

1. 访问 [Railway](https://railway.app) 并登录
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 连接你的 GitHub 仓库
4. 添加两个服务：

#### 后端服务
- **Root Directory**: server
- **Build Command**: `pnpm install && pnpm build`
- **Start Command**: `pnpm start`
- **环境变量**: `NODE_ENV=production`, `PORT=9091`

#### 前端服务
- **Root Directory**: client
- **Build Command**: `npx expo export --platform web`
- **环境变量**: `EXPO_PUBLIC_BACKEND_BASE_URL=<后端服务URL>`

---

### 方案三：单服务器部署 (Docker)

#### Dockerfile (根目录)

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY client/package.json client/
COPY server/package.json server/
RUN pnpm install --frozen-lockfile
COPY . .
RUN cd client && npx expo export --platform web
RUN cd server && pnpm build

# 运行阶段
FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/node_modules ./server/node_modules

EXPOSE 9091
CMD ["node", "server/dist/index.js"]
```

---

## 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `EXPO_PUBLIC_BACKEND_BASE_URL` | 后端 API 地址 | `https://italy-travel-backend.onrender.com` |
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 后端端口 | `9091` |

---

## 数据持久化

当前使用 JSON 文件存储数据（`server/data/` 目录）。生产环境建议：

1. **使用数据库**：迁移到 PostgreSQL、MySQL 或 MongoDB
2. **使用对象存储**：将 JSON 文件存储到 S3、OSS 等
3. **使用 Supabase**：项目已集成 Supabase SDK，可直接使用

---

## 部署后检查

1. 访问前端 URL，确认页面正常加载
2. 检查浏览器控制台，确认 API 请求正常
3. 测试核心功能：
   - 查看路书
   - 添加/编辑/删除开销
   - 勾选准备清单
   - 查看景点预定

---

## 常见问题

### Q: 前端访问后端 API 404？
A: 检查 `EXPO_PUBLIC_BACKEND_BASE_URL` 环境变量是否正确配置

### Q: 后端服务休眠？
A: Render 免费版服务会在 15 分钟无请求后休眠，首次访问需要等待 30-60 秒唤醒

### Q: 数据丢失？
A: JSON 文件存储在服务器本地，重启后会丢失。建议迁移到数据库

---

## 快速部署命令

```bash
# 构建前端
cd client && npx expo export --platform web

# 构建后端
cd server && pnpm build

# 本地测试生产构建
cd server && pnpm start
```

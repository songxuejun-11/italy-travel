# 意大利出行小助手 - 快速部署指南

## 部署方案

**前端**：Vercel（免费，全球 CDN）  
**后端**：Render（免费，750 小时/月）

## 快速开始

### 1. 推送代码到 GitHub

```bash
git add .
git commit -m "准备部署"
git push
```

### 2. 部署后端到 Render

1. 访问 https://render.com 注册
2. 点击 "New +" → "Web Service"
3. 连接 GitHub 仓库
4. 配置：
   - **Root Directory**: `server`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`
5. 添加环境变量：
   - `NODE_ENV` = `production`
   - `PORT` = `9091`
6. 点击 "Create Web Service"

部署成功后复制后端 URL，如：`https://italy-travel-backend.onrender.com`

### 3. 部署前端到 Vercel

1. 访问 https://vercel.com 注册
2. 点击 "Add New..." → "Project"
3. 选择 GitHub 仓库
4. 配置：
   - **Root Directory**: `client`
   - **Build Command**: `npx expo export --platform web`
   - **Output Directory**: `dist`
5. 添加环境变量：
   - `EXPO_PUBLIC_BACKEND_BASE_URL` = 你的 Render 后端 URL
6. 点击 "Deploy"

部署成功后获得前端 URL，如：`https://italy-travel.vercel.app`

## 验证部署

1. 打开前端 URL
2. 检查航班信息是否正常显示
3. 检查路书地图是否正常
4. 测试添加/编辑/删除功能

## 免费额度

| 平台 | 免费额度 | 说明 |
|------|----------|------|
| Vercel | 100GB 流量/月 | 足够个人使用 |
| Render | 750 小时/月 | 约 31 天，24 小时运行会超限 |

## 注意事项

- Render 免费服务 15 分钟无访问会休眠，首次访问需等待 30 秒唤醒
- 如需 24 小时运行，建议升级到 Render 付费版（$7/月）
- 数据使用 JSON 文件存储，Render 重启后数据保留

## 详细文档

查看 [DEPLOY.md](./DEPLOY.md) 获取完整部署指南。

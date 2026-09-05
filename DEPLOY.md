# 意大利出行小助手 - 部署指南

## 部署架构

```
前端 (Vercel) ←→ 后端 (Render)
     ↓                ↓
  xxx.vercel.app  xxx.onrender.com
```

## 一、后端部署到 Render

### 1. 注册 Render 账号
访问 https://render.com 注册（支持 GitHub 登录）

### 2. 创建 Web Service
1. 点击 "New +" → "Web Service"
2. 连接你的 GitHub 仓库
3. 配置如下：

| 配置项 | 值 |
|--------|-----|
| Name | italy-travel-backend |
| Region | Oregon (推荐，全球访问快) |
| Branch | main |
| Root Directory | server |
| Runtime | Node |
| Build Command | `pnpm install && pnpm build` |
| Start Command | `pnpm start` |
| Instance Type | Free |

### 3. 添加环境变量
在 Render 控制台 → Environment 添加：

| Key | Value |
|-----|-------|
| NODE_ENV | production |
| PORT | 9091 |

### 4. 部署
点击 "Create Web Service"，等待部署完成。
部署成功后会获得 URL：`https://italy-travel-backend.onrender.com`

---

## 二、前端部署到 Vercel

### 1. 注册 Vercel 账号
访问 https://vercel.com 注册（支持 GitHub 登录）

### 2. 导入项目
1. 点击 "Add New..." → "Project"
2. 选择你的 GitHub 仓库
3. 配置如下：

| 配置项 | 值 |
|--------|-----|
| Framework Preset | Other |
| Root Directory | client |
| Build Command | `npx expo export --platform web` |
| Output Directory | dist |
| Install Command | `pnpm install` |

### 3. 添加环境变量
在 Vercel 控制台 → Settings → Environment Variables 添加：

| Key | Value |
|-----|-------|
| EXPO_PUBLIC_BACKEND_BASE_URL | https://italy-travel-backend.onrender.com |

️ **重要**：将 URL 替换为你实际的 Render 后端 URL

### 4. 部署
点击 "Deploy"，等待部署完成。
部署成功后会获得 URL：`https://your-app.vercel.app`

---

## 三、验证部署

### 1. 检查后端健康状态
```bash
curl https://italy-travel-backend.onrender.com/api/v1/health
```
应返回：`{"status":"ok"}`

### 2. 检查前端访问
在浏览器打开 Vercel 提供的 URL，确认：
- 页面正常加载
- 航班信息显示正常
- 路书地图正常显示
- 可以添加/编辑/删除数据

### 3. 检查国外访问
使用 VPN 或请国外朋友帮忙测试访问速度。

---

## 四、自定义域名（可选）

### Vercel 自定义域名
1. Vercel 控制台 → Settings → Domains
2. 添加你的域名
3. 按提示配置 DNS

### Render 自定义域名
1. Render 控制台 → Settings → Custom Domain
2. 添加你的域名
3. 按提示配置 DNS

---

## 五、注意事项

### 免费额度限制
- **Vercel**：100GB 流量/月，足够个人使用
- **Render**：750 小时/月（约 31 天），如果 24 小时运行会超限
  - 解决方案：设置自动休眠，或升级到 $7/月

### 数据持久化
当前使用 JSON 文件存储，Render 重启后数据会保留（除非重新部署）。
如需更可靠的数据存储，建议后续迁移到 PostgreSQL。

### 环境变量
- 前端环境变量以 `EXPO_PUBLIC_` 开头会暴露给客户端
- 后端环境变量不会暴露给客户端

---

## 六、故障排查

### 前端无法连接后端
1. 检查 Vercel 环境变量 `EXPO_PUBLIC_BACKEND_BASE_URL` 是否正确
2. 检查 Render 后端是否正常运行
3. 检查 CORS 配置（后端已配置允许所有来源）

### 后端部署失败
1. 检查 `server/package.json` 中的依赖是否完整
2. 检查构建日志，确认 `pnpm build` 成功
3. 确认 Node.js 版本兼容（推荐 18+）

### 前端部署失败
1. 检查 `client/package.json` 中的依赖是否完整
2. 确认 `npx expo export --platform web` 命令成功
3. 检查 Metro 配置是否正确

---

## 七、部署后优化

### 性能优化
- 启用 Vercel 的 Edge Cache
- 压缩图片资源
- 使用 CDN 加速静态资源

### 安全优化
- 限制 CORS 允许的来源
- 添加 API 限流
- 使用 HTTPS（已自动启用）

### 监控
- 使用 Vercel Analytics 监控前端性能
- 使用 Render 监控后端健康状态

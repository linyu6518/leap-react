# Vercel 部署修复指南

## 项目信息
- **Vercel 项目名称**: leap-react
- **GitHub 仓库**: https://github.com/linyu6518/leap-react
- **实际项目目录**: `leap-angular/`

## 重要配置步骤

### 方法 1：设置 Root Directory（推荐）

1. 访问 Vercel Dashboard: https://vercel.com/dashboard
2. 选择项目 **leap-react**
3. 进入 **Settings** → **General**
4. 找到 **Root Directory** 设置
5. **设置为**: `leap-angular`
6. 点击 **Save**
7. 触发重新部署（Redeploy）

### 方法 2：使用根目录 vercel.json（已配置）

如果不想设置 Root Directory，根目录的 `vercel.json` 已经配置好：
- 会自动进入 `leap-angular` 目录
- 安装依赖
- 构建项目
- 从 `leap-angular/dist` 输出

## 验证部署

部署成功后检查：
1. ✅ 构建日志显示成功
2. ✅ 访问 URL 能看到登录页面
3. ✅ 没有 404 错误（除了浏览器扩展的错误，可忽略）
4. ✅ 资源文件正常加载

## 如果还有问题

### 检查构建日志
在 Vercel Dashboard → Deployments → 选择最新部署 → 查看 Build Logs

确认：
- Root Directory 是否正确
- 构建命令是否执行：`cd leap-angular && npm install && npm run build`
- 输出目录：`leap-angular/dist`

### 清除缓存
1. 浏览器：硬刷新（Ctrl+Shift+R 或 Cmd+Shift+R）
2. Vercel：在项目设置中清除构建缓存

### 常见问题

**问题**: 404 错误
**解决**: 确认 Root Directory 设置为 `leap-angular` 或使用根目录的 vercel.json

**问题**: 构建失败
**解决**: 检查 Node.js 版本（需要 >= 18.13.0）

**问题**: 资源加载失败
**解决**: 确认 `public` 目录的资源被正确复制到 `dist`

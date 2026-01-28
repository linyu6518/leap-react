# Vercel 部署指南

## 前置要求

1. **Node.js** >= 18.13.0
2. **npm** >= 9.0.0
3. **Vercel 账号**（如果没有，请访问 https://vercel.com 注册）

## 部署步骤

### 方法 1: 使用 Vercel CLI（推荐）

1. **安装 Vercel CLI**（如果尚未安装）：
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**：
   ```bash
   vercel login
   ```

3. **在项目根目录部署**：
   ```bash
   vercel
   ```
   
   首次部署时，Vercel 会询问一些问题：
   - Set up and deploy? **Yes**
   - Which scope? 选择你的账号
   - Link to existing project? **No**（首次部署）
   - What's your project's name? **leap-angular**（或自定义名称）
   - In which directory is your code located? **./**（当前目录）
   - Want to override the settings? **No**（使用 vercel.json 配置）

4. **生产环境部署**：
   ```bash
   vercel --prod
   ```

### 方法 2: 通过 GitHub 集成（推荐用于持续部署）

1. **将代码推送到 GitHub**：
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **在 Vercel 网站操作**：
   - 访问 https://vercel.com
   - 点击 "Add New Project"
   - 导入你的 GitHub 仓库
   - Vercel 会自动检测 Angular 项目并使用 `vercel.json` 配置
   - 点击 "Deploy"

3. **自动部署**：
   - 每次推送到 main 分支时，Vercel 会自动部署
   - 每次创建 Pull Request 时，Vercel 会创建预览部署

## 配置说明

### vercel.json 配置

- **buildCommand**: `npm run build:prod` - 生产环境构建命令
- **outputDirectory**: `dist/leap-angular/browser` - Angular 构建输出目录
- **rewrites**: 所有路由重定向到 `index.html`（支持 Angular 路由）
- **headers**: 静态资源缓存配置

### 环境变量（如需要）

如果应用需要环境变量，可以在 Vercel 项目设置中配置：

1. 访问 Vercel 项目设置
2. 进入 "Environment Variables"
3. 添加所需的环境变量

## 验证部署

部署完成后，访问 Vercel 提供的 URL（例如：`https://your-project.vercel.app`）

## 常见问题

### 1. 路由 404 错误
- 确保 `vercel.json` 中的 `rewrites` 配置正确
- 所有路由都应重定向到 `index.html`

### 2. 构建失败
- 检查 Node.js 版本是否符合要求（>= 18.13.0）
- 确保所有依赖都已正确安装
- 查看 Vercel 构建日志

### 3. API 请求失败
- 检查 `environment.prod.ts` 中的 API URL 配置
- 如果使用相对路径 `/api`，确保后端 API 已配置代理或 CORS

## 更新部署

### 使用 CLI
```bash
vercel --prod
```

### 使用 GitHub 集成
只需推送代码到 GitHub，Vercel 会自动部署。

## 回滚部署

在 Vercel 项目页面：
1. 进入 "Deployments"
2. 找到之前的部署版本
3. 点击 "..." 菜单
4. 选择 "Promote to Production"

# Vercel 部署配置说明

## 重要：Root Directory 设置

由于项目结构是：
```
LEAP React/
  └── leap-angular/  (实际项目目录)
      ├── src/
      ├── package.json
      └── vercel.json
```

**你需要在 Vercel 项目设置中配置 Root Directory：**

### 设置步骤：

1. 访问 Vercel 项目：https://vercel.com/dashboard
2. 选择你的项目
3. 进入 **Settings** → **General**
4. 找到 **Root Directory** 设置
5. 设置为：`leap-angular`
6. 点击 **Save**

### 或者使用根目录的 vercel.json

如果不想设置 Root Directory，我已经在项目根目录创建了 `vercel.json`，它会：
- 自动进入 `leap-angular` 目录
- 安装依赖
- 构建项目
- 从 `leap-angular/dist` 输出

### 验证部署

部署成功后，访问你的 Vercel URL，应该能看到：
- 登录页面正常显示
- 没有 404 错误
- 资源文件正常加载

### 如果还有问题

1. 检查 Vercel 构建日志，确认：
   - Root Directory 是否正确
   - 构建命令是否执行成功
   - 输出目录是否正确

2. 清除浏览器缓存并硬刷新（Ctrl+Shift+R 或 Cmd+Shift+R）

3. 检查控制台错误，确认具体是哪个资源加载失败

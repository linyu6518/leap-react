# 服务器启动诊断指南

## 快速启动步骤

请在终端中执行以下命令：

```bash
# 1. 进入项目目录
cd '/Users/lin/Liquidity Explain & Analytics Platform (LEAP)/leap-angular'

# 2. 检查 Node.js 版本（需要 >= 18.13.0）
node --version

# 3. 检查 npm 版本（需要 >= 9.0.0）
npm --version

# 4. 如果依赖未安装，先安装依赖
npm install

# 5. 停止所有可能运行的服务器
pkill -f "ng serve" || true
pkill -f "node.*4201" || true

# 6. 等待2秒
sleep 2

# 7. 启动服务器（使用4201端口）
npx ng serve --port 4201 --host 0.0.0.0
```

## 常见问题排查

### 1. 如果看到 "Port 4201 is already in use"
```bash
# 查找占用端口的进程
lsof -i :4201
# 或者
lsof -i :4200

# 杀死占用端口的进程（替换PID为实际进程ID）
kill -9 <PID>
```

### 2. 如果看到编译错误
- 检查终端中的红色错误信息
- 确保所有依赖已安装：`npm install`
- 检查 TypeScript 版本：`npx tsc --version`

### 3. 如果服务器启动但无法访问
- 尝试访问：http://127.0.0.1:4201
- 检查防火墙设置
- 确保浏览器没有阻止本地连接

### 4. 如果依赖有问题
```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
```

## 访问地址

服务器启动成功后，访问：
- http://localhost:4201/login
- http://127.0.0.1:4201/login

# 快速启动指南

## 如果服务器打不开，请按以下步骤操作：

### 1. 停止所有正在运行的服务器
```bash
pkill -f "ng serve"
pkill -f "node.*4201"
```

### 2. 清理并重新安装依赖（如果需要）
```bash
cd '/Users/lin/Liquidity Explain & Analytics Platform (LEAP)/leap-angular'
npm install
```

### 3. 启动服务器
```bash
npx ng serve --port 4201 --host 0.0.0.0
```

### 4. 等待编译完成
看到以下消息表示成功：
```
✔ Application bundle generation complete.
Local: http://localhost:4201/
```

### 5. 访问应用
- 登录页面：http://localhost:4201/login
- Dashboard：http://localhost:4201/dashboard（需要先登录）

## 测试账号
- Username: `maker1`, Password: `password`, Key: `test`
- Username: `admin`, Password: `admin`, Key: `test`

## 如果还有问题
请把终端中的完整错误信息发给我。

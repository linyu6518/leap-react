# LEAP 后端部署方案推荐

## 📋 方案概述

基于LEAP作为金融监管平台的特点，推荐采用**渐进式部署策略**：
- **阶段1（立即可用）**：前端独立部署 + Mock数据
- **阶段2（1-2周）**：轻量级后端API + SQLite数据库
- **阶段3（1-2个月）**：完整生产级后端 + SQL Server/Oracle集成

---

## 🎯 推荐技术栈

### 后端框架
**推荐：Node.js + Express.js + TypeScript**

**选型理由：**
- ✅ 与前端Angular同语言（TypeScript），团队学习成本低
- ✅ 轻量级快速启动，适合初期MVP验证
- ✅ 生态丰富（JWT认证、数据库ORM、WebSocket）
- ✅ 适合50+用户并发规模

**备选方案：Python + FastAPI**（如果团队熟悉Python）

### 数据库
**推荐：PostgreSQL**

**选型理由：**
- ✅ 开源免费，企业级稳定性
- ✅ 符合金融行业合规要求（ACID事务、审计日志）
- ✅ 支持JSON类型（存储Commentary等非结构化数据）
- ✅ 未来可平滑迁移到Oracle/SQL Server

**初期替代：SQLite**（快速启动，无需安装数据库服务器）

### 认证授权
**推荐：JWT (JSON Web Token) + Bcrypt密码加密**

**功能：**
- 用户登录/登出
- 基于角色的访问控制（Maker/Checker/Viewer）
- Token过期刷新机制

### 部署方式
**推荐：Docker容器化**

**优势：**
- ✅ 一键部署，环境一致性
- ✅ 支持本地、云端、内网多种环境
- ✅ 易于扩展和维护

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户浏览器                             │
│                   (http://localhost:4200)                    │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   Nginx反向代理 (可选)                        │
│              前端静态文件 + API路由转发                        │
└────────────┬────────────────────────────┬────────────────────┘
             │                            │
             ↓                            ↓
    ┌────────────────┐          ┌─────────────────────┐
    │  Angular前端    │          │  Node.js后端API     │
    │  (静态文件)     │          │  (Express.js)       │
    │  Port: 4200    │          │  Port: 3000         │
    └────────────────┘          └──────────┬──────────┘
                                           │
                                           ↓
                                ┌──────────────────────┐
                                │  PostgreSQL数据库    │
                                │  Port: 5432          │
                                └──────────────────────┘
```

---

## 📊 数据库设计

### 核心数据表

#### 1. users (用户表)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'MAKER', 'CHECKER', 'VIEWER', 'ADMIN'
  product_line VARCHAR(50), -- 按产品线划分权限
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. products (产品数据表)
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  region VARCHAR(50) NOT NULL, -- 'US', 'CAD', 'Enterprise'
  segment VARCHAR(50), -- 'Retail', 'Corporate'
  product_type VARCHAR(100) NOT NULL, -- 'Deposits', 'BuyBack'
  sub_product VARCHAR(100),
  pid VARCHAR(50) UNIQUE NOT NULL,
  current_value DECIMAL(18, 2),
  prev_value DECIMAL(18, 2),
  threshold DECIMAL(18, 2),
  report_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. workflows (审批流程表)
```sql
CREATE TABLE workflows (
  id SERIAL PRIMARY KEY,
  submission_id VARCHAR(50) UNIQUE NOT NULL,
  maker_id INT REFERENCES users(id),
  checker_id INT REFERENCES users(id),
  status VARCHAR(20) NOT NULL, -- 'DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ESCALATED'
  product_ids TEXT[], -- 关联的产品ID数组
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. commentaries (注释表)
```sql
CREATE TABLE commentaries (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id),
  user_id INT REFERENCES users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. audit_logs (审计日志表)
```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  action VARCHAR(50) NOT NULL, -- 'LOGIN', 'SUBMIT', 'APPROVE', 'REJECT', 'EXPORT'
  entity_type VARCHAR(50), -- 'PRODUCT', 'WORKFLOW', 'USER'
  entity_id INT,
  details JSONB, -- JSON格式存储详细信息
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. lcr_metrics (LCR指标表)
```sql
CREATE TABLE lcr_metrics (
  id SERIAL PRIMARY KEY,
  region VARCHAR(50) NOT NULL,
  report_date DATE NOT NULL,
  hqla DECIMAL(18, 2), -- High-Quality Liquid Assets
  nco DECIMAL(18, 2), -- Net Cash Outflow
  lcr_ratio DECIMAL(5, 2), -- LCR比率(百分比)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔌 RESTful API接口设计

### 认证接口
```
POST   /api/auth/login          # 用户登录
POST   /api/auth/logout         # 用户登出
POST   /api/auth/refresh        # 刷新Token
GET    /api/auth/me             # 获取当前用户信息
```

### 产品数据接口
```
GET    /api/products            # 获取产品列表(支持筛选)
GET    /api/products/:id        # 获取单个产品详情
POST   /api/products            # 创建产品(Admin)
PUT    /api/products/:id        # 更新产品(Maker)
DELETE /api/products/:id        # 删除产品(Admin)
```

**查询参数示例：**
```
GET /api/products?region=US,CAD&segment=Retail&startDate=2025-09-01&endDate=2025-10-31&page=1&size=100
```

### Maker-Checker工作流接口
```
GET    /api/workflows           # 获取工作流列表
POST   /api/workflows/submit    # Maker提交审批
PUT    /api/workflows/:id/approve   # Checker批准
PUT    /api/workflows/:id/reject    # Checker驳回
PUT    /api/workflows/:id/escalate  # 升级
```

### Commentary接口
```
GET    /api/commentaries?productId=123  # 获取产品注释
POST   /api/commentaries                # 添加注释
```

### LCR指标接口
```
GET    /api/lcr/metrics         # 获取LCR指标
GET    /api/lcr/trend           # 获取LCR趋势数据(Dashboard)
```

### 报表导出接口
```
POST   /api/reports/fr2052a     # 生成FR2052a报表
GET    /api/reports/:id/download # 下载报表
```

### 审计日志接口
```
GET    /api/audit-logs          # 获取审计日志(Admin)
```

---

## 🔐 安全配置

### 1. JWT认证配置
```typescript
// JWT配置
{
  secret: process.env.JWT_SECRET, // 环境变量存储密钥
  expiresIn: '1h',                // Token 1小时过期
  refreshExpiresIn: '7d'          // Refresh Token 7天过期
}
```

### 2. CORS配置
```typescript
// 允许前端跨域请求
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));
```

### 3. HTTPS配置（生产环境）
```
推荐使用Let's Encrypt免费SSL证书
```

### 4. 密码策略
- 最小长度：8位
- 必须包含：大小写字母、数字、特殊字符
- Bcrypt加密（成本因子12）

---

## 🐳 Docker容器化配置

### 项目结构
```
leap-backend/
├── Dockerfile               # 后端API容器
├── docker-compose.yml       # 多容器编排
├── .env.example             # 环境变量模板
├── src/
│   ├── server.ts            # 入口文件
│   ├── routes/              # 路由
│   ├── controllers/         # 控制器
│   ├── models/              # 数据模型
│   ├── middlewares/         # 中间件
│   └── config/              # 配置
└── package.json
```

### docker-compose.yml示例
```yaml
version: '3.8'

services:
  # PostgreSQL数据库
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: leap_db
      POSTGRES_USER: leap_user
      POSTGRES_PASSWORD: leap_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Node.js后端API
  backend:
    build: ./leap-backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://leap_user:leap_pass@postgres:5432/leap_db
      JWT_SECRET: your-secret-key
      NODE_ENV: development
    depends_on:
      - postgres

  # Angular前端（可选，也可单独部署）
  frontend:
    build: ./leap-angular
    ports:
      - "4200:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 📦 部署步骤

### 阶段1：本地开发环境（立即可用）

**当前状态：**
- ✅ Angular前端已完成
- ✅ 使用MockDataService模拟数据
- ✅ 可直接运行 `npm start`

**适用场景：**
- 前端UI开发和测试
- 产品演示
- 用户培训

**运行方式：**
```bash
cd leap-angular
npm install
npm start
# 访问 http://localhost:4200
```

---

### 阶段2：轻量级后端（1-2周实现）

**需要实现：**
1. Node.js + Express后端API
2. SQLite数据库（无需安装数据库服务器）
3. JWT认证
4. 基础CRUD接口

**部署步骤：**
```bash
# 1. 创建后端项目
cd "/Users/lin/Liquidity Explain & Analytics Platform (LEAP)"
mkdir leap-backend
cd leap-backend
npm init -y

# 2. 安装依赖
npm install express cors dotenv bcryptjs jsonwebtoken sqlite3 sequelize

# 3. 启动后端
npm run dev  # Port 3000

# 4. 启动前端（新终端）
cd ../leap-angular
npm start    # Port 4200

# 5. 前端连接后端
# 修改 environment.ts:
# apiUrl: 'http://localhost:3000/api'
```

**优势：**
- 快速启动，2-3天可完成
- 无需复杂配置
- 适合初期验证

---

### 阶段3：生产级部署（1-2个月）

**完整功能：**
1. PostgreSQL生产级数据库
2. Docker容器化
3. Nginx反向代理
4. HTTPS加密
5. 完整的错误处理和日志
6. 数据备份策略
7. 性能监控

**部署步骤：**
```bash
# 1. 使用Docker Compose一键启动
cd "/Users/lin/Liquidity Explain & Analytics Platform (LEAP)"
docker-compose up -d

# 2. 访问应用
# 前端: http://localhost:4200
# 后端API: http://localhost:3000
# 数据库: localhost:5432

# 3. 查看日志
docker-compose logs -f backend
```

**优势：**
- 一键部署，环境一致
- 支持云端/内网多环境
- 生产级稳定性

---

## 📝 环境变量配置

### .env文件示例
```bash
# 数据库配置
DATABASE_URL=postgres://leap_user:leap_pass@localhost:5432/leap_db

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# 服务器配置
PORT=3000
NODE_ENV=development

# CORS配置
FRONTEND_URL=http://localhost:4200

# 日志级别
LOG_LEVEL=debug
```

---

## 🔄 数据迁移策略

### 从Mock数据到真实数据库

**步骤1：** 导出前端Mock数据
```typescript
// 将MockDataService中的数据导出为JSON
export const mockProducts = [...]; // 100条产品数据
```

**步骤2：** 创建数据库迁移脚本
```bash
# 使用Sequelize ORM迁移
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

**步骤3：** 批量导入数据
```sql
COPY products(region, product_type, current_value, prev_value, ...)
FROM '/path/to/mock-data.csv'
DELIMITER ','
CSV HEADER;
```

---

## 🚀 一键启动脚本

### start-all.sh
```bash
#!/bin/bash

echo "🚀 启动LEAP完整应用..."

# 启动数据库
echo "📊 启动PostgreSQL..."
docker-compose up -d postgres
sleep 3

# 启动后端API
echo "⚙️  启动后端API..."
cd leap-backend
npm run dev &
sleep 2

# 启动前端
echo "🎨 启动前端应用..."
cd ../leap-angular
npm start &

echo "✅ 应用启动完成！"
echo "   前端: http://localhost:4200"
echo "   后端: http://localhost:3000"
echo "   数据库: localhost:5432"
```

---

## 📊 监控与维护

### 1. 日志管理
- 使用Winston记录后端日志
- 按日期滚动存储
- 错误日志单独记录

### 2. 性能监控
- 使用PM2管理Node.js进程
- API响应时间监控
- 数据库慢查询分析

### 3. 数据备份
```bash
# 每日自动备份数据库
0 2 * * * pg_dump leap_db > /backup/leap_db_$(date +\%Y\%m\%d).sql
```

### 4. 安全审计
- 定期更新依赖包 (`npm audit`)
- 审计日志保留7年
- 密码定期轮换策略

---

## 💡 推荐下一步行动

### 立即可做（0成本）
1. ✅ **继续使用当前前端Mock数据**
   - 已可用于演示和培训
   - 无需额外配置

### 1-2周内（轻量级后端）
2. 🔧 **实现基础后端API**
   - Node.js + Express
   - SQLite数据库
   - JWT认证
   - 核心CRUD接口

### 1-2个月内（生产级）
3. 🐳 **Docker容器化部署**
   - PostgreSQL数据库
   - 完整的API功能
   - HTTPS安全配置
   - 自动化部署脚本

---

## 📞 技术支持建议

### 推荐学习资源
- **Node.js + Express**: [官方文档](https://expressjs.com/)
- **PostgreSQL**: [官方教程](https://www.postgresql.org/docs/)
- **Docker**: [Docker入门](https://docs.docker.com/get-started/)
- **JWT认证**: [JWT.io](https://jwt.io/)

### 外部服务建议
- **云端部署**: Heroku (免费层) / AWS / Azure
- **数据库托管**: ElephantSQL (免费PostgreSQL)
- **监控工具**: Sentry (错误追踪) / New Relic (性能监控)

---

## ✅ 总结

**推荐路径：**
1. **当前（第0天）**：使用前端Mock数据，完成UI验证 ✅
2. **第1-14天**：实现轻量级Node.js后端 + SQLite
3. **第15-60天**：升级到生产级PostgreSQL + Docker

**估算成本：**
- 开发环境：免费
- 测试环境：$0-50/月（云端托管可选）
- 生产环境：$100-500/月（按用户规模）

**技术风险：低**
- 采用成熟技术栈
- 渐进式升级，风险可控
- 完整的文档支持

---

**部署方案已制定！下一步请输入 `/上线` 启动后端实现。**

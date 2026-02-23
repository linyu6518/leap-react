# LEAP - Liquidity Explain & Analytics Platform

> TD Bank流动性风险管理平台 - Angular前端应用

[![Angular](https://img.shields.io/badge/Angular-17.3-DD0031?logo=angular)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Material](https://img.shields.io/badge/Material-17.3-00843D)](https://material.angular.io/)

## 📋 项目简介

LEAP是为TD Bank开发的专业流动性监管管理平台，替代传统Excel工具，为50+人规模的风险团队提供：

- **流动性指标计算** - 自动化LCR/NSFR/NCCF计算
- **Maker-Checker流程** - 数字化审核流程和权限管理
- **监管报表生成** - FR2052a/STWF/Appendix VI一键导出
- **实时数据分析** - Dashboard可视化和差异预警

## 🎨 技术栈

### 核心框架
- **Angular 17.3** - 现代化Web应用框架
- **TypeScript 5.4** - 类型安全的JavaScript超集
- **RxJS 7.8** - 响应式编程

### UI组件
- **Angular Material 17.3** - TD绿主题定制 (#00843D)
- **AG Grid Community 31.2** - 企业级数据表格
- **ECharts 5.5** - 数据可视化图表
- **ngx-echarts 17.2** - ECharts Angular集成

### 状态管理
- **NgRx Store 17.2** - Redux状态管理
- **NgRx Effects 17.2** - 副作用处理
- **NgRx DevTools** - 开发调试工具

## 📁 项目结构

```
leap-react/
├── src/
│   ├── app/
│   │   ├── core/                 # 核心模块（单例服务）
│   │   │   ├── state/            # NgRx状态管理
│   │   │   │   └── workflow/     # 工作流状态
│   │   │   ├── api/              # API服务
│   │   │   └── core.module.ts
│   │   │
│   │   ├── shared/               # 共享模块
│   │   │   ├── components/       # 共享组件
│   │   │   │   ├── status-badge/        # 状态标签
│   │   │   │   ├── query-panel/         # 查询面板
│   │   │   │   ├── commentary-drawer/   # 注释抽屉
│   │   │   │   └── data-grid/           # 数据表格
│   │   │   ├── services/         # 共享服务
│   │   │   │   └── mock-data.service.ts
│   │   │   └── shared.module.ts
│   │   │
│   │   ├── layout/               # 布局组件
│   │   │   ├── main-layout/      # 主布局
│   │   │   ├── header/           # 头部导航
│   │   │   ├── sidebar/          # 侧边栏
│   │   │   │   └── navigation-tree/  # 导航树
│   │   │   └── layout.module.ts
│   │   │
│   │   ├── features/             # 功能模块
│   │   │   ├── dashboard/        # 仪表盘
│   │   │   ├── product-analysis/ # 产品分析
│   │   │   │   └── deposits/     # 存款分析
│   │   │   ├── regulatory-views/ # 监管视图
│   │   │   │   └── lcr-view/     # LCR视图
│   │   │   ├── maker-workspace/  # Maker工作区
│   │   │   └── checker-workspace/# Checker工作区
│   │   │
│   │   ├── app-routing.module.ts
│   │   ├── app.component.ts
│   │   └── app.module.ts
│   │
│   ├── assets/
│   │   └── themes/
│   │       └── td-green-theme.scss   # TD绿主题
│   │
│   ├── styles/
│   │   ├── _variables.scss       # SCSS变量
│   │   └── styles.scss           # 全局样式
│   │
│   ├── environments/             # 环境配置
│   ├── index.html
│   └── main.ts
│
├── angular.json                  # Angular配置
├── package.json                  # 依赖管理
├── tsconfig.json                 # TypeScript配置
└── README.md
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.13.0
- npm >= 9.0.0

### 安装依赖

```bash
cd leap-react
npm install
```

### 开发运行

```bash
npm start
# 或
ng serve

# 浏览器自动打开 http://localhost:4200
```

### 生产构建

```bash
npm run build:prod
# 构建产物在 dist/leap-react/
```

## 🎯 核心功能

### 1. Dashboard仪表盘
- **统计卡片** - Draft/Pending/Approved数量实时展示
- **LCR/NSFR趋势图** - 12个月折线图趋势分析
- **Variance Top 10** - 差异最大的10个产品柱状图
- **阈值超标分析** - 环形图展示预警分布

### 2. 产品分析 (Product Analysis)
- **Deposits页面** - 存款产品分析
  - Region/Segment多维度筛选
  - AG Grid表格展示100+行数据
  - Variance自动计算和阈值高亮
  - 行级Commentary注释功能

### 3. 监管视图 (Regulatory Views)
- **LCR View** - 流动性覆盖率
  - HQLA/NCO/LCR Ratio指标卡片
  - 产品分布表格
  - <100%自动标红预警

### 4. Maker-Checker工作流
- **Maker Workspace** - 数据审查和提交
- **Checker Workspace** - 审批/驳回/升级
- **Status Badge** - 5种状态可视化
  - Draft (灰) / Pending (蓝) / Approved (绿) / Rejected (红) / Escalated (橙)

## 🎨 设计规范

### TD绿色主题
- **主色** - #00843D (TD品牌绿)
- **深绿** - #005A29 (导航背景)
- **浅绿** - #E8F5E9 (悬停/成功背景)

### 功能色系
- 预警黄 - #FFC107
- 风险红 - #E53935
- 信息蓝 - #1976D2
- 升级橙 - #FF6F00
- 成功绿 - #4CAF50

### 间距系统 (8px基准)
- xs: 8px | sm: 16px | md: 24px | lg: 32px | xl: 48px

## 📊 数据模拟

由于当前没有后端API，应用使用 `MockDataService` 提供模拟数据：

```typescript
// src/app/shared/services/mock-data.service.ts
- getProductData() - 100行产品数据
- getLCRData() - LCR指标和产品分布
- getDashboardStats() - 仪表盘统计数据
```

## 🔧 开发指南

### 代码规范
- 使用 `ng lint` 检查代码质量
- 遵循 Angular Style Guide
- 组件使用 OnPush 变更检测策略
- SCSS遵循BEM命名规范

### 路由结构
```
/dashboard              - 仪表盘
/product/deposits       - 存款分析
/product/buyback        - 回购分析
/product/loan-commitments - 贷款承诺
/regulatory/lcr         - LCR视图
/regulatory/nsfr        - NSFR视图
/regulatory/nccf        - NCCF视图
/regulatory/ilst        - ILST视图
/maker/review           - Maker工作区
/checker/approve        - Checker工作区
```

### 添加新功能模块

```bash
# 生成新模块
ng generate module features/new-feature --routing

# 生成组件
ng generate component features/new-feature/new-component

# 添加到路由
# 在 app-routing.module.ts 中配置懒加载
```

## 📦 主要依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| @angular/core | 17.3.0 | Angular核心 |
| @angular/material | 17.3.0 | Material UI |
| @ngrx/store | 17.2.0 | 状态管理 |
| ag-grid-angular | 31.2.0 | 数据表格 |
| echarts | 5.5.0 | 数据可视化 |
| ngx-echarts | 17.2.0 | ECharts集成 |

## 🔐 权限控制

应用支持基于角色的权限控制（待实现后端集成）：

- **Maker** - 产品线数据编辑权限
- **Checker** - 跨产品审批权限
- **财务人员** - 报表查看和导出
- **监管报告** - 报表生成和提交
- **管理层** - 只读Dashboard访问

## 📝 待完成功能

### P0核心功能
- ✅ TD绿色主题定制
- ✅ 左侧导航树
- ✅ Query Panel筛选器
- ✅ Product View数据表格
- ✅ Maker-Checker状态标签
- ✅ Commentary抽屉
- ✅ LCR View页面
- ✅ Dashboard可视化

### P1重要功能
- ⏳ NgRx Effects异步处理
- ⏳ HTTP拦截器和认证
- ⏳ Excel导出服务
- ⏳ 路由守卫

### P2增强功能
- ⏳ WebSocket实时协作
- ⏳ 审计日志模块
- ⏳ 高级数据筛选

## 🐛 已知问题

1. **Commentary Drawer动画** - 需要在模块中配置BrowserAnimationsModule
2. **AG Grid列宽** - 需要在onGridReady中调用sizeColumnsToFit()
3. **Material主题** - 某些组件需要额外的样式覆盖

## 🤝 贡献指南

1. Fork本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交变更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 License

Copyright © 2025 TD Bank. All rights reserved.

---

**项目负责人**: 前端开发团队
**最后更新**: 2025-10-06
**Angular版本**: 17.3.0

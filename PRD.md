# LEAP 产品需求文档（PRD）
**Liquidity Explain & Analytics Platform**

## 1. 产品概述

### 1.1 背景与目标
LEAP旨在替代传统Excel工具，为50+人规模的金融机构风险团队提供专业的流动性监管管理平台。解决Excel操作效率低、版本管理混乱、数据追溯困难、审核流程不规范等痛点，实现流动性指标计算自动化、Maker-Checker流程数字化、监管报表一键生成。

### 1.2 核心价值
- **效率提升**：自动化数据查询和计算，减少90%手工操作
- **合规保障**：内置Maker-Checker流程和完整审计日志
- **风险预警**：实时差异分析和阈值监控
- **监管对接**：标准化报表直接生成

---

## 2. 用户角色与权限

| 角色 | 权限范围 | 核心需求 | 典型操作 |
|------|---------|---------|---------|
| **Maker** | 分配产品线的读写权限 | 数据审查、调整、注释提交 | Review→Adjust→Commentary→Submit |
| **Checker** | 跨产品线审批权限 | 审批、驳回、升级 | Summary→Review→Approve/Reject/Escalate |
| **财务人员** | 特定报表查看权限 | 数据导出、报表下载 | 查询→导出Excel |
| **监管报告人员** | 报表生成和提交权限 | 监管报表生成和校验 | 生成FR2052a/STWF等报表 |
| **管理层** | 全局只读+Dashboard权限 | 趋势分析、风险概览 | 查看Dashboard、接收预警通知 |

---

## 3. 核心功能需求

### P0 核心功能（必须实现）

#### 3.1 用户权限管理
- 支持按产品线（Product Line）划分角色权限
- 支持Maker/Checker角色分配
- 实现数据行级权限控制（Region/Segment）
- 记录权限变更审计日志

#### 3.2 数据查询面板
- **过滤条件**：Region（下拉多选）、Segment（下拉多选）、Prev Date（日期选择器）、Curr Date（日期选择器）
- **验收标准**：
  - 查询结果<3秒返回（10万行数据内）
  - 支持过滤条件联动（Region选择后Segment自动刷新）
  - 查询参数自动保存到会话

#### 3.3 流动性指标视图
**LCR View（流动性覆盖率）**
- 展示列：Region/Product/HQLA（高质量流动性资产）/NCO（净现金流出）/LCR Ratio
- LCR Ratio = HQLA / NCO × 100%，低于100%标红
- 支持按Region/Product分组展示

**NSFR View（净稳定资金比率）**
- 展示ASF（可用稳定资金）/RSF（所需稳定资金）/NSFR Ratio
- NSFR Ratio = ASF / RSF × 100%，低于100%标红

**NCCF/ILST View**
- 按标准模板展示内部流动性指标

#### 3.4 产品分析视图（Product View）
- **表格列**：Region/Internal Category/Product/Sub-Product/PID/Current/Prev/Variance/Threshold
- **Variance计算**：Variance = Current - Prev
- **阈值预警**：|Variance| > Threshold时背景标黄，字体加粗
- **支持产品**：Deposits、BuyBack、Loan Commitments等

#### 3.5 Maker-Checker签核流程
**Maker流程**：
1. **Review**：查看Product View和LCR View数据
2. **Adjust**：调整异常数据（记录调整原因）
3. **Commentary**：添加逐行注释或汇总说明
4. **Submit**：生成Summary页面提交审批（状态→Pending Review）

**Checker流程**：
1. **Summary**：查看Maker提交的汇总数据和Commentary
2. **Adjustments Review**：审查所有调整记录（显示Before/After/Reason）
3. **Sign-off Options**：
   - Approve（状态→Approved，发送Email通知）
   - Reject（状态→Rejected，退回Maker并附原因）
   - Escalate（状态→Escalated，发送给高级管理层）

**状态流转**：Draft → Pending Review → Approved/Rejected/Escalated

#### 3.6 差异分析与预警
- 自动计算Variance（Current vs Prev）
- 预设Threshold阈值（支持按Product配置）
- 超阈值项自动高亮并生成Alert
- Dashboard展示Top 10 Variance项

#### 3.7 监管报表生成
- **FR2052a**：美联储流动性报告（自动映射数据到表格行项）
- **STWF**：短期批发融资报告
- **Appendix VI**：香港金管局流动性报告
- **OSFI LCR**：加拿大监管机构LCR报告
- 验收标准：报表公式自动计算准确率100%，支持PDF/Excel导出

#### 3.8 审计日志
- 记录所有数据变更（字段级别）
- 记录用户操作（登录、查询、提交、审批）
- 日志字段：Timestamp/User/Action/Object/Old Value/New Value/IP Address
- 日志保留期≥7年（监管要求）

### P1 重要功能（优先实现）

#### 3.9 Commentary管理
- 支持行级注释（针对单条产品数据）
- 支持页面级汇总注释
- 历史注释可追溯查看
- 注释支持富文本格式

#### 3.10 导出功能
- 支持当前视图导出Excel/CSV
- 支持批量导出多个报表
- 导出文件包含查询条件水印
- 导出操作记录到审计日志

#### 3.11 左侧导航树（Accordion）
```
Liquidity
├── Product Analysis
│   ├── Deposits
│   ├── BuyBack
│   └── Loan Commitments
├── Regulatory Views
│   ├── LCR
│   ├── NSFR
│   └── NCCF
└── Internal Views
    └── ILST
```

#### 3.12 Dashboard可视化
- LCR/NSFR趋势图（折线图，最近12个月）
- Variance Top 10排行（柱状图）
- 阈值超标项计数（饼图）
- 审批状态分布（进度条）

### P2 增强功能（后续实现）

#### 3.13 Email通知
- Maker提交后通知Checker
- 审批结果通知Maker
- 阈值预警通知管理层
- 支持自定义通知规则

---

## 4. 页面架构

### 4.1 整体结构
```
┌─────────────────────────────────────────────┐
│  Header (Logo + User Info + Logout)          │
├──────────┬──────────────────────────────────┤
│          │  Query Panel (Region/Segment/Date)│
│  Left    ├──────────────────────────────────┤
│  Nav     │  Data Grid / Chart Area           │
│  Tree    │  (Product View / LCR View)        │
│ (Accord- │                                    │
│  ion)    ├──────────────────────────────────┤
│          │  Action Bar (Adjust/Comment/Submit)│
└──────────┴──────────────────────────────────┘
```

### 4.2 核心页面清单
| 页面名称 | 路径 | 核心组件 | 用户入口 |
|---------|------|---------|---------|
| Dashboard | `/dashboard` | 趋势图+预警卡片 | 登录后默认页 |
| Product View | `/product/:type` | 查询面板+数据网格 | 左侧导航→Product |
| LCR View | `/regulatory/lcr` | 指标计算表 | 左侧导航→Regulatory |
| Maker Workspace | `/maker/review` | 调整面板+注释区 | 顶部工作区入口 |
| Checker Workspace | `/checker/approve` | 审批面板+历史对比 | 顶部工作区入口 |
| Reports | `/reports` | 报表模板列表 | 顶部Reports菜单 |
| Audit Log | `/admin/audit` | 日志查询表格 | 管理员菜单 |

---

## 5. 工作流设计

### 5.1 Maker-Checker流程
```
Maker:
  查看数据 → 识别异常 → 执行调整(记录原因) → 添加Commentary → 提交审批
       ↓
  状态: Draft → Pending Review

Checker:
  接收通知 → 查看Summary → 审查Adjustments → 决策
       ↓                                        ↓
  Approve: 状态→Approved，发送通知        Reject: 状态→Rejected，退回Maker
       ↓                                        ↓
  Escalate: 状态→Escalated，上报管理层
```

### 5.2 状态流转规则
- **Draft**：Maker编辑中（允许修改）
- **Pending Review**：已提交待审批（Maker只读，Checker可操作）
- **Approved**：已批准（全部只读，可导出报表）
- **Rejected**：已驳回（Maker可重新编辑）
- **Escalated**：已升级（等待高级管理层决策）

---

## 6. 关键业务规则

1. **Variance计算公式**：Variance = Current Value - Previous Value
2. **阈值预警规则**：|Variance| > Threshold → 背景标黄 + 字体加粗 + 生成Alert
3. **权限控制**：
   - Maker只能操作分配的Product Line
   - Checker可查看所有Product Line但只能审批分配的Region
   - 管理层全局只读
4. **数据锁定**：Approved状态下数据不可修改（除非重新开启新周期）
5. **审计要求**：所有变更必须记录操作人、时间、原因
6. **报表一致性**：监管报表数据必须与Product View数据完全一致
7. **并发控制**：同一条数据同时只能一个用户编辑（乐观锁）

---

## 7. 非功能性需求

| 类别 | 要求 | 验收标准 |
|------|------|---------|
| **性能** | 查询响应时间 | <3秒（10万行数据） |
| **并发** | 支持用户数 | 50+并发用户 |
| **安全** | 数据传输 | HTTPS + Token认证 |
| **安全** | 密码策略 | 8位以上，包含大小写+数字+特殊字符 |
| **合规** | 审计日志保留 | ≥7年 |
| **合规** | 数据备份 | 每日自动备份，保留30天 |
| **可用性** | 系统可用率 | ≥99.5% |
| **兼容性** | 浏览器支持 | Chrome 90+, Edge 90+, Safari 14+ |
| **数据库** | 支持类型 | SQL Server 2016+, Oracle 12c+ |

---

## 8. 开发阶段

### Phase 1：基础架构与权限（Week 1-2）
- 用户登录认证、角色权限管理
- 左侧导航树、页面路由
- 数据库连接和查询面板基础功能

### Phase 2：核心数据视图（Week 3-4）
- Product View开发（含Variance计算和阈值预警）
- LCR/NSFR/NCCF/ILST指标视图
- 数据网格交互（排序、筛选、分页）

### Phase 3：Maker-Checker流程（Week 5-6）
- Maker调整功能和Commentary模块
- Checker审批工作区
- 状态流转和Email通知

### Phase 4：报表与优化（Week 7-8）
- 监管报表生成（FR2052a/STWF/Appendix VI/OSFI LCR）
- Dashboard可视化
- 审计日志、导出功能、性能优化

---

## 9. 技术风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 数据库性能瓶颈 | 查询超时 | 建立索引、数据分区、缓存层 |
| 监管公式复杂 | 计算错误 | 单元测试覆盖率100%、财务人员验证 |
| 权限控制漏洞 | 数据泄露 | 代码审查、渗透测试、行级权限验证 |
| 并发编辑冲突 | 数据覆盖 | 乐观锁机制、版本号控制 |
| 审计日志存储 | 磁盘空间 | 日志归档策略、分表存储 |

---

**文档版本**：v1.0
**更新日期**：2025-10-06
**负责人**：产品团队
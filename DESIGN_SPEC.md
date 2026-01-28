# LEAP 设计规范文档（Design Specification）
**Liquidity Explain & Analytics Platform**

## 1. 设计概览

### 1.1 设计理念
LEAP作为金融机构流动性监管平台，设计以**专业可信、高效精准、合规安全**为核心。视觉语言融合TD品牌绿的金融专业性与现代化数据平台的简约美学，通过清晰的信息层级、直观的交互反馈、严谨的数据呈现，帮助风险团队在复杂的监管数据中快速定位问题、高效完成审核流程。

### 1.2 核心设计原则
- **数据优先**：突出关键指标（LCR/NSFR/Variance），弱化装饰元素
- **状态清晰**：通过颜色编码（Draft灰/Pending蓝/Approved绿）即时传达流程状态
- **操作高效**：Maker-Checker流程路径最短，关键操作≤3次点击
- **合规导向**：审计日志、权限控制等安全元素融入界面设计

---

## 2. 色彩规范

### 2.1 主色系统
| 颜色名称 | HEX色值 | RGB | 应用场景 |
|---------|---------|-----|---------|
| 品牌主色（TD绿） | `#00843D` | `0, 132, 61` | 主按钮、导航激活状态、品牌标识 |
| 深绿（导航背景） | `#005A29` | `0, 90, 41` | 左侧导航栏背景 |
| 浅绿（悬停） | `#E8F5E9` | `232, 245, 233` | 导航项悬停、成功提示背景 |

### 2.2 功能色系统
| 功能 | 颜色 | HEX色值 | 使用场景 |
|------|------|---------|---------|
| 预警黄 | ⚠️ | `#FFC107` | Variance超阈值背景高亮 |
| 风险红 | 🔴 | `#E53935` | LCR<100%、删除操作、Rejected状态 |
| 信息蓝 | 🔵 | `#1976D2` | Pending Review状态、信息提示 |
| 升级橙 | 🟠 | `#FF6F00` | Escalated状态、重要提醒 |
| 成功绿 | ✅ | `#4CAF50` | Approved状态、操作成功 |

### 2.3 状态色系统（Maker-Checker流程）
| 状态 | 颜色 | HEX色值 | 标签样式 |
|------|------|---------|---------|
| Draft | 灰色 | `#9E9E9E` | 背景`#F5F5F5`、文字`#616161` |
| Pending Review | 蓝色 | `#1976D2` | 背景`#E3F2FD`、文字`#1565C0` |
| Approved | 绿色 | `#4CAF50` | 背景`#E8F5E9`、文字`#2E7D32` |
| Rejected | 红色 | `#E53935` | 背景`#FFEBEE`、文字`#C62828` |
| Escalated | 橙色 | `#FF6F00` | 背景`#FFF3E0`、文字`#E65100` |

### 2.4 中性色系统
```css
/* 文字颜色 */
--text-primary: #1A1A1A;      /* 主标题、数据 */
--text-secondary: #4A4A4A;    /* 次要文字、标签 */
--text-tertiary: #757575;     /* 辅助说明、禁用 */
--text-white: #FFFFFF;        /* 深色背景上的文字 */

/* 边框与背景 */
--border-light: #E0E0E0;      /* 分割线、表格边框 */
--border-medium: #BDBDBD;     /* 输入框边框 */
--bg-page: #F5F5F5;           /* 页面背景 */
--bg-card: #FFFFFF;           /* 卡片、表格背景 */
--bg-hover: #FAFAFA;          /* 行悬停背景 */
```

---

## 3. 字体排版

### 3.1 字体家族
```css
--font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
                'Helvetica Neue', Arial, sans-serif;
--font-mono: 'SF Mono', 'Consolas', 'Monaco', monospace; /* 用于数据显示 */
```

### 3.2 字号与字重系统
| 用途 | 字号 | 字重 | 行高 | CSS变量 | 使用场景 |
|------|------|------|------|---------|---------|
| H1大标题 | 28px | 600 | 1.3 | `--font-h1` | Dashboard标题 |
| H2标题 | 24px | 600 | 1.4 | `--font-h2` | 页面主标题 |
| H3标题 | 20px | 500 | 1.4 | `--font-h3` | 区块标题 |
| H4标题 | 18px | 500 | 1.5 | `--font-h4` | 表格标题 |
| 正文 | 16px | 400 | 1.5 | `--font-body` | 常规文字、表单 |
| 辅助文字 | 14px | 400 | 1.4 | `--font-caption` | 说明文字、标签 |
| 小字 | 12px | 400 | 1.3 | `--font-small` | 时间戳、注释 |
| 数据数字 | 16px | 500 | 1.2 | `--font-data` | 表格数据（等宽字体） |

---

## 4. 间距与网格

### 4.1 基础间距单位
```css
--spacing-unit: 8px; /* 所有间距都是8px的倍数 */

/* 常用间距值 */
--spacing-xs: 8px;   /* 紧密元素间距 */
--spacing-sm: 16px;  /* 组件内间距 */
--spacing-md: 24px;  /* 组件间间距 */
--spacing-lg: 32px;  /* 区块间间距 */
--spacing-xl: 48px;  /* 页面区域间距 */
```

### 4.2 组件间距规范
- **卡片内边距**：24px（标题区16px顶部+内容区24px四周）
- **表格行高**：48px（确保数据可读性和点击区域）
- **按钮内边距**：12px 24px（高度44px）
- **表单字段间距**：垂直16px
- **页面边距**：左侧导航260px + 主内容区32px内边距

### 4.3 圆角与阴影
```css
/* 圆角 */
--radius-sm: 4px;    /* 按钮、输入框、标签 */
--radius-md: 8px;    /* 卡片、弹窗 */
--radius-lg: 12px;   /* 大型容器 */

/* 阴影 */
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);   /* 卡片 */
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12);  /* 下拉菜单 */
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.16);  /* Modal */
```

---

## 5. 核心组件规范

### 5.1 左侧导航树（Accordion）
**结构与尺寸**
- 固定宽度：260px
- 背景色：`#005A29`（深绿）
- 三级层级缩进：L1=16px, L2=32px, L3=48px

**导航项样式**
```css
/* 默认状态 */
background: transparent;
color: rgba(255, 255, 255, 0.8);
height: 44px;
padding: 0 16px;

/* 悬停状态 */
background: rgba(255, 255, 255, 0.1);
color: #FFFFFF;

/* 当前页激活状态 */
background: rgba(0, 132, 61, 0.3);
color: #FFFFFF;
border-left: 4px solid #00843D;
font-weight: 500;

/* 展开/收起图标 */
transform: rotate(0deg); /* 收起 */
transform: rotate(90deg); /* 展开 */
transition: 200ms ease;
```

### 5.2 Query Panel筛选器
**布局**：水平排列，高度80px，背景白色，底部1px边框`#E0E0E0`

**筛选器组件**
- **Region下拉**：宽度200px，支持多选，显示已选数量徽章
- **Segment下拉**：宽度200px，与Region联动刷新
- **Date Picker**：宽度180px，格式YYYY-MM-DD
- **Query按钮**：主按钮样式，宽度120px

```css
/* Dropdown样式 */
.dropdown {
  height: 40px;
  border: 1px solid #BDBDBD;
  border-radius: 4px;
  padding: 0 12px;
  font-size: 16px;
}

.dropdown:focus {
  border-color: #00843D;
  box-shadow: 0 0 0 2px rgba(0, 132, 61, 0.1);
}
```

### 5.3 数据表格
**表格结构**
- 表头高度：56px，背景`#FAFAFA`，字重500
- 数据行高度：48px
- 边框：1px solid `#E0E0E0`
- 斑马纹：偶数行背景`#FAFAFA`

**Variance高亮规则**
```css
/* |Variance| > Threshold */
.variance-alert {
  background-color: #FFF9C4 !important; /* 预警黄浅色 */
  font-weight: 600;
  color: #F57C00; /* 深橙 */
}

/* LCR < 100% */
.lcr-warning {
  color: #E53935; /* 风险红 */
  font-weight: 600;
}
```

**交互状态**
```css
/* 行悬停 */
tr:hover {
  background-color: #F5F5F5;
  cursor: pointer;
}

/* 选中行 */
tr.selected {
  background-color: #E8F5E9;
  border-left: 3px solid #00843D;
}
```

### 5.4 状态标签（Status Badge）
**尺寸**：高度24px，内边距6px 12px，圆角12px

**样式代码**
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.badge-draft { background: #F5F5F5; color: #616161; }
.badge-pending { background: #E3F2FD; color: #1565C0; }
.badge-approved { background: #E8F5E9; color: #2E7D32; }
.badge-rejected { background: #FFEBEE; color: #C62828; }
.badge-escalated { background: #FFF3E0; color: #E65100; }
```

### 5.5 Commentary面板（右侧抽屉）
**尺寸与布局**
- 宽度：480px
- 背景：白色
- 阴影：`0 0 24px rgba(0,0,0,0.15)`
- 动画：从右侧滑入，300ms ease-out

**面板内容**
- 标题栏：高度60px，背景`#FAFAFA`，含关闭按钮
- 内容区：Textarea高度自适应（最小120px）
- 底部操作栏：高度64px，含Save/Cancel按钮

### 5.6 按钮
| 类型 | 背景色 | 文字色 | 边框 | 悬停效果 | 使用场景 |
|------|--------|--------|------|---------|---------|
| Primary | `#00843D` | `#FFFFFF` | 无 | 背景`#006B32` | Submit、Approve |
| Secondary | `#FFFFFF` | `#00843D` | `1px #00843D` | 背景`#F1F8F4` | Cancel、Export |
| Danger | `#E53935` | `#FFFFFF` | 无 | 背景`#C62828` | Reject、Delete |
| Ghost | 透明 | `#4A4A4A` | 无 | 背景`#F5F5F5` | 次要操作 |

**按钮尺寸**
- 高度：44px
- 内边距：12px 24px
- 圆角：4px
- 最小宽度：120px
- 字体：16px，字重500

### 5.7 表单输入框
```css
.input {
  height: 40px;
  padding: 0 12px;
  border: 1px solid #BDBDBD;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 200ms;
}

.input:focus {
  border-color: #00843D;
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 132, 61, 0.1);
}

.input.error {
  border-color: #E53935;
}

/* Textarea */
.textarea {
  min-height: 120px;
  padding: 12px;
  resize: vertical;
}
```

### 5.8 卡片容器
```css
.card {
  background: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 24px;
  margin-bottom: 24px;
}

.card-header {
  font-size: 20px;
  font-weight: 500;
  color: #1A1A1A;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E0E0E0;
}
```

---

## 6. 页面布局规范

### 6.1 整体布局结构
```
┌──────────────────────────────────────────────────────────┐
│  Header: Logo + 路径导航 + 用户信息           高度: 60px  │
├──────────────┬───────────────────────────────────────────┤
│              │  Query Panel                  高度: 80px  │
│  Left Nav    ├───────────────────────────────────────────┤
│  Tree        │                                            │
│              │  Main Content Area                         │
│  宽度: 260px  │  (Data Grid / Chart / Dashboard)           │
│              │  背景: #F5F5F5                              │
│  背景:       │  内边距: 32px                               │
│  #005A29     │                                            │
│              │                                            │
└──────────────┴───────────────────────────────────────────┘
```

### 6.2 Header布局
- **Logo区域**：左侧，宽度200px，包含TD Logo + "LEAP"文字
- **路径导航**：中间，面包屑格式（Home > Product Analysis > Deposits）
- **用户信息区**：右侧，用户头像32px圆形 + 用户名 + 下拉菜单

### 6.3 响应式断点
```css
/* 桌面端优先 */
@media (min-width: 1920px) {
  /* 大屏：主内容区最大宽度1600px */
  .main-content { max-width: 1600px; }
}

@media (max-width: 1440px) {
  /* 标准屏：导航收缩为图标 */
  .left-nav { width: 80px; }
  .nav-text { display: none; }
}

@media (max-width: 1280px) {
  /* 小屏：导航折叠为汉堡菜单 */
  .left-nav { transform: translateX(-260px); }
  .left-nav.open { transform: translateX(0); }
}
```

---

## 7. 数据可视化规范

### 7.1 图表配色方案
**折线图（LCR/NSFR趋势）**
- LCR线条：`#00843D`（主绿），线宽2px
- NSFR线条：`#1976D2`（信息蓝），线宽2px
- 阈值线：`#E53935`（风险红），虚线

**柱状图（Variance Top 10）**
- 正值（增加）：`#4CAF50`（成功绿）
- 负值（减少）：`#E53935`（风险红）

**环形图（阈值超标）**
- 正常：`#4CAF50`
- 警告：`#FFC107`
- 危险：`#E53935`

### 7.2 图表尺寸与间距
- 图表容器：最小高度300px，宽度100%填充卡片
- 图表标题：20px字体，字重500，底部间距16px
- 坐标轴标签：14px字体，颜色`#757575`
- 数据标签：12px字体，字重500

### 7.3 交互规范
- **悬停**：显示Tooltip，背景`rgba(0,0,0,0.8)`，白色文字
- **点击**：图例点击切换显示/隐藏对应数据系列
- **缩放**：折线图支持鼠标滚轮缩放时间范围

---

## 8. 交互规范

### 8.1 加载状态
**骨架屏（Skeleton）**
```css
.skeleton {
  background: linear-gradient(90deg,
    #F5F5F5 25%,
    #EEEEEE 50%,
    #F5F5F5 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Loading图标**
- 全局Loading：屏幕中心，圆形Spinner，颜色`#00843D`，大小48px
- 按钮Loading：按钮内小型Spinner，大小16px，白色

### 8.2 提示与反馈
**Toast通知**
- 位置：屏幕右上角，距离顶部80px
- 尺寸：最小宽度320px，高度自适应
- 持续时间：成功3秒，错误5秒，可手动关闭
- 样式：背景白色，左侧4px色条（成功绿/错误红/信息蓝）

**Modal对话框**
- 遮罩：背景`rgba(0,0,0,0.5)`
- 对话框：宽度480px，圆角8px，阴影`0 8px 24px rgba(0,0,0,0.16)`
- 标题栏：高度60px，背景`#FAFAFA`
- 按钮区：右对齐，按钮间距12px

### 8.3 动画时长
```css
--duration-fast: 150ms;    /* 悬停、点击反馈 */
--duration-base: 200ms;    /* 下拉菜单、Accordion展开 */
--duration-slow: 300ms;    /* 页面切换、抽屉滑入 */
--duration-chart: 500ms;   /* 图表动画 */

/* 缓动函数 */
--easing-in: cubic-bezier(0.4, 0, 1, 1);
--easing-out: cubic-bezier(0, 0, 0.2, 1);
--easing-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 9. 关键页面设计要点

### 9.1 Dashboard主页
**布局**：2x2网格卡片布局
- 左上：LCR/NSFR趋势折线图（占2列）
- 右上：审批状态统计卡片
- 左下：Variance Top 10柱状图
- 右下：阈值超标饼图

**关键指标卡片**
- 背景：渐变色（LCR用绿色渐变，NSFR用蓝色渐变）
- 数值：48px大字体，字重700
- 趋势箭头：↑红色（上升）/↓绿色（下降）

### 9.2 Product View - Deposits
**表格列配置**
- Region（100px）| Internal Category（150px）| Product（180px）| Sub-Product（150px）| PID（120px）| Current（120px）| Prev（120px）| Variance（120px）| Threshold（100px）| Commentary图标（60px）

**行操作**
- 点击行：高亮选中，右侧显示Commentary抽屉
- 悬停Variance单元格：显示Tooltip说明计算公式
- 点击Commentary图标：直接打开注释编辑

### 9.3 LCR View
**指标展示卡片**
- HQLA卡片：绿色边框，显示总额和明细
- NCO卡片：蓝色边框，显示净流出计算
- LCR Ratio卡片：主色边框，显著展示百分比，<100%时整个卡片标红

**明细表格**
- 支持按Region/Product分组折叠
- 每组小计行：背景`#FAFAFA`，字重500
- 总计行：背景`#E8F5E9`，字重600

### 9.4 Maker Workspace
**三列布局**
- 左侧（30%）：待处理项列表，按Region分组
- 中间（40%）：数据表格，支持内联编辑
- 右侧（30%）：Commentary面板，实时保存

**操作流程指示**
- 顶部进度条：Review → Adjust → Comment → Submit（4步）
- 当前步骤：主色高亮，已完成步骤打勾

### 9.5 Checker Workspace
**审批卡片**
- Maker信息：头像+姓名+提交时间
- Summary表格：仅显示有Variance的项
- Adjustments历史：Before/After对比表格，调整原因单独列
- 操作按钮：Approve（绿）/Reject（红）/Escalate（橙），等宽排列

---

## 10. 开发实现指南

### 10.1 推荐技术栈
**前端框架**：React 18+ 或 Vue 3+
**UI组件库**：Ant Design 5.x（推荐，符合企业级需求）或 Material-UI
**图表库**：ECharts 5.x（支持复杂金融图表）
**状态管理**：Redux Toolkit（React）/ Pinia（Vue）
**表格组件**：AG Grid（处理大数据集）

### 10.2 CSS变量定义
```css
:root {
  /* 品牌色 */
  --color-primary: #00843D;
  --color-primary-dark: #005A29;
  --color-primary-light: #E8F5E9;

  /* 功能色 */
  --color-warning: #FFC107;
  --color-error: #E53935;
  --color-info: #1976D2;
  --color-escalate: #FF6F00;
  --color-success: #4CAF50;

  /* 中性色 */
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #4A4A4A;
  --color-text-tertiary: #757575;
  --color-border: #E0E0E0;
  --color-bg-page: #F5F5F5;
  --color-bg-card: #FFFFFF;

  /* 间距 */
  --spacing-xs: 8px;
  --spacing-sm: 16px;
  --spacing-md: 24px;
  --spacing-lg: 32px;
  --spacing-xl: 48px;

  /* 圆角 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* 阴影 */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.16);

  /* 动画 */
  --duration-fast: 150ms;
  --duration-base: 200ms;
  --duration-slow: 300ms;
}
```

### 10.3 组件库定制指南
**Ant Design主题配置**
```javascript
// theme.config.js
export default {
  token: {
    colorPrimary: '#00843D',
    colorSuccess: '#4CAF50',
    colorWarning: '#FFC107',
    colorError: '#E53935',
    colorInfo: '#1976D2',
    borderRadius: 4,
    fontSize: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    Button: {
      controlHeight: 44,
      paddingContentHorizontal: 24,
    },
    Table: {
      headerBg: '#FAFAFA',
      rowHoverBg: '#F5F5F5',
    },
  },
};
```

### 10.4 响应式实现要点
- 使用CSS Grid布局主内容区（自适应列宽）
- 表格在1280px以下启用横向滚动
- 导航在1440px以下收缩为图标模式
- 所有触摸目标≥44px（符合WCAG 2.1标准）

### 10.5 性能优化建议
- 虚拟滚动：使用react-window处理1000+行表格
- 懒加载：图表组件按需加载
- 防抖：筛选器查询添加300ms防抖
- 缓存：Redux缓存查询结果，避免重复请求

---

**文档版本**：v1.0
**更新日期**：2025-10-06
**设计负责人**：UI/UX团队

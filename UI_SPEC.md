# LEAP UI 规范文档 (UI Specification)

本文档基于当前 React 版本 (leap-react) 的 UI 提取，**Angular 版本必须按此规范实现**，以保证两套产品视觉与交互一致。

---

## 1. 设计令牌 (Design Tokens)

### 1.1 品牌色
| 变量名 | 色值 | 用途 |
|--------|------|------|
| color-primary | `#00843D` | 主色（按钮、链接、焦点、选中） |
| color-primary-dark | `#133F28` | 侧栏背景、深色区域 |
| color-primary-light | `#E8F5E9` | 浅色背景/高亮 |
| 侧栏实际背景 | `#005A29` | Sider/Layout 深绿（可覆盖 primary-dark） |

### 1.2 状态色
| 状态 | 色值 | 用途 |
|------|------|------|
| draft | `#9E9E9E` | 草稿 |
| pending | `#1976D2` | 待审 |
| approved | `#4CAF50` | 已批准 |
| rejected | `#E53935` | 已拒绝 |
| escalated | `#FF6F00` | 升级 |
| error | `#E53935` / `#AD1100` | 错误边框/文字 |
| success | `#4CAF50` | 成功 |
| warning | `#FFC107` | 警告 |

### 1.3 中性色
| 变量 | 色值 |
|------|------|
| text-primary | `#1A1A1A` |
| text-secondary | `#4A4A4A` |
| text-hint | `#757575` |
| text-white | `#FFFFFF` |
| border | `#E0E0E0` |
| border-medium | `#BDBDBD` |
| background / bg-page | `#F5F5F5` |
| bg-card / surface | `#FFFFFF` |
| bg-hover | `#FAFAFA` |

### 1.4 字体
- **font-family**: `'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
- **font-size**: h1 28px, h2 24px, h3 20px, h4 18px, body 16px, caption 14px, small 12px
- **font-weight**: light 300, regular 400, medium 500, bold 700

### 1.5 间距
- xs: 8px, sm: 16px, md: 24px, lg: 32px, xl: 48px
- 表单项间距：表单项之间 margin-bottom 20px；表单项与按钮间距 8px

### 1.6 布局尺寸
- header-height: **64px**
- sidebar-width: **270px**
- sidebar-collapsed-width: **80px**
- 主内容区 padding: **24px**（或 24px 12px 12px 12px，上 24 其余 12）
- 主内容区高度：**calc(100vh - 64px)**，overflow-y: auto

### 1.7 圆角与按钮
- 卡片/容器：**border-radius: 0**（直角）
- 按钮：**border-radius: 0**（方角）
- 输入框：上左、上右 4px，下左、下右 0（下边线加粗表示焦点）
- 小圆角：4px（如 Tag 用 12px）

### 1.8 阴影
- shadow-sm: `0 1px 3px rgba(0,0,0,0.08)`
- 登录卡片: `0 2px 8px rgba(0,0,0,0.1)`

### 1.9 动效
- duration-base: 200ms
- easing-out: cubic-bezier(0, 0, 0.2, 1)

---

## 2. 组件规范

### 2.1 按钮 (Button)（设计系统标准，全局复用）
- **主按钮**：背景 `#058901`，hover `#047001`，文字白色，**字重 500**，**圆角 0**，高度 **40px**，左右 padding **24px**；全局 `.ant-btn` 统一 border-radius: 0、font-weight: 500
- **次要/取消按钮**：白底，边框 **2px** `#00843D`，文字 `#00843D`，hover 背景 rgba(0,132,61,0.05)，**圆角 0**，高度 40px
- **disabled**：背景 `#F9F9F9`，边框 `#CCCCCC`，文字 `#CCCCCC`

### 2.2 输入框 (Input / TDInput)
- 高度：**54px**（顶栏搜索框为 **40px**）
- 边框：默认 **#8C8C8C**，1px；hover/focus：**下边 3px，颜色 #008A00**，其余边保持 1px #8C8C8C
- 上左/上右圆角 4px，下左/下右 0
- 文字：16px，字重 500，颜色 #1A1A1A；placeholder #1C1C1C
- 错误态：下边 3px #AD1100，错误文案 12px，#AD1100，字重 600
- 可选：leading/suffix 图标；清除按钮；浮动 label（无 label 时用 placeholder 做浮动 label）

**登录页带浮动标签的输入框（已定稿）：**
- 前缀图标：**20×20**，颜色 **#8C8C8C**；与文字间距 margin-right 8px；浮动标签 left 与图标对齐：**40px**（12 + 20 + 8）
- **浮动标签（如 Username*、Password*）**
  - 默认（未聚焦、无内容）：**垂直居中**，`top: 50%`，`transform: translateY(-50%)`；字号 16px，字重 **400**，颜色 #1C1C1C
  - 上浮（聚焦或有内容）：`top: 8px`，`transform: none`；字号 **12px**，颜色 #1C1C1C
- **输入值文字**（如 Maker）：与标签拉开间距，**padding-top: 15px**；padding-left 0，margin-left -1px；字号 16px，字重 500，颜色 #1A1A1A

### 2.3 下拉 (Select / TDSelect)
- 与 Input 同高 **54px**，同边框与焦点规则（下边 3px #008A00）
- 占位符 #9E9E9E 或 #757575；选中项字重 500
- 下拉箭头 #6B6B6B，hover/focus #00843D；箭头为 CSS 三角，打开时旋转并下移 4px
- 选项选中背景 rgba(0,132,61,0.1)，文字 #00843D

**调用方式（设计系统）：**  
样式已沉淀到 `LEAP-Angular2/src/styles/_select-dropdown.scss`。  
- **Select 触发器**：在页面 SCSS 中 `@use '.../styles/select-dropdown' as leap-dropdown;`，在 `:host ::ng-deep { @include leap-dropdown.leap-select-trigger('.你的类名'); }`。  
- **下拉面板**：已在全局 `styles.scss` 中通过 `leap-select-dropdown-panel()` 引入，无需页面单独写。  
- 可调变量：`$leap-select-height`、`$leap-select-focus-underline`、`$leap-select-arrow-active` 等（见该文件顶部）。

### 2.4 日期选择器 (DatePicker)
- 与 Input 同高 **54px**，同边框、圆角、焦点规则（下边 3px #008A00，border #8b8b8b）
- 字体与 Input 一致

**调用方式（设计系统）：**  
同上，使用 `_select-dropdown.scss` 中的 `leap-datepicker-trigger('.你的类名')`；DatePicker 下拉面板已通过 `leap-datepicker-dropdown-panel()` 在全局引入。

### 2.5 表单 (Form)
- label：14px，颜色 #1A1A1A，必填星号 #E53935
- item margin-bottom: 20px
- 所有表单控件统一使用上述 Input/Select/DatePicker 规范

### 2.6 卡片 (Card)
- 背景 #FFFFFF，**border-radius: 0**
- 标题区可含 h2 18px + subtitle 14px #757575

### 2.7 状态标签 (Status Badge / Tag)
- 圆角 12px，字体 12px，字重 500，高度约 24px，padding 6px 12px
- 颜色与 1.2 状态色一致（draft/pending/approved/rejected/escalated）

### 2.8 错误提示 / Notification (Alert Error)（设计系统标准，全局复用）
- **容器**：背景 **#F8E7E8**，无边框，圆角 **4px**，**padding: 10px 14px**；`display: flex`，**gap: 0**；内容区 `margin-left: 2px`
- **标题 (message)**：**13px**，**字重 600**，颜色 **#1A1A1A**
- **描述 (description)**：**12px**，**字重 400**，颜色 #1A1A1A
- **图标**：**必显**，与标题首行对齐；**14×14**，颜色 **#AD1100**；推荐使用自定义 SVG（红圆 #AD1100 + 白色感叹号），`align-items: flex-start`，`margin-top: 2px`；图标与文字间距由 content 的 margin-left: 2px 控制
- 全局 error 类 / nzType="error" 的 alert 均采用此样式，登录失败、表单校验错误等统一复用

---

## 3. 布局规范

### 3.1 主布局 (MainLayout)
- 整页：flex 行向，高度 100vh，背景 #F5F5F5
- 内容区：flex 列向，flex: 1，min-width: 0，overflow: hidden
- 主内容 (main-content-wrapper)：背景 #F5F5F5，padding 24px（或 24 12 12 12），**高度 calc(100vh - 64px)**，overflow-y: auto

### 3.2 侧栏 (Sidebar)
- 背景 **#005A29**（或 #133F28）
- 宽度 270px，折叠 80px
- Logo 48×48；标题 24px 字重 600 白色，副标题 11px rgba(255,255,255,0.7)
- 折叠按钮：40×40，圆角 8px，背景 rgba(255,255,255,0.1)，hover #1f5a35
- 导航树：见 3.3

### 3.3 导航树 (NavigationTree)
- 一级：高度 40px，padding 0 16px；图标 18px，颜色 #96a496；选中/有子选中时图标 #00b624，背景 #0c321e，文字 #fff
- 二级：左侧缩进，小圆点 3px，未选 #96a496，选中 #00b624
- 三级：再缩进，小圆点 3px，同色系
- hover：背景 rgba(255,255,255,0.05)，文字 rgba(255,255,255,0.9)
- 展开箭头：CSS 三角，未展开 45deg，展开 225deg

### 3.4 顶栏 (Header)
- 高度 **64px**，背景 #FFFFFF，下边框 1px #E0E0E0，阴影 0 1px 3px rgba(0,0,0,0.04)
- **搜索框**：高度 **40px**；边框 #8C8C8C，focus 下边 3px #008A00；**前缀图标 16×16，颜色 #008A00**；有内容时显示清除按钮（圆 22px，背景 #F5F5F5，hover #E0E0E0）
- 通知图标 + 用户头像（如 34px 圆，紫色系 #aa50de 或品牌绿）

---

## 4. 页面级规范

### 4.1 登录页 (Login)
- 整页背景 #f5f5f5，居中
- 卡片：白底，圆角 8px，阴影 0 2px 8px rgba(0,0,0,0.1)，padding 40px，max-width 480px
- 卡片头：Logo 48×48 + 标题 “LEAP” 28px #424242 + 副标题 14px #757575
- **输入框**：带前置图标（用户/锁）与浮动标签；边框 **#8C8C8C**；浮动标签默认垂直居中、字重 400，上浮后 top 8px、12px；输入值 padding-top 15px 与标签拉开间距；详见 2.2「登录页带浮动标签的输入框」
- 表单项间距 20px；按钮区 margin-top 8px, margin-bottom 24px；主按钮/取消按钮遵守 2.1
- 底部说明区：margin-top 24px，padding-top 24px，上边框 1px #e0e0e0，文案 13px #757575

### 4.2 内容页通用
- 页面标题：24px，字重 600，与图标间距 8px
- Report Config 卡片：标题 h2 18px，subtitle 14px #757575，表单项遵守 2.2–2.5

### 4.3 表格 (AG Grid)
- 使用 ag-theme-material
- 表头背景 #FAFAFA，文字 #1A1A1A
- 行 hover #F5F5F5
- 方差告警行背景 #fff9e6，字重 600
- 全局字体与设计令牌一致

---

## 5. 全局与覆盖

- 所有 Ant Design / ng-zorro 组件需覆盖为上述 font-family
- Layout：sider 背景 #005A29 或 #133F28；header #FFFFFF；body #F5F5F5
- 按钮、输入、选择、日期、表单、卡片、菜单、下拉、提示等均使用 Graphik 字体
- **按钮**与**错误提示 (Alert Error)** 以 2.1、2.8 为设计系统标准，全局复用；避免页面级单独覆盖（主按钮 #058901、取消 outline #00843D、error alert padding 10px 14px / 图标 14×14 等）

---

## 6. 实施检查清单（Angular）

- [x] 设计令牌（颜色、字体、间距、圆角）与本文档一致 → `LEAP-Angular2/src/styles/_variables.scss`
- [x] 主布局与主内容区高度、padding 一致 → `styles.scss` .main-layout / .main-content-wrapper
- [x] 侧栏背景 #005A29、Logo、标题、折叠按钮样式一致 → sidebar.component.scss 使用 $sidebar-bg
- [x] 导航树层级、颜色、选中/hover 一致 → navigation-tree.component.scss
- [x] 顶栏高度 64px、阴影、搜索与用户区一致 → header.component.scss
- [x] 登录页卡片、标题、表单、按钮、错误提示一致 → login.component.scss + 全局 error alert
- [x] 所有按钮圆角 0；主按钮 #058901 → 全局 .ant-btn border-radius: 0；登录主按钮 #058901
- [x] 输入/选择 高度与焦点样式 → 全局 input 54px、focus 下边 #008A00
- [x] 卡片圆角 0；错误 Alert #F8E7E8 → 全局 .ant-card、.ant-alert-error
- [x] 错误提示与按钮为设计系统标准，全局复用 → styles.scss .ant-btn / .ant-alert-error；新页面直接使用，勿新增覆盖
- [x] AG Grid 表头 #FAFAFA，字体与令牌一致 → styles.scss .ag-header

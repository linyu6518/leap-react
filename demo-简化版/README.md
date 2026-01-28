# 🎬 LEAP 简化演示版

**立即可查看，无需安装任何依赖！**

---

## 🚀 如何查看演示

### 方法1：双击打开（最简单）

1. 打开 Finder
2. 找到文件：`/Users/lin/Liquidity Explain & Analytics Platform (LEAP)/demo-简化版/index.html`
3. 双击文件，浏览器会自动打开

### 方法2：命令行打开

```bash
open "/Users/lin/Liquidity Explain & Analytics Platform (LEAP)/demo-简化版/index.html"
```

### 方法3：拖拽到浏览器

将 `index.html` 文件拖拽到Chrome/Safari浏览器窗口

---

## 📍 演示内容

### 5个核心页面

1. **📊 Dashboard** - 仪表盘
   - 统计卡片（Draft/Pending/Approved/Alerts）
   - LCR/NSFR趋势图占位符
   - Variance Top 10图表占位符

2. **💰 Deposits** - 产品分析
   - Query Panel查询面板（Region/Segment/Date筛选器）
   - 产品数据表格（5行示例数据）
   - Variance超阈值黄色高亮
   - 5种状态标签（Draft/Pending/Approved/Rejected）

3. **📈 LCR View** - LCR监管视图
   - 3个关键指标卡片（HQLA/NCO/LCR Ratio）
   - LCR产品分布表格
   - 合规状态标识

4. **✏️ Maker Workspace** - Maker工作区
   - 操作按钮（Review/Commentary/Submit）
   - My Drafts列表

5. **✓ Checker Workspace** - Checker工作区
   - Pending Approvals待审批列表（12个）
   - Approve/Reject操作按钮
   - Recently Approved已批准列表

---

## 🎨 设计展示

### TD品牌绿主题
- **主色调**：#00843D（TD品牌绿）
- **深绿导航**：#005A29
- **左侧导航栏**：深绿色背景，白色文字
- **TD Logo**：白色方块+绿色字母

### 核心UI组件
- ✅ 统计卡片（白色背景+阴影）
- ✅ 数据表格（斑马纹+悬停高亮）
- ✅ 状态标签（5种颜色编码）
- ✅ Variance预警（黄色背景高亮）
- ✅ 查询面板（浅灰背景）
- ✅ 按钮（TD绿主色）

### 状态色系统
- 🟦 **Draft（草稿）** - 灰色 #F5F5F5
- 🔵 **Pending Review（待审批）** - 蓝色 #E3F2FD
- 🟢 **Approved（已批准）** - 绿色 #E8F5E9
- 🔴 **Rejected（已驳回）** - 红色 #FFEBEE

---

## 💡 演示要点

### Variance阈值预警
- 表格中黄色高亮的行表示Variance超过Threshold
- 绿色↑表示正向变化
- 红色↓表示负向变化

### 导航交互
- 点击左侧导航切换页面
- 当前页面高亮显示（绿色背景+白色左边框）

### Maker-Checker流程
- Maker提交 → Checker审批 → Approved状态
- 完整的工作流可视化

---

## 🆚 与完整版的区别

### 简化演示版（当前）
- ✅ 单个HTML文件
- ✅ 无需安装依赖
- ✅ 立即可查看
- ✅ 展示核心UI和布局
- ❌ 无真实图表（占位符）
- ❌ 无交互功能（按钮仅展示）
- ❌ 无后端连接

### 完整Angular版
- ✅ 完整的Angular 17应用
- ✅ 真实的ECharts图表
- ✅ AG Grid企业级表格
- ✅ NgRx状态管理
- ✅ 完整交互功能
- ✅ 可扩展架构
- ⚠️ 需要修复SCSS配置才能运行

---

## 🎯 使用场景

### 适合用于：
- ✅ **产品演示** - 展示界面和布局给客户
- ✅ **需求确认** - 确认页面结构和功能
- ✅ **UI Review** - 检查设计是否符合要求
- ✅ **培训材料** - 作为培训演示使用

### 不适合用于：
- ❌ 真实数据处理
- ❌ 生产环境部署
- ❌ 性能测试

---

## 📞 技术说明

### 技术栈
- **纯HTML + CSS + JavaScript** - 无框架依赖
- **响应式布局** - 适配桌面浏览器
- **TD品牌定制** - 完整配色系统

### 文件大小
- 单个HTML文件：约20KB
- 无图片、无外部依赖
- 加载速度：< 1秒

### 浏览器兼容
- ✅ Chrome 90+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Firefox 88+

---

## 🔄 下一步

### 如果你满意这个演示：
1. 可以基于此HTML设计完善完整的Angular应用
2. 或者直接使用 `/leap-angular/` 目录的Angular版本（需修复SCSS配置）

### 如果需要完整功能：
1. 参考 `BACKEND_DEPLOYMENT_PLAN.md` 实现后端API
2. 修复Angular项目的SCSS配置
3. 集成真实的ECharts图表和AG Grid表格

---

## ✅ 总结

**这个简化演示版：**
- ✅ 立即可查看，无需安装
- ✅ 展示完整的UI设计
- ✅ 覆盖5个核心页面
- ✅ TD品牌绿完整应用
- ✅ 适合产品演示和需求确认

**现在就双击 `index.html` 开始查看吧！** 🎉

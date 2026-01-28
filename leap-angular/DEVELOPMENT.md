# LEAP开发文档

## 开发环境配置

### 必需工具
- **Node.js**: 18.13.0+
- **npm**: 9.0.0+
- **Angular CLI**: 17.3.0
- **Visual Studio Code** (推荐)

### VS Code推荐扩展
```json
{
  "recommendations": [
    "angular.ng-template",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "nrwl.angular-console"
  ]
}
```

## 项目初始化

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start

# 运行在端口4200
# http://localhost:4200
```

## 核心技术架构

### 1. 模块化设计

#### CoreModule (单例服务)
- 只在AppModule中导入一次
- 包含全局服务(API、Auth、State)
- 使用构造函数防止重复导入

```typescript
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule已加载，请勿重复导入');
    }
  }
}
```

#### SharedModule (共享组件)
- 在功能模块中重复导入
- 导出Material模块、AG Grid、ECharts
- 包含StatusBadge、QueryPanel等共享组件

#### 功能模块 (懒加载)
```typescript
// app-routing.module.ts
{
  path: 'dashboard',
  loadChildren: () => import('./features/dashboard/dashboard.module')
    .then(m => m.DashboardModule)
}
```

### 2. NgRx状态管理

#### State结构
```typescript
// workflow.reducer.ts
export interface WorkflowState {
  workflows: Workflow[];
  loading: boolean;
  error: any;
}
```

#### Actions
```typescript
// workflow.actions.ts
export const loadWorkflows = createAction('[Workflow] Load Workflows');
export const updateWorkflowStatus = createAction(
  '[Workflow] Update Status',
  props<{ id: number; status: WorkflowStatus }>()
);
```

#### 使用示例
```typescript
// 组件中使用
constructor(private store: Store) {}

ngOnInit() {
  this.store.dispatch(loadWorkflows());
  this.workflows$ = this.store.select(selectAllWorkflows);
}
```

### 3. Angular Material主题定制

#### TD绿色主题配置
```scss
// td-green-theme.scss
$td-green-palette: (
  500: #00843D,  // 主色
  600: #006B32,  // 悬停
  700: #005A29,  // 导航背景
  ...
);

$leap-primary: mat.define-palette($td-green-palette, 500);
$leap-theme: mat.define-light-theme(...);
@include mat.all-component-themes($leap-theme);
```

#### 组件样式覆盖
```scss
// 按钮主色覆盖
.mat-mdc-raised-button.mat-primary {
  background-color: #00843D !important;
  &:hover { background-color: #006B32 !important; }
}
```

### 4. AG Grid集成

#### 基础配置
```typescript
columnDefs: ColDef[] = [
  {
    field: 'variance',
    cellClassRules: {
      'variance-alert': params => Math.abs(params.value) > params.data.threshold
    }
  }
];

defaultColDef: ColDef = {
  sortable: true,
  resizable: true,
  filter: true
};
```

#### 自定义单元格渲染
```typescript
{
  headerName: 'Commentary',
  cellRenderer: () => '<button class="commentary-btn">...</button>',
  onCellClicked: params => this.openCommentary(params.data)
}
```

### 5. ECharts数据可视化

#### 折线图配置
```typescript
trendChartOption: EChartsOption = {
  title: { text: 'LCR/NSFR Trend' },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: months },
  yAxis: { type: 'value' },
  series: [{
    name: 'LCR',
    type: 'line',
    data: lcrData,
    smooth: true,
    lineStyle: { color: '#00843D' }
  }]
};
```

#### HTML模板
```html
<div echarts [options]="trendChartOption" class="chart"></div>
```

## 组件开发指南

### 1. 智能组件 vs 展示组件

#### 智能组件 (Container)
```typescript
@Component({
  selector: 'app-deposits',
  // 处理业务逻辑、状态管理、API调用
})
export class DepositsComponent {
  constructor(
    private mockDataService: MockDataService,
    private store: Store
  ) {}
}
```

#### 展示组件 (Presentational)
```typescript
@Component({
  selector: 'app-status-badge',
  // 只接收@Input，通过@Output发送事件
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBadgeComponent {
  @Input() status: WorkflowStatus = 'draft';
}
```

### 2. 表单开发

#### Reactive Forms
```typescript
queryForm: FormGroup;

ngOnInit() {
  this.queryForm = this.fb.group({
    regions: [[]],
    segments: [[]],
    prevDate: [null],
    currDate: [new Date()]
  });
}
```

#### 表单验证
```typescript
commentForm = this.fb.group({
  content: ['', [
    Validators.required,
    Validators.minLength(10)
  ]]
});
```

### 3. 路由和导航

#### 懒加载配置
```typescript
// app-routing.module.ts
{
  path: 'product',
  loadChildren: () => import('./features/product-analysis/product-analysis.module')
    .then(m => m.ProductAnalysisModule)
}
```

#### 面包屑导航
```typescript
// header.component.ts
createBreadcrumbs(): Breadcrumb[] {
  const url = this.router.url;
  // 解析URL生成面包屑
}
```

## 样式开发规范

### 1. SCSS变量使用
```scss
@import 'styles/variables';

.my-component {
  padding: $spacing-md;
  color: $color-text-primary;
  border-radius: $radius-sm;
}
```

### 2. BEM命名规范
```scss
.query-panel {              // Block
  &__filter { ... }         // Element
  &--expanded { ... }       // Modifier
}
```

### 3. 响应式设计
```scss
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}
```

## 测试策略

### 单元测试
```typescript
describe('StatusBadgeComponent', () => {
  it('should display correct status', () => {
    component.status = 'approved';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Approved');
  });
});
```

### E2E测试
```typescript
// TODO: 添加Cypress/Playwright配置
```

## 性能优化

### 1. OnPush变更检测
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

### 2. TrackBy函数
```typescript
// HTML
<div *ngFor="let item of items; trackBy: trackByFn">

// Component
trackByFn(index: number, item: any) {
  return item.id;
}
```

### 3. 虚拟滚动(大数据集)
```html
<cdk-virtual-scroll-viewport itemSize="50">
  <div *cdkVirtualFor="let item of items">{{ item }}</div>
</cdk-virtual-scroll-viewport>
```

## 调试技巧

### 1. NgRx DevTools
```typescript
// 浏览器中使用Redux DevTools Extension
// 查看State变化和Action历史
```

### 2. Angular DevTools
- Chrome扩展: Angular DevTools
- 查看组件树和变更检测

### 3. Console调试
```typescript
// 开发环境启用详细日志
if (!environment.production) {
  console.log('Debug info:', data);
}
```

## 部署流程

### 1. 构建
```bash
# 生产构建
npm run build:prod

# 输出目录
dist/leap-angular/
```

### 2. 环境配置
```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.tdbank.com/leap',
  mockDataEnabled: false
};
```

### 3. 静态文件部署
- Nginx配置
- 路由fallback到index.html
- GZIP压缩

## 常见问题

### 1. Material主题不生效
**原因**: 未正确导入主题文件
**解决**: 在angular.json的styles中添加
```json
"styles": [
  "src/assets/themes/td-green-theme.scss",
  "src/styles.scss"
]
```

### 2. AG Grid样式错误
**原因**: 缺少主题class
**解决**:
```html
<ag-grid-angular class="ag-theme-material">
```

### 3. ECharts不显示
**原因**: 容器高度为0
**解决**:
```scss
.chart {
  width: 100%;
  height: 350px; // 明确高度
}
```

### 4. 路径别名不工作
**原因**: tsconfig.json配置错误
**解决**:
```json
"paths": {
  "@core/*": ["src/app/core/*"],
  "@shared/*": ["src/app/shared/*"]
}
```

## 代码审查清单

- [ ] 组件使用OnPush策略
- [ ] 表单使用ReactiveFormsModule
- [ ] 使用TrackBy优化*ngFor
- [ ] SCSS变量代替硬编码色值
- [ ] 类型定义完整(no any)
- [ ] 错误处理完善
- [ ] 关键逻辑有注释
- [ ] 响应式设计实现

## 下一步开发

### 短期目标 (1-2周)
- [ ] 完善NgRx Effects
- [ ] 实现真实API集成
- [ ] 添加单元测试
- [ ] Excel导出功能

### 中期目标 (1个月)
- [ ] WebSocket实时协作
- [ ] 高级权限控制
- [ ] 审计日志完善
- [ ] 性能监控

### 长期目标 (3个月)
- [ ] 微前端架构
- [ ] PWA支持
- [ ] 国际化(i18n)
- [ ] 移动端优化

---

**维护团队**: 前端开发组
**最后更新**: 2025-10-06

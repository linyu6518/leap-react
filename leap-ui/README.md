# LEAP UI – 控件库 (React + Angular)

基于当前 LEAP 项目 TD 品牌样式整理出的**设计令牌**与**两套控件库**（React / Angular），需要时在任意新项目中安装或引用即可使用。

---

## 目录结构

```
leap-ui/
├── tokens/           # 设计令牌（两套共用）
│   ├── variables.scss   # SCSS 变量
│   ├── tokens.json      # JSON 令牌
│   └── css-vars.css     # CSS 自定义属性
├── react/            # React 控件库 @leap/ui-react
│   ├── src/
│   │   ├── TDInput.tsx / TDSelect.tsx / StatusBadge.tsx
│   │   ├── theme.ts     # Ant Design ConfigProvider theme
│   │   └── index.ts
│   └── package.json
├── angular/          # Angular 控件库 @leap/ui-angular
│   ├── src/lib/
│   │   ├── td-input/ td-select/ status-badge/
│   │   ├── leap-ui-angular.module.ts
│   │   └── theme.ts     # ng-zorro-antd 主题
│   └── package.json
└── README.md
```

---

## 1. 设计令牌 (tokens)

可在任意技术栈中引用：

- **SCSS**：`@use 'path/to/leap-ui/tokens/variables.scss' as *;`
- **CSS**：在页面或根组件引入 `tokens/css-vars.css`，使用 `var(--leap-primary)` 等
- **JSON**：`tokens/tokens.json` 供脚本或设计工具使用

---

## 2. React 控件库 (@leap/ui-react)

### 安装

在 React 项目根目录：

```bash
# 本地引用（未发布 npm 时）
npm install file:./path/to/leap-ui/react

# 或先构建再 link
cd leap-ui/react && npm install && npm run build
cd your-app && npm link ../leap-ui/react
```

### 依赖

需已安装：`react`, `react-dom`, `antd`, `@ant-design/icons`。

### 使用

```tsx
import { ConfigProvider } from 'antd'
import { TDInput, TDSelect, StatusBadge, leapTheme } from '@leap/ui-react'
import '@leap/ui-react/dist/styles/index.css'  // 若构建出 CSS

function App() {
  return (
    <ConfigProvider theme={leapTheme}>
      <TDInput label="Name" placeholder="Enter name" />
      <TDSelect
        label="Region"
        placeholder="Select"
        options={[{ label: 'Americas', value: 'americas' }]}
      />
      <StatusBadge status="approved" />
    </ConfigProvider>
  )
}
```

### 构建

```bash
cd leap-ui/react
npm install
npm run build
```

产物在 `dist/`，主入口为 `index.mjs` / `index.js`，类型为 `index.d.ts`。

---

## 3. Angular 控件库 (@leap/ui-angular)

### 安装

在 Angular 项目中：

```bash
# 本地引用
npm install file:./path/to/leap-ui/angular
```

依赖：`@angular/common`, `@angular/core`, `ng-zorro-antd`。

### 使用

在 `app.config.ts` 或根模块中引入主题（可选）：

```ts
import { provideNzConfig } from 'ng-zorro-antd/core/config'
import { leapTheme } from '@leap/ui-angular'

// 若使用 standalone 或 provideNzConfig
providers: [provideNzConfig(leapTheme)]
```

在需要控件的模块中：

```ts
import { LeapUiAngularModule } from '@leap/ui-angular'

@NgModule({
  imports: [LeapUiAngularModule],
  // ...
})
export class YourModule {}
```

模板中：

```html
<leap-td-input
  [(ngModel)]="name"
  label="Name"
  placeholder="Enter name"
  [error]="nameError"
></leap-td-input>

<leap-td-select
  [(ngModel)]="region"
  label="Region"
  placeholder="Select"
  [nzOptions]="regionOptions"
  [error]="regionError"
></leap-td-select>

<leap-status-badge status="approved"></leap-status-badge>
```

### 构建（若用 ng-packagr）

在 `leap-ui/angular` 目录：

```bash
npm install
npx ng-packagr -p ng-package.json
```

---

## 4. 组件一览

| 组件 | React | Angular | 说明 |
|------|--------|---------|------|
| 输入框 | `<TDInput />` | `<leap-td-input>` | 带 label、浮动占位、错误、helper |
| 下拉 | `<TDSelect />` + `Option` | `<leap-td-select>` | 同风格 |
| 状态标签 | `<StatusBadge status="..." />` | `<leap-status-badge status="...">` | draft / pending / approved / rejected / escalated |
| 主题 | `leapTheme` (Ant Design) | `leapTheme` (NzConfig) | 供 ConfigProvider / provideNzConfig 使用 |

---

## 5. 需要时再调用

- **仅用样式**：只引用 `tokens/` 下的 SCSS 或 CSS。
- **React 项目**：安装 `@leap/ui-react`，按上面示例引入组件和主题。
- **Angular 项目**：安装 `@leap/ui-angular`，导入 `LeapUiAngularModule` 并使用 `leap-*` 组件。

两套控件库与 LEAP 当前 UI 保持一致，按需选用即可。

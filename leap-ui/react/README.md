# @leap/ui-react

LEAP UI 控件库 - React 版（TD 品牌样式）。

## 安装

```bash
npm install react react-dom antd @ant-design/icons
# 本地引用
npm install file:../path/to/leap-ui/react
```

## 使用

```tsx
import { ConfigProvider } from 'antd'
import { TDInput, TDSelect, StatusBadge, leapTheme } from '@leap/ui-react'

<ConfigProvider theme={leapTheme}>
  <TDInput label="Name" placeholder="Enter" />
  <TDSelect label="Region" options={[{ value: 'a', label: 'Americas' }]} />
  <StatusBadge status="approved" />
</ConfigProvider>
```

## 构建

```bash
npm install && npm run build
```

产出在 `dist/`。

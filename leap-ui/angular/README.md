# @leap/ui-angular

LEAP UI 控件库 - Angular 版（TD 品牌样式），基于 ng-zorro-antd。

## 依赖

- Angular 17+
- ng-zorro-antd 17+

## 使用

1. 将本库复制到你的 Angular 工作区内，或通过 `path` 引用。
2. 在模块中导入：

```ts
import { LeapUiAngularModule } from '@leap/ui-angular'

@NgModule({
  imports: [LeapUiAngularModule],
})
export class YourModule {}
```

3. 模板中：

```html
<leap-td-input [(ngModel)]="name" label="Name" placeholder="Enter"></leap-td-input>
<leap-td-select [(ngModel)]="region" label="Region" [nzOptions]="options"></leap-td-select>
<leap-status-badge status="approved"></leap-status-badge>
```

## 构建

在已有 Angular 工作区内用 `ng build your-lib` 构建；若单独用 ng-packagr：`npx ng-packagr -p ng-package.json`。

import { Component } from '@angular/core'
import { IHeaderAngularComp } from 'ag-grid-angular'
import { IHeaderParams } from 'ag-grid-community'

@Component({
  selector: 'app-deposits-header',
  standalone: true,
  template: `
    <div class="deposits-col-header">
      <div class="header-title">Deposits</div>
      <div class="header-subtitle">(Amount in Millions CAD)</div>
    </div>
  `,
  styles: [`
    .deposits-col-header {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 8px 0;
    }
    .header-title {
      font-weight: 600;
      font-size: 14px;
      color: #1a1a1a;
    }
    .header-subtitle {
      font-weight: 400;
      font-size: 12px;
      color: #1890ff;
      margin-top: 2px;
    }
  `],
})
export class DepositsHeaderRendererComponent implements IHeaderAngularComp {
  agInit(_params: IHeaderParams): void {}
  refresh(_params: IHeaderParams): boolean {
    return false
  }
}

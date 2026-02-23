import { Component } from '@angular/core'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { ICellRendererAngularComp } from 'ag-grid-angular'
import { ICellRendererParams } from 'ag-grid-community'

@Component({
  selector: 'app-variance-cell',
  standalone: true,
  imports: [NzIconModule],
  template: `
    <span
      class="variance-cell"
      [class.positive]="(value ?? 0) > 0"
      [class.negative]="(value ?? 0) < 0"
      [class.flat]="(value ?? 0) === 0"
    >
      {{ formatted }}
      @if ((value ?? 0) > 0) {
        <span nz-icon nzType="arrow-up" class="arrow"></span>
      }
      @if ((value ?? 0) < 0) {
        <span nz-icon nzType="arrow-down" class="arrow"></span>
      }
    </span>
  `,
  styles: [`
    .variance-cell {
      text-align: right;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      font-weight: 500;
    }
    .variance-cell.positive { color: #008a00; }
    .variance-cell.negative { color: #ff4d4f; }
    .variance-cell.flat { color: #000000; }
    .arrow { font-size: 12px; }
  `],
})
export class VarianceCellRendererComponent implements ICellRendererAngularComp {
  value: number | null = null
  formatted = ''

  agInit(params: ICellRendererParams): void {
    const v = params.value
    this.value = v == null ? null : Number(v)
    if (this.value != null) {
      this.formatted = Math.abs(this.value).toLocaleString()
    }
  }

  refresh(params: ICellRendererParams): boolean {
    this.agInit(params)
    return true
  }
}

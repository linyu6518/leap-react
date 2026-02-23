import { Component } from '@angular/core'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { ICellRendererAngularComp } from 'ag-grid-angular'
import { ICellRendererParams } from 'ag-grid-community'

@Component({
  selector: 'app-lcr-variance-cell',
  standalone: true,
  imports: [NzIconModule],
  template: `
    <span
      class="lcr-variance-cell"
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
    .lcr-variance-cell {
      text-align: right;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      font-weight: 500;
    }
    .lcr-variance-cell.positive { color: #008a00; }
    .lcr-variance-cell.negative { color: #ff4d4f; }
    .lcr-variance-cell.flat { color: #000000; }
    .arrow { font-size: 12px; }
  `],
})
export class LcrVarianceCellRendererComponent implements ICellRendererAngularComp {
  value: number | null = null
  formatted = ''
  isPercentage = false

  agInit(params: ICellRendererParams): void {
    const v = params.value
    const data = params.data as { name?: string }
    this.isPercentage = data?.name === 'LCR Ratio'
    this.value = v == null ? null : Number(v)
    if (this.value != null) {
      const abs = Math.abs(this.value)
      this.formatted = this.isPercentage ? `${abs}%` : abs.toLocaleString()
    }
  }

  refresh(params: ICellRendererParams): boolean {
    this.agInit(params)
    return true
  }
}

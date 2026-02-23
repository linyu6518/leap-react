import { Component } from '@angular/core'
import { ICellRendererAngularComp } from 'ag-grid-angular'
import { ICellRendererParams } from 'ag-grid-community'

@Component({
  selector: 'app-action-cell',
  standalone: true,
  template: `
    <div class="action-cell">
      <div class="dots-wrapper">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="5" r="1.5" fill="#999" stroke="none"/>
          <circle cx="10" cy="10" r="1.5" fill="#999" stroke="none"/>
          <circle cx="10" cy="15" r="1.5" fill="#999" stroke="none"/>
        </svg>
        @if (hasAlert) {
          <span class="alert-dot"></span>
        }
      </div>
    </div>
  `,
  styles: [`
    .action-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      position: relative;
    }
    .dots-wrapper {
      position: relative;
      display: inline-block;
      transform: translateY(5px);
      cursor: pointer;
    }
    .alert-dot {
      position: absolute;
      top: 0;
      right: 0;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #ff4d4f;
      display: inline-block;
    }
  `],
})
export class ActionCellRendererComponent implements ICellRendererAngularComp {
  hasAlert = false

  agInit(params: ICellRendererParams): void {
    const data = params.data as { hasAlert?: boolean }
    this.hasAlert = !!data?.hasAlert
  }

  refresh(params: ICellRendererParams): boolean {
    this.agInit(params)
    return true
  }
}

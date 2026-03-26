import { Component } from '@angular/core'
import { ICellRendererAngularComp } from 'ag-grid-angular'
import { ICellRendererParams } from 'ag-grid-community'

interface ActionContext {
  onCommentClick?: (data: unknown) => void
}

@Component({
  selector: 'app-action-cell',
  standalone: true,
  template: `
    <div class="action-cell">
      <button class="icon-btn" title="Comment" (click)="onComment($event)">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 2H3C2.44772 2 2 2.44772 2 3V11C2 11.5523 2.44772 12 3 12H5V15.5L9.5 12H15C15.5523 12 16 11.5523 16 11V3C16 2.44772 15.5523 2 15 2Z"
            stroke="#8C8C8C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <circle cx="6.5" cy="7" r="1" fill="#8C8C8C"/>
          <circle cx="9" cy="7" r="1" fill="#8C8C8C"/>
          <circle cx="11.5" cy="7" r="1" fill="#8C8C8C"/>
        </svg>
        @if (hasAlert) {
          <span class="alert-dot"></span>
        }
      </button>
    </div>
  `,
  styles: [`
    .action-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      width: 100%;
      height: 100%;
    }
    .icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      padding: 0;
      position: relative;
      transition: background 0.15s;
    }
    .icon-btn:hover {
      background: transparent;
    }
    .icon-btn:hover svg path {
      stroke: #00843D;
    }
    .alert-dot {
      position: absolute;
      top: 3px;
      right: 3px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #FF9500;
    }
  `],
})
export class ActionCellRendererComponent implements ICellRendererAngularComp {
  hasAlert = false
  private params!: ICellRendererParams

  agInit(params: ICellRendererParams): void {
    this.params = params
    const data = params.data as { hasAlert?: boolean }
    this.hasAlert = !!data?.hasAlert
  }

  refresh(params: ICellRendererParams): boolean {
    this.agInit(params)
    return true
  }

  onComment(event: Event): void {
    event.stopPropagation()
    const ctx = this.params.context as ActionContext | undefined
    ctx?.onCommentClick?.(this.params.data)
  }
}

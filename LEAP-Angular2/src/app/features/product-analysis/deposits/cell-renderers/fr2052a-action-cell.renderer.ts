import { Component } from '@angular/core'
import { ICellRendererAngularComp } from 'ag-grid-angular'
import { ICellRendererParams } from 'ag-grid-community'

interface ActionContext {
  onCommentClick?: (data: unknown) => void
  onEscalateClick?: (data: unknown) => void
  onAdjustClick?: (data: unknown) => void
}

@Component({
  selector: 'app-fr2052a-action-cell',
  standalone: true,
  template: `
    @if (!isGrandTotal) {
      <div class="action-cell">
        <!-- Escalation icon: grey when already escalated, orange otherwise -->
        <button
          class="icon-btn escalation-btn"
          [class.escalation-btn--done]="isEscalated"
          [attr.title]="isEscalated ? 'Already escalated' : 'Escalation'"
          (click)="onEscalate($event)"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="10" [attr.fill]="isEscalated ? '#C8C8C8' : '#FF8453'"/>
            <path d="M7 13L13 7" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M8 7H13V12" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <!-- Comment icon -->
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
    }
  `,
  styles: [`
    .action-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
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
    .escalation-btn:hover svg circle {
      fill: #FFa57a;
    }
    .escalation-btn:hover svg path {
      stroke: white;
    }
    .escalation-btn--done {
      cursor: default;
      opacity: 0.75;
    }
    .escalation-btn--done:hover svg circle {
      fill: #C8C8C8;
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
export class Fr2052aActionCellRendererComponent implements ICellRendererAngularComp {
  isGrandTotal = false
  hasAlert = false
  isEscalated = false
  private params!: ICellRendererParams

  agInit(params: ICellRendererParams): void {
    this.params = params
    const data = params.data as { isGrandTotal?: boolean; hasAlert?: boolean; isEscalated?: boolean }
    this.isGrandTotal = !!data?.isGrandTotal
    this.hasAlert = !!data?.hasAlert
    this.isEscalated = !!data?.isEscalated
  }

  refresh(params: ICellRendererParams): boolean {
    this.agInit(params)
    return true
  }

  onEscalate(event: Event): void {
    event.stopPropagation()
    const ctx = this.params.context as ActionContext | undefined
    ctx?.onEscalateClick?.(this.params.data)
  }

  onComment(event: Event): void {
    event.stopPropagation()
    const ctx = this.params.context as ActionContext | undefined
    ctx?.onCommentClick?.(this.params.data)
  }
}

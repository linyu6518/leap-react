import { Component } from '@angular/core'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzToolTipModule } from 'ng-zorro-antd/tooltip'
import { ICellRendererAngularComp } from 'ag-grid-angular'
import { ICellRendererParams } from 'ag-grid-community'
import { latestScopedComment, type Comment, type ScopeKey } from '../comment-panel/comment-data'
import { driverMeta, type DriverMeta } from '../comment-panel/driver-codes'

/** Callbacks the renderer expects on `gridOptions.context`. Extra keys are ignored. */
interface VarianceCellContext {
  hasScopedComment?: (rowId: string, scope: ScopeKey) => boolean
  openScopedPanel?: (data: unknown, scope: ScopeKey) => void
}

/**
 * Parse the counterparty key out of the column field.
 * Field format: `counterparties.<SCOPE>.variance`. Returns null for any other field
 * (e.g. FR2052 / US LCR variance columns that don't carry a counterparty scope).
 */
function parseScope(field: string | undefined): ScopeKey | null {
  if (!field) return null
  const match = /^counterparties\.([A-Z_]+)\.variance$/.exec(field)
  return match ? (match[1] as ScopeKey) : null
}

@Component({
  selector: 'app-variance-cell',
  standalone: true,
  imports: [NzIconModule, NzToolTipModule],
  template: `
    <span
      class="variance-cell"
      [class.positive]="(value ?? 0) > 0"
      [class.negative]="(value ?? 0) < 0"
      [class.flat]="(value ?? 0) === 0"
      [class.clickable]="scope != null"
      [nz-tooltip]="tooltipTpl"
      [nzTooltipTrigger]="showTooltip ? 'hover' : null"
      nzTooltipPlacement="topRight"
      nzTooltipOverlayClassName="variance-tooltip"
      (click)="onClick($event)"
    >
      {{ formatted }}
      @if ((value ?? 0) > 0) {
        <span nz-icon nzType="arrow-up" class="arrow"></span>
      }
      @if ((value ?? 0) < 0) {
        <span nz-icon nzType="arrow-down" class="arrow"></span>
      }
      @if (hasComment) {
        <span class="cell-dot" aria-hidden="true"></span>
      }
    </span>

    <ng-template #tooltipTpl>
      @if (latest) {
        <div class="vtt-root">
          <div class="vtt-row-1">
            @if (driver) {
              <span class="vtt-chip" [style.background]="driver.colorBg" [style.color]="driver.colorFg">
                {{ driver.shortLabel }}
              </span>
            }
            @if (latest.impactAmount != null) {
              <span class="vtt-impact" [class.up]="latest.impactAmount > 0" [class.down]="latest.impactAmount < 0">
                {{ signed(latest.impactAmount) }}
              </span>
            }
          </div>
          <div class="vtt-meta">
            <span class="vtt-author">{{ latest.author }}</span>
            <span class="vtt-dot">·</span>
            <span class="vtt-time">{{ latest.timestamp }}</span>
          </div>
          <div class="vtt-text">{{ truncated }}</div>
        </div>
      }
    </ng-template>
  `,
  styles: [`
    .variance-cell {
      position: relative;
      text-align: right;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      font-weight: 500;
      padding-right: 10px;
    }
    .variance-cell.positive { color: #008a00; }
    .variance-cell.negative { color: #ff4d4f; }
    .variance-cell.flat { color: #000000; }
    .variance-cell.clickable { cursor: pointer; }
    .variance-cell.clickable:hover { background: rgba(0, 132, 61, 0.04); }
    .arrow { font-size: 12px; }

    /* Small dot pinned to the variance value indicating "someone already explained this column". */
    .cell-dot {
      position: absolute;
      top: 6px;
      right: 1px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #FF9500;
    }

    /* Tooltip content — scoped to the tooltip body via :host-context isn't possible in standalone template, so styles live inline. */
    ::ng-deep .variance-tooltip .ant-tooltip-inner {
      background: #FFFFFF;
      color: #1A1A1A;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.14);
      border: 1px solid #E0E0E0;
      padding: 10px 12px;
      max-width: 280px;
    }
    ::ng-deep .variance-tooltip .ant-tooltip-arrow-content { background: #FFFFFF; }
    ::ng-deep .variance-tooltip .vtt-root { font-family: inherit; font-size: 12px; line-height: 1.35; }
    ::ng-deep .variance-tooltip .vtt-row-1 { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    ::ng-deep .variance-tooltip .vtt-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    ::ng-deep .variance-tooltip .vtt-impact { font-weight: 600; }
    ::ng-deep .variance-tooltip .vtt-impact.up { color: #008A00; }
    ::ng-deep .variance-tooltip .vtt-impact.down { color: #D32F2F; }
    ::ng-deep .variance-tooltip .vtt-meta { color: #8C8C8C; font-size: 11px; display: flex; gap: 4px; margin-bottom: 6px; }
    ::ng-deep .variance-tooltip .vtt-text { color: #1A1A1A; font-size: 12px; }
  `],
})
export class VarianceCellRendererComponent implements ICellRendererAngularComp {
  value: number | null = null
  formatted = ''
  scope: ScopeKey | null = null
  rowId: string | null = null
  hasComment = false
  latest: Comment | null = null
  driver: DriverMeta | null = null
  truncated = ''
  private params!: ICellRendererParams

  get showTooltip(): boolean {
    return this.hasComment && this.latest != null
  }

  agInit(params: ICellRendererParams): void {
    this.params = params
    const v = params.value
    this.value = v == null ? null : Number(v)
    this.formatted = this.value != null ? Math.abs(this.value).toLocaleString() : ''

    const field = params.colDef?.field
    this.scope = parseScope(field)
    const data = params.data as { nodeId?: string } | undefined
    this.rowId = data?.nodeId ?? null

    const ctx = params.context as VarianceCellContext | undefined
    if (this.scope && this.rowId && ctx?.hasScopedComment) {
      this.hasComment = ctx.hasScopedComment(this.rowId, this.scope)
      this.latest = this.hasComment ? latestScopedComment(this.rowId, this.scope) : null
      this.driver = this.latest?.driver ? driverMeta(this.latest.driver) : null
      const text = this.latest?.text ?? ''
      this.truncated = text.length > 120 ? text.slice(0, 117) + '…' : text
    } else {
      this.hasComment = false
      this.latest = null
      this.driver = null
      this.truncated = ''
    }
  }

  refresh(params: ICellRendererParams): boolean {
    this.agInit(params)
    return true
  }

  signed(n: number): string {
    const abs = Math.abs(n).toLocaleString()
    if (n > 0) return `+${abs}`
    if (n < 0) return `-${abs}`
    return abs
  }

  onClick(event: MouseEvent): void {
    if (!this.scope || !this.rowId) return
    const ctx = this.params.context as VarianceCellContext | undefined
    if (!ctx?.openScopedPanel) return
    event.stopPropagation()
    ctx.openScopedPanel(this.params.data, this.scope)
  }
}

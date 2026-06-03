import { Component, HostBinding } from '@angular/core'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { ICellRendererAngularComp } from 'ag-grid-angular'
import { ICellRendererParams } from 'ag-grid-community'
import type { DrilldownContext, DrilldownPeriod } from '../../../product-analysis/deposits/drilldown-panel/drilldown-data'
import { lcrSegmentValueAt, type LcrRowData, type LcrSegmentKey, type LcrWeighting } from '../lcr-detail-data'

export type LcrDualMetricKind = 'current' | 'previous' | 'variance'

export interface LcrDualMetricCellParams {
  base: string
  segmentCode: string
  segmentLabel: string
  metric: LcrDualMetricKind
}

interface LcrDualGridContext {
  openDrilldown?: (ctx: DrilldownContext) => void
  onLcrEditClick?: (payload: {
    row: LcrRowData
    segment: LcrSegmentKey
    segmentLabel: string
    currentValue: number
  }) => void
  currentDateIso?: () => string | null
}

function formatAmount(value: number | null | undefined, isRatio: boolean): string {
  if (value == null || Number.isNaN(value)) return '—'
  if (isRatio) return `${value}%`
  return Number(value).toLocaleString()
}

function formatVariance(value: number | null | undefined, isRatio: boolean): string {
  if (value == null || Number.isNaN(value)) return '—'
  const abs = Math.abs(value)
  return isRatio ? `${abs}%` : abs.toLocaleString()
}

@Component({
  selector: 'app-lcr-dual-metric-cell',
  standalone: true,
  imports: [NzIconModule],
  template: `
    <div
      class="dual-cell"
      [class.dual-cell--current]="isCurrentColumn"
      [class.dual-cell--editable]="isEditable"
    >
      <div class="dual-inline">
        @if (isVariance) {
          <div class="dual-pair">
            <span class="dual-badge dual-badge--uw" title="Unweighted" aria-label="Unweighted">Uw</span>
            <span
              class="dual-num dual-num--uw"
              [class.positive]="(uwValue ?? 0) > 0"
              [class.negative]="(uwValue ?? 0) < 0"
              [class.flat]="(uwValue ?? 0) === 0"
            >{{ uwFormatted }}</span>
          </div>
          <span class="dual-sep" aria-hidden="true"></span>
          <div class="dual-pair">
            <span class="dual-badge dual-badge--w" title="Weighted" aria-label="Weighted">W</span>
            <span class="dual-num-group">
              <span
                class="dual-num dual-num--w"
                [class.positive]="(wValue ?? 0) > 0"
                [class.negative]="(wValue ?? 0) < 0"
                [class.flat]="(wValue ?? 0) === 0"
              >{{ wFormatted }}</span>
              @if ((wValue ?? 0) > 0) {
                <span nz-icon nzType="arrow-up" class="arrow"></span>
              }
              @if ((wValue ?? 0) < 0) {
                <span nz-icon nzType="arrow-down" class="arrow"></span>
              }
            </span>
          </div>
        } @else {
          <button type="button" class="dual-pair dual-pair--btn" (click)="onDrill('unweighted', $event)">
            <span class="dual-badge dual-badge--uw" title="Unweighted" aria-label="Unweighted">Uw</span>
            <span class="dual-num dual-num--uw">{{ uwFormatted }}</span>
          </button>
          <span class="dual-sep" aria-hidden="true"></span>
          <button type="button" class="dual-pair dual-pair--btn" (click)="onDrill('weighted', $event)">
            <span class="dual-badge dual-badge--w" title="Weighted" aria-label="Weighted">W</span>
            <span class="dual-w-nums">
              @if (hasAdjustment) {
                <span class="dual-num dual-num--strike">{{ adjustPrevFormatted }}</span>
              }
              <span class="dual-num dual-num--w">{{ wFormatted }}</span>
            </span>
          </button>
        }
      </div>
      @if (isCurrentColumn) {
        <span class="edit-slot">
          @if (isEditable) {
            <button class="edit-btn" type="button" title="Adjust" (click)="onEdit($event)">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M11.333 2a1.886 1.886 0 0 1 2.667 2.667L4.933 13.733 2 14.667l.933-2.934L11.333 2Z"
                  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          }
        </span>
      }
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
    }
    :host.host-adjusted {
      background: #fff8e1 !important;
      padding: 0 var(--ag-cell-horizontal-padding, 12px);
      box-sizing: border-box;
      align-self: stretch;
    }

    .dual-cell {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      width: 100%;
      min-height: 32px;
      box-sizing: border-box;
    }

    /* Current 列：右侧固定预留编辑位，保证各行 Uw/W 数字纵向对齐 */
    .dual-cell--current {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 22px;
      column-gap: 4px;
      align-items: center;
    }
    .dual-cell--current .dual-inline {
      grid-column: 1;
      justify-self: end;
      width: 100%;
    }

    .dual-inline {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      flex: 1;
      min-width: 0;
      flex-wrap: nowrap;
    }

    .edit-slot {
      grid-column: 2;
      width: 22px;
      height: 22px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .dual-pair {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      min-width: 0;
      flex-shrink: 1;
    }

    .dual-pair--btn {
      border: none;
      background: transparent;
      padding: 0;
      margin: 0;
      cursor: pointer;
      font-family: inherit;
    }
    .dual-pair--btn:hover .dual-num--uw { color: #434343; }
    .dual-pair--btn:hover .dual-num--w { color: #00843d; }

    .dual-sep {
      flex-shrink: 0;
      width: 1px;
      height: 16px;
      background: #e0e0e0;
    }

    .dual-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      padding: 0;
      border-radius: 3px;
      flex-shrink: 0;
      font-size: 9px;
      font-weight: 400;
      letter-spacing: 0;
      line-height: 1;
    }
    .dual-badge--uw {
      background: #fafafa;
      border: 1px solid #d9d9d9;
      color: #8c8c8c;
    }
    .dual-badge--w {
      background: #f0faf2;
      border: 1px solid #b7dfb8;
      color: #00843d;
    }

    .dual-num {
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      line-height: 1.2;
    }
    .dual-num--uw {
      font-size: 12px;
      font-weight: 500;
      color: #595959;
    }
    .dual-num--w {
      font-size: 13px;
      font-weight: 600;
      color: #111111;
    }

    .dual-w-nums {
      display: inline-flex;
      align-items: baseline;
      gap: 5px;
      flex-wrap: nowrap;
    }

    .dual-num--strike {
      font-size: 11px;
      font-weight: 400;
      text-decoration: line-through;
      color: #a67c00;
    }

    .dual-num-group {
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }

    .dual-num.positive { color: #008a00; }
    .dual-num.negative { color: #ff4d4f; }
    .dual-num.flat { color: #000000; }
    .arrow { font-size: 10px; flex-shrink: 0; }

    .edit-btn {
      width: 22px;
      height: 22px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 0;
      color: #8c8c8c;
      border-radius: 3px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.18s ease, color 0.15s ease;
    }
    .dual-cell--editable:hover .edit-btn {
      opacity: 1;
      pointer-events: auto;
    }
    .edit-btn:hover { color: #008a00; }
  `],
})
export class LcrDualMetricCellRendererComponent implements ICellRendererAngularComp {
  @HostBinding('class.host-adjusted') hostAdjusted = false

  metric: LcrDualMetricKind = 'current'
  isCurrentColumn = false
  isVariance = false
  isEditable = false
  hasAdjustment = false
  uwFormatted = ''
  wFormatted = ''
  adjustPrevFormatted = ''
  uwValue: number | null = null
  wValue: number | null = null

  private base = ''
  private segmentCode = ''
  private segmentLabel = ''
  private isRatio = false
  private params!: ICellRendererParams
  private period: DrilldownPeriod = 'current'

  agInit(params: ICellRendererParams): void {
    this.params = params
    const p = (params.colDef?.cellRendererParams ?? {}) as LcrDualMetricCellParams
    this.base = p.base ?? ''
    this.segmentCode = p.segmentCode ?? ''
    this.segmentLabel = p.segmentLabel ?? ''
    this.metric = p.metric ?? 'current'
    this.isCurrentColumn = this.metric === 'current'
    this.isVariance = this.metric === 'variance'
    this.period = this.metric === 'previous' ? 'previous' : 'current'

    const data = params.data as LcrRowData | undefined
    this.isRatio = data?.name === 'LCR Ratio'
    this.isEditable = !this.isVariance && this.metric === 'current' && !!data && data.level > 0

    const seg = lcrSegmentValueAt(data, this.base)
    const uw = seg?.unweighted[this.metric] ?? null
    const w = seg?.weighted[this.metric] ?? null
    this.uwValue = uw
    this.wValue = w

    if (this.isVariance) {
      this.uwFormatted = formatVariance(uw, this.isRatio)
      this.wFormatted = formatVariance(w, this.isRatio)
    } else {
      this.uwFormatted = formatAmount(uw, this.isRatio)
      this.wFormatted = formatAmount(w, this.isRatio)
    }

    const prevRaw = data?.adjustedFrom?.[this.segmentCode]
    this.hasAdjustment = this.isEditable && typeof prevRaw === 'number'
    this.hostAdjusted = this.hasAdjustment
    this.adjustPrevFormatted = this.hasAdjustment
      ? formatAmount(prevRaw, this.isRatio)
      : ''
  }

  refresh(params: ICellRendererParams): boolean {
    this.agInit(params)
    return true
  }

  onDrill(weighting: LcrWeighting, event: Event): void {
    event.stopPropagation()
    if (this.isVariance) return
    const ctx = this.params.context as LcrDualGridContext | undefined
    const data = this.params.data as LcrRowData | undefined
    const seg = lcrSegmentValueAt(data, this.base)
    const amount = seg?.[weighting][this.metric as 'current' | 'previous'] ?? null
    ctx?.openDrilldown?.({
      segmentCode: this.segmentCode,
      segmentLabel: this.segmentLabel,
      period: this.period,
      weighting,
      productName: data?.name ?? '',
      date: ctx.currentDateIso?.() ?? null,
      amount: typeof amount === 'number' ? amount : null,
    })
  }

  onEdit(event: Event): void {
    event.stopPropagation()
    const ctx = this.params.context as LcrDualGridContext | undefined
    const data = this.params.data as LcrRowData
    const w = lcrSegmentValueAt(data, this.base)?.weighted.current ?? 0
    ctx?.onLcrEditClick?.({
      row: data,
      segment: this.segmentCode,
      segmentLabel: this.segmentLabel,
      currentValue: w,
    })
  }
}

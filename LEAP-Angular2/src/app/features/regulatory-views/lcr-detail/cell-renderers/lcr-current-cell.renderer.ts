import { Component, HostBinding } from '@angular/core'
import { ICellRendererAngularComp } from 'ag-grid-angular'
import { ICellRendererParams } from 'ag-grid-community'
import type { LcrRowData, LcrSegmentKey } from '../lcr-detail-data'

interface LcrAmountContext {
  onLcrEditClick?: (payload: { row: LcrRowData; segment: LcrSegmentKey; segmentLabel: string }) => void
  isCheckerMode?: boolean
  signedOffBySegment?: Record<string, Partial<Record<LcrSegmentKey, boolean>>>
}

const SEGMENT_LABELS: Record<string, string> = {
  enterprise: 'Enterprise',
  cadRetail: 'CAD Retail',
  wholesale: 'Wholesale',
  usRetail: 'US Retail',
}

@Component({
  selector: 'app-lcr-current-cell',
  standalone: true,
  template: `
    <div class="amount-cell" [class.amount-cell--editable]="isEditable">
      @if (isSignedOff) {
        <span class="signedoff-badge" aria-label="Signed off">
          <span class="signedoff-badge__text">Sign-off</span>
          <span class="signedoff-badge__arrow"></span>
        </span>
      }
      <div class="amount-cell-body">
        @if (hasAdjustment) {
          <div class="amount-compare" [attr.title]="'Original: ' + prevFormatted + ' / New: ' + formatted">
            <span class="amount-prev">{{ prevFormatted }}</span>
            <span class="amount-current">{{ formatted }}</span>
          </div>
        } @else {
          <span class="amount-value">{{ formatted }}</span>
        }
        @if (isEditable) {
          <button class="edit-btn" type="button" title="Adjust" (click)="onEdit($event)">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M11.333 2a1.886 1.886 0 0 1 2.667 2.667L4.933 13.733 2 14.667l.933-2.934L11.333 2Z"
                stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        }
      </div>
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
    :host.host-signedoff:not(.host-adjusted) {
      background: #f5fbf2 !important;
      padding: 0 var(--ag-cell-horizontal-padding, 12px);
      box-sizing: border-box;
      align-self: stretch;
    }
    .amount-cell {
      position: relative;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      overflow: visible;
      box-sizing: border-box;
    }
    .signedoff-badge {
      position: absolute;
      left: calc(-1 * var(--ag-cell-horizontal-padding, 12px));
      top: -1px;
      display: inline-flex;
      align-items: center;
      background: #52C41A;
      color: #ffffff;
      font-size: 10px;
      font-weight: 600;
      line-height: 1;
      letter-spacing: 0.2px;
      padding: 3px 8px 3px 6px;
      z-index: 2;
      pointer-events: none;
    }
    .signedoff-badge__text {
      transform: translateY(1px);
    }
    .signedoff-badge__arrow {
      position: absolute;
      right: -6px;
      top: 0;
      width: 0;
      height: 0;
      border-top: 9px solid transparent;
      border-bottom: 9px solid transparent;
      border-left: 6px solid #52C41A;
    }
    .amount-cell-body {
      position: relative;
      width: 100%;
      box-sizing: border-box;
      transition: padding-right 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .amount-cell--editable:hover .amount-cell-body { padding-right: 26px; }
    .amount-value {
      display: block;
      width: 100%;
      text-align: right;
    }
    .amount-compare {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: center;
      gap: 2px;
      width: 100%;
      font-size: 12px;
      font-weight: 500;
      line-height: 1.3;
    }
    .amount-prev {
      text-decoration: line-through;
      color: #a67c00;
      font-weight: 400;
    }
    .amount-current {
      color: #111111;
      font-weight: 600;
      font-size: 13px;
    }
    .edit-btn {
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translate(100%, -50%);
      opacity: 0;
      pointer-events: none;
      width: 22px;
      height: 22px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 0;
      color: #8C8C8C;
      border-radius: 3px;
      transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.18s ease, color 0.15s ease;
    }
    .amount-cell--editable:hover .edit-btn {
      transform: translate(0, -50%);
      opacity: 1;
      pointer-events: auto;
    }
    .edit-btn:hover { color: #008A00; }
  `],
})
export class LcrCurrentCellRendererComponent implements ICellRendererAngularComp {
  @HostBinding('class.host-adjusted') hostAdjusted = false
  @HostBinding('class.host-signedoff') hostSignedOff = false

  formatted = ''
  prevFormatted = ''
  hasAdjustment = false
  isEditable = false
  isSignedOff = false
  private segment: LcrSegmentKey = 'enterprise'
  private params!: ICellRendererParams

  agInit(params: ICellRendererParams): void {
    this.params = params
    const data = params.data as LcrRowData | undefined
    this.isEditable = !!data && data.level > 0

    const val = params.value as number | null | undefined
    this.formatted = val != null && !Number.isNaN(val)
      ? (data?.name === 'LCR Ratio' ? `${val}%` : Number(val).toLocaleString())
      : ''

    const field = params.colDef?.field ?? ''
    this.segment = (field.split('.')[0] as LcrSegmentKey) || 'enterprise'

    const prevRaw = data?.adjustedFrom?.[this.segment]
    this.hasAdjustment = typeof prevRaw === 'number'
    this.hostAdjusted = this.hasAdjustment
    this.prevFormatted = this.hasAdjustment
      ? (data?.name === 'LCR Ratio' ? `${Number(prevRaw)}%` : Number(prevRaw).toLocaleString())
      : ''

    const ctx = params.context as LcrAmountContext | undefined
    const signedMap = ctx?.signedOffBySegment ?? {}
    this.isSignedOff = !!(ctx?.isCheckerMode && data?.nodeId && signedMap[data.nodeId]?.[this.segment])
    this.hostSignedOff = this.isSignedOff
  }

  refresh(params: ICellRendererParams): boolean {
    this.agInit(params)
    return true
  }

  onEdit(event: Event): void {
    event.stopPropagation()
    const ctx = this.params.context as LcrAmountContext | undefined
    const data = this.params.data as LcrRowData
    ctx?.onLcrEditClick?.({
      row: data,
      segment: this.segment,
      segmentLabel: SEGMENT_LABELS[this.segment] ?? this.segment,
    })
  }
}

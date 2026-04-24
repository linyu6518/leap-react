import { Component, HostBinding } from '@angular/core'
import { ICellRendererAngularComp } from 'ag-grid-angular'
import { ICellRendererParams } from 'ag-grid-community'

type AmountField = 'amount1' | 'amount2' | 'amount3'

interface AmountRowData {
  isGrandTotal?: boolean
  amountAdjustedFrom?: Partial<Record<AmountField, number>>
}

interface AmountCellContext {
  onAdjustClick?: (payload: { row: unknown; amountField: AmountField }) => void
}

@Component({
  selector: 'app-fr2052a-amount-cell',
  standalone: true,
  template: `
    <div class="amount-cell" [class.amount-cell--editable]="!isGrandTotal">
      <div class="amount-cell-body">
        @if (hasAdjustmentNote) {
          <div
            class="amount-compare"
            [attr.title]="'原值: ' + prevFormatted + ' / 新值: ' + formatted"
          >
            <span class="amount-prev">{{ prevFormatted }}</span>
            <span class="amount-current">{{ formatted }}</span>
          </div>
        } @else {
          <span class="amount-value">{{ formatted }}</span>
        }
        @if (!isGrandTotal) {
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
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    /*
     * Bleed into ag-grid cell wrapper padding so yellow fills the full cell (matches --ag-cell-horizontal-padding).
     */
    :host.host-adjusted {
      --_cell-pad-h: calc(var(--ag-cell-horizontal-padding, 12px) - 1px);
      align-self: stretch;
      display: flex;
      align-items: center;
      min-height: 100%;
      width: calc(100% + 2 * var(--_cell-pad-h));
      max-width: none;
      margin-left: calc(-1 * var(--_cell-pad-h));
      margin-right: calc(-1 * var(--_cell-pad-h));
      box-sizing: border-box;
      background: #fff8e1 !important;
    }
    :host.host-adjusted .amount-cell {
      flex: 1 1 auto;
      min-width: 0;
      width: 100%;
      /* Match --ag-cell-horizontal-padding so text lines up with single-line amount cells */
      padding-left: var(--ag-cell-horizontal-padding, 12px);
      padding-right: var(--ag-cell-horizontal-padding, 12px);
      box-sizing: border-box;
    }
    .amount-cell {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      overflow: visible;
      box-sizing: border-box;
    }
    .amount-cell-body {
      position: relative;
      width: 100%;
      box-sizing: border-box;
      transition: padding-right 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .amount-cell--editable:hover .amount-cell-body {
      padding-right: 26px;
    }
    .amount-value {
      display: block;
      width: 100%;
      text-align: right;
      box-sizing: border-box;
    }
    .amount-compare {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: center;
      gap: 3px;
      width: 100%;
      text-align: right;
      line-height: 1.25;
      font-size: 12px;
      font-weight: 500;
    }
    .amount-prev {
      text-decoration: line-through;
      /* Match adjustment-panel maturity-dirty “Maturity Amount” label */
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
      transition:
        transform 0.22s cubic-bezier(0.4, 0, 0.2, 1),
        opacity 0.18s ease,
        color 0.15s ease;
    }
    .amount-cell--editable:hover .edit-btn {
      transform: translate(0, -50%);
      opacity: 1;
      pointer-events: auto;
    }
    .edit-btn:hover {
      color: #008A00;
    }
  `],
})
export class Fr2052aAmountCellRendererComponent implements ICellRendererAngularComp {
  @HostBinding('class.host-adjusted')
  hostAdjusted = false

  formatted = ''
  prevFormatted = ''
  hasAdjustmentNote = false
  isGrandTotal = false
  private params!: ICellRendererParams

  agInit(params: ICellRendererParams): void {
    this.params = params
    const data = params.data as AmountRowData | undefined
    this.isGrandTotal = !!data?.isGrandTotal
    const val = params.value
    this.formatted = val != null ? Number(val).toLocaleString() : ''

    const field = params.colDef?.field
    const af = data?.amountAdjustedFrom
    let prevRaw: number | undefined
    if (!this.isGrandTotal && (field === 'amount1' || field === 'amount2' || field === 'amount3') && af && typeof af[field] === 'number') {
      prevRaw = af[field]
    }
    this.hasAdjustmentNote = typeof prevRaw === 'number'
    this.hostAdjusted = this.hasAdjustmentNote
    this.prevFormatted = typeof prevRaw === 'number' ? Number(prevRaw).toLocaleString() : ''
  }

  refresh(params: ICellRendererParams): boolean {
    this.agInit(params)
    return true
  }

  onEdit(event: Event): void {
    event.stopPropagation()
    const ctx = this.params.context as AmountCellContext | undefined
    const field = this.params.colDef?.field
    if (field !== 'amount1' && field !== 'amount2' && field !== 'amount3') return
    ctx?.onAdjustClick?.({ row: this.params.data, amountField: field })
  }
}

import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { NzSelectModule } from 'ng-zorro-antd/select'
import type { FR2052AData, Fr2052AmountField } from '../fr2052a-data'

interface AdjustmentForm {
  product: string
  pid: string
  reportingEntity: string
  counterparty: string
  insured: string
  businessLine: string
  currency: string
  trigger: string
  internal: string
  converted: string
  maturityAmount: string
  issueId: string
  comment: string
}

const REPORTING_ENTITY_OPTIONS = ['TD USA', 'TD Canada', 'TD Europe', 'TD Asia']
const COUNTERPARTY_OPTIONS = ['Retail', 'SME', 'Non-Financial', 'Pension Funds', 'Sovereigns', 'GSE/PSE', 'Bank', 'Broker Dealers', 'Investment Funds', 'Other Financial']
const YES_NO_OPTIONS = ['Yes', 'No']
const CURRENCY_OPTIONS = ['USD', 'CAD', 'EUR', 'GBP', 'JPY']
const TRIGGER_OPTIONS = ['US Retail', 'US Wholesale', 'US SME', 'CAD Retail', 'CAD Wholesale', 'CAD SME']
const BUSINESS_LINE_OPTIONS = ['Retail Banking', 'Commercial', 'Wholesale', 'Capital Markets', 'Wealth', 'Asset Management', 'Government', 'No']

// 24 biweekly data points for the chart (mimics the screenshot)
const CHART_VALUES = [21000, 19200, 23000, 19800, 21000, 23200, 21500, 21800, 26500, 18500, 21000, 18500, 21500, 17500, 17000, 20500, 17000, 20500, 18500, 20000, 16500, 18500, 19000, 22500]
const CHART_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const CHART_Y_MIN = 15000
const CHART_Y_MAX = 27000
// Coordinate constants (viewBox width must match CHART_VIEWBOX_W)
const CHART_VIEWBOX_W = 510
const CHART_X0 = 56   // left margin for y-labels (text ends at ~50, gap to chart)
const CHART_Y0 = 10   // top margin
const CHART_W = 448   // chart draw width (+10px stretch to the right; right edge = 56+448 = 504)
const CHART_H = 98    // chart draw height (bottom = 108, x-labels at y≈130)

function buildChartPts(): { x: number; y: number }[] {
  const step = CHART_W / (CHART_VALUES.length - 1)
  return CHART_VALUES.map((v, i) => ({
    x: +(CHART_X0 + i * step).toFixed(1),
    y: +(CHART_Y0 + (CHART_Y_MAX - v) / (CHART_Y_MAX - CHART_Y_MIN) * CHART_H).toFixed(1),
  }))
}

const CHART_PTS = buildChartPts()
const CHART_BOTTOM_Y = CHART_Y0 + CHART_H   // = 108

const CHART_LINE_PATH = CHART_PTS.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
const CHART_AREA_PATH = CHART_LINE_PATH +
  ` L${CHART_PTS[CHART_PTS.length - 1].x},${CHART_BOTTOM_Y} L${CHART_X0},${CHART_BOTTOM_Y} Z`

const CHART_Y_LABELS: { label: string; y: number }[] = [27000, 25000, 23000, 21000, 19000, 17000, 15000].map(v => ({
  label: v.toLocaleString(),
  y: +(CHART_Y0 + (CHART_Y_MAX - v) / (CHART_Y_MAX - CHART_Y_MIN) * CHART_H).toFixed(1),
}))

const _STEP = CHART_W / (CHART_VALUES.length - 1)
const CHART_X_LABELS: { label: string; x: number }[] = CHART_MONTHS.map((m, i) => ({
  label: m,
  x: +(CHART_X0 + i * 2 * _STEP).toFixed(1),
}))

@Component({
  selector: 'app-adjustment-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, NzSelectModule],
  template: `
    <div class="panel-overlay" [class.visible]="visible" (click)="onOverlayClick($event)">
      <div class="adjustment-panel" [class.open]="visible">

        <!-- Header -->
        <div class="panel-header">
          <div class="panel-title-area">
            <h2 class="panel-title">Adjustment</h2>
          </div>
          <button class="close-btn" (click)="close()" type="button" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="#777" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- Scrollable body -->
        <div class="panel-body">

          <!-- Form -->
          <div class="form-grid">

            <!-- Row 1: Product (3) + Pid (1) -->
            <div class="form-field col-3">
              <div class="field-wrap floating-label-active field-wrap--product-readonly">
                <div
                  class="adj-readonly adj-readonly--multiline"
                  [attr.title]="form.product.trim() ? form.product : null"
                >
                  <span class="adj-readonly-clip">{{ form.product || '—' }}</span>
                </div>
                <span class="floating-label">Product</span>
              </div>
            </div>
            <div class="form-field col-1">
              <div class="field-wrap floating-label-active">
                <div class="adj-readonly">{{ form.pid || '—' }}</div>
                <span class="floating-label">Pid</span>
              </div>
            </div>

            <!-- Row 2: Reporting Entity (2) + Counterparty (2) -->
            <div class="form-field col-2">
              <div class="field-wrap" [class.floating-label-active]="openState['reportingEntity'] || !!form.reportingEntity">
                <nz-select class="adj-select" [(ngModel)]="form.reportingEntity"
                  [nzPlaceHolder]="(openState['reportingEntity'] || form.reportingEntity) ? 'Select' : ''"
                  (nzOpenChange)="openState['reportingEntity'] = $event"
                  (ngModelChange)="markDirty()">
                  @for (opt of reportingEntityOptions; track opt) { <nz-option [nzValue]="opt" [nzLabel]="opt"/> }
                </nz-select>
                <span class="floating-label">Reporting Entity</span>
              </div>
            </div>
            <div class="form-field col-2">
              <div class="field-wrap" [class.floating-label-active]="openState['counterparty'] || !!form.counterparty">
                <nz-select class="adj-select" [(ngModel)]="form.counterparty"
                  [nzPlaceHolder]="(openState['counterparty'] || form.counterparty) ? 'Select' : ''"
                  (nzOpenChange)="openState['counterparty'] = $event"
                  (ngModelChange)="markDirty()">
                  @for (opt of counterpartyOptions; track opt) { <nz-option [nzValue]="opt" [nzLabel]="opt"/> }
                </nz-select>
                <span class="floating-label">Counterparty</span>
              </div>
            </div>

            <!-- Row 3: Insured (1) + Business Line (3) -->
            <div class="form-field col-1">
              <div class="field-wrap" [class.floating-label-active]="openState['insured'] || !!form.insured">
                <nz-select class="adj-select" [(ngModel)]="form.insured"
                  [nzPlaceHolder]="(openState['insured'] || form.insured) ? 'Select' : ''"
                  (nzOpenChange)="openState['insured'] = $event"
                  (ngModelChange)="markDirty()">
                  @for (opt of yesNoOptions; track opt) { <nz-option [nzValue]="opt" [nzLabel]="opt"/> }
                </nz-select>
                <span class="floating-label">Insured</span>
              </div>
            </div>
            <div class="form-field col-3">
              <div class="field-wrap" [class.floating-label-active]="openState['businessLine'] || !!form.businessLine">
                <nz-select class="adj-select" [(ngModel)]="form.businessLine"
                  [nzPlaceHolder]="(openState['businessLine'] || form.businessLine) ? 'Select' : ''"
                  (nzOpenChange)="openState['businessLine'] = $event"
                  (ngModelChange)="markDirty()">
                  @for (opt of businessLineOptions; track opt) { <nz-option [nzValue]="opt" [nzLabel]="opt"/> }
                </nz-select>
                <span class="floating-label">Business Line</span>
              </div>
            </div>

            <!-- Row 4: Currency (2) + Trigger (2) -->
            <div class="form-field col-2">
              <div class="field-wrap" [class.floating-label-active]="openState['currency'] || !!form.currency">
                <nz-select class="adj-select" [(ngModel)]="form.currency"
                  [nzPlaceHolder]="(openState['currency'] || form.currency) ? 'Select' : ''"
                  (nzOpenChange)="openState['currency'] = $event"
                  (ngModelChange)="markDirty()">
                  @for (opt of currencyOptions; track opt) { <nz-option [nzValue]="opt" [nzLabel]="opt"/> }
                </nz-select>
                <span class="floating-label">Currency</span>
              </div>
            </div>
            <div class="form-field col-2">
              <div class="field-wrap" [class.floating-label-active]="openState['trigger'] || !!form.trigger">
                <nz-select class="adj-select" [(ngModel)]="form.trigger"
                  [nzPlaceHolder]="(openState['trigger'] || form.trigger) ? 'Select' : ''"
                  (nzOpenChange)="openState['trigger'] = $event"
                  (ngModelChange)="markDirty()">
                  @for (opt of triggerOptions; track opt) { <nz-option [nzValue]="opt" [nzLabel]="opt"/> }
                </nz-select>
                <span class="floating-label">Trigger</span>
              </div>
            </div>

            <!-- Row 5: Internal (1) + Converted (1) + Maturity Amount (2) -->
            <div class="form-field col-1">
              <div class="field-wrap" [class.floating-label-active]="openState['internal'] || !!form.internal">
                <nz-select class="adj-select" [(ngModel)]="form.internal"
                  [nzPlaceHolder]="(openState['internal'] || form.internal) ? 'Select' : ''"
                  (nzOpenChange)="openState['internal'] = $event"
                  (ngModelChange)="markDirty()">
                  @for (opt of yesNoOptions; track opt) { <nz-option [nzValue]="opt" [nzLabel]="opt"/> }
                </nz-select>
                <span class="floating-label">Internal</span>
              </div>
            </div>
            <div class="form-field col-1">
              <div class="field-wrap" [class.floating-label-active]="openState['converted'] || !!form.converted">
                <nz-select class="adj-select" [(ngModel)]="form.converted"
                  [nzPlaceHolder]="(openState['converted'] || form.converted) ? 'Select' : ''"
                  (nzOpenChange)="openState['converted'] = $event"
                  (ngModelChange)="markDirty()">
                  @for (opt of yesNoOptions; track opt) { <nz-option [nzValue]="opt" [nzLabel]="opt"/> }
                </nz-select>
                <span class="floating-label">Converted</span>
              </div>
            </div>
            <div class="form-field col-2">
              <div
                class="field-wrap"
                [class.floating-label-active]="inputFocus['maturityAmount'] || !!form.maturityAmount"
                [class.maturity-dirty]="maturityDirty || openingHadAmountHistory"
              >
                <input class="adj-input" type="text" [(ngModel)]="form.maturityAmount"
                  [placeholder]="(inputFocus['maturityAmount'] || form.maturityAmount) ? 'e.g. $20,487' : ''"
                  (focus)="inputFocus['maturityAmount'] = true"
                  (blur)="inputFocus['maturityAmount'] = false"
                  (ngModelChange)="onMaturityAmountChange($event)"/>
                <span class="floating-label">Maturity Amount</span>
              </div>
              @if (openingHadAmountHistory || maturityDirty) {
                <div class="prev-amount-row">
                  <span class="prev-amount-label">Previous:</span>
                  <span class="prev-amount-value">{{ prevMaturityAmountFormatted }}</span>
                </div>
              }
            </div>

            <!-- Row 6: Issue ID (2) -->
            <div class="form-field col-2">
              <div class="field-wrap" [class.floating-label-active]="inputFocus['issueId'] || !!form.issueId">
                <input class="adj-input" type="text" [(ngModel)]="form.issueId"
                  [placeholder]="(inputFocus['issueId'] || form.issueId) ? 'e.g. US_511' : ''"
                  (focus)="inputFocus['issueId'] = true"
                  (blur)="inputFocus['issueId'] = false"
                  (ngModelChange)="markDirty()"/>
                <span class="floating-label">Issue ID</span>
              </div>
            </div>

          </div>

          <!-- Chart — interactive -->
          <div class="chart-wrap"
               (pointerenter)="onChartEnter()"
               (pointermove)="onChartMove($event)"
               (pointerleave)="onChartLeave()">
            <svg class="chart-svg" [attr.viewBox]="'0 0 ' + chartViewBoxW + ' 138'" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="adjChartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#008A00" stop-opacity="0.26"/>
                  <stop offset="100%" stop-color="#008A00" stop-opacity="0.02"/>
                </linearGradient>
              </defs>

              <!-- Horizontal gridlines -->
              @for (lbl of chartYLabels; track lbl.label) {
                <line [attr.x1]="chartX0" [attr.x2]="chartX0 + chartW"
                  [attr.y1]="lbl.y" [attr.y2]="lbl.y" stroke="#ECF0F4" stroke-width="1"/>
              }

              <!-- Area fill with gradient -->
              <path [attr.d]="chartAreaPath" class="chart-area-anim" fill="url(#adjChartGrad)" stroke="none"/>

              <!-- Line (animated on open) -->
              <path [attr.d]="chartLinePath"
                class="chart-line-anim"
                fill="none"
                stroke="#008A00"
                stroke-width="1.8"
                stroke-linejoin="round"
                stroke-linecap="round"
                pathLength="1"/>

              <!-- Hover guide + points -->
              @if (chartHoverIndex >= 0) {
                <line
                  class="chart-hover-guide"
                  [attr.x1]="chartPtsIndexed[chartHoverIndex].x"
                  [attr.x2]="chartPtsIndexed[chartHoverIndex].x"
                  [attr.y1]="chartY0"
                  [attr.y2]="chartY0 + chartH"
                />
              }

              @for (pt of chartPtsIndexed; track pt.i) {
                <circle
                  class="chart-point"
                  [attr.cx]="pt.x"
                  [attr.cy]="pt.y"
                  [attr.r]="pt.i === chartHoverIndex ? 4.2 : 2.2"
                  [attr.fill]="pt.i === chartHoverIndex ? '#00A600' : '#008A00'"
                  [attr.fill-opacity]="pt.i === chartHoverIndex ? 1 : 0.18"
                />
              }

              <!-- Y-axis labels (black) -->
              @for (lbl of chartYLabels; track lbl.label) {
                <text [attr.x]="chartX0 - 6" [attr.y]="lbl.y + 4"
                  text-anchor="end"
                  font-size="11"
                  fill="#1A1A1A"
                  fill-opacity="0.75"
                  font-family="system-ui,sans-serif">{{ lbl.label }}</text>
              }

              <!-- X-axis labels (black) -->
              @for (lbl of chartXLabels; track lbl.label) {
                <text [attr.x]="lbl.x" y="130"
                  text-anchor="middle"
                  font-size="11"
                  fill="#1A1A1A"
                  fill-opacity="0.75"
                  font-family="system-ui,sans-serif">{{ lbl.label }}</text>
              }

              <!-- Tooltip -->
              @if (chartHoverIndex >= 0) {
                <g class="chart-tooltip">
                  <rect
                    [attr.x]="chartTooltipX"
                    [attr.y]="chartTooltipY"
                    width="102"
                    height="26"
                    rx="4"
                    fill="rgba(255,255,255,0.95)"
                    stroke="#008A00"
                    stroke-width="1"
                  />
                  <text
                    [attr.x]="chartTooltipX + 10"
                    [attr.y]="chartTooltipY + 17"
                    font-size="12"
                    font-weight="600"
                    fill="#1A1A1A"
                    font-family="system-ui,sans-serif"
                  >{{ chartPtsIndexed[chartHoverIndex].v.toLocaleString() }}</text>
                  <text
                    [attr.x]="chartTooltipX + 10"
                    [attr.y]="chartTooltipY + 33"
                    font-size="10"
                    font-weight="500"
                    fill="#1A1A1A"
                    fill-opacity="0.75"
                    font-family="system-ui,sans-serif"
                  >{{ chartPtsIndexed[chartHoverIndex].m }}</text>
                </g>
              }
            </svg>
          </div>

          <!-- Reason -->
          <div class="reason-area">
          <div class="comment-input-shell" [class.focused]="commentFocused" [class.has-value]="form.comment.length > 0">
            <div class="comment-input-label">Reason <span class="field-required">*</span></div>
            <textarea
              class="comment-input-textarea"
              [(ngModel)]="form.comment"
              (ngModelChange)="markDirty()"
              (focus)="commentFocused = true"
              (blur)="commentFocused = false"
              [maxlength]="maxChars"
              placeholder="Minimum 10 characters"
              rows="3"
            ></textarea>
          </div>
          <div class="field-meta">
            <span class="char-count">{{ form.comment.length }} / {{ maxChars }}</span>
          </div>
          @if (form.comment.length > 0 && form.comment.length < 10) {
            <div class="field-hint-error">Minimum 10 characters required</div>
          }
        </div>

        </div>

        <!-- Footer -->
        <div class="panel-footer">
          <div class="footer-actions">
            <button class="btn-cancel" type="button" (click)="close()">Cancel</button>
            <button
              class="btn-confirm"
              type="button"
              [disabled]="!formDirty"
              [class.confirm-dirty]="formDirty"
              (click)="onSave()"
            >Save</button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .panel-overlay { position: fixed; inset: 0; z-index: 1001; pointer-events: none; background: transparent; transition: background 0.25s; }
    .panel-overlay.visible { pointer-events: all; background: rgba(0,0,0,0.12); }

    .adjustment-panel {
      position: absolute;
      top: 10px; right: 10px; bottom: 10px;
      width: 540px;
      background: #fff;
      box-shadow: -4px 0 24px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      transform: translateX(calc(100% + 10px));
      transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
      overflow: hidden;
    }
    .adjustment-panel.open { transform: translateX(0); }

    /* Header — matches Comment Panel */
    .panel-header { position: relative; padding: 20px 36px 16px; flex-shrink: 0; }
    .panel-title-area { display: flex; flex-direction: column; gap: 6px; margin-top: 17px; }
    .panel-title { font-size: 22px; font-weight: 500; color: #1A5C2A; margin: 0; line-height: 1.2; }
    .close-btn { position: absolute; top: 20px; right: 20px; border: none; background: transparent; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
    .close-btn:hover { background: #f5f5f5; }

    /* Scrollable body */
    .panel-body { flex: 1; overflow-y: auto; padding: 12px 36px 20px; }

    /* Chart */
    .chart-wrap { margin-top: 28px; margin-bottom: 4px; position: relative; left: -10px; }
    .chart-svg { display: block; width: 100%; height: auto; overflow: visible; }

    .chart-area-anim { opacity: 0; }
    .chart-line-anim { stroke-dasharray: 1; stroke-dashoffset: 1; }
    .adjustment-panel.open .chart-area-anim { animation: chartAreaIn 0.55s ease-out forwards; }
    .adjustment-panel.open .chart-line-anim { animation: chartLineDraw 0.9s ease-out forwards; }

    @keyframes chartAreaIn {
      from { opacity: 0; transform: translateY(2px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes chartLineDraw {
      to { stroke-dashoffset: 0; }
    }

    .chart-hover-guide { stroke: #008A00; stroke-width: 1; stroke-dasharray: 4 3; opacity: 0.9; }
    .chart-point { transition: r 0.15s ease, fill-opacity 0.15s ease; }
    .chart-tooltip { pointer-events: none; }

    /* Grid: 4 columns, variable span per field */
    .form-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 28px 12px; }
    .form-field { display: flex; flex-direction: column; grid-column: span 1; min-width: 0; }
    .form-field.col-1 { grid-column: span 1; }
    .form-field.col-2 { grid-column: span 2; }
    .form-field.col-3 { grid-column: span 3; }
    .field-required { color: #D9363E; margin-left: 2px; }

    /* Floating label wrapper */
    .field-wrap { position: relative; width: 100%; min-width: 0; }
    .floating-label {
      position: absolute; left: 8px; top: 18px;
      font-family: inherit; font-size: 16px; font-weight: 400; color: #1c1c1c;
      pointer-events: none; transition: all 0.2s ease;
      background-color: #fff; padding: 0 4px; z-index: 2; line-height: 1; white-space: nowrap;
    }
    .field-wrap.floating-label-active .floating-label { top: 6px; font-size: 12px; color: #8C8C8C; }

    /* Readonly */
    .adj-readonly {
      height: 54px; display: flex; align-items: flex-end; padding: 6px 12px 8px;
      background: #FAFAFA; border: 1px solid #E8E8E8;
      border-top-left-radius: 4px; border-top-right-radius: 4px;
      font-size: 16px; color: #8C8C8C; font-weight: 400;
      box-sizing: border-box;
    }
    /* Long product name: inner span so text-overflow: ellipsis works inside flex */
    .adj-readonly--multiline {
      height: 54px;
      min-height: 54px;
      max-height: 54px;
      min-width: 0;
      width: 100%;
      align-items: flex-end;
      align-self: stretch;
      padding: 6px 12px 8px;
      box-sizing: border-box;
      overflow: hidden;
    }
    .adj-readonly--multiline .adj-readonly-clip {
      display: block;
      min-width: 0;
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 1.2;
    }
    /* Text input */
    .adj-input {
      width: 100%; height: 54px; padding: 20px 12px 8px;
      border: 1px solid #8C8C8C;
      border-top-left-radius: 4px; border-top-right-radius: 4px;
      border-bottom-left-radius: 0; border-bottom-right-radius: 0;
      background: #fff; font-size: 16px; font-weight: 500; color: #1A1A1A;
      font-family: inherit; outline: none;
      transition: border-color 0.2s, border-width 0.2s; box-sizing: border-box;
    }
    .adj-input:focus { border-color: #008A00; border-width: 1px 1px 3px 1px; }
    .adj-input::placeholder { color: #9E9E9E; font-size: 16px; font-weight: 400; }

    /* Maturity amount dirty state — yellow highlight */
    .maturity-dirty .adj-input {
      border-color: #D4A000 !important;
      background: #FFF8E1 !important;
      border-width: 2px !important;
    }
    .field-wrap.maturity-dirty .floating-label {
      background-color: transparent;
      color: #A67C00;
    }
    .prev-amount-row {
      margin-top: 8px;
      font-size: 12px;
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      align-items: baseline;
      gap: 6px;
    }
    .prev-amount-label { color: #8c8c8c; font-weight: 500; font-size: 12px; flex-shrink: 0; }
    .prev-amount-value {
      color: #a67c00;
      font-weight: 500;
      text-decoration: line-through;
    }

    /* Reason (scrolls with content, sits under the chart) */
    .reason-area { margin-top: 14px; padding: 0; }

    /* Comment input shell — identical to Comment Panel */
    .comment-input-shell {
      position: relative; border: 1px solid #8C8C8C; border-radius: 4px 4px 0 0;
      background: #fff; transition: border-color 0.22s ease, border-width 0.22s ease; overflow: visible;
    }
    .comment-input-shell:hover { border-color: #008A00; }
    .comment-input-shell.focused { border-color: #008A00; border-width: 1px 1px 3px 1px; border-radius: 4px 4px 0 0; box-shadow: none; }
    .comment-input-label {
      position: absolute; left: 12px; top: 10px;
      font-size: 12px; font-weight: 400; color: #1C1C1C; line-height: 1;
      transition: top 0.22s ease, font-size 0.22s ease;
      pointer-events: none; z-index: 1; background: #fff; padding: 0 2px;
    }
    .comment-input-shell:not(.focused):not(.has-value) .comment-input-label { top: 18px; font-size: 16px; font-weight: 400; }
    .comment-input-textarea {
      display: block; width: 100%; border: none; outline: none; resize: vertical;
      font-size: 16px; font-weight: 500; color: #1A1A1A; background: transparent;
      padding: 34px 12px 10px; font-family: inherit; line-height: 1.45;
      box-sizing: border-box; min-height: 80px; height: 80px;
    }
    .comment-input-shell:not(.focused):not(.has-value) .comment-input-textarea { padding-top: 44px; }
    .comment-input-shell:not(.focused):not(.has-value) .comment-input-textarea::placeholder { color: transparent; }
    .comment-input-textarea::placeholder { color: #8C8C8C; }

    /* Char count */
    .field-meta { display: flex; justify-content: flex-end; align-items: center; margin-top: 6px; margin-bottom: 2px; }
    .char-count { font-size: 12px; color: #1A1A1A; line-height: 1; text-align: right; min-width: 72px; }
    .field-hint-error { font-size: 12px; color: #D9363E; margin-top: 2px; }

    /* NZ Select */
    :host ::ng-deep .adj-select { width: 100%; display: block; }
    :host ::ng-deep .adj-select .ant-select-selector {
      height: 54px !important; min-height: 54px !important;
      padding: 8px 40px 8px 12px !important;
      border-color: #8C8C8C !important;
      border-top-left-radius: 4px !important; border-top-right-radius: 4px !important;
      border-bottom-left-radius: 0 !important; border-bottom-right-radius: 0 !important;
      border-width: 1px !important; outline: none !important;
    }
    :host ::ng-deep .adj-select.ant-select-focused .ant-select-selector,
    :host ::ng-deep .adj-select.ant-select-open .ant-select-selector {
      border-color: #008A00 !important; border-width: 1px 1px 3px 1px !important;
      box-shadow: none !important; outline: none !important;
    }
    :host ::ng-deep .adj-select:not(.ant-select-focused):not(.ant-select-open) .ant-select-selector {
      border-color: #8C8C8C !important; border-width: 1px !important;
    }
    :host ::ng-deep .adj-select .ant-select-selection-placeholder {
      color: #9E9E9E !important; font-size: 16px !important; font-weight: 400 !important;
      line-height: 1.5 !important; margin-top: 12px !important; margin-left: 3px !important;
    }
    :host ::ng-deep .adj-select .ant-select-selection-item {
      color: #1A1A1A !important; font-size: 16px !important; font-weight: 500 !important;
      line-height: 1.5 !important; margin-top: 12px !important; margin-left: 3px !important;
    }
    :host ::ng-deep .adj-select .ant-select-arrow {
      color: #616161 !important; font-size: 0 !important;
      width: 16px !important; height: 16px !important; margin-top: 0 !important;
      top: 50% !important; transform: translateY(calc(-50% - 2px)) !important;
      display: flex !important; align-items: center !important; justify-content: center !important;
      right: 12px !important;
    }
    :host ::ng-deep .adj-select .ant-select-arrow .anticon { display: none !important; }
    :host ::ng-deep .adj-select .ant-select-arrow::after {
      content: ''; display: block; width: 8px; height: 8px;
      border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor;
      transform: rotate(45deg) scale(0.9); transition: transform 0.2s ease, color 0.2s ease;
    }
    :host ::ng-deep .adj-select:hover .ant-select-arrow { color: #616161 !important; }
    :host ::ng-deep .adj-select.ant-select-open .ant-select-arrow { transform: translateY(calc(-50% + 2px)) !important; color: #616161 !important; }
    :host ::ng-deep .adj-select.ant-select-open .ant-select-arrow::after { transform: rotate(225deg) scale(0.9); }

    /* Footer */
    .panel-footer { flex-shrink: 0; padding: 14px 36px 24px; border-top: none; }
    .footer-actions { display: flex; gap: 12px; }
    .btn-cancel { flex: 1; height: 40px; background: #fff; color: #00843D; border: 2px solid #00843D; border-radius: 0; font-size: 14px; font-weight: 500; cursor: pointer; }
    .btn-cancel:hover { background: rgba(0,132,61,0.05); color: #00843D; border-color: #00843D; }
    .btn-confirm { flex: 1; height: 40px; background: #058901; color: #fff; border: none; border-radius: 0; font-size: 14px; font-weight: 500; cursor: pointer; outline: none; box-shadow: none; }
    .btn-confirm:hover:not(:disabled), .btn-confirm:focus:not(:disabled), .btn-confirm:active:not(:disabled) { background: #047001; border: none; outline: none; box-shadow: none; }
    .btn-confirm:disabled { background: #F7F7F7; color: #C7C7C7; border: 2px solid #D4D4D4; cursor: not-allowed; }
    .btn-confirm.confirm-dirty:disabled { background: #058901 !important; color: #fff !important; border: none !important; }
  `],
})
export class AdjustmentPanelComponent implements OnChanges {
  @Input() visible = false
  /** Row + amountField together — avoids Angular applying rowData before amountField (wrong column in the form). */
  @Input() panelContext: { row: FR2052AData; amountField: Fr2052AmountField } | null = null
  @Output() closed = new EventEmitter<void>()
  @Output() saved = new EventEmitter<unknown>()

  commentFocused = false
  openState: Record<string, boolean> = {}
  inputFocus: Record<string, boolean> = {}
  readonly maxChars = 250
  formDirty = false

  prevMaturityAmountFormatted = ''
  maturityDirty = false
  /** Row had amountAdjustedFrom when panel opened — keep showing «before» vs input «after». */
  openingHadAmountHistory = false

  markDirty(): void {
    this.formDirty = true
  }

  onMaturityAmountChange(raw: string): void {
    this.markDirty()
    const formatted = this.formatMoneyWithCommas(raw)
    this.form.maturityAmount = formatted
    this.maturityDirty = formatted !== this.prevMaturityAmountFormatted
  }

  private formatMoneyWithCommas(raw: string): string {
    const input = (raw ?? '').toString()
    const trimmed = input.trim()
    if (!trimmed) return ''

    const isNeg = trimmed.startsWith('-')
    const cleaned = trimmed.replace(/[^0-9.]/g, '')
    if (!cleaned) return isNeg ? '-$' : ''

    const [intPartRaw, decPartRaw] = cleaned.split('.', 2)
    const intPart = (intPartRaw ?? '').replace(/^0+(?=\d)/, '')
    const intNum = intPart === '' ? 0 : parseInt(intPart, 10)
    const intFormatted = intNum.toLocaleString('en-US')

    const decPart = decPartRaw != null && decPartRaw.length > 0 ? `.${decPartRaw}` : ''
    return `${isNeg ? '-' : ''}$${intFormatted}${decPart}`
  }

  // Chart interaction state
  chartHoverIndex = -1
  chartTooltipX = 0
  chartTooltipY = 0

  // Chart data exposed to template
  readonly chartLinePath = CHART_LINE_PATH
  readonly chartAreaPath = CHART_AREA_PATH
  readonly chartYLabels = CHART_Y_LABELS
  readonly chartXLabels = CHART_X_LABELS
  readonly chartX0 = CHART_X0
  readonly chartW = CHART_W
  readonly chartViewBoxW = CHART_VIEWBOX_W
  readonly chartY0 = CHART_Y0
  readonly chartH = CHART_H
  readonly chartPtsIndexed = CHART_PTS.map((p, i) => ({
    ...p,
    i,
    v: CHART_VALUES[i],
    m: CHART_MONTHS[Math.floor(i / 2)],
  }))

  onChartEnter(): void {
    // No-op; hover index is set by move
  }

  onChartLeave(): void {
    this.chartHoverIndex = -1
  }

  onChartMove(event: PointerEvent): void {
    const container = event.currentTarget as HTMLElement
    const svg = container.querySelector('svg') as SVGElement | null
    if (!svg) return

    const rect = svg.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    // Convert pointer to SVG viewBox X
    const viewX = ((event.clientX - rect.left) / rect.width) * CHART_VIEWBOX_W
    const step = this.chartW / (CHART_VALUES.length - 1)
    const idx = Math.round((viewX - this.chartX0) / step)
    const clamped = Math.max(0, Math.min(CHART_VALUES.length - 1, idx))

    this.chartHoverIndex = clamped
    const pt = this.chartPtsIndexed[clamped]

    // Tooltip positioning (clamp so it stays within chart box)
    const tooltipW = 102
    const tooltipH = 46
    const minX = this.chartX0
    const maxX = this.chartX0 + this.chartW - tooltipW
    this.chartTooltipX = Math.max(minX, Math.min(maxX, pt.x + 8))

    const minY = 0
    const maxY = this.chartY0 + this.chartH - tooltipH
    this.chartTooltipY = Math.max(minY, Math.min(maxY, pt.y - 42))
  }

  readonly reportingEntityOptions = REPORTING_ENTITY_OPTIONS
  readonly counterpartyOptions = COUNTERPARTY_OPTIONS
  readonly yesNoOptions = YES_NO_OPTIONS
  readonly currencyOptions = CURRENCY_OPTIONS
  readonly triggerOptions = TRIGGER_OPTIONS
  readonly businessLineOptions = BUSINESS_LINE_OPTIONS

  form: AdjustmentForm = this.emptyForm()

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['panelContext'] && !changes['visible']) return

    this.openState = {}
    this.inputFocus = {}
    this.formDirty = false

    const ctx = this.panelContext
    if (ctx?.row) {
      const d = ctx.row
      const col = ctx.amountField
      const fieldVal = d[col]
      const baseNum =
        fieldVal != null && !Number.isNaN(Number(fieldVal))
          ? Number(fieldVal)
          : d.maturityAmount != null
            ? Number(d.maturityAmount)
            : NaN
      const safeCurrent = !Number.isNaN(baseNum) ? baseNum : 0
      const formatUsd = (n: number) => `$${n.toLocaleString('en-US')}`

      const savedPrev = d.amountAdjustedFrom?.[col]
      this.openingHadAmountHistory = typeof savedPrev === 'number'

      let maturityDisplay = ''
      if (this.openingHadAmountHistory) {
        this.prevMaturityAmountFormatted = formatUsd(savedPrev as number)
        maturityDisplay = formatUsd(safeCurrent)
      } else {
        maturityDisplay = formatUsd(safeCurrent)
        this.prevMaturityAmountFormatted = maturityDisplay
      }

      this.maturityDirty = this.openingHadAmountHistory
        ? maturityDisplay !== this.prevMaturityAmountFormatted
        : false

      this.form = {
        product: d.product ?? '',
        pid: d.pid ?? '',
        reportingEntity: d.reportingEntity ?? '',
        counterparty: d.counterparty ?? '',
        insured: d.insured ?? '',
        businessLine: d.businessLine ?? '',
        currency: d.currency ?? '',
        trigger: d.trigger ?? '',
        internal: d.internal ?? '',
        converted: d.converted ?? '',
        maturityAmount: maturityDisplay,
        issueId: d.issueId ?? '',
        comment: '',
      }
    } else {
      this.prevMaturityAmountFormatted = ''
      this.maturityDirty = false
      this.openingHadAmountHistory = false
    }
  }

  isFormValid(): boolean {
    return this.form.comment.trim().length >= 10
  }

  onSave(): void {
    if (!this.formDirty) return
    const ctx = this.panelContext
    if (!ctx?.row) return
    const d = ctx.row
    const col = ctx.amountField
    const newNum = parseFloat(this.form.maturityAmount.replace(/[^0-9.-]/g, '')) || 0
    const prevRaw = d[col]
    const oldVal = prevRaw != null && !Number.isNaN(Number(prevRaw)) ? Number(prevRaw) : 0
    const updated: FR2052AData = {
      ...d,
      reportingEntity: this.form.reportingEntity,
      counterparty: this.form.counterparty,
      insured: this.form.insured,
      businessLine: this.form.businessLine,
      currency: this.form.currency,
      trigger: this.form.trigger,
      internal: this.form.internal,
      converted: this.form.converted,
      [col]: newNum,
      maturityAmount: newNum,
      issueId: this.form.issueId,
      amountAdjustedFrom: {
        ...d.amountAdjustedFrom,
        [col]: oldVal,
      },
    }
    this.saved.emit(updated)
    this.close()
  }

  close(): void {
    this.closed.emit()
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('panel-overlay')) this.close()
  }

  private emptyForm(): AdjustmentForm {
    return {
      product: '', pid: '', reportingEntity: '', counterparty: '',
      insured: '', businessLine: '', currency: '', trigger: '',
      internal: '', converted: '', maturityAmount: '', issueId: '', comment: '',
    }
  }
}

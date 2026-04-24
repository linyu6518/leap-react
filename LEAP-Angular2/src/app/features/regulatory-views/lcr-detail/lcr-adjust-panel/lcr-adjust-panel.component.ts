import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import type { LcrRowData, LcrSegmentKey } from '../lcr-detail-data'

export interface LcrAdjustContext {
  row: LcrRowData
  segment: LcrSegmentKey
  segmentLabel: string
  currentValue: number
}

export interface LcrAdjustSaveEvent {
  nodeId: string
  segment: LcrSegmentKey
  originalValue: number
  newValue: number
  comment: string
}

export interface LcrMockEditHistoryEntry {
  at: string
  user: string
  initials: string
  avatarColor: string
  avatarBg: string
  delta: number
  result: number
  note: string
}

@Component({
  selector: 'app-lcr-adjust-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="panel-overlay" [class.visible]="visible" (click)="onOverlayClick($event)">
      <div class="adjustment-panel" [class.open]="visible">

        <!-- Header -->
        <div class="panel-header">
          <div class="panel-title-area">
            <h2 class="panel-title">Adjustment</h2>
          </div>
          <button class="close-btn" type="button" (click)="closed.emit()" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="#777" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- Scrollable body -->
        <div class="panel-body">
          <div class="form-grid">

            <!-- Row Name (col-4, full width) -->
            <div class="form-field col-4">
              <div class="field-wrap floating-label-active field-wrap--readonly">
                <div class="adj-readonly adj-readonly--multiline">
                  <span class="adj-readonly-clip">{{ context?.row?.name || '—' }}</span>
                </div>
                <span class="floating-label">Row</span>
              </div>
            </div>

            <!-- Segment (col-2) + Date (col-2) -->
            <div class="form-field col-2">
              <div class="field-wrap floating-label-active">
                <div class="adj-readonly">{{ context?.segmentLabel || '—' }}</div>
                <span class="floating-label">Segment</span>
              </div>
            </div>
            <div class="form-field col-2">
              <div class="field-wrap floating-label-active">
                <div class="adj-readonly">29-Sep</div>
                <span class="floating-label">Date</span>
              </div>
            </div>

            <!-- Original Value (col-2) -->
            <div class="form-field col-2">
              <div class="field-wrap floating-label-active">
                <div class="adj-readonly">{{ originalFormatted }}</div>
                <span class="floating-label">Original Value</span>
              </div>
            </div>

            <!-- Adjusted Value = delta (col-2) -->
            <div class="form-field col-2" [class.field-has-error]="deltaError">
              <div
                class="field-wrap"
                [class.floating-label-active]="inputFocus['adjustedDelta'] || adjustedDeltaRaw !== null"
                [class.field-wrap--dirty]="deltaDirty"
              >
                <input
                  class="adj-input"
                  type="number"
                  [(ngModel)]="adjustedDeltaRaw"
                  (ngModelChange)="onDeltaChange()"
                  (focus)="inputFocus['adjustedDelta'] = true"
                  (blur)="inputFocus['adjustedDelta'] = false"
                  [placeholder]="(inputFocus['adjustedDelta'] || adjustedDeltaRaw !== null) ? 'e.g. -500' : ''"
                  [class.adj-input--delta-pos]="deltaInputTone() === 'pos'"
                  [class.adj-input--delta-neg]="deltaInputTone() === 'neg'"
                  step="any"
                />
                <span class="floating-label">Adjusted Value</span>
              </div>
              @if (deltaError) {
                <span class="field-hint-error">{{ deltaError }}</span>
              }
            </div>

            <!-- New Value + Weighted: distinct summary cards (not floating-label readonly) -->
            <div class="form-field col-4 value-pair">
              <div class="value-card value-card--new">
                <span class="value-card-label value-card-label--new">New value</span>
                <span class="value-card-amount">{{ previewNewFormatted }}</span>
              </div>
              <div
                class="value-card value-card--weighted"
                [attr.title]="weightedIllustrativeTitle"
              >
                <div class="value-card-head">
                  <span class="value-card-label value-card-label--new">Weighted (illustrative)</span>
                  <span class="value-card-pill">Demo</span>
                </div>
                <span class="value-card-amount">{{ weightedIllustrativeFormatted }}</span>
                <span class="value-card-foot">Not a regulatory or production figure.</span>
              </div>
            </div>

          </div>

          <!-- Comment -->
          <div class="comment-area">
            <div
              class="comment-input-shell"
              [class.focused]="commentFocused"
              [class.has-value]="comment.trim().length > 0"
              [class.comment-input-shell--error]="showCommentRequiredError"
            >
              <div class="comment-input-label" id="lcr-adj-comment-label">Comment</div>
              <textarea
                id="lcr-adj-comment"
                class="comment-input-textarea"
                [(ngModel)]="comment"
                (ngModelChange)="onCommentChange()"
                (focus)="commentFocused = true"
                (blur)="commentFocused = false"
                [maxlength]="maxChars"
                aria-required="true"
                [attr.aria-invalid]="showCommentRequiredError"
                [attr.aria-describedby]="showCommentRequiredError ? 'lcr-adj-comment-err' : null"
                rows="3"
              ></textarea>
            </div>
            @if (showCommentRequiredError) {
              <span id="lcr-adj-comment-err" class="field-hint-error" role="alert">Comment is required.</span>
            }
            <div class="field-meta">
              <span class="char-count">{{ comment.length }} / {{ maxChars }}</span>
            </div>
          </div>

          <!-- Edit history — same visual language as Comments panel (avatar + thread line + meta + quote body) -->
          <div class="edit-history">
            <h3 class="edit-history-heading">Edit history</h3>
            <div class="history-list" role="list">
              @for (h of mockEditHistory; track h.at; let idx = $index) {
                <div class="history-thread" role="listitem">
                  <div class="history-left">
                    <div class="history-avatar" [style.background]="h.avatarBg" [style.color]="h.avatarColor">
                      {{ h.initials }}
                    </div>
                    @if (idx < mockEditHistory.length - 1) {
                      <div class="history-thread-line" aria-hidden="true"></div>
                    }
                  </div>
                  <div class="history-right">
                    <div class="history-meta">
                      <span class="history-author">{{ h.user }}</span>
                      <span class="history-timestamp">{{ h.at }}</span>
                    </div>
                    <div class="history-body">
                      <span class="history-quote-icon" aria-hidden="true">
                        <svg width="16" height="12" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M0 14V8.4C0 6.93333 0.333333 5.6 1 4.4C1.66667 3.2 2.73333 2.13333 4.2 1.2L5.6 2.8C4.53333 3.46667 3.76667 4.13333 3.3 4.8C2.83333 5.46667 2.6 6.26667 2.6 7.2H5.2V14H0ZM10 14V8.4C10 6.93333 10.3333 5.6 11 4.4C11.6667 3.2 12.7333 2.13333 14.2 1.2L15.6 2.8C14.5333 3.46667 13.7667 4.13333 13.3 4.8C12.8333 5.46667 12.6 6.26667 12.6 7.2H15.2V14H10Z" fill="#D0D0D0"/>
                        </svg>
                      </span>
                      <div class="history-text-block">
                        <div class="history-change-line">
                          <span
                            class="history-delta"
                            [class.history-delta--pos]="h.delta > 0"
                            [class.history-delta--neg]="h.delta < 0"
                          >{{ formatHistoryDelta(h.delta) }}</span>
                          <span class="history-sep">→</span>
                          <span class="history-result">{{ formatHistoryNumber(h.result) }}</span>
                        </div>
                        <p class="history-note">{{ h.note }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="panel-footer">
          <div class="footer-actions">
            <button class="btn-cancel" type="button" (click)="closed.emit()">Cancel</button>
            <button
              class="btn-confirm"
              type="button"
              [disabled]="!saveEnabled"
              [class.confirm-dirty]="canSave"
              (click)="onSave()"
            >Save</button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .panel-overlay {
      position: fixed; inset: 0; z-index: 1001;
      pointer-events: none; background: transparent;
      transition: background 0.25s;
    }
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
      border-radius: 0;
    }
    .adjustment-panel.open { transform: translateX(0); }

    /* Header */
    .panel-header { position: relative; padding: 20px 36px 16px; flex-shrink: 0; }
    .panel-title-area { display: flex; flex-direction: column; gap: 6px; margin-top: 17px; }
    .panel-title { font-size: 22px; font-weight: 500; color: #1A5C2A; margin: 0; line-height: 1.2; }
    .close-btn {
      position: absolute; top: 20px; right: 20px;
      border: none; background: transparent; cursor: pointer;
      padding: 4px; border-radius: 4px;
      display: flex; align-items: center; justify-content: center;
    }
    .close-btn:hover { background: #f5f5f5; }

    /* Scrollable body */
    .panel-body { flex: 1; overflow-y: auto; padding: 12px 36px 20px; }

    /* Grid: 4 columns */
    .form-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 28px 12px; }
    .form-field { display: flex; flex-direction: column; grid-column: span 1; min-width: 0; }
    .form-field.col-1 { grid-column: span 1; }
    .form-field.col-2 { grid-column: span 2; }
    .form-field.col-3 { grid-column: span 3; }
    .form-field.col-4 { grid-column: span 4; }

    /* Floating label wrapper */
    .field-wrap { position: relative; width: 100%; min-width: 0; }
    .floating-label {
      position: absolute; left: 8px; top: 18px;
      font-family: inherit; font-size: 16px; font-weight: 400; color: #1c1c1c;
      pointer-events: none; transition: all 0.2s ease;
      background-color: #fff; padding: 0 4px; z-index: 2;
      line-height: 1; white-space: nowrap;
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
    .adj-readonly--multiline {
      height: 54px; min-height: 54px; max-height: 54px;
      min-width: 0; width: 100%;
      align-items: flex-end; align-self: stretch;
      padding: 6px 12px 8px; box-sizing: border-box; overflow: hidden;
    }
    .adj-readonly--multiline .adj-readonly-clip {
      display: block; min-width: 0; width: 100%;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
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
      transition: border-color 0.2s, border-width 0.2s;
      box-sizing: border-box;
      -moz-appearance: textfield;
    }
    .adj-input::-webkit-outer-spin-button,
    .adj-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .adj-input:focus { border-color: #008A00; border-width: 1px 1px 3px 1px; }
    .adj-input::placeholder { color: #9E9E9E; font-size: 16px; font-weight: 400; }
    .adj-input.adj-input--delta-pos { color: #058901; font-weight: 600; }
    .adj-input.adj-input--delta-neg { color: #D9363E; font-weight: 600; }

    .field-wrap--dirty .adj-input {
      border-color: #D4A000 !important;
      background: #FFF8E1 !important;
      border-width: 2px !important;
    }
    .field-wrap--dirty .floating-label {
      background-color: transparent;
      color: #A67C00;
    }

    .field-hint-error {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #D9363E;
      margin-top: 4px;
      line-height: 1.35;
    }

    /* New Value + Weighted summary (aligned with panel green accent, not floating-label fields) */
    .value-pair {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .value-card {
      box-sizing: border-box;
      border-radius: 4px 4px 0 0;
      padding: 14px 16px;
    }
    .value-card--new {
      background: #f5fbf2;
      border: 1px solid #d9ead9;
      border-radius: 4px;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
    }
    .value-card--weighted {
      background: #f7f7f7;
      border: none;
      border-radius: 4px;
      box-shadow: none;
    }
    .value-card-label {
      display: block;
      font-size: 12px;
      font-weight: 400;
      color: #8C8C8C;
      margin-bottom: 6px;
    }
    .value-card-label--new {
      color: #595959;
      font-weight: 500;
    }
    .value-card-amount {
      display: block;
      font-size: 22px;
      font-weight: 600;
      color: #1A1A1A;
      font-variant-numeric: tabular-nums;
      line-height: 1.2;
    }
    .value-card-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 6px;
    }
    .value-card-head .value-card-label {
      margin-bottom: 0;
      flex: 1;
      min-width: 0;
    }
    .value-card-pill {
      flex-shrink: 0;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: #b42318;
      background: #ffe2de;
      border: 1px solid #f4b8b0;
      padding: 3px 8px;
      border-radius: 2px;
      line-height: 1.2;
    }
    .value-card-foot {
      display: block;
      margin-top: 10px;
      font-size: 11px;
      font-weight: 400;
      color: #7a7a7a;
      line-height: 1.35;
    }

    .comment-area { margin-top: 28px; }

    .comment-input-shell {
      position: relative; border: 1px solid #8C8C8C; border-radius: 4px 4px 0 0;
      background: #fff; transition: border-color 0.22s ease, border-width 0.22s ease;
    }
    .comment-input-shell:hover { border-color: #008A00; }
    .comment-input-shell.focused {
      border-color: #008A00; border-width: 1px 1px 3px 1px;
      border-radius: 4px 4px 0 0;
    }
    .comment-input-label {
      position: absolute; left: 12px; top: 10px;
      font-size: 12px; font-weight: 400; color: #1C1C1C;
      line-height: 1; transition: top 0.22s ease, font-size 0.22s ease;
      pointer-events: none; z-index: 1; background: #fff; padding: 0 2px;
    }
    .comment-input-shell.comment-input-shell--error {
      border-color: #D9363E;
    }
    .comment-input-shell.comment-input-shell--error.focused {
      border-color: #D9363E;
      border-width: 1px 1px 3px 1px;
    }
    .comment-input-shell:not(.focused):not(.has-value) .comment-input-label {
      top: 18px; font-size: 16px; font-weight: 400;
    }
    .comment-input-textarea {
      display: block; width: 100%; border: none; outline: none; resize: vertical;
      font-size: 16px; font-weight: 500; color: #1A1A1A; background: transparent;
      padding: 34px 12px 10px; font-family: inherit; line-height: 1.45;
      box-sizing: border-box; min-height: 80px; height: 80px;
    }
    .comment-input-shell:not(.focused):not(.has-value) .comment-input-textarea { padding-top: 44px; }
    .comment-input-shell:not(.focused):not(.has-value) .comment-input-textarea::placeholder { color: transparent; }
    .comment-input-textarea::placeholder { color: #8C8C8C; }

    .field-meta { display: flex; justify-content: flex-end; align-items: center; margin-top: 6px; margin-bottom: 2px; }
    .char-count { font-size: 12px; color: #1A1A1A; text-align: right; min-width: 72px; }

    /* Edit history — match comment-panel thread typography & thread line */
    .edit-history {
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid #E8E8E8;
    }
    .edit-history-heading {
      margin: 0 0 16px;
      font-size: 14px;
      font-weight: 600;
      color: #1A1A1A;
      line-height: 1.2;
    }
    .history-list {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .history-thread {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .history-left {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: 28px;
      flex-shrink: 0;
      overflow: visible;
    }
    .history-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .history-thread-line {
      flex: none;
      min-height: 24px;
      margin-top: 4px;
      margin-left: 13px;
      width: 0;
      border-left: 1px dashed #dcdcdc;
    }
    .history-right {
      flex: 1;
      min-width: 0;
    }
    .history-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      padding-top: 4px;
    }
    .history-author {
      font-size: 13px;
      font-weight: 600;
      color: #1A1A1A;
    }
    .history-timestamp {
      font-size: 11px;
      font-weight: 500;
      color: #bbb;
    }
    .history-body {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .history-quote-icon {
      display: flex;
      align-items: flex-start;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .history-text-block {
      flex: 1;
      min-width: 0;
    }
    .history-change-line {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 6px 8px;
      font-size: 13px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: #1A1A1A;
      margin-bottom: 6px;
    }
    .history-delta {
      font-weight: 600;
      color: #595959;
    }
    .history-delta--pos { color: #058901; }
    .history-delta--neg { color: #D9363E; }
    .history-sep {
      color: #8C8C8C;
      font-weight: 400;
    }
    .history-result {
      color: #1A1A1A;
      font-weight: 600;
    }
    .history-note {
      margin: 0;
      font-size: 15px;
      font-weight: 400;
      color: #1A1A1A;
      line-height: 1.5;
    }

    .panel-footer { flex-shrink: 0; padding: 14px 36px 24px; border-top: none; }
    .footer-actions { display: flex; gap: 12px; }
    .btn-cancel {
      flex: 1; height: 40px;
      background: #fff; color: #00843D;
      border: 2px solid #00843D; border-radius: 0;
      font-size: 14px; font-weight: 500; cursor: pointer;
    }
    .btn-cancel:hover { background: rgba(0,132,61,0.05); }
    .btn-confirm {
      flex: 1; height: 40px;
      background: #F7F7F7;
      color: #C7C7C7;
      border: 2px solid #D4D4D4;
      border-radius: 0;
      font-size: 14px; font-weight: 500; cursor: pointer;
      outline: none;
    }
    .btn-confirm.confirm-dirty:not(:disabled) {
      background: #058901;
      color: #fff;
      border: none;
    }
    .btn-confirm.confirm-dirty:not(:disabled):hover { background: #047001; }
    .btn-confirm:not(.confirm-dirty):not(:disabled):hover {
      background: #efefef;
      border-color: #c7c7c7;
    }
    .btn-confirm:disabled {
      background: #F7F7F7;
      color: #C7C7C7;
      border: 2px solid #D4D4D4;
      cursor: not-allowed;
      opacity: 0.95;
    }
  `],
})
export class LcrAdjustPanelComponent implements OnChanges {
  @Input() visible = false
  @Input() context: LcrAdjustContext | null = null
  @Output() closed = new EventEmitter<void>()
  @Output() saved = new EventEmitter<LcrAdjustSaveEvent>()

  adjustedDeltaRaw: number | null = null
  private initialDelta = 0
  comment = ''
  deltaError = ''
  deltaDirty = false
  /** Set true only after Save click while Comment empty (shows Comment error). */
  private saveAttempted = false
  commentFocused = false
  originalFormatted = ''
  inputFocus: Record<string, boolean> = {}
  readonly maxChars = 250
  readonly weightedIllustrativeTitle =
    'Illustrative weighted figure for UI demo only; not a regulatory or production value.'

  readonly mockEditHistory: LcrMockEditHistoryEntry[] = [
    {
      at: '28-Sep 14:22',
      user: 'A. Chen',
      initials: 'AC',
      avatarColor: '#00695c',
      avatarBg: '#e0f2f1',
      delta: -1200,
      result: 88420,
      note: 'Repo balance correction per ops.',
    },
    {
      at: '26-Sep 09:05',
      user: 'M. Patel',
      initials: 'MP',
      avatarColor: '#1565c0',
      avatarBg: '#e3f2fd',
      delta: 3500,
      result: 89620,
      note: 'Included late-day cash sweep.',
    },
    {
      at: '24-Sep 16:40',
      user: 'J. Kim',
      initials: 'JK',
      avatarColor: '#6a1b9a',
      avatarBg: '#f3e5f5',
      delta: -800,
      result: 86120,
      note: 'Reclassified to Level 2a bucket.',
    },
    {
      at: '20-Sep 11:15',
      user: 'S. Roy',
      initials: 'SR',
      avatarColor: '#283593',
      avatarBg: '#e8eaf6',
      delta: 2100,
      result: 86920,
      note: 'Initial submission adjustment.',
    },
  ]

  /** Delta valid and changed — Save is clickable even before Comment is filled. */
  get saveEnabled(): boolean {
    return (
      this.adjustedDeltaRaw !== null &&
      !this.deltaError &&
      this.deltaDirty
    )
  }

  /** Full submit: delta OK + non-empty Comment (green Save). */
  get canSave(): boolean {
    return this.saveEnabled && this.comment.trim().length > 0
  }

  /** After user clicks Save with empty Comment only. */
  get showCommentRequiredError(): boolean {
    return this.saveAttempted && !this.comment.trim()
  }

  get previewNewFormatted(): string {
    if (!this.context) return '—'
    const orig = this.context.row.adjustedFrom?.[this.context.segment] ?? this.context.currentValue
    const d = this.adjustedDeltaRaw
    if (d === null || d === undefined || Number.isNaN(Number(d))) return '—'
    const sum = orig + Number(d)
    if (Number.isNaN(sum)) return '—'
    return this.formatAmount(sum)
  }

  /** Mock weighted from preview “New Value” (LCR Ratio ×0.99, else rounded ×0.98). */
  get weightedIllustrativeFormatted(): string {
    if (!this.context) return '—'
    const orig = this.context.row.adjustedFrom?.[this.context.segment] ?? this.context.currentValue
    const d = this.adjustedDeltaRaw
    if (d === null || d === undefined || Number.isNaN(Number(d))) return '—'
    const preview = orig + Number(d)
    if (Number.isNaN(preview)) return '—'
    const isRatio = this.context.row.name === 'LCR Ratio'
    const w = isRatio ? preview * 0.99 : preview * 0.98
    return isRatio ? `${w.toFixed(1)}%` : Math.round(w).toLocaleString()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['context'] && this.context) {
      const orig = this.context.row.adjustedFrom?.[this.context.segment] ?? this.context.currentValue
      this.originalFormatted = this.formatAmount(orig)
      const delta = this.context.currentValue - orig
      this.initialDelta = delta
      this.adjustedDeltaRaw = delta
      this.comment = ''
      this.deltaError = ''
      this.deltaDirty = false
      this.saveAttempted = false
      this.inputFocus = {}
    }
  }

  onCommentChange(): void {
    if (this.comment.trim().length > 0) {
      this.saveAttempted = false
    }
  }

  onDeltaChange(): void {
    const d = this.adjustedDeltaRaw
    if (d === null || d === undefined || Number.isNaN(Number(d))) {
      this.deltaError = 'Please enter a valid number'
      this.deltaDirty = false
    } else {
      this.deltaError = ''
      this.deltaDirty = Number(d) !== this.initialDelta
    }
  }

  formatHistoryNumber(n: number): string {
    return Number(n).toLocaleString()
  }

  formatHistoryDelta(n: number): string {
    const sign = n > 0 ? '+' : ''
    return `Δ ${sign}${Number(n).toLocaleString()}`
  }

  /** Positive = green, negative = red in UI; zero stays neutral. */
  deltaInputTone(): 'pos' | 'neg' | 'zero' | null {
    if (this.deltaError) return null
    const d = this.adjustedDeltaRaw
    if (d === null || d === undefined || Number.isNaN(Number(d))) return null
    const n = Number(d)
    if (n > 0) return 'pos'
    if (n < 0) return 'neg'
    return 'zero'
  }

  private formatAmount(n: number): string {
    if (this.context?.row.name === 'LCR Ratio') return `${n}%`
    return Number(n).toLocaleString()
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('panel-overlay')) {
      this.closed.emit()
    }
  }

  onSave(): void {
    if (!this.saveEnabled || !this.context) return
    if (!this.comment.trim()) {
      this.saveAttempted = true
      return
    }
    this.saveAttempted = false
    const orig = this.context.row.adjustedFrom?.[this.context.segment] ?? this.context.currentValue
    const delta = Number(this.adjustedDeltaRaw)
    this.saved.emit({
      nodeId: this.context.row.nodeId,
      segment: this.context.segment,
      originalValue: orig,
      newValue: orig + delta,
      comment: this.comment.trim(),
    })
  }
}

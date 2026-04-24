import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  signal,
} from '@angular/core'
import { CommonModule, NgTemplateOutlet } from '@angular/common'
import { FormsModule } from '@angular/forms'
import {
  Comment,
  CommentGroup,
  CommentReply,
  RowIndex,
  ScopeKey,
  buildRowIndex,
  ensureBucket,
  getCommentsForRow,
  COMMENTS_BY_SCOPE,
} from './comment-data'
import { DRIVER_CODES, type DriverCode, type DriverMeta, driverMeta } from './driver-codes'

export type { Comment, CommentReply } from './comment-data'

const MAX_CHARS = 250

/** Subset of `COUNTERPARTY_GROUPS` in deposits.component.ts. Mirrored here so the panel can label tabs without importing the whole grid module. */
const SCOPE_LABELS: Record<ScopeKey, string> = {
  TOTAL: 'Total',
  RETAIL: 'Retail',
  SME: 'SME',
  NON_FINANCIAL: 'Non-Financial',
  PENSION_FUNDS: 'Pension Funds',
  SOVEREIGNS: 'Sovereigns',
  GSE_PSE: 'GSE/PSEs',
  BANK: 'Bank',
  BROKER_DEALERS: 'Broker Dealers/FMUs',
  INVESTMENT_FUNDS: 'Investment Firms/Funds',
  OTHER_FINANCIAL: 'Other Financial',
}

const ALL_SCOPES: ScopeKey[] = Object.keys(SCOPE_LABELS) as ScopeKey[]

interface DriverItem {
  nodeId: string
  breadcrumbs: string[]
  variance: number
  pct: number
}

interface DriversSummary {
  total: number
  top: DriverItem[]
  others: { count: number; combined: number } | null
}

interface ScopeTab {
  key: ScopeKey
  label: string
  count: number
  variance: number
}

/** Aggregated per-driver entry inside a single group's preview chip row. */
interface GroupDriverChip {
  code: DriverCode | 'UNASSIGNED'
  label: string
  shortLabel: string
  colorBg: string
  colorFg: string
  impact: number
}

/** Snippet of the latest comment in a group, pre-rendered for the collapsed header. */
interface GroupLatest {
  author: string
  absolute: string
  relative: string
  snippet: string
}

type ReconcileState = 'balanced' | 'partial' | 'over' | 'none'

/** Derived info attached to a child group so the collapsed header can render richly. */
interface GroupSummary {
  variance: number
  impactSum: number
  chips: GroupDriverChip[]
  hiddenChipCount: number
  reconcile: ReconcileState
  latest: GroupLatest | null
}

interface EnrichedGroup extends CommentGroup {
  summary: GroupSummary
}

/** One card in the By-Driver view: aggregates impacts across all child rows. */
interface DriverBucketRow {
  nodeId: string
  rowName: string
  breadcrumbs: string[]
  impact: number
  commentCount: number
}

interface DriverBucket {
  code: DriverCode | 'UNASSIGNED'
  label: string
  shortLabel: string
  colorBg: string
  colorFg: string
  impactSum: number
  rows: DriverBucketRow[]
  latest: GroupLatest | null
}

type CommentView = 'hierarchy' | 'driver'
const VIEW_STORAGE_KEY = 'leap_comment_panel_view'
const UNASSIGNED_META = {
  label: 'Unassigned',
  shortLabel: 'NONE',
  colorBg: '#F0F0F0',
  colorFg: '#555555',
}

@Component({
  selector: 'app-comment-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, NgTemplateOutlet],
  template: `
    <div class="panel-overlay" [class.visible]="visible" (click)="onOverlayClick($event)">
      <div class="comment-panel" [class.open]="visible" (click)="$event.stopPropagation()">
        <div class="panel-header">
          <div class="panel-title-area">
            <div class="panel-title-row">
              <h2 class="panel-title" [title]="titleText()">{{ titleText() }}</h2>
              @if (totalCount() > 0) {
                <span class="title-count" aria-label="Total comments">{{ totalCount() }}</span>
              }
            </div>
            <span class="panel-subtitle">{{ subtitle() }}</span>
          </div>
          <button class="close-btn" (click)="close()" type="button" aria-label="Close comments">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="#777" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        @if (availableScopes().length > 1) {
          <nav class="scope-tabs" role="tablist" aria-label="Counterparty scope">
            @for (tab of availableScopes(); track tab.key) {
              <button
                type="button"
                role="tab"
                class="scope-tab"
                [class.active]="tab.key === scope()"
                [attr.aria-selected]="tab.key === scope()"
                (click)="selectScope(tab.key)"
              >
                <span class="scope-label">{{ tab.label }}</span>
                @if (tab.count > 0) {
                  <span class="scope-count">{{ tab.count }}</span>
                }
              </button>
            }
          </nav>
        }

        <div class="panel-body" (click)="cancelReply()">
          @if (drivers().top.length > 0) {
            <section class="drivers-summary" (click)="$event.stopPropagation()">
              <header class="drivers-header">
                <span class="drivers-title">Top drivers of {{ currentScopeLabel() }}</span>
                <span
                  class="drivers-total"
                  [class.up]="drivers().total > 0"
                  [class.down]="drivers().total < 0"
                >{{ formatSigned(drivers().total) }}</span>
              </header>
              <ol class="drivers-list">
                @for (d of drivers().top; track d.nodeId; let i = $index) {
                  <li class="driver-item" (click)="navigateToDriver(d.nodeId)">
                    <span class="rank">{{ i + 1 }}</span>
                    <span class="crumbs" [title]="d.breadcrumbs.join(' / ')">{{ d.breadcrumbs.join(' / ') }}</span>
                    <span
                      class="variance"
                      [class.up]="d.variance > 0"
                      [class.down]="d.variance < 0"
                    >{{ formatSigned(d.variance) }} · {{ d.pct }}%</span>
                  </li>
                }
                @if (drivers().others; as o) {
                  <li class="driver-more" (click)="expandAllDrivers()">
                    + {{ o.count }} more rows ({{ formatSigned(o.combined) }} combined)
                  </li>
                }
              </ol>
            </section>
          }

          <div class="comments-list">
            @if (currentGroup(); as cg) {
              <section class="comment-group is-current" [attr.data-group-id]="cg.rowId">
                <div class="group-body">
                  @if (cg.comments.length === 0) {
                    <div class="group-empty">No comments on this row yet.</div>
                  }
                  <ng-container *ngTemplateOutlet="threadTpl; context: { comments: cg.comments, rowId: cg.rowId }"></ng-container>
                </div>
              </section>
            }

            @if (otherGroups().length >= 2) {
              <div class="view-switch" role="tablist" aria-label="Child comments view">
                <button
                  type="button"
                  role="tab"
                  class="view-switch-btn"
                  [class.active]="view() === 'hierarchy'"
                  [attr.aria-selected]="view() === 'hierarchy'"
                  (click)="setView('hierarchy'); $event.stopPropagation()"
                >Hierarchy</button>
                <button
                  type="button"
                  role="tab"
                  class="view-switch-btn"
                  [class.active]="view() === 'driver'"
                  [attr.aria-selected]="view() === 'driver'"
                  (click)="setView('driver'); $event.stopPropagation()"
                >By Driver</button>
              </div>
            }

            @if (view() === 'hierarchy') {
              @for (group of otherGroups(); track group.rowId) {
                @let expanded = isGroupExpanded(group.rowId);
                <section class="comment-group" [attr.data-group-id]="group.rowId">
                  <button class="group-header rich" type="button" [class.expanded]="expanded" (click)="toggleGroup(group.rowId); $event.stopPropagation()">
                    <span class="gh-line-1">
                      <span class="crumbs">
                        @for (crumb of group.breadcrumbs; track $index; let last = $last) {
                          <span class="crumb" [class.leaf]="last">{{ crumb }}</span>
                          @if (!last) { <span class="sep">›</span> }
                        }
                      </span>
                      <span class="gh-right">
                        @if (group.summary.variance !== 0) {
                          <span
                            class="group-variance"
                            [class.up]="group.summary.variance > 0"
                            [class.down]="group.summary.variance < 0"
                          >{{ formatSigned(group.summary.variance) }}</span>
                        }
                        <span
                          class="group-reconcile"
                          [class.balanced]="group.summary.reconcile === 'balanced'"
                          [class.partial]="group.summary.reconcile === 'partial'"
                          [class.over]="group.summary.reconcile === 'over'"
                          [class.none]="group.summary.reconcile === 'none'"
                          [title]="reconcileTooltip(group.summary)"
                          aria-hidden="true"
                        >
                          @if (group.summary.reconcile === 'balanced') {
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5.2L4 7.7L8.5 2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                          } @else if (group.summary.reconcile === 'over') {
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1.5L9 8.5H1L5 1.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" fill="none"/><path d="M5 4V6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="5" cy="7.3" r="0.6" fill="currentColor"/></svg>
                          } @else if (group.summary.reconcile === 'partial') {
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="3.6" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M5 1.4A3.6 3.6 0 0 1 5 8.6Z" fill="currentColor"/></svg>
                          } @else {
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="3.6" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>
                          }
                        </span>
                        <span class="badge">{{ group.comments.length }}</span>
                        <span class="chevron chevron-trailing" [class.open]="expanded" aria-hidden="true">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M3 2L7 5L3 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </span>
                      </span>
                    </span>
                    @if (group.summary.chips.length > 0 || group.summary.latest) {
                      <span class="gh-line-2">
                        @if (group.summary.chips.length > 0) {
                          <span class="group-chips">
                            @for (ch of group.summary.chips; track ch.code) {
                              <span class="gc-item">
                                <span
                                  class="driver-chip"
                                  [style.background]="ch.colorBg"
                                  [style.color]="ch.colorFg"
                                  [title]="ch.label"
                                >{{ ch.shortLabel }}</span>
                                @if (ch.impact !== 0) {
                                  <span
                                    class="driver-impact"
                                    [class.up]="ch.impact > 0"
                                    [class.down]="ch.impact < 0"
                                  >{{ formatSigned(ch.impact) }}</span>
                                }
                              </span>
                            }
                            @if (group.summary.hiddenChipCount > 0) {
                              <span class="gc-more">+{{ group.summary.hiddenChipCount }}</span>
                            }
                          </span>
                        }
                        @if (group.summary.latest; as l) {
                          <span class="group-snippet" [title]="l.absolute">
                            <span class="gs-author">{{ l.author }}</span>,
                            <span class="gs-time">{{ l.relative }}</span>:
                            <span class="gs-text">“{{ l.snippet }}”</span>
                          </span>
                        }
                      </span>
                    }
                  </button>

                  @if (expanded) {
                    <div class="group-body">
                      @if (group.comments.length === 0) {
                        <div class="group-empty">No comments on this row yet.</div>
                      }
                      <ng-container *ngTemplateOutlet="threadTpl; context: { comments: group.comments, rowId: group.rowId }"></ng-container>
                    </div>
                  }
                </section>
              }
            } @else {
              @for (bucket of driverBuckets(); track bucket.code) {
                <section class="driver-bucket" [attr.data-driver]="bucket.code">
                  <header class="driver-bucket-header">
                    <span
                      class="driver-chip"
                      [style.background]="bucket.colorBg"
                      [style.color]="bucket.colorFg"
                      [title]="bucket.label"
                    >{{ bucket.shortLabel }}</span>
                    <span class="db-label">{{ bucket.label }}</span>
                    <span class="db-aggregate">
                      @if (bucket.impactSum !== 0) {
                        <span
                          class="driver-impact"
                          [class.up]="bucket.impactSum > 0"
                          [class.down]="bucket.impactSum < 0"
                        >{{ formatSigned(bucket.impactSum) }}</span>
                      }
                      <span class="db-rowcount">across {{ bucket.rows.length }} {{ bucket.rows.length === 1 ? 'row' : 'rows' }}</span>
                    </span>
                  </header>
                  <ul class="driver-bucket-rows">
                    @for (r of bucket.rows; track r.nodeId) {
                      <li class="driver-bucket-row" (click)="jumpToRowFromBucket(r.nodeId)">
                        <span class="dbr-crumbs" [title]="r.breadcrumbs.join(' / ')">
                          @for (crumb of r.breadcrumbs; track $index; let last = $last) {
                            <span class="crumb" [class.leaf]="last">{{ crumb }}</span>
                            @if (!last) { <span class="sep">›</span> }
                          }
                        </span>
                        @if (r.impact !== 0) {
                          <span
                            class="driver-impact"
                            [class.up]="r.impact > 0"
                            [class.down]="r.impact < 0"
                          >{{ formatSigned(r.impact) }}</span>
                        }
                      </li>
                    }
                  </ul>
                  @if (bucket.latest; as l) {
                    <div class="driver-bucket-latest" [title]="l.absolute">
                      <span class="dbl-author">{{ l.author }}</span>,
                      <span class="dbl-time">{{ l.relative }}</span>:
                      <span class="dbl-text">“{{ l.snippet }}”</span>
                    </div>
                  }
                </section>
              }
              @if (driverBuckets().length === 0) {
                <div class="driver-empty">No driver-tagged comments on child rows yet.</div>
              }
            }
          </div>
        </div>

        <ng-template #threadTpl let-comments="comments" let-rowId="rowId">
          @for (comment of comments; track comment.id) {
            <div class="comment-thread">
                        <div class="comment-left">
                          <div class="avatar" [style.background]="comment.avatarBg" [style.color]="comment.avatarColor">
                            {{ comment.initials }}
                          </div>
                          @if (comment.replies?.length || activeReplyId === comment.id) {
                            <div class="thread-line"></div>
                          }
                        </div>
                        <div class="comment-right">
                          <div class="comment-meta">
                            <span class="author">{{ comment.author }}</span>
                            <span class="timestamp">{{ comment.timestamp }}</span>
                          </div>

                          @if (comment.driver || comment.impactAmount != null) {
                            <div class="comment-driver-row">
                              @if (comment.driver) {
                                @let dm = driverMetaFor(comment.driver);
                                <span
                                  class="driver-chip"
                                  [style.background]="dm.colorBg"
                                  [style.color]="dm.colorFg"
                                  [title]="dm.label"
                                >{{ dm.shortLabel }}</span>
                              }
                              @if (comment.impactAmount != null) {
                                <span
                                  class="driver-impact"
                                  [class.up]="comment.impactAmount > 0"
                                  [class.down]="comment.impactAmount < 0"
                                >{{ formatSigned(comment.impactAmount) }}</span>
                              }
                            </div>
                          }

                          <div class="comment-body">
                            <span class="quote-icon">
                              <svg width="16" height="12" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0 14V8.4C0 6.93333 0.333333 5.6 1 4.4C1.66667 3.2 2.73333 2.13333 4.2 1.2L5.6 2.8C4.53333 3.46667 3.76667 4.13333 3.3 4.8C2.83333 5.46667 2.6 6.26667 2.6 7.2H5.2V14H0ZM10 14V8.4C10 6.93333 10.3333 5.6 11 4.4C11.6667 3.2 12.7333 2.13333 14.2 1.2L15.6 2.8C14.5333 3.46667 13.7667 4.13333 13.3 4.8C12.8333 5.46667 12.6 6.26667 12.6 7.2H15.2V14H10Z" fill="#D0D0D0"/>
                              </svg>
                            </span>
                            <span class="comment-text">{{ comment.text }}</span>
                          </div>
                          <button class="reply-btn" type="button" (click)="startReply(comment.id, comment.id, rowId); $event.stopPropagation()">
                            <svg width="12" height="12" viewBox="0 0 18 18" fill="none">
                              <path d="M15 2H3C2.44772 2 2 2.44772 2 3V11C2 11.5523 2.44772 12 3 12H5V15.5L9.5 12H15C15.5523 12 16 11.5523 16 11V3C16 2.44772 15.5523 2 15 2Z"
                                stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Reply
                          </button>

                          @if (activeReplyId === comment.id) {
                            <ng-container *ngTemplateOutlet="replyEditor; context: { parentId: comment.id, groupRowId: rowId }"></ng-container>
                          }

                          @if (comment.replies?.length) {
                            <div class="replies-list">
                              @for (reply of comment.replies; track reply.id) {
                                <div class="reply-thread">
                                  <div class="reply-item">
                                    <div class="reply-left-col">
                                      <div class="avatar avatar-sm" [style.background]="reply.avatarBg" [style.color]="reply.avatarColor">
                                        {{ reply.initials }}
                                      </div>
                                      @if (reply.replies?.length || activeReplyId === reply.id) {
                                        <div class="reply-thread-line"></div>
                                      }
                                    </div>
                                    <div class="comment-right">
                                      <div class="comment-meta">
                                        <span class="author">{{ reply.author }}</span>
                                        <span class="timestamp">{{ reply.timestamp }}</span>
                                      </div>
                                      <div class="comment-body">
                                        <span class="quote-icon">
                                          <svg width="16" height="12" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M0 14V8.4C0 6.93333 0.333333 5.6 1 4.4C1.66667 3.2 2.73333 2.13333 4.2 1.2L5.6 2.8C4.53333 3.46667 3.76667 4.13333 3.3 4.8C2.83333 5.46667 2.6 6.26667 2.6 7.2H5.2V14H0ZM10 14V8.4C10 6.93333 10.3333 5.6 11 4.4C11.6667 3.2 12.7333 2.13333 14.2 1.2L15.6 2.8C14.5333 3.46667 13.7667 4.13333 13.3 4.8C12.8333 5.46667 12.6 6.26667 12.6 7.2H15.2V14H10Z" fill="#D0D0D0"/>
                                          </svg>
                                        </span>
                                        <span class="comment-text">{{ reply.text }}</span>
                                      </div>
                                      <button class="reply-btn" type="button" (click)="startReply(reply.id, reply.id, rowId); $event.stopPropagation()">
                                        <svg width="12" height="12" viewBox="0 0 18 18" fill="none">
                                          <path d="M15 2H3C2.44772 2 2 2.44772 2 3V11C2 11.5523 2.44772 12 3 12H5V15.5L9.5 12H15C15.5523 12 16 11.5523 16 11V3C16 2.44772 15.5523 2 15 2Z"
                                            stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        Reply
                                      </button>
                                      @if (activeReplyId === reply.id) {
                                        <ng-container *ngTemplateOutlet="replyEditor; context: { parentId: reply.id, groupRowId: rowId }"></ng-container>
                                      }
                                      @if (reply.replies?.length) {
                                        <div class="sub-replies-list">
                                          @for (subReply of reply.replies; track subReply.id) {
                                            <div class="sub-reply-item">
                                              <div class="avatar avatar-sm" [style.background]="subReply.avatarBg" [style.color]="subReply.avatarColor">
                                                {{ subReply.initials }}
                                              </div>
                                              <div class="comment-right">
                                                <div class="comment-meta">
                                                  <span class="author">{{ subReply.author }}</span>
                                                  <span class="timestamp">{{ subReply.timestamp }}</span>
                                                </div>
                                                <div class="comment-body">
                                                  <span class="quote-icon">
                                                    <svg width="16" height="12" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                      <path d="M0 14V8.4C0 6.93333 0.333333 5.6 1 4.4C1.66667 3.2 2.73333 2.13333 4.2 1.2L5.6 2.8C4.53333 3.46667 3.76667 4.13333 3.3 4.8C2.83333 5.46667 2.6 6.26667 2.6 7.2H5.2V14H0ZM10 14V8.4C10 6.93333 10.3333 5.6 11 4.4C11.6667 3.2 12.7333 2.13333 14.2 1.2L15.6 2.8C14.5333 3.46667 13.7667 4.13333 13.3 4.8C12.8333 5.46667 12.6 6.26667 12.6 7.2H15.2V14H10Z" fill="#D0D0D0"/>
                                                    </svg>
                                                  </span>
                                                  <span class="comment-text">{{ subReply.text }}</span>
                                                </div>
                                              </div>
                                            </div>
                                          }
                                        </div>
                                      }
                                    </div>
                                  </div>
                                </div>
                              }
                            </div>
                          }
                        </div>

                      </div>
                    }
        </ng-template>

        <ng-template #replyEditor let-parentId="parentId" let-groupRowId="groupRowId">
          <div class="reply-editor-wrap" (click)="$event.stopPropagation()">
            <div class="comment-input-shell compact" [class.focused]="replyFieldFocused" [class.has-value]="replyDraft.length > 0">
              <div class="comment-input-label">Reply</div>
              <textarea
                class="comment-input-textarea"
                [(ngModel)]="replyDraft"
                (focus)="replyFieldFocused = true"
                (blur)="replyFieldFocused = false"
                [maxlength]="maxChars"
                placeholder="Hint text"
                rows="1"
              ></textarea>
              <button class="comment-submit-btn" type="button" (click)="submitReply(parentId, groupRowId)" [class.active]="replyDraft.trim().length > 0" aria-label="Submit reply">
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.4"/>
                  <path d="M10 13.5L10 6.5M7 9.5L10 6.5L13 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </ng-template>

        <div class="panel-footer">
          <div
            class="comment-input-shell composer"
            [class.focused]="fieldFocused"
            [class.has-value]="newComment.length > 0"
            [class.has-driver]="draftDriver !== null"
          >
            <div class="comment-input-label">{{ footerLabel() }}</div>

            <!-- Inline Driver chip — sits at top-left of the textarea's first line. -->
            <button
              type="button"
              class="driver-chip-slot"
              [class.empty]="draftDriver === null"
              [class.filled]="draftDriver !== null"
              [attr.aria-haspopup]="'listbox'"
              [attr.aria-expanded]="driverPickerOpen"
              (click)="toggleDriverPicker($event)"
            >
              @if (draftDriver === null) {
                <span class="dcs-plus" aria-hidden="true">+</span>
                <span class="dcs-label">Driver</span>
              } @else {
                @let meta = driverMetaFor(draftDriver);
                <span
                  class="dcs-code"
                  [style.background]="meta.colorBg"
                  [style.color]="meta.colorFg"
                >{{ meta.shortLabel }}</span>
                <span class="dcs-name">{{ meta.label }}</span>
                <span class="dcs-clear" (click)="clearDriver($event)" aria-label="Clear driver">×</span>
              }
            </button>

            @if (driverPickerOpen) {
              <div class="driver-picker" role="listbox" (click)="$event.stopPropagation()">
                <button type="button" class="dp-item" (click)="selectDriver(null)">
                  <span class="dp-chip unassigned">NONE</span>
                  <span class="dp-text">— No driver —</span>
                </button>
                @for (d of driverCodes; track d.code) {
                  <button type="button" class="dp-item" (click)="selectDriver(d.code)">
                    <span
                      class="dp-chip"
                      [style.background]="d.colorBg"
                      [style.color]="d.colorFg"
                    >{{ d.shortLabel }}</span>
                    <span class="dp-text">{{ d.label }}</span>
                  </button>
                }
              </div>
            }

            <textarea
              #commentTextarea
              class="comment-input-textarea driver-aware"
              [(ngModel)]="newComment"
              (focus)="fieldFocused = true"
              (blur)="fieldFocused = false"
              [maxlength]="maxChars"
              placeholder="Leave a comment"
              rows="1"
            ></textarea>
          </div>

          <div class="footer-actions">
            <button class="btn-cancel" type="button" (click)="cancelDraft()">Cancel</button>
            <button class="btn-confirm" type="button" [disabled]="!newComment.trim()" (click)="saveComment()">Submit</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .panel-overlay { position: fixed; inset: 0; z-index: 1000; pointer-events: none; background: transparent; transition: background 0.25s; }
    .panel-overlay.visible { pointer-events: all; background: rgba(0,0,0,0.12); }

    .comment-panel {
      position: absolute;
      top: 10px;
      right: 10px;
      bottom: 10px;
      width: 420px;
      background: #fff;
      box-shadow: -4px 0 24px rgba(0,0,0,0.08);
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
    }
    .comment-panel.open { transform: translateX(0); }

    .panel-header { position: relative; padding: 20px 36px 16px; flex-shrink: 0; }
    .panel-title-area { display: flex; flex-direction: column; gap: 6px; margin-top: 17px; }
    .panel-title-row { display: flex; align-items: flex-start; gap: 10px; min-width: 0; padding-right: 32px; }
    .panel-title {
      font-size: 22px;
      font-weight: 500;
      color: #1A5C2A;
      margin: 0;
      line-height: 1.25;
      min-width: 0;
      flex: 1 1 auto;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .panel-title-row > .title-count { margin-top: 4px; }
    .title-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 22px;
      height: 20px;
      padding: 0 8px;
      border-radius: 999px;
      background: #FF9500;
      color: #FFFFFF;
      font-size: 12px;
      font-weight: 600;
      line-height: 1;
      letter-spacing: 0.2px;
    }
    .panel-subtitle { font-size: 14px; font-weight: 400; color: #1A1A1A; line-height: 1.3; }
    .close-btn { position: absolute; top: 20px; right: 20px; border: none; background: transparent; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
    .close-btn:hover { background: #f5f5f5; }

    /* Scope tabs */
    .scope-tabs {
      display: flex;
      gap: 4px;
      padding: 0 20px 0 36px;
      border-bottom: 1px solid #EFEFEF;
      flex-shrink: 0;
      overflow-x: auto;
      scrollbar-width: thin;
    }
    .scope-tab {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 12px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: #555;
      white-space: nowrap;
      border-bottom: 2px solid transparent;
      transition: color 0.15s ease, border-color 0.15s ease;
    }
    .scope-tab:hover { color: #00843D; }
    .scope-tab.active { color: #00843D; border-bottom-color: #00843D; }
    .scope-tab .scope-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 16px;
      padding: 0 5px;
      background: #FF9500;
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 600;
      border-radius: 999px;
      line-height: 1;
    }

    .panel-body { flex: 1; overflow-y: auto; padding: 20px 36px 8px; }

    /* Drivers summary */
    .drivers-summary {
      border: 1px solid #E6E6E6;
      background: #FAFBFC;
      border-radius: 6px;
      padding: 12px 14px;
      margin-bottom: 18px;
    }
    .drivers-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .drivers-title { font-size: 12px; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }
    .drivers-total { font-size: 14px; font-weight: 600; }
    .drivers-total.up { color: #008A00; }
    .drivers-total.down { color: #D32F2F; }
    .drivers-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
    .driver-item {
      display: grid;
      grid-template-columns: 18px 1fr auto;
      gap: 10px;
      align-items: center;
      padding: 6px 6px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      color: #1A1A1A;
      transition: background 0.12s ease;
    }
    .driver-item:hover { background: #F0F5F1; }
    .driver-item .rank { color: #999; font-weight: 600; text-align: center; }
    .driver-item .crumbs {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #333;
    }
    .driver-item .variance { font-weight: 600; }
    .driver-item .variance.up { color: #008A00; }
    .driver-item .variance.down { color: #D32F2F; }
    .driver-more {
      padding: 6px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      color: #666;
      text-align: center;
      transition: background 0.12s ease;
    }
    .driver-more:hover { background: #F0F5F1; color: #00843D; }

    .comments-list { display: flex; flex-direction: column; }

    .comment-group { display: block; padding: 0; }
    .comment-group.is-current > .group-body { padding-top: 0; }
    /* Divider only between the current-row section and the first child card. */
    .comment-group.is-current + .comment-group { margin-top: 22px; padding-top: 18px; border-top: 1px solid #F0F0F0; }

    /* ─── Child groups rendered as cards (Hierarchy view) ───
     * Matches the visual weight of .driver-bucket cards so both views feel consistent.
     */
    .comment-group:not(.is-current) {
      border: 1px solid #E6E6E6;
      background: #FFFFFF;
      border-radius: 0;
      margin-bottom: 18px;
      overflow: hidden;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .comment-group:not(.is-current):hover { border-color: #D4D4D4; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); }
    .comment-group:not(.is-current):last-child { margin-bottom: 0; }
    .comment-group:not(.is-current) > .group-body { padding: 8px 20px 20px; }

    .group-header {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 4px 2px;
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: left;
      color: #1A1A1A;
      border-radius: 4px;
      transition: background 0.15s ease;
    }
    .group-header:hover { background: #F7F7F7; }
    .group-header .chevron {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      color: #8C8C8C;
      transition: transform 0.18s ease;
    }
    .group-header .chevron.open { transform: rotate(90deg); color: #1A1A1A; }
    .group-header .crumbs {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: nowrap;
      overflow: hidden;
      font-size: 13px;
      line-height: 1.2;
    }
    .group-header .crumb {
      color: #8C8C8C;
      font-weight: 400;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 120px;
    }
    .group-header .crumb.leaf {
      color: #1A1A1A;
      font-weight: 600;
      flex-shrink: 0;
      max-width: none;
    }
    .group-header .sep { color: #C7C7C7; font-size: 12px; flex-shrink: 0; }
    .group-header .badge {
      flex-shrink: 0;
      min-width: 22px;
      height: 18px;
      padding: 0 7px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #F2F2F2;
      color: #1A1A1A;
      font-size: 11px;
      font-weight: 600;
      border-radius: 999px;
      line-height: 1;
    }

    /* ─── Rich (two-line) group header ───
     * Line 1: chevron + breadcrumbs + variance + reconcile icon + count badge.
     * Line 2: per-driver chip row + latest-comment snippet (muted, single line).
     * Falls back to the legacy single-line look when there are no chips and no snippet.
     */
    .group-header.rich {
      flex-direction: column;
      align-items: stretch;
      gap: 14px;
      padding: 18px 20px;
      border-radius: 0;
    }
    .group-header.rich:hover { background: #FAFBFC; }
    .comment-group:not(.is-current) > .group-header.rich.expanded {
      border-bottom: 1px solid #EFEFEF;
      background: #FAFBFC;
    }
    .group-header.rich .gh-line-1 {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      min-width: 0;
    }
    .group-header.rich .gh-right {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
      margin-left: auto;
    }
    .group-variance {
      font-size: 12px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }
    .group-variance.up { color: #008A00; }
    .group-variance.down { color: #D32F2F; }

    /* Reconcile glyph — a tiny status indicator next to the count badge.
     * balanced = green check, partial = half-circle, over = amber triangle, none = hollow circle. */
    .group-reconcile {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .group-reconcile.balanced { color: #008A00; background: rgba(0, 138, 0, 0.08); }
    .group-reconcile.partial { color: #FF9500; background: rgba(255, 149, 0, 0.12); }
    .group-reconcile.over { color: #D32F2F; background: rgba(211, 47, 47, 0.10); }
    .group-reconcile.none { color: #BFBFBF; }

    .group-header.rich .gh-line-2 {
      display: flex;
      align-items: center;
      gap: 14px;
      padding-left: 0; /* crumbs now start at the left edge, chevron is trailing */
      min-width: 0;
      width: 100%;
      padding-top: 2px;
    }

    /* Trailing chevron variant: sits at the far right of line 1, after the count badge.
     * Rotation direction flipped (points down when expanded) for a natural drawer feel.
     */
    .chevron.chevron-trailing {
      color: #8C8C8C;
      transition: transform 0.18s ease;
      margin-left: 2px;
    }
    .chevron.chevron-trailing.open { transform: rotate(90deg); color: #1A1A1A; }
    .group-chips {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
      flex-wrap: nowrap;
    }
    .gc-item { display: inline-flex; align-items: center; gap: 6px; }
    .gc-more {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 16px;
      padding: 0 6px;
      font-size: 10px;
      font-weight: 600;
      color: #666;
      background: #F2F2F2;
      border-radius: 999px;
      line-height: 1;
    }

    /* Muted one-line preview; shrinks before the chips do. */
    .group-snippet {
      flex: 1 1 auto;
      min-width: 0;
      font-size: 12px;
      line-height: 1.5;
      color: #8C8C8C;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .group-snippet .gs-author { color: #555; font-weight: 600; margin-right: 2px; }
    .group-snippet .gs-time { color: #8C8C8C; }
    .group-snippet .gs-text { color: #1A1A1A; font-weight: 400; }

    /* ─── View switch (Hierarchy / By Driver) ─── */
    .view-switch {
      display: inline-flex;
      align-self: flex-start;
      margin: 6px 0 14px;
      padding: 3px;
      background: #F2F2F2;
      border-radius: 999px;
      gap: 0;
    }
    .view-switch-btn {
      border: none;
      background: transparent;
      color: #555;
      font-size: 12px;
      font-weight: 500;
      padding: 5px 12px;
      border-radius: 999px;
      cursor: pointer;
      line-height: 1;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .view-switch-btn:hover { color: #1A1A1A; }
    .view-switch-btn.active {
      background: #FFFFFF;
      color: #00843D;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
    }

    /* ─── By-Driver bucket cards ─── */
    .driver-bucket {
      border: 1px solid #E6E6E6;
      background: #FFFFFF;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 12px;
    }
    .driver-bucket:last-child { margin-bottom: 0; }
    .driver-bucket-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .driver-bucket-header .db-label {
      font-size: 13px;
      font-weight: 600;
      color: #1A1A1A;
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .driver-bucket-header .db-aggregate {
      display: inline-flex;
      align-items: baseline;
      gap: 8px;
      flex-shrink: 0;
    }
    .driver-bucket-header .db-rowcount {
      font-size: 11px;
      color: #8C8C8C;
    }
    .driver-bucket-rows {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .driver-bucket-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.12s ease;
    }
    .driver-bucket-row:hover { background: #F5FAF6; }
    .driver-bucket-row .dbr-crumbs {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 12px;
      color: #333;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .driver-bucket-row .dbr-crumbs .crumb { color: #8C8C8C; }
    .driver-bucket-row .dbr-crumbs .crumb.leaf { color: #1A1A1A; font-weight: 600; }
    .driver-bucket-row .dbr-crumbs .sep { color: #C7C7C7; }
    .driver-bucket-latest {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed #EDEDED;
      font-size: 11px;
      color: #8C8C8C;
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .driver-bucket-latest .dbl-author { color: #555; font-weight: 600; }
    .driver-bucket-latest .dbl-text { color: #1A1A1A; }
    .driver-empty {
      padding: 16px;
      text-align: center;
      font-size: 12px;
      color: #8C8C8C;
      border: 1px dashed #E6E6E6;
      border-radius: 6px;
    }

    .group-body { padding-top: 14px; display: flex; flex-direction: column; gap: 24px; }
    .group-empty { font-size: 13px; color: #8C8C8C; padding: 4px 0; }

    .comment-thread { display: flex; gap: 12px; align-items: flex-start; }
    .comment-left {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: 28px;
      flex-shrink: 0;
      overflow: visible;
    }
    .thread-line {
      flex: none;
      min-height: 4px;
      margin-top: 4px;
      margin-left: 13px;
      width: 0;
      border-left: 1px dashed #dcdcdc;
    }

    .reply-item {
      position: relative;
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }
    .reply-item::before {
      content: '';
      position: absolute;
      left: -27px;
      top: 0;
      width: 22px;
      height: 14px;
      border-left: 1px dashed #dcdcdc;
      border-bottom: 1px dashed #dcdcdc;
      border-bottom-left-radius: 999px;
    }

    .reply-left-col {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: 24px;
      flex-shrink: 0;
      overflow: visible;
    }
    .reply-thread-line {
      flex: none;
      min-height: 4px;
      margin-top: 4px;
      margin-left: 11px;
      width: 0;
      border-left: 1px dashed #dcdcdc;
    }

    .sub-replies-list { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
    .sub-reply-item {
      position: relative;
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }
    .sub-reply-item::before {
      content: '';
      position: absolute;
      left: -22px;
      top: 0;
      width: 17px;
      height: 14px;
      border-left: 1px dashed #dcdcdc;
      border-bottom: 1px dashed #dcdcdc;
      border-bottom-left-radius: 999px;
    }
    .comment-right { flex: 1; min-width: 0; }

    .avatar { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .avatar-sm { width: 24px; height: 24px; font-size: 10px; }

    .comment-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; padding-top: 4px; }
    .author { font-size: 13px; font-weight: 600; color: #1A1A1A; }
    .timestamp { font-size: 11px; font-weight: 500; color: #bbb; }

    /* Driver chip + impact row sits between meta and comment body. */
    .comment-driver-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .driver-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.4px;
      line-height: 1.2;
    }
    .driver-impact { font-size: 12px; font-weight: 600; }
    .driver-impact.up { color: #008A00; }
    .driver-impact.down { color: #D32F2F; }

    .comment-body { display: flex; align-items: flex-start; gap: 8px; }
    .quote-icon { display: flex; align-items: flex-start; flex-shrink: 0; margin-top: 2px; }
    .comment-text { font-size: 15px; font-weight: 400; color: #1A1A1A; line-height: 1.5; }

    .reply-btn { display: inline-flex; align-items: center; gap: 4px; margin-top: 6px; margin-bottom: 8px; border: none; background: transparent; cursor: pointer; color: #1A1A1A; font-size: 12px; padding: 0; opacity: 0; transform: translateY(4px); pointer-events: none; transition: opacity 0.18s ease, transform 0.18s ease, color 0.18s ease; }
    .comment-right:hover > .reply-btn { opacity: 1; transform: translateY(0); pointer-events: auto; }
    .reply-item .comment-right:hover > .reply-btn { opacity: 1; transform: translateY(0); pointer-events: auto; }
    .reply-btn:hover { color: #00843D; }

    .reply-editor-wrap { margin: 0; }

    .replies-list { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
    .reply-item { display: flex; gap: 10px; align-items: flex-start; }

    .panel-footer { flex-shrink: 0; padding: 14px 36px 24px; border-top: 1px solid #F0F0F0; background: #FFFFFF; }

    /* ─── Composer: single shell combining Driver chip + comment textarea ───
     * The chip is absolutely positioned over the top-left of the textarea,
     * and the textarea uses text-indent so the first line reflows around it.
     * Subsequent lines (and line-break overflow) fall back to the shell's
     * normal left padding.
     */
    .comment-input-shell.composer { position: relative; }

    .driver-chip-slot {
      position: absolute;
      left: 10px;
      top: 8px;
      height: 26px;
      padding: 0 10px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      line-height: 1;
      cursor: pointer;
      color: #00843D;
      background: #F1F9F3;
      border: 1px solid #00843D;
      transition: border-color 0.15s ease, background 0.15s ease, top 0.22s ease;
      z-index: 2;
      white-space: nowrap;
    }
    .driver-chip-slot.empty:hover { background: #E1F2E6; border-color: #006B31; }
    .driver-chip-slot.filled {
      color: #1A1A1A;
      font-weight: 500;
      border: 1px solid transparent;
      background: #F2F2F2;
    }
    .driver-chip-slot.filled:hover { background: #EAEAEA; }
    .driver-chip-slot .dcs-plus { font-size: 15px; font-weight: 700; color: #00843D; line-height: 1; margin-right: -2px; }
    .driver-chip-slot .dcs-label { color: #00843D; font-weight: 600; letter-spacing: 0.1px; }
    /* Shift chip down when composer is expanded so it aligns with the
     * first line of the textarea (below the floated label). */
    .comment-input-shell.composer.focused .driver-chip-slot,
    .comment-input-shell.composer.has-value .driver-chip-slot { top: 32px; }
    /* In has-driver mode the floating label is hidden, so the chip can
     * sit right at the top and the placeholder follows immediately
     * below — no wasted first row. */
    .comment-input-shell.composer.has-driver .driver-chip-slot { top: 12px; }
    .driver-chip-slot .dcs-code {
      padding: 2px 5px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.3px;
      line-height: 1.2;
    }
    .driver-chip-slot .dcs-name {
      color: #1A1A1A;
      font-weight: 500;
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .driver-chip-slot .dcs-clear {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      color: #8C8C8C;
      font-size: 14px;
      font-weight: 400;
      line-height: 1;
      margin-left: 2px;
      border-radius: 2px;
    }
    .driver-chip-slot .dcs-clear:hover { color: #1A1A1A; background: rgba(0, 0, 0, 0.06); }

    /* First-line text-indent reserves room for the chip while empty.
     * Once a driver is picked the chip graduates to its own row above
     * the textarea content, so we zero out the indent and let padding-top
     * (further below) push the first text line under the chip.
     */
    .comment-input-textarea.driver-aware { text-indent: 84px; }
    .comment-input-shell.has-driver .comment-input-textarea.driver-aware { text-indent: 0; }

    /* Popover listbox with the full driver catalogue. Anchored above the
     * composer shell so it never gets clipped by the panel's bottom edge.
     */
    .driver-picker {
      position: absolute;
      bottom: calc(100% + 6px);
      top: auto;
      left: 0;
      min-width: 240px;
      max-height: 280px;
      overflow-y: auto;
      background: #FFFFFF;
      border: 1px solid #D9D9D9;
      box-shadow: 0 -6px 16px rgba(0, 0, 0, 0.08);
      border-radius: 4px;
      padding: 4px;
      z-index: 20;
    }
    .dp-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 7px 10px;
      background: transparent;
      border: none;
      text-align: left;
      cursor: pointer;
      font-size: 13px;
      color: #1A1A1A;
      border-radius: 3px;
    }
    .dp-item:hover { background: #F5F5F5; }
    .dp-chip {
      flex-shrink: 0;
      padding: 2px 5px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.3px;
      line-height: 1.2;
    }
    .dp-chip.unassigned { background: #EFEFEF; color: #595959; }
    .dp-text { flex: 1; min-width: 0; }

    .comment-input-shell {
      position: relative;
      border: 1px solid #8C8C8C;
      border-radius: 4px 4px 0 0;
      background: #fff;
      transition: border-color 0.22s ease, border-width 0.22s ease;
      overflow: visible;
      margin-top: 6px;
    }
    .comment-input-shell.compact { min-height: 56px; height: auto; padding-bottom: 0; overflow: visible; margin-top: 0; }
    .comment-input-shell:hover { border-color: #008A00; }
    .comment-input-shell.focused {
      border-color: #008A00;
      border-width: 1px 1px 3px 1px;
      border-radius: 4px 4px 0 0;
      box-shadow: none;
    }

    .comment-input-label {
      position: absolute;
      left: 12px;
      top: 10px;
      font-size: 12px;
      font-weight: 400;
      color: #1C1C1C;
      line-height: 1;
      transition: top 0.22s ease, font-size 0.22s ease;
      pointer-events: none;
      z-index: 1;
      background: #fff;
      padding: 0 2px;
      max-width: calc(100% - 40px);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .comment-input-shell:not(.focused):not(.has-value) .comment-input-label {
      top: 18px;
      font-size: 16px;
      font-weight: 400;
    }
    /* When only a driver is picked (no focus, no typed text), still show the
     * label in its "floated" small state so the composer reads as active. */
    .comment-input-shell.composer.has-driver:not(.focused):not(.has-value) .comment-input-label {
      top: 10px;
      font-size: 12px;
      font-weight: 400;
    }
    .comment-input-shell.compact:not(.focused):not(.has-value) .comment-input-label {
      top: 18px;
      font-size: 16px;
      font-weight: 400;
      color: #1C1C1C;
    }

    .comment-input-textarea {
      display: block;
      width: 100%;
      border: none;
      outline: none;
      resize: vertical;
      font-size: 16px;
      font-weight: 500;
      color: #1A1A1A;
      background: transparent;
      padding: 34px 12px 10px;
      font-family: inherit;
      line-height: 1.45;
      box-sizing: border-box;
      min-height: 80px;
      height: 80px;
      transition: padding-top 0.22s ease;
    }
    .comment-input-shell.compact .comment-input-textarea { padding-top: 24px; min-height: 56px; height: 56px; font-size: 16px; resize: vertical; }
    .comment-input-shell:not(.focused):not(.has-value) .comment-input-textarea { padding-top: 44px; }
    .comment-input-shell.compact:not(.focused):not(.has-value) .comment-input-textarea { padding-top: 24px; }
    .comment-input-shell:not(.focused):not(.has-value) .comment-input-textarea::placeholder { color: transparent; }
    .comment-input-textarea::placeholder { color: #8C8C8C; }

    /* ─── Composer collapse/expand ─────────────────────────────────
     * Collapsed (no focus, empty, no driver): textarea renders as a
     * single-line input whose placeholder == footerLabel.  The floating
     * label fades out because the placeholder carries the hint.
     *
     * Expanded (focused OR has-value OR has-driver): textarea grows,
     * floating label fades in at top-left, chip shifts down to line 1.
     *
     * All composer-specific geometry uses the same 0.26s ease-out curve
     * so the expansion reads as a single coordinated motion.
     */
    .comment-input-shell.composer {
      transition:
        border-color 0.26s ease-out,
        border-width 0.26s ease-out,
        min-height 0.26s ease-out;
    }
    .comment-input-shell.composer .comment-input-textarea.driver-aware {
      transition:
        min-height 0.26s ease-out,
        height 0.26s ease-out,
        padding 0.26s ease-out;
    }
    .comment-input-shell.composer .driver-chip-slot {
      transition:
        border-color 0.15s ease,
        background 0.15s ease,
        top 0.26s ease-out;
    }
    .comment-input-shell.composer .comment-input-label {
      transition:
        top 0.26s ease-out,
        font-size 0.26s ease-out,
        opacity 0.22s ease-out;
    }

    /* COLLAPSED */
    .comment-input-shell.composer:not(.focused):not(.has-value):not(.has-driver) {
      min-height: 44px;
    }
    .comment-input-shell.composer:not(.focused):not(.has-value):not(.has-driver)
      .comment-input-textarea.driver-aware {
      min-height: 42px;
      height: 42px;
      padding: 10px 12px 10px;
      resize: none;
      overflow: hidden;
      /* Force the placeholder onto a single clipped line so long row
       * names ("Leave a comment on Wholesale Deposits") don't wrap
       * under the 42px shell and bleed past the bottom border. */
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    /* Keep the floating label mounted so it can transition; only fade
     * it out in the collapsed state. */
    .comment-input-shell.composer:not(.focused):not(.has-value):not(.has-driver)
      .comment-input-label {
      opacity: 0;
      pointer-events: none;
    }
    .comment-input-shell.composer:not(.focused):not(.has-value):not(.has-driver)
      .comment-input-textarea.driver-aware::placeholder {
      color: #8C8C8C;
      /* One weight step lighter than the textarea's own 500 so the
       * placeholder reads as a hint rather than as typed content. */
      font-weight: 400;
    }

    /* EXPANDED (focused / has-value / has-driver) — full composer.
     * 106 = textarea 104 + 1px top border + 1px bottom border. Keeping
     * shell min-height in sync with the textarea lets the shell grow
     * smoothly alongside the child transition. */
    .comment-input-shell.composer.focused,
    .comment-input-shell.composer.has-value {
      min-height: 106px;
    }
    .comment-input-shell.composer.focused .comment-input-textarea.driver-aware,
    .comment-input-shell.composer.has-value .comment-input-textarea.driver-aware {
      min-height: 104px;
      height: 104px;
      padding: 34px 12px 10px;
      resize: vertical;
      overflow: auto;
      white-space: pre-wrap;
    }
    .comment-input-shell.composer.focused .comment-input-label,
    .comment-input-shell.composer.has-value .comment-input-label {
      opacity: 1;
    }
    /* In the has-driver layout the chip already carries the row context
     * and the textarea placeholder says "Leave a comment" — so showing
     * the floating label here would be a duplicate hint. Hide it. */
    .comment-input-shell.composer.has-driver .comment-input-label {
      opacity: 0;
      pointer-events: none;
    }
    /* Hide placeholder once the user has typed text — but keep it in
     * the has-driver state so the caret has a legible hint on line 2.
     * The placeholder doesn't duplicate the floating label in that case
     * because the chip occupies line 1 on its own. */
    .comment-input-shell.composer.focused:not(.has-driver) .comment-input-textarea.driver-aware::placeholder,
    .comment-input-shell.composer.has-value .comment-input-textarea.driver-aware::placeholder {
      color: transparent;
    }
    .comment-input-shell.composer.has-driver .comment-input-textarea.driver-aware::placeholder {
      color: #8C8C8C;
      font-weight: 400;
    }

    /* has-driver specific layout: chip at the top, caret & placeholder
     * drop to the next row.  Padding-top clears the 26px chip + ~8px
     * breathing room so the first text line never collides with it. */
    .comment-input-shell.composer.has-driver {
      min-height: 120px;
    }
    .comment-input-shell.composer.has-driver .comment-input-textarea.driver-aware {
      min-height: 118px;
      height: 118px;
      padding: 46px 12px 10px;
      resize: vertical;
      overflow: auto;
      white-space: pre-wrap;
    }

    .field-meta { display: flex; justify-content: flex-end; align-items: center; margin-top: 6px; margin-bottom: 16px; }
    .field-meta.compact { margin-bottom: 10px; }
    .char-count { font-size: 12px; color: #1A1A1A; line-height: 1; text-align: right; min-width: 72px; }
    .char-count.compact { min-width: auto; font-size: 11px; }
    .comment-submit-btn {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      padding: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #C0C0C0;
      transition: color 0.18s ease;
    }
    .comment-submit-btn.active { color: #008A00; }
    .comment-submit-btn.active:hover { color: #006800; }

    .footer-actions { display: flex; gap: 12px; margin-top: 16px; }

    .btn-cancel {
      flex: 1;
      height: 40px;
      background: #fff;
      color: #00843D;
      border: 2px solid #00843D;
      border-radius: 0;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }
    .btn-cancel:hover { background: rgba(0, 132, 61, 0.05); color: #00843D; border-color: #00843D; }

    .btn-confirm {
      flex: 1;
      height: 40px;
      background: #058901;
      color: #fff;
      border: none;
      border-radius: 0;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      outline: none;
      box-shadow: none;
    }
    .btn-confirm:hover:not(:disabled),
    .btn-confirm:focus:not(:disabled),
    .btn-confirm:active:not(:disabled) {
      background: #047001;
      border: none;
      outline: none;
      box-shadow: none;
    }
    .btn-confirm:disabled {
      background: #F7F7F7;
      color: #C7C7C7;
      border: 2px solid #D4D4D4;
      cursor: not-allowed;
    }
  `],
})
export class CommentPanelComponent implements OnChanges, AfterViewChecked {
  @Input() visible = false
  @Input() rowData: unknown = null
  /** Full summary-tree index. When omitted, the panel falls back to a single-row view. */
  @Input() rowIndex: RowIndex | null = null
  /** Scope to show when the panel opens. 'TOTAL' = row-level; any other value focuses a counterparty column. */
  @Input() activeScopeKey: ScopeKey = 'TOTAL'
  /** `${nodeId}::${scope}` -> variance, for Top drivers and the suggested Impact default. */
  @Input() varianceByNodeScope: ReadonlyMap<string, number> | null = null
  /** `nodeId -> direct children ids`. Needed by the DFS in {@link drivers}. */
  @Input() childrenByNode: ReadonlyMap<string, string[]> | null = null
  /** Driver options in the dropdown. Injected so grid + panel share a single source. */
  @Input() driverCodes: DriverMeta[] = DRIVER_CODES
  @Output() closed = new EventEmitter<void>()
  @Output() scopeChanged = new EventEmitter<ScopeKey>()

  constructor(private el: ElementRef<HTMLElement>) {}

  private _lineUpdatePending = false

  ngAfterViewChecked() {
    if (!this._lineUpdatePending) {
      this._lineUpdatePending = true
      setTimeout(() => {
        this.updateThreadLines()
        this._lineUpdatePending = false
      })
    }
  }

  updateThreadLines() {
    const threads = this.el.nativeElement.querySelectorAll<HTMLElement>('.comment-thread')
    threads.forEach((thread) => {
      const threadLine = thread.querySelector<HTMLElement>(':scope > .comment-left .thread-line')
      if (!threadLine) return

      const allReplyItems = thread.querySelectorAll<HTMLElement>(':scope > .comment-right .replies-list .reply-item')
      if (!allReplyItems.length) { threadLine.style.height = '0'; return }

      const parentAvatar = thread.querySelector<HTMLElement>(':scope > .comment-left .avatar')!
      const parentAvatarRect = parentAvatar.getBoundingClientRect()
      const lastReplyItem = allReplyItems[allReplyItems.length - 1]
      const lastReplyItemRect = lastReplyItem.getBoundingClientRect()
      const lineHeight = lastReplyItemRect.top - parentAvatarRect.bottom - 2
      threadLine.style.height = `${Math.max(4, lineHeight)}px`
    })

    const replyItems = this.el.nativeElement.querySelectorAll<HTMLElement>('.reply-item')
    replyItems.forEach((replyItem) => {
      const replyThreadLine = replyItem.querySelector<HTMLElement>(':scope > .reply-left-col .reply-thread-line')
      if (!replyThreadLine) return

      const allSubReplyItems = replyItem.querySelectorAll<HTMLElement>(':scope > .comment-right .sub-replies-list .sub-reply-item')
      if (!allSubReplyItems.length) { replyThreadLine.style.height = '0'; return }

      const replyAvatar = replyItem.querySelector<HTMLElement>(':scope > .reply-left-col .avatar-sm')!
      const replyAvatarRect = replyAvatar.getBoundingClientRect()
      const lastSubReplyItem = allSubReplyItems[allSubReplyItems.length - 1]
      const lastSubReplyItemRect = lastSubReplyItem.getBoundingClientRect()
      const lineHeight = lastSubReplyItemRect.top - replyAvatarRect.bottom - 2
      replyThreadLine.style.height = `${Math.max(4, lineHeight)}px`
    })
  }

  groups = signal<CommentGroup[]>([])
  private expandedGroupIds = signal<Set<string>>(new Set())
  /** Tracked scope the panel is currently showing. Seeded from {@link activeScopeKey} and updated by the tab bar. */
  readonly scope = signal<ScopeKey>('TOTAL')
  /** "+ N more" opens a fully-expanded drivers list below the Top 3. */
  private showAllDrivers = signal(false)
  /** Hierarchy (default) vs By-Driver pivot for the child-groups list. Persisted per-session. */
  readonly view = signal<CommentView>(this.readInitialView())

  lastUpdate = '2025-10-15'
  currentRowId = ''
  rowLabel = ''
  newComment = ''
  fieldFocused = false
  maxChars = MAX_CHARS

  draftDriver: DriverCode | null = null
  driverPickerOpen = false

  activeReplyId: string | null = null
  activeReplyParentId: string | null = null
  activeReplyGroupRowId: string | null = null
  replyDraft = ''
  replyFieldFocused = false
  private draftMap = new Map<string, string>()

  private fallbackIndex = buildRowIndex()

  ngOnChanges(changes: SimpleChanges): void {
    const rowChanged = 'rowData' in changes
    const scopeChanged = 'activeScopeKey' in changes

    if (rowChanged) {
      const data = (this.rowData ?? null) as Record<string, unknown> | null
      const nodeId = (data?.['nodeId'] as string) || (data?.['pid'] as string) || (data?.['product'] as string) || ''
      this.currentRowId = nodeId

      const index = this.rowIndex ?? this.fallbackIndex
      const entry = index.get(nodeId)
      this.rowLabel = entry?.name || (data?.['name'] as string) || (data?.['product'] as string) || ''
    }

    if (scopeChanged) {
      this.scope.set(this.activeScopeKey)
    }

    if (rowChanged || scopeChanged) {
      this.refreshGroups()
      this.expandedGroupIds.set(new Set<string>())
      this.showAllDrivers.set(false)
      // Reset form draft on every (row, scope) change to avoid sending a stale driver.
      this.draftDriver = null
      this.driverPickerOpen = false
    }
  }

  /** Total comments (top-level + all nested replies) for the current (row, scope). */
  readonly totalCount = computed(() => {
    const countReplies = (replies?: CommentReply[]): number => {
      if (!replies || replies.length === 0) return 0
      let n = 0
      for (const r of replies) n += 1 + countReplies(r.replies)
      return n
    }
    return this.groups().reduce((acc, g) => {
      for (const c of g.comments) acc += 1 + countReplies(c.replies)
      return acc
    }, 0)
  })

  /** Panel title — the selected row's display name. */
  titleText(): string {
    return this.rowLabel || 'Comments'
  }

  currentScopeLabel(): string {
    return SCOPE_LABELS[this.scope()] ?? 'Total'
  }

  subtitle(): string {
    const sc = this.currentScopeLabel()
    return this.scope() === 'TOTAL'
      ? `Comments · Last update ${this.lastUpdate}`
      : `${sc} · Last update ${this.lastUpdate}`
  }

  footerLabel(): string {
    const base = this.rowLabel ? `Leave a comment on ${this.rowLabel}` : 'Leave a comment'
    return this.scope() === 'TOTAL' ? base : `${base} (${this.currentScopeLabel()})`
  }

  isGroupExpanded(rowId: string): boolean {
    return this.expandedGroupIds().has(rowId)
  }

  toggleGroup(rowId: string): void {
    const next = new Set(this.expandedGroupIds())
    if (next.has(rowId)) next.delete(rowId)
    else next.add(rowId)
    this.expandedGroupIds.set(next)
  }

  // ───────────────────────────── Scope tabs ─────────────────────────────

  /**
   * Scope tabs shown under the header. We always keep TOTAL and then include any
   * counterparty scope that either has at least one comment on the current row or
   * has a non-zero variance under the current row. This avoids showing all 11
   * columns when most are zeros.
   */
  readonly availableScopes = computed<ScopeTab[]>(() => {
    const rowId = this.currentRowId
    if (!rowId) return []
    const out: ScopeTab[] = []
    for (const key of ALL_SCOPES) {
      const count = (COMMENTS_BY_SCOPE[rowId]?.[key]?.length) ?? 0
      const variance = this.varianceByNodeScope?.get(`${rowId}::${key}`) ?? 0
      if (key === 'TOTAL' || count > 0 || Math.abs(variance) > 0) {
        out.push({ key, label: SCOPE_LABELS[key], count, variance })
      }
    }
    return out
  })

  selectScope(key: ScopeKey): void {
    if (this.scope() === key) return
    this.scope.set(key)
    this.refreshGroups()
    this.expandedGroupIds.set(new Set<string>())
    this.showAllDrivers.set(false)
    this.draftDriver = null
    this.driverPickerOpen = false
    this.scopeChanged.emit(key)
  }

  // ───────────────────────────── Drivers ─────────────────────────────

  /**
   * Top drivers of the current (row, scope) variance. Walks the tree via
   * {@link childrenByNode} down to leaves and aggregates variance per leaf.
   * Returns empty when:
   *  - the row is a leaf itself (no children to explain)
   *  - the total variance for this scope is 0 with no contributing children
   */
  readonly drivers = computed<DriversSummary>(() => {
    const empty: DriversSummary = { total: 0, top: [], others: null }
    const rowId = this.currentRowId
    const scope = this.scope()
    const varMap = this.varianceByNodeScope
    const childMap = this.childrenByNode
    const rowIndex = this.rowIndex ?? this.fallbackIndex
    if (!rowId || !varMap || !childMap || !rowIndex) return empty

    const children = childMap.get(rowId) ?? []
    if (children.length === 0) return empty
    const totalVariance = varMap.get(`${rowId}::${scope}`) ?? 0

    // DFS collect leaves (childless nodes) under the current row.
    const leaves: string[] = []
    const stack = [...children]
    while (stack.length) {
      const id = stack.pop()!
      const kids = childMap.get(id) ?? []
      if (kids.length === 0) leaves.push(id)
      else stack.push(...kids)
    }

    const items: DriverItem[] = []
    for (const leafId of leaves) {
      const v = varMap.get(`${leafId}::${scope}`) ?? 0
      if (v === 0) continue
      const node = rowIndex.get(leafId)
      if (!node) continue
      const entry = rowIndex.get(rowId)
      const relIds = entry ? node.path.slice(entry.path.length) : node.path
      const crumbs = relIds.map((nid) => rowIndex.get(nid)?.name ?? nid)
      items.push({
        nodeId: leafId,
        breadcrumbs: crumbs.length ? crumbs : [node.name],
        variance: v,
        pct: totalVariance !== 0 ? Math.round((v / totalVariance) * 100) : 0,
      })
    }

    if (items.length === 0) return { total: totalVariance, top: [], others: null }

    items.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))

    const showAll = this.showAllDrivers()
    if (showAll || items.length <= 3) {
      return { total: totalVariance, top: items, others: null }
    }
    const top = items.slice(0, 3)
    const rest = items.slice(3)
    const combined = rest.reduce((a, r) => a + r.variance, 0)
    return { total: totalVariance, top, others: { count: rest.length, combined } }
  })

  navigateToDriver(nodeId: string): void {
    // Expand the destination group so it's visible, then scroll it into view.
    const next = new Set(this.expandedGroupIds())
    next.add(nodeId)
    this.expandedGroupIds.set(next)
    setTimeout(() => {
      const el = this.el.nativeElement.querySelector<HTMLElement>(`[data-group-id="${nodeId}"]`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  expandAllDrivers(): void {
    this.showAllDrivers.set(true)
  }

  // ───────────────────────────── Child groups: hierarchy & by-driver ─────────────────────────────

  /** Group for the currently-selected row. Always rendered expanded at the top of the list. */
  readonly currentGroup = computed<CommentGroup | null>(() => {
    const rowId = this.currentRowId
    return this.groups().find((g) => g.rowId === rowId) ?? null
  })

  /**
   * All groups that are NOT the current row — i.e. descendant rows that carry comments.
   * Each group is enriched with a {@link GroupSummary} and sorted by |variance| desc
   * (ties broken by comment count desc) so the most impactful rows float to the top.
   */
  readonly otherGroups = computed<EnrichedGroup[]>(() => {
    const rowId = this.currentRowId
    const scope = this.scope()
    const varMap = this.varianceByNodeScope
    const source = this.groups().filter((g) => g.rowId !== rowId)
    const enriched: EnrichedGroup[] = source.map((g) => ({
      ...g,
      summary: this.summariseGroup(g, scope, varMap),
    }))
    enriched.sort((a, b) => {
      const va = Math.abs(a.summary.variance)
      const vb = Math.abs(b.summary.variance)
      if (vb !== va) return vb - va
      return b.comments.length - a.comments.length
    })
    return enriched
  })

  /**
   * By-Driver pivot: every comment on a non-current group gets bucketed by its
   * driver code (or 'UNASSIGNED'). Buckets are sorted by |impactSum| desc.
   */
  readonly driverBuckets = computed<DriverBucket[]>(() => {
    const others = this.otherGroups()
    const byCode = new Map<DriverCode | 'UNASSIGNED', {
      code: DriverCode | 'UNASSIGNED'
      label: string
      shortLabel: string
      colorBg: string
      colorFg: string
      impactSum: number
      rows: Map<string, DriverBucketRow>
      latest: { ts: number; value: GroupLatest } | null
    }>()

    for (const g of others) {
      for (const c of g.comments) {
        const code: DriverCode | 'UNASSIGNED' = c.driver ?? 'UNASSIGNED'
        const meta = code === 'UNASSIGNED' ? UNASSIGNED_META : driverMeta(code)
        let bucket = byCode.get(code)
        if (!bucket) {
          bucket = {
            code,
            label: meta.label,
            shortLabel: meta.shortLabel,
            colorBg: meta.colorBg,
            colorFg: meta.colorFg,
            impactSum: 0,
            rows: new Map(),
            latest: null,
          }
          byCode.set(code, bucket)
        }
        const impact = c.impactAmount ?? 0
        bucket.impactSum += impact

        const rowKey = g.rowId
        const existing = bucket.rows.get(rowKey)
        if (existing) {
          existing.impact += impact
          existing.commentCount += 1
        } else {
          bucket.rows.set(rowKey, {
            nodeId: g.rowId,
            rowName: g.rowName,
            breadcrumbs: g.breadcrumbs,
            impact,
            commentCount: 1,
          })
        }

        const ts = this.parseTimestamp(c.timestamp)
        if (!bucket.latest || ts > bucket.latest.ts) {
          bucket.latest = {
            ts,
            value: {
              author: c.author,
              absolute: c.timestamp,
              relative: this.relativeTime(c.timestamp),
              snippet: this.truncate(c.text, 120),
            },
          }
        }
      }
    }

    const out: DriverBucket[] = []
    for (const b of byCode.values()) {
      const rows = Array.from(b.rows.values()).sort(
        (x, y) => Math.abs(y.impact) - Math.abs(x.impact),
      )
      out.push({
        code: b.code,
        label: b.label,
        shortLabel: b.shortLabel,
        colorBg: b.colorBg,
        colorFg: b.colorFg,
        impactSum: b.impactSum,
        rows,
        latest: b.latest?.value ?? null,
      })
    }
    out.sort((a, b) => Math.abs(b.impactSum) - Math.abs(a.impactSum))
    return out
  })

  /** Toggle the hierarchy / by-driver pivot and persist the choice to sessionStorage. */
  setView(next: CommentView): void {
    if (this.view() === next) return
    this.view.set(next)
    try {
      sessionStorage.setItem(VIEW_STORAGE_KEY, next)
    } catch {
      // sessionStorage may be unavailable (SSR/private mode) — silently ignore.
    }
  }

  /** Jump to a row inside a driver bucket: switch back to hierarchy and scroll it into view. */
  jumpToRowFromBucket(nodeId: string): void {
    this.setView('hierarchy')
    this.navigateToDriver(nodeId)
  }

  /** Human-readable tooltip text for the reconcile glyph. */
  reconcileTooltip(s: GroupSummary): string {
    switch (s.reconcile) {
      case 'balanced':
        return `Explained: impact ${this.formatSigned(s.impactSum)} matches variance ${this.formatSigned(s.variance)}`
      case 'partial':
        return `Partially explained: ${this.formatSigned(s.impactSum)} of ${this.formatSigned(s.variance)}`
      case 'over':
        return `Over-explained: sum of impacts ${this.formatSigned(s.impactSum)} exceeds variance ${this.formatSigned(s.variance)}`
      case 'none':
      default:
        return s.variance === 0
          ? 'No variance to reconcile'
          : `Unexplained: variance ${this.formatSigned(s.variance)}, no impacts recorded`
    }
  }

  // ───────────────────────────── Summary / time helpers ─────────────────────────────

  private summariseGroup(
    group: CommentGroup,
    scope: ScopeKey,
    varMap: ReadonlyMap<string, number> | null,
  ): GroupSummary {
    const variance = varMap?.get(`${group.rowId}::${scope}`) ?? 0

    // Aggregate impacts by driver code (treat missing driver as UNASSIGNED so impact still counts).
    const driverMap = new Map<DriverCode | 'UNASSIGNED', number>()
    let impactSum = 0
    for (const c of group.comments) {
      const code: DriverCode | 'UNASSIGNED' = c.driver ?? 'UNASSIGNED'
      const imp = c.impactAmount ?? 0
      impactSum += imp
      driverMap.set(code, (driverMap.get(code) ?? 0) + imp)
    }

    const allChips: GroupDriverChip[] = Array.from(driverMap.entries())
      .map(([code, impact]) => {
        const meta = code === 'UNASSIGNED' ? UNASSIGNED_META : driverMeta(code)
        return {
          code,
          label: meta.label,
          shortLabel: meta.shortLabel,
          colorBg: meta.colorBg,
          colorFg: meta.colorFg,
          impact,
        }
      })
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))

    // Show top 3 chips; anything else rolls up into a "+N" pill.
    const chips = allChips.slice(0, 3)
    const hiddenChipCount = Math.max(0, allChips.length - chips.length)

    // Pick latest comment by parsed timestamp; snippet capped to 80 chars for single-line preview.
    let latest: GroupLatest | null = null
    let latestTs = -Infinity
    for (const c of group.comments) {
      const ts = this.parseTimestamp(c.timestamp)
      if (ts > latestTs) {
        latestTs = ts
        latest = {
          author: c.author,
          absolute: c.timestamp,
          relative: this.relativeTime(c.timestamp),
          snippet: this.truncate(c.text, 80),
        }
      }
    }

    return {
      variance,
      impactSum,
      chips,
      hiddenChipCount,
      reconcile: this.classifyReconcile(variance, impactSum),
      latest,
    }
  }

  /**
   * Reconcile status for a row:
   * - `none`:     no impacts recorded at all
   * - `balanced`: impactSum matches variance within 2% (or within 1 unit when variance is tiny)
   * - `over`:     impactSum has wrong sign or exceeds variance magnitude by more than tolerance
   * - `partial`:  same sign but under-explained
   */
  private classifyReconcile(variance: number, impactSum: number): ReconcileState {
    if (impactSum === 0) return variance === 0 ? 'balanced' : 'none'
    const tol = Math.max(1, Math.abs(variance) * 0.02)
    if (Math.abs(variance - impactSum) <= tol) return 'balanced'
    if (variance === 0) return 'over'
    if (Math.sign(impactSum) !== Math.sign(variance)) return 'over'
    return Math.abs(impactSum) > Math.abs(variance) + tol ? 'over' : 'partial'
  }

  /**
   * Best-effort timestamp parser. Handles:
   *  - ISO-like `YYYY-MM-DD HH:mm` and `YYYY-MM-DD`
   *  - fuzzy `just now` (always treated as "now")
   * Falls back to Date.parse, and to 0 when unparseable so stale strings sort to the bottom.
   */
  private parseTimestamp(ts: string | null | undefined): number {
    if (!ts) return 0
    const trimmed = ts.trim()
    if (!trimmed) return 0
    if (/just now/i.test(trimmed)) return Date.now()
    // Convert "YYYY-MM-DD HH:mm" to ISO ("T") so Date.parse treats it as local time.
    const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(trimmed)
      ? trimmed.replace(' ', 'T')
      : trimmed
    const t = Date.parse(iso)
    return Number.isNaN(t) ? 0 : t
  }

  /** Pretty relative time for the snippet line. Absolute timestamp still available via `title`. */
  relativeTime(ts: string): string {
    if (!ts) return ''
    if (/just now/i.test(ts)) return 'just now'
    const t = this.parseTimestamp(ts)
    if (!t) return ts
    const delta = Date.now() - t
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour
    if (delta < minute) return 'just now'
    if (delta < hour) return `${Math.floor(delta / minute)}m ago`
    if (delta < day) return `${Math.floor(delta / hour)}h ago`
    const days = Math.floor(delta / day)
    if (days === 1) return 'yesterday'
    if (days < 7) return `${days}d ago`
    // Longer than a week — drop the time portion so it reads as a plain date.
    return ts.split(' ')[0] ?? ts
  }

  private truncate(text: string, max: number): string {
    if (!text) return ''
    const clean = text.replace(/\s+/g, ' ').trim()
    return clean.length > max ? clean.slice(0, Math.max(0, max - 1)) + '…' : clean
  }

  private readInitialView(): CommentView {
    try {
      const raw = sessionStorage.getItem(VIEW_STORAGE_KEY)
      return raw === 'driver' ? 'driver' : 'hierarchy'
    } catch {
      return 'hierarchy'
    }
  }

  // ───────────────────────────── Reply flow ─────────────────────────────

  startReply(targetId: string, parentCommentId: string, groupRowId: string): void {
    if (this.activeReplyId && this.activeReplyId !== targetId) {
      this.draftMap.set(this.activeReplyId, this.replyDraft)
    }
    this.activeReplyId = targetId
    this.activeReplyParentId = parentCommentId
    this.activeReplyGroupRowId = groupRowId
    this.replyDraft = this.draftMap.get(targetId) ?? ''
    this.replyFieldFocused = false
  }

  cancelReply(): void {
    if (this.activeReplyId) {
      this.draftMap.set(this.activeReplyId, this.replyDraft)
    }
    this.activeReplyId = null
    this.activeReplyParentId = null
    this.activeReplyGroupRowId = null
    this.replyFieldFocused = false
  }

  private findReplyTarget(id: string, groupRowId: string | null): Comment | CommentReply | null {
    const gs = this.groups()
    const pool = groupRowId ? gs.filter((g) => g.rowId === groupRowId) : gs
    for (const group of pool) {
      for (const comment of group.comments) {
        if (comment.id === id) return comment
        const found = this.findInReplies(id, comment.replies ?? [])
        if (found) return found
      }
    }
    return null
  }

  private findInReplies(id: string, replies: CommentReply[]): CommentReply | null {
    for (const reply of replies) {
      if (reply.id === id) return reply
      const found = this.findInReplies(id, reply.replies ?? [])
      if (found) return found
    }
    return null
  }

  submitReply(parentId: string, groupRowId: string): void {
    const content = this.replyDraft.trim()
    if (!content) return

    const target = this.findReplyTarget(parentId, groupRowId)
    if (!target) return

    if (!target.replies) target.replies = []
    target.replies.push({
      id: `${parentId}-${Date.now()}`,
      author: 'Yu Lin',
      initials: 'YL',
      avatarColor: '#6a1b9a',
      avatarBg: '#f3e5f5',
      timestamp: 'just now',
      text: content,
      replies: [],
    })

    this.draftMap.delete(parentId)
    this.replyDraft = ''
    this.cancelReply()
    this.refreshGroups()
  }

  // ───────────────────────────── Save / draft ─────────────────────────────

  saveComment(): void {
    const content = this.newComment.trim()
    if (!content || !this.currentRowId) return

    const currentScope = this.scope()
    const bucket = ensureBucket(this.currentRowId, currentScope)
    // Impact input has been removed from the composer — new comments no longer
    // carry an impact amount. Historical comments keep their data untouched so
    // the Hierarchy-card reconcile / per-driver totals continue to render.
    bucket.unshift({
      id: `c-${Date.now()}`,
      author: 'Yu Lin',
      initials: 'YL',
      avatarColor: '#6a1b9a',
      avatarBg: '#f3e5f5',
      timestamp: 'just now',
      text: content,
      replies: [],
      driver: this.draftDriver ?? undefined,
      scope: currentScope,
    })

    this.refreshGroups()

    this.newComment = ''
    this.fieldFocused = false
    this.draftDriver = null
    this.driverPickerOpen = false
  }

  cancelDraft(): void {
    this.newComment = ''
    this.draftDriver = null
    this.driverPickerOpen = false
    this.fieldFocused = false
  }

  /** Rebuild `groups` from the current (row, scope). Always creates a new array ref so the signal notifies. */
  private refreshGroups(): void {
    if (!this.currentRowId) {
      this.groups.set([])
      return
    }
    const index = this.rowIndex ?? this.fallbackIndex
    this.groups.set(getCommentsForRow(this.currentRowId, index, this.scope()))
  }

  close(): void {
    this.newComment = ''
    this.fieldFocused = false
    this.cancelReply()
    this.closed.emit()
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('panel-overlay')) {
      this.close()
    }
  }

  // ───────────────────────────── Helpers ─────────────────────────────

  formatSigned(n: number): string {
    const abs = Math.abs(n).toLocaleString()
    if (n > 0) return `+${abs}`
    if (n < 0) return `-${abs}`
    return abs
  }

  driverMetaFor(code: DriverCode): DriverMeta {
    return driverMeta(code)
  }

  // ───────────────────────────── Driver picker ─────────────────────────────

  toggleDriverPicker(ev: MouseEvent): void {
    ev.stopPropagation()
    this.driverPickerOpen = !this.driverPickerOpen
  }

  selectDriver(code: DriverCode | null): void {
    this.draftDriver = code
    this.driverPickerOpen = false
    if (code !== null) {
      // Focus the comment textarea on the next tick so the caret is
      // blinking right where the user is about to type their reason.
      queueMicrotask(() => {
        const ta = this.el.nativeElement.querySelector<HTMLTextAreaElement>(
          '.comment-input-textarea.driver-aware'
        )
        ta?.focus()
      })
    }
  }

  clearDriver(ev: MouseEvent): void {
    ev.stopPropagation()
    this.draftDriver = null
    this.driverPickerOpen = false
  }

  /** Close the Driver popover when the user clicks anywhere outside the chip/menu. */
  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.driverPickerOpen) this.driverPickerOpen = false
  }
}

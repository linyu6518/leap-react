import { AfterViewChecked, Component, ElementRef, EventEmitter, Input, OnChanges, Output } from '@angular/core'
import { CommonModule, NgTemplateOutlet } from '@angular/common'
import { FormsModule } from '@angular/forms'

export interface CommentReply {
  id: string
  author: string
  initials: string
  avatarColor: string
  avatarBg: string
  timestamp: string
  text: string
  replies?: CommentReply[]
}

export interface Comment {
  id: string
  author: string
  initials: string
  avatarColor: string
  avatarBg: string
  timestamp: string
  text: string
  replies?: CommentReply[]
}

const MAX_CHARS = 250

const MOCK_COMMENTS: Comment[] = [
  {
    id: '1',
    author: 'John Doe',
    initials: 'JD',
    avatarColor: '#2e7d32',
    avatarBg: '#e8f5e9',
    timestamp: '2025-10-15 12:19',
    text: 'Reviewed adjusted value, within acceptable range.',
    replies: [
      {
        id: '1-1',
        author: 'Yu Lin',
        initials: 'YL',
        avatarColor: '#6a1b9a',
        avatarBg: '#f3e5f5',
        timestamp: '15 hours ago',
        text: 'Reviewed deposit variance',
        replies: [
          {
            id: '1-1-1',
            author: 'John Doe',
            initials: 'JD',
            avatarColor: '#2e7d32',
            avatarBg: '#e8f5e9',
            timestamp: '14 hours ago',
            text: 'Thanks for confirming.',
          },
        ],
      },
    ],
  },
  {
    id: '2',
    author: 'Yufeng Guo',
    initials: 'YG',
    avatarColor: '#1565c0',
    avatarBg: '#e3f2fd',
    timestamp: '2025-10-15 12:19',
    text: 'Reviewed adjusted value.',
    replies: [
      {
        id: '2-1',
        author: 'Amy Chen',
        initials: 'AC',
        avatarColor: '#00695c',
        avatarBg: '#e0f2f1',
        timestamp: '2025-10-15 12:48',
        text: 'Confirmed the variance is within the approved threshold.',
      },
      {
        id: '2-2',
        author: 'Yu Lin',
        initials: 'YL',
        avatarColor: '#6a1b9a',
        avatarBg: '#f3e5f5',
        timestamp: '2025-10-15 13:05',
        text: 'Will monitor this item again after end-of-day refresh.',
      },
    ],
  },
  {
    id: '3',
    author: 'Kevin Wu',
    initials: 'KW',
    avatarColor: '#283593',
    avatarBg: '#e8eaf6',
    timestamp: '2025-10-15 13:20',
    text: 'Escalation not required for now. Keep this in weekly tracking.',
    replies: [
      {
        id: '3-1',
        author: 'John Doe',
        initials: 'JD',
        avatarColor: '#2e7d32',
        avatarBg: '#e8f5e9',
        timestamp: '2025-10-15 13:33',
        text: 'Acknowledged. Added into the governance watchlist.',
      },
    ],
  },
]

@Component({
  selector: 'app-comment-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, NgTemplateOutlet],
  template: `
    <div class="panel-overlay" [class.visible]="visible" (click)="onOverlayClick($event)">
      <div class="comment-panel" [class.open]="visible" (click)="$event.stopPropagation()">
        <div class="panel-header">
          <div class="panel-title-area">
            <h2 class="panel-title">Comments</h2>
            <span class="panel-subtitle">Last update: {{ lastUpdate }}</span>
          </div>
          <button class="close-btn" (click)="close()" type="button" aria-label="Close comments">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="#777" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <div class="panel-body">
          <div class="comments-list">
            @for (comment of comments; track comment.id) {
              <div class="comment-thread">

                <!-- Left col: avatar + vertical thread line -->
                <div class="comment-left">
                  <div class="avatar" [style.background]="comment.avatarBg" [style.color]="comment.avatarColor">
                    {{ comment.initials }}
                  </div>
                  @if (comment.replies?.length || activeReplyId === comment.id) {
                    <div class="thread-line"></div>
                  }
                </div>

                <!-- Right col: content + reply editor + replies -->
                <div class="comment-right">
                  <div class="comment-meta">
                    <span class="author">{{ comment.author }}</span>
                    <span class="timestamp">{{ comment.timestamp }}</span>
                  </div>
                  <div class="comment-body">
                    <span class="quote-icon">
                      <svg width="16" height="12" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 14V8.4C0 6.93333 0.333333 5.6 1 4.4C1.66667 3.2 2.73333 2.13333 4.2 1.2L5.6 2.8C4.53333 3.46667 3.76667 4.13333 3.3 4.8C2.83333 5.46667 2.6 6.26667 2.6 7.2H5.2V14H0ZM10 14V8.4C10 6.93333 10.3333 5.6 11 4.4C11.6667 3.2 12.7333 2.13333 14.2 1.2L15.6 2.8C14.5333 3.46667 13.7667 4.13333 13.3 4.8C12.8333 5.46667 12.6 6.26667 12.6 7.2H15.2V14H10Z" fill="#D0D0D0"/>
                      </svg>
                    </span>
                    <span class="comment-text">{{ comment.text }}</span>
                  </div>
                  <button class="reply-btn" type="button" (click)="startReply(comment.id, comment.id)">
                    <svg width="12" height="12" viewBox="0 0 18 18" fill="none">
                      <path d="M15 2H3C2.44772 2 2 2.44772 2 3V11C2 11.5523 2.44772 12 3 12H5V15.5L9.5 12H15C15.5523 12 16 11.5523 16 11V3C16 2.44772 15.5523 2 15 2Z"
                        stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Reply
                  </button>

                  <!-- Reply editor under main comment -->
                  @if (activeReplyId === comment.id) {
                    <ng-container *ngTemplateOutlet="replyEditor; context: { parentId: comment.id }"></ng-container>
                  }

                  <!-- Replies -->
                  @if (comment.replies?.length) {
                    <div class="replies-list">
                      @for (reply of comment.replies; track reply.id) {
                        <div class="reply-thread">
                          <div class="reply-item">
                            <!-- reply left col: avatar + sub-thread line -->
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
                              <button class="reply-btn" type="button" (click)="startReply(reply.id, reply.id)">
                                <svg width="12" height="12" viewBox="0 0 18 18" fill="none">
                                  <path d="M15 2H3C2.44772 2 2 2.44772 2 3V11C2 11.5523 2.44772 12 3 12H5V15.5L9.5 12H15C15.5523 12 16 11.5523 16 11V3C16 2.44772 15.5523 2 15 2Z"
                                    stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Reply
                              </button>
                              <!-- Reply editor under this reply -->
                              @if (activeReplyId === reply.id) {
                                <ng-container *ngTemplateOutlet="replyEditor; context: { parentId: reply.id }"></ng-container>
                              }
                              <!-- Sub-replies (level 3) -->
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
          </div>
        </div>

        <!-- Shared reply editor template -->
        <ng-template #replyEditor let-parentId="parentId">
          <div class="reply-editor-wrap">
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
              <div class="reply-inline-meta">
                <span class="char-count compact">{{ replyDraft.length }} / {{ maxChars }}</span>
              </div>
            </div>
            <div class="footer-actions compact">
              <button class="btn-cancel" type="button" (click)="cancelReply()">Cancel</button>
              <button class="btn-confirm" type="button" [disabled]="!replyDraft.trim()" (click)="submitReply(parentId)">Reply</button>
            </div>
          </div>
        </ng-template>

        <div class="panel-footer">
          <div class="comment-input-shell" [class.focused]="fieldFocused" [class.has-value]="newComment.length > 0">
            <div class="comment-input-label">Leave a comment</div>
            <textarea
              class="comment-input-textarea"
              [(ngModel)]="newComment"
              (focus)="fieldFocused = true"
              (blur)="fieldFocused = false"
              [maxlength]="maxChars"
              placeholder="Hint text"
              rows="3"
            ></textarea>
          </div>
          <div class="field-meta">
            <span class="char-count">{{ newComment.length }} / {{ maxChars }}</span>
          </div>

          <div class="footer-actions">
            <button class="btn-cancel" type="button" (click)="newComment = ''">Cancel</button>
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
    .panel-title { font-size: 22px; font-weight: 500; color: #1A5C2A; margin: 0; line-height: 1.2; }
    .panel-subtitle { font-size: 14px; font-weight: 400; color: #1A1A1A; line-height: 1.2; }
    .close-btn { position: absolute; top: 20px; right: 20px; border: none; background: transparent; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
    .close-btn:hover { background: #f5f5f5; }

    .panel-body { flex: 1; overflow-y: auto; padding: 36px 36px 8px; }
    .comments-list { display: flex; flex-direction: column; gap: 24px; }

    /* Each top-level comment: left col (avatar+line) + right col (content+replies) */
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
      /* height set dynamically by JS to reach last reply avatar center */
      flex: none;
      min-height: 4px;
      margin-top: 4px;
      margin-left: 13px;
      width: 0;
      border-left: 1px dashed #dcdcdc;
    }

    /* L-connector on each reply: branches from thread-line to reply avatar */
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

    /* Level-2 reply left column: avatar + sub-thread line */
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

    /* Sub-replies list (level 3) */
    .sub-replies-list { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
    .sub-reply-item {
      position: relative;
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }
    /* L-connector: from reply-thread-line to sub-reply avatar */
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

    .comment-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; padding-top: 4px; }
    .author { font-size: 13px; font-weight: 600; color: #1A1A1A; }
    .timestamp { font-size: 11px; font-weight: 500; color: #bbb; }
    .comment-body { display: flex; align-items: flex-start; gap: 8px; }
    .quote-icon { display: flex; align-items: flex-start; flex-shrink: 0; margin-top: 2px; }
    .comment-text { font-size: 15px; font-weight: 400; color: #1A1A1A; line-height: 1.5; }

    .reply-btn { display: inline-flex; align-items: center; gap: 4px; margin-top: 6px; margin-bottom: 8px; border: none; background: transparent; cursor: pointer; color: #1A1A1A; font-size: 12px; padding: 0; opacity: 0; transform: translateY(4px); pointer-events: none; transition: opacity 0.18s ease, transform 0.18s ease, color 0.18s ease; }
    .comment-right:hover > .reply-btn { opacity: 1; transform: translateY(0); pointer-events: auto; }
    .reply-item .comment-right:hover > .reply-btn { opacity: 1; transform: translateY(0); pointer-events: auto; }
    .reply-btn:hover { color: #00843D; }

    .reply-editor-wrap { margin: 0; }

    /* Replies indented inside the right column */
    .replies-list { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
    .reply-item { display: flex; gap: 10px; align-items: flex-start; }

    .panel-footer { flex-shrink: 0; padding: 14px 36px 24px; }

    /* unified input style */
    .comment-input-shell {
      position: relative;
      border: 1px solid #8C8C8C;
      border-radius: 4px 4px 0 0;
      background: #fff;
      transition: border-color 0.22s ease, border-width 0.22s ease;
      overflow: visible;
    }
    .comment-input-shell.compact { min-height: 56px; height: auto; padding-bottom: 0; overflow: visible; }
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
    }
    .comment-input-shell:not(.focused):not(.has-value) .comment-input-label {
      top: 18px;
      font-size: 16px;
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

    .field-meta { display: flex; justify-content: flex-end; align-items: center; margin-top: 6px; margin-bottom: 16px; }
    .field-meta.compact { margin-bottom: 10px; }
    .char-count { font-size: 12px; color: #1A1A1A; line-height: 1; text-align: right; min-width: 72px; }
    .char-count.compact { min-width: auto; font-size: 11px; }
    .reply-inline-meta {
      position: absolute;
      right: 12px;
      top: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .footer-actions { display: flex; gap: 12px; }
    .footer-actions.compact { margin-top: 15px; margin-bottom: 2px; }
    .footer-actions.compact .btn-cancel,
    .footer-actions.compact .btn-confirm {
      height: 32px;
      font-size: 12px;
      padding: 0 10px;
    }

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
  @Output() closed = new EventEmitter<void>()

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
    // Level 1: main comment → replies
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

    // Level 2: reply → sub-replies
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

  comments: Comment[] = MOCK_COMMENTS.map((c) => ({ ...c, replies: c.replies ? [...c.replies] : [] }))
  lastUpdate = '2025-10-15'
  rowLabel = ''
  newComment = ''
  fieldFocused = false
  maxChars = MAX_CHARS

  activeReplyId: string | null = null        // which item (comment or reply) has editor open
  activeReplyParentId: string | null = null  // which main comment receives the new reply
  replyDraft = ''
  replyFieldFocused = false

  ngOnChanges(): void {
    if (this.rowData) {
      const d = this.rowData as Record<string, unknown>
      this.rowLabel = (d['name'] as string) || (d['product'] as string) || ''
    } else {
      this.rowLabel = ''
    }
  }

  startReply(targetId: string, parentCommentId: string): void {
    this.activeReplyId = targetId
    this.activeReplyParentId = parentCommentId
    this.replyDraft = ''
    this.replyFieldFocused = false
  }

  cancelReply(): void {
    this.activeReplyId = null
    this.activeReplyParentId = null
    this.replyDraft = ''
    this.replyFieldFocused = false
  }

  private findReplyTarget(id: string): Comment | CommentReply | null {
    for (const comment of this.comments) {
      if (comment.id === id) return comment
      const found = this.findInReplies(id, comment.replies ?? [])
      if (found) return found
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

  submitReply(parentId: string): void {
    const content = this.replyDraft.trim()
    if (!content) return

    const target = this.findReplyTarget(parentId)
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

    this.cancelReply()
  }

  saveComment(): void {
    const content = this.newComment.trim()
    if (!content) return

    this.comments.unshift({
      id: `c-${Date.now()}`,
      author: 'Yu Lin',
      initials: 'YL',
      avatarColor: '#6a1b9a',
      avatarBg: '#f3e5f5',
      timestamp: 'just now',
      text: content,
      replies: [],
    })

    this.newComment = ''
    this.fieldFocused = false
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
}

import { AfterViewChecked, Component, ElementRef, EventEmitter, Input, OnChanges, Output } from '@angular/core'
import { CommonModule, NgTemplateOutlet } from '@angular/common'
import { FormsModule } from '@angular/forms'

const CONTACT_OPTIONS = [
  'Gundrum, Adam',
  'Citta, Tony',
  'Kline, David',
  'Leed, Christopher',
  'Smith, John',
  'Wang, Alice',
  'Chen, Amy',
]

const MAX_CHARS = 250

interface EscReply {
  id: string
  author: string
  initials: string
  avatarColor: string
  avatarBg: string
  timestamp: string
  text: string
  replies?: EscReply[]
}

interface EscComment {
  id: string
  author: string
  initials: string
  avatarColor: string
  avatarBg: string
  timestamp: string
  text: string
  replies?: EscReply[]
}

@Component({
  selector: 'app-escalation-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, NgTemplateOutlet],
  template: `
    <div class="panel-overlay" [class.visible]="visible" (click)="onOverlayClick($event)">
      <div class="escalation-panel" [class.open]="visible" (click)="closeDropdown(); $event.stopPropagation()">

        <!-- Header -->
        <div class="panel-header">
          <div class="panel-title-area">
            <div class="panel-title-row">
              <h2 class="panel-title">Escalation</h2>
            </div>
          </div>
          <button class="close-btn" (click)="close()" type="button" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="#777" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <div class="panel-body">

          <!-- To: multi-select -->
          <div class="section to-section">
            <div class="tag-input-wrap" [class.focused]="dropdownOpen" [class.has-value]="selectedContacts.length > 0 || toInput.length > 0">
              <div class="to-input-row" (click)="dropdownOpen = true; $event.stopPropagation()">
                <span class="to-inline-label">To :</span>
                <input
                  class="to-input"
                  [(ngModel)]="toInput"
                  (focus)="dropdownOpen = true"
                  (blur)="onToInputBlur()"
                  (keydown.enter)="addTypedContact($event)"
                  (keydown.tab)="addTypedContact($event)"
                  placeholder=""
                  type="text"
                />
                @if (dropdownOpen) {
                  <div class="dropdown-list" (click)="$event.stopPropagation()">
                    @for (option of availableContacts; track option) {
                      <div class="dropdown-item" (click)="addContact(option)">{{ option }}</div>
                    }
                    @if (!availableContacts.length) {
                      <div class="dropdown-empty">All contacts selected</div>
                    }
                  </div>
                }
              </div>
              <div class="to-chips-row" (click)="$event.stopPropagation()">
                @for (contact of selectedContacts; track contact) {
                  <span class="contact-tag">
                    {{ contact }}
                    <button class="tag-remove" type="button" (click)="removeContact(contact, $event)">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" fill="white"/>
                        <path d="M5.4 5.4L10.6 10.6M10.6 5.4L5.4 10.6" stroke="#008A00" stroke-width="1.6" stroke-linecap="round"/>
                      </svg>
                    </button>
                  </span>
                }
              </div>
            </div>
          </div>

          <!-- Details -->
          <div class="section details-section">
            <div class="section-title">Details</div>
            <div class="details-shell">
              <div class="details-grid">
                <div class="details-card">
                  <div class="details-label">
                    <span class="details-label-icon" aria-hidden="true">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.2"/>
                      </svg>
                    </span>
                    <span>Current</span>
                  </div>
                  <div class="details-value">{{ details.current }}</div>
                </div>
                <div class="details-card">
                  <div class="details-label">
                    <span class="details-label-icon" aria-hidden="true">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 1.5V10.5M2.5 5L6 1.5L9.5 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </span>
                    <span>Prev</span>
                  </div>
                  <div class="details-value">{{ details.prev }}</div>
                </div>
                <div class="details-card details-card-accent">
                  <div class="details-label">
                    <span class="details-label-icon" aria-hidden="true">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 8.5L4.75 5.75L6.75 7.75L10 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </span>
                    <span>Variance</span>
                  </div>
                  <div class="details-value">{{ details.variance }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Comments -->
          <div class="section comments-section">
            <div class="section-title">Comments</div>
            <div class="comments-list">
              @for (comment of comments; track comment.id) {
                <div class="comment-thread">

                  <!-- Left col: avatar + thread line -->
                  <div class="comment-left">
                    <div class="avatar" [style.background]="comment.avatarBg" [style.color]="comment.avatarColor">
                      {{ comment.initials }}
                    </div>
                    @if (comment.replies?.length || activeReplyId === comment.id) {
                      <div class="thread-line"></div>
                    }
                  </div>

                  <!-- Right col -->
                  <div class="comment-right">
                    <div class="comment-meta">
                      <span class="author">{{ comment.author }}</span>
                      <span class="timestamp">{{ comment.timestamp }}</span>
                    </div>
                    <div class="comment-body">
                      <span class="quote-icon">
                        <svg width="16" height="12" viewBox="0 0 18 14" fill="none">
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

                    @if (activeReplyId === comment.id) {
                      <ng-container *ngTemplateOutlet="replyEditor; context: { parentId: comment.id }"></ng-container>
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
                                    <svg width="16" height="12" viewBox="0 0 18 14" fill="none">
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
                                @if (activeReplyId === reply.id) {
                                  <ng-container *ngTemplateOutlet="replyEditor; context: { parentId: reply.id }"></ng-container>
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
                                              <svg width="16" height="12" viewBox="0 0 18 14" fill="none">
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
            <div class="comment-input-shell compact" [class.focused]="fieldFocused" [class.has-value]="newComment.length > 0" [class.resized]="commentInputResized">
              <div class="comment-input-label">Leave a comment</div>
              <textarea
                class="comment-input-textarea"
                [(ngModel)]="newComment"
                (mousedown)="onCommentTextareaMouseDown($event)"
                (focus)="fieldFocused = true"
                (blur)="fieldFocused = false"
                [maxlength]="maxChars"
                placeholder="Hint text"
                rows="1"
                (mouseup)="onCommentTextareaMouseUp($event)"
              ></textarea>
              <button class="comment-submit-btn" type="button" (click)="addComment()" [class.active]="newComment.trim().length > 0" aria-label="Submit comment">
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.4"/>
                  <path d="M10 13.5L10 6.5M7 9.5L10 6.5L13 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            <div class="field-meta">
              <span class="char-count">{{ newComment.length }} / {{ maxChars }}</span>
            </div>
          </div>

        </div>

        <!-- Reply editor template -->
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

        <!-- Footer -->
        <div class="panel-footer">
          <div class="footer-actions">
            <button class="btn-cancel" type="button" (click)="close()">Cancel</button>
            <button class="btn-confirm" type="button" (click)="onConfirm()">Submit</button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .panel-overlay { position: fixed; inset: 0; z-index: 1001; pointer-events: none; background: transparent; transition: background 0.25s; }
    .panel-overlay.visible { pointer-events: all; background: rgba(0,0,0,0.12); }

    .escalation-panel {
      position: absolute;
      top: 10px; right: 10px; bottom: 10px;
      width: 420px;
      background: #fff;
      box-shadow: -4px 0 24px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      transform: translateX(calc(100% + 10px));
      transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
      overflow: hidden;
    }
    .escalation-panel.open { transform: translateX(0); }

    /* Header */
    .panel-header { position: relative; padding: 20px 20px 14px 24px; flex-shrink: 0; display: flex; align-items: flex-start; justify-content: space-between; }
    .panel-title-area { display: flex; flex-direction: column; }
    .panel-title-row { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
    .panel-title { font-size: 20px; font-weight: 500; color: #1A5C2A; margin: 0; }
    .close-btn { border: none; background: transparent; cursor: pointer; padding: 4px; display: flex; align-items: center; }
    .close-btn:hover { background: #f5f5f5; border-radius: 4px; }

    /* Body */
    .panel-body { flex: 1; overflow-y: auto; padding: 4px 28px 18px; }
    .section { margin-bottom: 28px; }

    /* To: section */
    .to-section { margin-bottom: 30px; }
    .tag-input-wrap {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 10px;
      border: 1px solid #8C8C8C;
      border-radius: 4px 4px 0 0;
      padding: 10px 12px;
      cursor: pointer;
      min-height: 96px;
      transition: border-color 0.22s ease, border-width 0.22s ease;
    }
    .tag-input-wrap:hover { border-color: #008A00; }
    .tag-input-wrap.focused { border-color: #008A00; border-width: 1px 1px 3px 1px; border-radius: 4px 4px 0 0; box-shadow: none; }
    .to-input-row { position: relative; display: flex; align-items: center; gap: 8px; min-height: 24px; width: 100%; }
    .to-inline-label { font-size: 16px; font-weight: 400; color: #1C1C1C; line-height: 1.2; white-space: nowrap; }
    .to-chips-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .contact-tag { display: inline-flex; align-items: center; gap: 6px; background: #008A00; color: white; border-radius: 999px; height: 32px; padding: 0 12px 0 14px; font-size: 13px; font-weight: 500; }
    .tag-remove { border: none; background: transparent; cursor: pointer; padding: 0; display: flex; align-items: center; width: 16px; height: 16px; }
    .to-input { flex: 1; min-width: 80px; border: none; outline: none; background: transparent; height: 24px; font-size: 16px; font-weight: 400; color: #1A1A1A; font-family: inherit; }
    .to-input::placeholder { color: #9E9E9E; }
    .dropdown-list {
      position: absolute;
      top: calc(100% + 2px);
      left: -12px;
      width: calc(100% + 24px);
      background: #fff;
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      z-index: 10;
      overflow: hidden;
    }
    .dropdown-item { min-height: 44px; display: flex; align-items: center; padding: 0 12px; font-size: 16px; font-weight: 500; cursor: pointer; color: #1A1A1A; background: #fff; }
    .dropdown-item:hover { background: #f5f7f5; }
    .dropdown-empty { min-height: 44px; display: flex; align-items: center; padding: 0 12px; font-size: 14px; color: #8C8C8C; }

    /* Details */
    .section-title { font-size: 16px; font-weight: 500; color: #1A5C2A; margin-bottom: 14px; }
    .details-section { margin-bottom: 28px; }
    .details-shell {
      position: relative;
      border: 1px solid #E3E3E3;
      background: #FFFFFF;
      padding: 0;
    }
    .details-shell::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 2px;
      background: #DDEBDD;
    }
    .details-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0; }
    .details-card {
      min-height: 92px;
      padding: 18px 20px 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #FFFFFF;
    }
    .details-card + .details-card { border-left: 1px solid #EAEAEA; }
    .details-card-accent {
      background: #FAFCF9;
    }
    .details-label {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
      color: #6D6D6D;
      line-height: 1.2;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }
    .details-label-icon {
      width: 12px;
      height: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #8C8C8C;
      flex-shrink: 0;
    }
    .details-value {
      font-size: 18px;
      font-weight: 600;
      color: #1A1A1A;
      line-height: 1.1;
      letter-spacing: -0.01em;
      font-variant-numeric: tabular-nums;
    }
    .details-card-accent .details-label { color: #467046; }
    .details-card-accent .details-label-icon { color: #5E8D5E; }
    .details-card-accent .details-value { color: #008A00; }

    /* Comments - full thread system */
    .comments-section .section-title { margin-bottom: 20px; }
    .comments-list { display: flex; flex-direction: column; gap: 20px; margin-top: 0; }
    .comment-thread { display: flex; gap: 12px; align-items: flex-start; }
    .comment-left { display: flex; flex-direction: column; align-items: flex-start; width: 28px; flex-shrink: 0; overflow: visible; }
    .thread-line { flex: none; min-height: 4px; margin-top: 4px; margin-left: 13px; width: 0; border-left: 1px dashed #dcdcdc; }
    .comment-right { flex: 1; min-width: 0; }
    .avatar { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .avatar-sm { width: 24px; height: 24px; font-size: 10px; }
    .comment-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; padding-top: 4px; }
    .author { font-size: 13px; font-weight: 600; color: #1A1A1A; }
    .timestamp { font-size: 11px; font-weight: 500; color: #bbb; }
    .comment-body { display: flex; align-items: flex-start; gap: 8px; }
    .quote-icon { display: flex; align-items: flex-start; flex-shrink: 0; margin-top: 2px; }
    .comment-text { font-size: 15px; font-weight: 400; color: #1A1A1A; line-height: 1.5; }

    /* Reply button */
    .reply-btn { display: inline-flex; align-items: center; gap: 4px; margin-top: 6px; margin-bottom: 8px; border: none; background: transparent; cursor: pointer; color: #1A1A1A; font-size: 12px; padding: 0; opacity: 0; transform: translateY(4px); pointer-events: none; transition: opacity 0.18s ease, transform 0.18s ease, color 0.18s ease; }
    .comment-right:hover > .reply-btn { opacity: 1; transform: translateY(0); pointer-events: auto; }
    .reply-item .comment-right:hover > .reply-btn { opacity: 1; transform: translateY(0); pointer-events: auto; }
    .reply-btn:hover { color: #008A00; }

    /* Level-1 replies */
    .replies-list { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
    .reply-item { position: relative; display: flex; gap: 10px; align-items: flex-start; }
    .reply-item::before {
      content: ''; position: absolute;
      left: -27px; top: 0;
      width: 22px; height: 14px;
      border-left: 1px dashed #dcdcdc;
      border-bottom: 1px dashed #dcdcdc;
      border-bottom-left-radius: 999px;
    }
    .reply-left-col { display: flex; flex-direction: column; align-items: flex-start; width: 24px; flex-shrink: 0; overflow: visible; }
    .reply-thread-line { flex: none; min-height: 4px; margin-top: 4px; margin-left: 11px; width: 0; border-left: 1px dashed #dcdcdc; }

    /* Level-2 sub-replies */
    .sub-replies-list { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
    .sub-reply-item { position: relative; display: flex; gap: 10px; align-items: flex-start; }
    .sub-reply-item::before {
      content: ''; position: absolute;
      left: -22px; top: 0;
      width: 17px; height: 14px;
      border-left: 1px dashed #dcdcdc;
      border-bottom: 1px dashed #dcdcdc;
      border-bottom-left-radius: 999px;
    }

    /* Reply editor */
    .reply-editor-wrap { margin: 0; }

    /* Input shell */
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
    .comment-input-shell.focused { border-color: #008A00; border-width: 1px 1px 3px 1px; border-radius: 4px 4px 0 0; box-shadow: none; }
    .comment-input-label {
      position: absolute; left: 12px; top: 10px;
      font-size: 12px; font-weight: 400; color: #1C1C1C; line-height: 1;
      transition: top 0.22s ease, font-size 0.22s ease;
      pointer-events: none; z-index: 1; background: #fff; padding: 0 2px;
    }
    .comment-input-shell:not(.focused):not(.has-value) .comment-input-label { top: 18px; font-size: 16px; font-weight: 400; }
    .comment-input-shell.compact:not(.focused):not(.has-value) .comment-input-label { top: 18px; font-size: 16px; font-weight: 400; color: #1C1C1C; }
    .comment-input-textarea {
      display: block; width: 100%; border: none; outline: none; resize: vertical;
      font-size: 16px; font-weight: 500; color: #1A1A1A; background: transparent;
      padding: 34px 12px 10px; font-family: inherit; line-height: 1.45;
      box-sizing: border-box; min-height: 80px; height: 80px;
      transition: padding-top 0.22s ease;
    }
    .comment-input-shell.compact .comment-input-textarea { padding-top: 24px; padding-bottom: 10px; padding-right: 44px; min-height: 56px; height: 56px; font-size: 16px; resize: vertical; }
    .comment-input-shell:not(.focused):not(.has-value) .comment-input-textarea { padding-top: 44px; }
    .comment-input-shell.compact:not(.focused):not(.has-value) .comment-input-textarea { padding-top: 24px; }
    .comment-input-shell:not(.focused):not(.has-value) .comment-input-textarea::placeholder { color: transparent; }
    .comment-input-textarea::placeholder { color: #8C8C8C; }
    .comment-submit-btn {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      width: 28px;
      height: 28px;
      padding: 0;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #C7C7C7;
      transition: color 0.18s;
    }
    .comment-input-shell.resized .comment-submit-btn {
      top: auto;
      transform: none;
      bottom: 10px;
    }
    .comment-submit-btn.active { color: #008A00; }
    .comment-submit-btn.active:hover { color: #006800; }
    .reply-inline-meta { position: absolute; right: 12px; top: 8px; display: flex; align-items: center; gap: 8px; }
    .field-meta { display: flex; justify-content: flex-end; align-items: center; margin-top: 6px; margin-bottom: 16px; }
    .char-count { font-size: 12px; color: #1A1A1A; line-height: 1; text-align: right; min-width: 72px; }
    .char-count.compact { min-width: auto; font-size: 11px; }

    /* Footer */
    .panel-footer { flex-shrink: 0; padding: 14px 28px 24px; border-top: none; }
    .footer-actions { display: flex; gap: 12px; }
    .footer-actions.compact { margin-top: 10px; margin-bottom: 2px; }
    .footer-actions.compact .btn-cancel,
    .footer-actions.compact .btn-confirm { height: 32px; font-size: 12px; padding: 0 10px; }
    .btn-cancel {
      flex: 1; height: 40px; background: #fff; color: #008A00;
      border: 2px solid #008A00; border-radius: 0;
      font-size: 14px; font-weight: 500; cursor: pointer;
    }
    .btn-cancel:hover { background: rgba(0, 138, 0, 0.05); color: #008A00; border-color: #008A00; }
    .btn-confirm {
      flex: 1; height: 40px; background: #008A00; color: #fff;
      border: none; border-radius: 0;
      font-size: 14px; font-weight: 500; cursor: pointer; outline: none; box-shadow: none;
    }
    .btn-confirm:hover:not(:disabled),
    .btn-confirm:focus:not(:disabled),
    .btn-confirm:active:not(:disabled) { background: #007500; border: none; outline: none; box-shadow: none; }
    .btn-confirm:disabled { background: #F7F7F7; color: #C7C7C7; border: 2px solid #D4D4D4; cursor: not-allowed; }
  `],
})
export class EscalationPanelComponent implements OnChanges, AfterViewChecked {
  @Input() visible = false
  @Input() rowData: unknown = null
  @Output() closed = new EventEmitter<void>()
  @Output() confirmed = new EventEmitter<{ contacts: string[]; comment: string }>()

  constructor(private el: ElementRef<HTMLElement>) {}

  private _lineUpdatePending = false

  ngAfterViewChecked(): void {
    if (!this._lineUpdatePending) {
      this._lineUpdatePending = true
      setTimeout(() => {
        this.updateThreadLines()
        this._lineUpdatePending = false
      })
    }
  }

  updateThreadLines(): void {
    // Level 1: comment → replies
    const threads = this.el.nativeElement.querySelectorAll<HTMLElement>('.comment-thread')
    threads.forEach(thread => {
      const threadLine = thread.querySelector<HTMLElement>(':scope > .comment-left .thread-line')
      if (!threadLine) return
      const allReplyItems = thread.querySelectorAll<HTMLElement>(':scope > .comment-right .replies-list .reply-item')
      if (!allReplyItems.length) { threadLine.style.height = '0'; return }
      const parentAvatar = thread.querySelector<HTMLElement>(':scope > .comment-left .avatar')!
      const parentAvatarRect = parentAvatar.getBoundingClientRect()
      const lastReplyItemRect = allReplyItems[allReplyItems.length - 1].getBoundingClientRect()
      const lineHeight = lastReplyItemRect.top - parentAvatarRect.bottom - 2
      threadLine.style.height = `${Math.max(4, lineHeight)}px`
    })

    // Level 2: reply → sub-replies
    const replyItems = this.el.nativeElement.querySelectorAll<HTMLElement>('.reply-item')
    replyItems.forEach(replyItem => {
      const replyThreadLine = replyItem.querySelector<HTMLElement>(':scope > .reply-left-col .reply-thread-line')
      if (!replyThreadLine) return
      const allSubReplyItems = replyItem.querySelectorAll<HTMLElement>(':scope > .comment-right .sub-replies-list .sub-reply-item')
      if (!allSubReplyItems.length) { replyThreadLine.style.height = '0'; return }
      const replyAvatar = replyItem.querySelector<HTMLElement>(':scope > .reply-left-col .avatar-sm')!
      const replyAvatarRect = replyAvatar.getBoundingClientRect()
      const lastSubReplyItemRect = allSubReplyItems[allSubReplyItems.length - 1].getBoundingClientRect()
      const lineHeight = lastSubReplyItemRect.top - replyAvatarRect.bottom - 2
      replyThreadLine.style.height = `${Math.max(4, lineHeight)}px`
    })
  }

  // To section
  selectedContacts = ['Gundrum, Adam', 'Citta, Tony', 'Kline, David', 'Leed, Christopher']
  dropdownOpen = false
  toInput = ''

  // Leave a comment
  newComment = ''
  fieldFocused = false
  maxChars = MAX_CHARS
  commentInputResized = false
  commentInputDragging = false

  // Reply
  activeReplyId: string | null = null
  activeReplyParentId: string | null = null
  replyDraft = ''
  replyFieldFocused = false

  details = { current: '$20,487', prev: '$20,564', variance: '$124' }

  comments: EscComment[] = [
    {
      id: '1', author: 'John Doe', initials: 'JD',
      avatarColor: '#2e7d32', avatarBg: '#e8f5e9',
      timestamp: '2025-10-15 12:19',
      text: 'Reviewed adjusted value, within acceptable range.',
      replies: [
        {
          id: '1-1', author: 'Yu Lin', initials: 'YL',
          avatarColor: '#6a1b9a', avatarBg: '#f3e5f5',
          timestamp: '15 hours ago',
          text: 'Reviewed deposit variance',
          replies: [],
        },
      ],
    },
    {
      id: '2', author: 'Amy Chen', initials: 'AC',
      avatarColor: '#00695c', avatarBg: '#e0f2f1',
      timestamp: '2025-10-15 13:02',
      text: 'Variance trend is stable compared with prior day.',
      replies: [
        {
          id: '2-1', author: 'Kevin Wu', initials: 'KW',
          avatarColor: '#283593', avatarBg: '#e8eaf6',
          timestamp: '2025-10-15 13:30',
          text: 'Agree. No additional escalation needed for now.',
          replies: [],
        },
      ],
    },
  ]

  get availableContacts(): string[] {
    return CONTACT_OPTIONS.filter(c => !this.selectedContacts.includes(c))
  }

  ngOnChanges(): void {
    if (this.rowData) {
      const d = this.rowData as Record<string, unknown>
      if (d['amount1'] != null) this.details.current = `$${Number(d['amount1']).toLocaleString()}`
      if (d['amount2'] != null) this.details.prev = `$${Number(d['amount2']).toLocaleString()}`
      const v = (Number(d['amount1']) || 0) - (Number(d['amount2']) || 0)
      if (d['amount1'] != null && d['amount2'] != null) this.details.variance = `$${Math.abs(v).toLocaleString()}`
    }
    this.dropdownOpen = false
  }

  // To section
  toggleDropdown(): void { this.dropdownOpen = !this.dropdownOpen }

  closeDropdown(): void { this.dropdownOpen = false }

  addContact(contact: string): void {
    this.selectedContacts = [...this.selectedContacts, contact]
    this.dropdownOpen = false
  }

  removeContact(contact: string, event: Event): void {
    event.stopPropagation()
    this.selectedContacts = this.selectedContacts.filter(c => c !== contact)
  }

  addTypedContact(event?: Event): void {
    event?.stopPropagation()
    const value = this.toInput.trim()
    if (!value) return
    if (!this.selectedContacts.includes(value)) {
      this.selectedContacts = [...this.selectedContacts, value]
    }
    this.toInput = ''
  }

  onToInputBlur(): void {
    this.addTypedContact()
    setTimeout(() => { this.dropdownOpen = false }, 120)
  }

  // Reply
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

  private findReplyTarget(id: string): EscComment | EscReply | null {
    for (const comment of this.comments) {
      if (comment.id === id) return comment
      const found = this.findInReplies(id, comment.replies ?? [])
      if (found) return found
    }
    return null
  }

  private findInReplies(id: string, replies: EscReply[]): EscReply | null {
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
      author: 'Yu Lin', initials: 'YL',
      avatarColor: '#6a1b9a', avatarBg: '#f3e5f5',
      timestamp: 'just now', text: content, replies: [],
    })
    this.cancelReply()
  }

  // Leave a comment
  onCommentTextareaMouseDown(event: MouseEvent): void {
    const textarea = event.target as HTMLTextAreaElement
    const rect = textarea.getBoundingClientRect()
    const nearRight = event.clientX >= rect.right - 20
    const nearBottom = event.clientY >= rect.bottom - 20

    // Only enter drag mode when grabbing native resize handle area.
    if (!nearRight || !nearBottom) return

    this.commentInputDragging = true
    this.commentInputResized = true

    const onMove = () => {
      this.commentInputResized = this.commentInputDragging || textarea.offsetHeight > 56
    }

    const onUp = () => {
      this.commentInputDragging = false
      this.commentInputResized = textarea.offsetHeight > 56
      window.removeEventListener('mousemove', onMove)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp, { once: true })
  }

  onCommentTextareaMouseUp(event: MouseEvent): void {
    const textarea = event.target as HTMLTextAreaElement
    this.commentInputResized = textarea.offsetHeight > 56
  }

  addComment(): void {
    const text = this.newComment.trim()
    if (!text) return
    this.comments = [{
      id: `c-${Date.now()}`, author: 'Yu Lin', initials: 'YL',
      avatarColor: '#6a1b9a', avatarBg: '#f3e5f5',
      timestamp: 'just now', text, replies: [],
    }, ...this.comments]
    this.newComment = ''
    this.fieldFocused = false
  }

  onConfirm(): void {
    this.confirmed.emit({ contacts: this.selectedContacts, comment: this.newComment })
    this.close()
  }

  close(): void {
    this.dropdownOpen = false
    this.closed.emit()
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('panel-overlay')) this.close()
  }
}

import { Component, OnDestroy, HostBinding, NgZone } from '@angular/core'
import { ICellRendererAngularComp } from 'ag-grid-angular'
import { ICellRendererParams } from 'ag-grid-community'

interface LcrActionContext {
  isCheckerMode?: boolean
  onCommentClick?: (data: unknown) => void
  onEscalate?: (data: unknown) => void
  onSignOff?: (data: unknown) => void
  onReject?: (data: unknown) => void
}

@Component({
  selector: 'app-lcr-action-cell',
  standalone: true,
  template: `
    <!-- MAKER MODE: comment icon -->
    @if (!isCheckerMode) {
      <button class="icon-btn" title="Comment" (click)="onComment($event)">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M15 2H3C2.44772 2 2 2.44772 2 3V11C2 11.5523 2.44772 12 3 12H5V15.5L9.5 12H15C15.5523 12 16 11.5523 16 11V3C16 2.44772 15.5523 2 15 2Z"
            stroke="#8C8C8C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <circle cx="6.5" cy="7" r="1" fill="#8C8C8C"/>
          <circle cx="9" cy="7" r="1" fill="#8C8C8C"/>
          <circle cx="11.5" cy="7" r="1" fill="#8C8C8C"/>
        </svg>
      </button>
    }

    <!-- CHECKER MODE: three-dot trigger -->
    @if (isCheckerMode) {
      <button
        class="checker-trigger"
        type="button"
        title="Actions"
        (click)="openDropdown($event)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="3"  r="1.3" fill="currentColor"/>
          <circle cx="8" cy="8"  r="1.3" fill="currentColor"/>
          <circle cx="8" cy="13" r="1.3" fill="currentColor"/>
        </svg>
      </button>
    }
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      transition: background 0.15s;
    }
    :host.maker-cell:hover { background: rgba(0, 138, 0, 0.05); }
    :host.checker-cell:hover { background: rgba(0, 0, 0, 0.04); }

    .icon-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px;
      border: none; background: transparent; border-radius: 4px;
      cursor: pointer; padding: 0;
    }
    :host.maker-cell:hover .icon-btn svg path { stroke: #00843D; }

    .checker-trigger {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px;
      border: none; background: transparent; border-radius: 6px;
      cursor: pointer; padding: 0; color: #595959;
    }
    :host.checker-cell:hover .checker-trigger { color: #262626; }
  `],
})
export class LcrActionCellRendererComponent implements ICellRendererAngularComp, OnDestroy {
  @HostBinding('class.checker-cell') get isCheckerCell() { return this.isCheckerMode }
  @HostBinding('class.maker-cell')   get isMakerCell()   { return !this.isCheckerMode }

  isCheckerMode = false
  private segment = 'enterprise'
  private params!: ICellRendererParams
  private dropdownEl: HTMLDivElement | null = null
  private styleEl: HTMLStyleElement | null = null
  private outsideHandler: ((e: MouseEvent) => void) | null = null

  constructor(private ngZone: NgZone) {}

  agInit(params: ICellRendererParams): void {
    this.params = params
    const ctx = params.context as LcrActionContext | undefined
    this.isCheckerMode = !!ctx?.isCheckerMode
    const cellParams = params.colDef?.cellRendererParams as { segment?: string } | undefined
    this.segment = cellParams?.segment ?? 'enterprise'
    this.closeDropdown()
  }

  refresh(params: ICellRendererParams): boolean {
    this.agInit(params)
    return true
  }

  ngOnDestroy(): void {
    this.closeDropdown()
    this.removeGlobalStyles()
  }

  onComment(event: Event): void {
    event.stopPropagation()
    const ctx = this.params.context as LcrActionContext | undefined
    ctx?.onCommentClick?.(this.params.data)
  }

  openDropdown(event: Event): void {
    event.stopPropagation()

    if (this.dropdownEl) {
      this.closeDropdown()
      return
    }

    const btn = event.currentTarget as HTMLElement
    const rect = btn.getBoundingClientRect()
    this.buildDropdown(rect)
  }

  private buildDropdown(rect: DOMRect): void {
    this.injectGlobalStyles()

    const el = document.createElement('div')
    el.className = 'lcr-action-popup'
    el.style.top    = `${rect.bottom + 4}px`
    el.style.left   = `${rect.right - 156}px`

    const items = [
      { label: 'Escalate', bg: '#FF8453', icon: this.iconEscalate(),  action: 'escalate' },
      { label: 'Sign-off', bg: '#52C41A', icon: this.iconSignOff(),   action: 'signoff'  },
      { label: 'Reject',   bg: '#FF4D4F', icon: this.iconReject(),    action: 'reject'   },
      { label: 'Comments', bg: '#8C8C8C', icon: this.iconComment(),   action: 'comment', divider: true },
    ]

    items.forEach(item => {
      if (item.divider) {
        const d = document.createElement('div')
        d.className = 'lcr-action-popup__divider'
        el.appendChild(d)
      }
      const row = document.createElement('button')
      row.className = 'lcr-action-popup__row'
      row.type = 'button'

      const iconWrap = document.createElement('span')
      iconWrap.className = 'lcr-action-popup__icon'
      iconWrap.style.background = item.bg
      iconWrap.innerHTML = item.icon

      const label = document.createElement('span')
      label.className = 'lcr-action-popup__label'
      label.textContent = item.label

      row.appendChild(iconWrap)
      row.appendChild(label)

      row.addEventListener('click', (e) => {
        e.stopPropagation()
        this.closeDropdown()
        // Run inside Angular zone so signals/effects update
        this.ngZone.run(() => {
          const ctx = this.params.context as LcrActionContext | undefined
          if (item.action === 'comment')  ctx?.onCommentClick?.(this.params.data)
          if (item.action === 'escalate') ctx?.onEscalate?.(this.params.data)
          if (item.action === 'signoff')  ctx?.onSignOff?.({ row: this.params.data, segment: this.segment })
          if (item.action === 'reject')   ctx?.onReject?.(this.params.data)
        })
      })

      el.appendChild(row)
    })

    document.body.appendChild(el)
    this.dropdownEl = el

    // Close on outside click
    this.outsideHandler = (e: MouseEvent) => {
      if (!el.contains(e.target as Node)) {
        this.closeDropdown()
      }
    }
    setTimeout(() => document.addEventListener('click', this.outsideHandler!), 0)
  }

  private closeDropdown(): void {
    if (this.dropdownEl) {
      this.dropdownEl.remove()
      this.dropdownEl = null
    }
    if (this.outsideHandler) {
      document.removeEventListener('click', this.outsideHandler)
      this.outsideHandler = null
    }
  }

  /* ---------- one-time global styles for the popup ---------- */
  private injectGlobalStyles(): void {
    if (document.getElementById('lcr-action-popup-styles')) return
    const style = document.createElement('style')
    style.id = 'lcr-action-popup-styles'
    style.textContent = `
      .lcr-action-popup {
        position: fixed;
        z-index: 99999;
        background: #fff;
        border-radius: 0;
        box-shadow: 0 6px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08);
        border: none;
        min-width: 148px;
        padding: 4px 0;
        animation: lcrPopupIn 0.14s cubic-bezier(0.4,0,0.2,1) both;
      }
      @keyframes lcrPopupIn {
        from { opacity:0; transform: translateY(-4px) scale(0.97); }
        to   { opacity:1; transform: translateY(0)   scale(1); }
      }
      .lcr-action-popup__divider {
        height: 1px; background: #f0f0f0; margin: 3px 0;
      }
      .lcr-action-popup__row {
        display: flex; align-items: center; gap: 10px;
        width: 100%; padding: 8px 14px;
        background: none; border: none; cursor: pointer; text-align: left;
      }
      .lcr-action-popup__row:hover { background: #f7f7f7; }
      .lcr-action-popup__icon {
        flex-shrink: 0; width: 18px; height: 18px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
      }
      .lcr-action-popup__label {
        font-size: 13px; font-weight: 500; color: #262626;
        white-space: nowrap; font-family: inherit;
      }
    `
    document.head.appendChild(style)
    this.styleEl = style
  }

  private removeGlobalStyles(): void {
    this.styleEl?.remove()
    this.styleEl = null
  }

  /* ---------- SVG icons ---------- */
  private iconEscalate(): string {
    return `<svg width="10" height="10" viewBox="0 0 14 14" fill="none">
      <path d="M4 10L10 4" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M5.5 4H10V8.5" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  }
  private iconSignOff(): string {
    return `<svg width="10" height="10" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7.5L5.5 10.5L11.5 4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  }
  private iconReject(): string {
    return `<svg width="10" height="10" viewBox="0 0 14 14" fill="none">
      <path d="M4 4l6 6M10 4l-6 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  }
  private iconComment(): string {
    return `<svg width="10" height="10" viewBox="0 0 14 14" fill="none">
      <path d="M12 2H2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1.5v2.5L7 10H12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"
        stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <circle cx="5" cy="6.5" r="0.8" fill="white"/>
      <circle cx="7" cy="6.5" r="0.8" fill="white"/>
      <circle cx="9" cy="6.5" r="0.8" fill="white"/>
    </svg>`
  }
}

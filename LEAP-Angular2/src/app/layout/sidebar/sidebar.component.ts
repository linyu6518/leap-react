import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core'
import { NzLayoutModule } from 'ng-zorro-antd/layout'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NavigationTreeComponent } from '../navigation-tree/navigation-tree.component'

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NzLayoutModule, NzIconModule, NavigationTreeComponent],
  template: `
    <nz-sider
      [nzWidth]="270"
      [nzCollapsed]="!expanded()"
      [nzCollapsedWidth]="85"
      class="sidebar"
      nzTheme="dark"
      (mouseenter)="onSiderPointerEnter()"
      (mouseleave)="onSiderPointerLeave()"
    >
      <div class="sidebar-header">
        <img src="assets/td-logo.svg" alt="TD Logo" class="td-logo-img" />
        <div class="sidebar-title-section" [class.sidebar-title-section--compact]="!expanded()">
          <h1 class="sidebar-title">LEAP <span class="version-text">1.0</span></h1>
          <p class="sidebar-subtitle">Liquidity Explain & Analytics</p>
        </div>
      </div>
      <div class="navigation-tree-wrapper" #navScroll>
        <app-navigation-tree [sidebarOpened]="expanded()" />
      </div>
      <div class="sidebar-footer" [class.sidebar-footer--expanded]="expanded()">
        <button
          class="autohide-switch"
          [class.autohide-switch--on]="!sidebarOpened()"
          (click)="toggle.emit()"
          [attr.title]="sidebarOpened() ? 'Turn on auto-hide' : 'Pin sidebar open'"
          type="button"
        >
          <span class="autohide-track">
            <span class="autohide-thumb">
              <svg class="autohide-thumb-icon" width="6" height="8" viewBox="0 0 6 8" fill="none">
                <rect x="2" y="0" width="2" height="8" rx="0" fill="currentColor"/>
              </svg>
            </span>
          </span>
          <span class="autohide-label">Auto-hide</span>
        </button>
      </div>
    </nz-sider>
  `,
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  /** Pinned open from parent toggle; when false, sidebar is narrow until hover. */
  sidebarOpened = input(true)
  toggle = output<void>()

  private readonly destroyRef = inject(DestroyRef)
  private readonly navScroll = viewChild<ElementRef<HTMLElement>>('navScroll')
  private hoverExpanded = signal(false)
  private collapseCloseTimer: ReturnType<typeof setTimeout> | null = null
  private prevExpandedUi = false

  /** Full width + labels: pinned open, or hover while pinned closed. */
  expanded = computed(() => this.sidebarOpened() || this.hoverExpanded())

  onSiderPointerEnter(): void {
    if (this.collapseCloseTimer != null) {
      clearTimeout(this.collapseCloseTimer)
      this.collapseCloseTimer = null
    }
    if (!this.sidebarOpened()) {
      this.hoverExpanded.set(true)
    }
  }

  onSiderPointerLeave(): void {
    if (this.sidebarOpened()) return
    if (this.collapseCloseTimer != null) {
      clearTimeout(this.collapseCloseTimer)
    }
    this.collapseCloseTimer = setTimeout(() => {
      this.hoverExpanded.set(false)
      this.collapseCloseTimer = null
    }, 280)
  }

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.collapseCloseTimer != null) clearTimeout(this.collapseCloseTimer)
    })

    effect(() => {
      const now = this.expanded()
      if (this.prevExpandedUi && !now) {
        /* After layout + scroll anchoring pass; instant reset avoids fighting the browser (no “dip then return”) */
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const el = this.navScroll()?.nativeElement
            if (el) el.scrollTop = 0
          })
        })
      }
      this.prevExpandedUi = now
    })
  }
}

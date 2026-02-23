import { Component, input, signal, OnInit, OnDestroy } from '@angular/core'
import { Router, NavigationEnd } from '@angular/router'
import { filter } from 'rxjs/operators'
import { NzIconModule } from 'ng-zorro-antd/icon'

interface NavItem {
  label: string
  icon?: string
  route?: string
  children?: NavItem[]
  expanded?: boolean
}

@Component({
  selector: 'app-navigation-tree',
  standalone: true,
  imports: [NzIconModule],
  template: `
    <div class="navigation-tree" [class.sidebar-collapsed]="!sidebarOpened()">
      @for (item of navItems(); track $index; let parentIdx = $index) {
        <div>
          <div
            class="nav-item level-1"
            [class.active]="isActive(item.route)"
            [class.has-active-child]="hasActiveChild(item)"
            [class.has-children]="!!item.children?.length"
            (click)="handleNavigate(item, parentIdx, undefined, $event)"
          >
            <div class="nav-item-content">
              @if (item.icon) {
                <span class="nav-icon" nz-icon [nzType]="item.icon"></span>
              }
              @if (sidebarOpened()) {
                <span class="nav-label">{{ item.label }}</span>
                @if (item.children?.length) {
                  <span class="expand-icon" [class.expanded]="item.expanded"></span>
                }
              }
            </div>
          </div>

          @if (item.children?.length && item.expanded && sidebarOpened()) {
            <div class="nav-children">
              @for (child of item.children; track $index) {
                <div>
                  <div
                    class="nav-item level-2"
                    [class.active]="isActive(child.route)"
                    [class.has-children]="!!child.children?.length"
                    (click)="handleNavigate(child, parentIdx, $index, $event)"
                  >
                    <div class="nav-item-content">
                      <span class="nav-dot"></span>
                      <span class="nav-label">{{ child.label }}</span>
                      @if (child.children?.length) {
                        <span class="expand-icon" [class.expanded]="child.expanded"></span>
                      }
                    </div>
                  </div>

                  @if (child.children?.length && child.expanded) {
                    <div class="nav-children">
                      @for (subChild of child.children; track $index) {
                        <div
                          class="nav-item level-3"
                          [class.active]="isActive(subChild.route)"
                          (click)="subChild.route && go(subChild.route)"
                        >
                          <div class="nav-item-content">
                            <span class="nav-dot"></span>
                            <span class="nav-label">{{ subChild.label }}</span>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrls: ['./navigation-tree.component.scss'],
})
export class NavigationTreeComponent implements OnInit, OnDestroy {
  sidebarOpened = input(true)
  private navEndSub?: { unsubscribe: () => void }

  navItems = signal<NavItem[]>([
    { label: 'Dashboard', icon: 'appstore', route: '/dashboard' },
    {
      label: 'Products',
      icon: 'folder',
      route: '/product',
      expanded: false,
      children: [
        { label: 'Deposit', route: '/product/deposits' },
        { label: 'Commitments', route: '/product/commitments' },
        { label: 'Loans', route: '/product/loans' },
        { label: 'Derivatives', route: '/product/derivatives' },
        { label: 'Unsecured', route: '/product/unsecured' },
        { label: 'Interaffiliate Funding', route: '/product/interaffiliate-funding' },
        { label: 'Secured Funding', route: '/product/secured-funding' },
        { label: 'Other Risks', route: '/product/other-risks' },
        { label: 'Prime Services', route: '/product/prime-services' },
        { label: 'HQLA', route: '/product/hqla' },
      ],
    },
    {
      label: 'Regulatory',
      icon: 'file-text',
      route: '/regulatory/lcr',
      expanded: false,
      children: [
        {
          label: 'Metrics',
          expanded: false,
          children: [
            { label: 'LCR', route: '/regulatory/lcr' },
            { label: 'NSFR', route: '/regulatory/nsfr' },
            { label: 'NCCF', route: '/regulatory/nccf' },
          ],
        },
        {
          label: 'Reporting',
          expanded: false,
          children: [
            { label: 'FR2052a', route: '/reports/fr2052a' },
            { label: 'STWF', route: '/reports/stwf' },
            { label: 'Appendix VI', route: '/reports/appendix-vi' },
            { label: 'OSFI LCR', route: '/reports/osfi-lcr' },
          ],
        },
        {
          label: 'Templates',
          expanded: false,
          children: [
            { label: 'Data Import', route: '/templates/import' },
            { label: 'Product Mapping', route: '/templates/mapping' },
            { label: 'Threshold Settings', route: '/templates/thresholds' },
          ],
        },
      ],
    },
    {
      label: 'Workspace',
      icon: 'usergroup-add',
      expanded: false,
      children: [
        { label: 'Maker Review', route: '/maker/review' },
        { label: 'Checker Approve', route: '/checker/approve' },
      ],
    },
    {
      label: 'Admin',
      icon: 'control',
      expanded: false,
      children: [
        { label: 'User Management', route: '/admin/users' },
        { label: 'System Settings', route: '/admin/settings' },
        { label: 'Audit Log', route: '/admin/audit-log' },
      ],
    },
  ])

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.expandActiveParent()
    this.navEndSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.expandActiveParent())
  }

  ngOnDestroy(): void {
    this.navEndSub?.unsubscribe()
  }

  private expandActiveParent(): void {
    const items = this.navItems()
    const next = items.map((item) => ({
      ...item,
      expanded: item.children?.length && this.hasActiveChild(item) ? true : (item.expanded ?? false),
      children: item.children?.map((c) => ({
        ...c,
        expanded: c.children?.length && this.hasActiveChild(c) ? true : (c.expanded ?? false),
      })),
    }))
    this.navItems.set(next)
  }

  isActive(route?: string): boolean {
    if (!route) return false
    const path = this.router.url.split('?')[0]
    return path === route || path.startsWith(route + '/')
  }

  hasActiveChild(item: NavItem): boolean {
    if (!item.children) return false
    return item.children.some((c) => {
      if (c.route && this.isActive(c.route)) return true
      return c.children?.some((s) => s.route && this.isActive(s.route)) ?? false
    })
  }

  go(route: string): void {
    if (this.router.url.split('?')[0] !== route) {
      this.router.navigateByUrl(route)
    }
  }

  handleNavigate(item: NavItem, parentIdx: number, childIdx?: number, e?: Event): void {
    e?.preventDefault()
    e?.stopPropagation()
    const items = this.navItems()

    if (item.children?.length) {
      if (childIdx !== undefined) {
        const child = items[parentIdx].children![childIdx]
        child.expanded = !child.expanded
        if (child.route) this.go(child.route)
        this.navItems.set([...items])
      } else {
        items[parentIdx].expanded = !items[parentIdx].expanded
        if (item.route) this.go(item.route)
        this.navItems.set([...items])
      }
    } else if (item.route) {
      this.go(item.route)
    }
  }
}

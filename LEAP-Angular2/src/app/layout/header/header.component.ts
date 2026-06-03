import { Component, signal, computed } from '@angular/core'
import { Router } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { NzLayoutModule } from 'ng-zorro-antd/layout'
import { NzBadgeModule } from 'ng-zorro-antd/badge'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzInputModule } from 'ng-zorro-antd/input'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzSelectModule } from 'ng-zorro-antd/select'
import { AuthService } from '../../core/services/auth.service'
import { ViewModeService } from '../../core/services/view-mode.service'
import { ReportScopeService } from '../../core/services/report-scope.service'
import { SegmentTreePickerComponent } from '../../shared/entity-tree/segment-tree-picker.component'

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    FormsModule,
    NzLayoutModule,
    NzBadgeModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    SegmentTreePickerComponent,
  ],
  template: `
    <ng-template #suffixClearTpl>
      @if (searchVal) {
        <button type="button" class="search-clear" (click)="clearSearch()" aria-label="Clear search">
          <span nz-icon nzType="close"></span>
        </button>
      }
    </ng-template>

    <header class="app-header">
      <!-- LEFT: Global Scope — collapsed to an icon, expands to a slide-out panel -->
      <div class="header-scope">
        <button
          type="button"
          class="scope-toggle-btn"
          [class.scope-toggle-btn--open]="scopeOpen()"
          (click)="toggleScope()"
          aria-label="Report scope"
          title="Global scope"
        >
          <span nz-icon nzType="control" nzTheme="outline"></span>
          @if (scopeSvc.globalScope().region) {
            <span class="scope-dot"></span>
          }
        </button>

        @if (scopeOpen()) {
          <div class="scope-backdrop" (click)="closeScope()"></div>
          <div class="scope-inline" role="dialog">
            <div class="scope-region-wrap">
              <nz-select
                class="scope-select"
                nzPlaceHolder="Region"
                [ngModel]="scopeSvc.globalScope().region"
                (nzOpenChange)="regionOpen.set($event)"
                (ngModelChange)="onRegionChange($event)"
              >
                <nz-option nzValue="US" nzLabel="US"></nz-option>
                <nz-option nzValue="Enterprise" nzLabel="Enterprise"></nz-option>
              </nz-select>
              <span class="scope-region-arrow" [class.scope-region-arrow--open]="regionOpen()"></span>
            </div>

            @if (scopeSvc.globalScope().region) {
              <div class="scope-segment-wrap">
                <app-segment-tree-picker
                  variant="header"
                  [region]="scopeSvc.globalScope().region"
                  [selectedCodes]="scopeSvc.globalScope().segments"
                  placeholder="Select a segment"
                  (selectedCodesChange)="onSegmentsChange($event)"
                ></app-segment-tree-picker>
              </div>
            }
          </div>
        }
      </div>

      <!-- RIGHT: Search + Bell + User -->
      <div class="header-right">
        <div class="search-box">
          <nz-input-group nzPrefixIcon="search" [nzSuffix]="suffixClearTpl" class="search-input-wrapper">
            <input
              nz-input
              placeholder="Search"
              class="search-input"
              [(ngModel)]="searchVal"
            />
          </nz-input-group>
        </div>

        <nz-badge [nzCount]="3" nzSize="small" [nzOffset]="[-25, 5]">
          <button class="notification-button" nz-button nzType="text" aria-label="Notifications">
            <span nz-icon nzType="bell"></span>
          </button>
        </nz-badge>

        <div class="user-menu-wrap">
          <button
            class="user-menu-button"
            type="button"
            (click)="toggleMenu()"
            [class.user-menu-button--open]="menuOpen()"
            aria-label="User menu"
          >
            <span class="user-avatar">{{ currentUser().avatar }}</span>
          </button>

          @if (menuOpen()) {
            <div class="menu-backdrop" (click)="closeMenu()"></div>
            <div class="user-dropdown-card" role="menu">
              <div class="dropdown-header">
                <div class="dropdown-avatar">{{ currentUser().avatar }}</div>
                <div class="dropdown-user-info">
                  <div class="dropdown-user-name">{{ currentUser().name }}</div>
                  <span
                    class="dropdown-role-badge"
                    [class.role-badge--checker]="currentViewMode() === 'checker'"
                  >{{ currentViewMode() === 'checker' ? 'Checker' : 'Maker' }}</span>
                </div>
              </div>

              <div class="dropdown-divider"></div>

              <button class="dropdown-item dropdown-item--switch" type="button" (click)="switchView()">
                <span class="dropdown-item-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 5h10M9 2l3 3-3 3M14 11H4M7 8l-3 3 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <span>Switch to {{ currentViewMode() === 'maker' ? 'Checker' : 'Maker' }} View</span>
                <span class="dropdown-item-badge" [class.badge--checker]="currentViewMode() === 'maker'">
                  {{ currentViewMode() === 'maker' ? 'Checker' : 'Maker' }}
                </span>
              </button>

              <button class="dropdown-item" type="button">
                <span class="dropdown-item-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" stroke-width="1.4"/>
                    <path d="M2.5 13.5c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                  </svg>
                </span>
                <span>Profile</span>
              </button>

              <button class="dropdown-item" type="button">
                <span class="dropdown-item-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.4"/>
                    <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M12.95 3.05l-1.06 1.06M4.11 11.89l-1.06 1.06" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                  </svg>
                </span>
                <span>Settings</span>
              </button>

              <div class="dropdown-divider"></div>

              <button class="dropdown-item dropdown-item--danger" type="button" (click)="handleLogout()">
                <span class="dropdown-item-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                    <path d="M11 11l3-3-3-3M14 8H6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <span>Sign out</span>
              </button>
            </div>
          }
        </div>
      </div>
    </header>
  `,
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  searchVal = ''
  menuOpen = signal(false)
  regionOpen = signal(false)
  scopeOpen = signal(false)
  currentUser = signal({ name: 'YL', role: 'Maker', avatar: 'YL' })
  currentViewMode!: ViewModeService['viewMode']

  constructor(
    private auth: AuthService,
    private router: Router,
    private viewModeService: ViewModeService,
    public scopeSvc: ReportScopeService,
  ) {
    this.currentViewMode = viewModeService.viewMode
    const user = this.auth.getCurrentUser() ?? this.auth.user
    if (user) {
      this.currentUser.set({
        name: user.fullName || user.username,
        role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
        avatar: 'YL',
      })
    }
  }

  onRegionChange(region: string | null): void {
    this.scopeSvc.setGlobal(region, [])
  }

  onSegmentsChange(segments: string[]): void {
    this.scopeSvc.setGlobal(this.scopeSvc.globalScope().region, segments)
  }

  toggleScope(): void { this.scopeOpen.update(v => !v) }
  closeScope(): void { this.scopeOpen.set(false) }

  toggleMenu(): void { this.menuOpen.update(v => !v) }
  closeMenu(): void { this.menuOpen.set(false) }

  switchView(): void {
    this.viewModeService.toggle()
    this.closeMenu()
  }

  handleLogout(): void {
    this.closeMenu()
    this.auth.logout()
    this.router.navigate(['/login'])
  }

  clearSearch(): void { this.searchVal = '' }
}

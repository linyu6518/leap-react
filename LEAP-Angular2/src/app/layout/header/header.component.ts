import { Component, signal, effect } from '@angular/core'
import { Router } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { NzLayoutModule } from 'ng-zorro-antd/layout'
import { NzBadgeModule } from 'ng-zorro-antd/badge'
import { NzDropDownModule } from 'ng-zorro-antd/dropdown'
import { NzMenuModule } from 'ng-zorro-antd/menu'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzInputModule } from 'ng-zorro-antd/input'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { AuthService } from '../../core/services/auth.service'

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    FormsModule,
    NzLayoutModule,
    NzBadgeModule,
    NzDropDownModule,
    NzMenuModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
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
      <div class="header-left">
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
      </div>
      <div class="header-right">
        <nz-badge [nzCount]="3" nzSize="small" [nzOffset]="[-25, 5]">
          <button class="notification-button" nz-button nzType="text" aria-label="Notifications">
            <span nz-icon nzType="bell"></span>
          </button>
        </nz-badge>
        <button class="user-menu-button" nz-button nzType="text" nz-dropdown [nzDropdownMenu]="menu" nzPlacement="bottomRight" nzTrigger="click">
          <span class="user-avatar">{{ currentUser().avatar }}</span>
        </button>
        <nz-dropdown-menu #menu="nzDropdownMenu">
          @if (currentViewMode() === 'maker') {
            <li nz-menu-item (click)="switchToChecker()">
              <span nz-icon nzType="swap"></span> Switch to Checker View
            </li>
          } @else {
            <li nz-menu-item (click)="switchToMaker()">
              <span nz-icon nzType="swap"></span> Switch to Maker View
            </li>
          }
          <li nz-menu-item><span nz-icon nzType="user"></span> Profile</li>
          <li nz-menu-item><span nz-icon nzType="setting"></span> Settings</li>
          <li nz-menu-divider></li>
          <li nz-menu-item (click)="handleLogout()">
            <span nz-icon nzType="logout"></span> Logout
          </li>
        </nz-dropdown-menu>
      </div>
    </header>
  `,
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  searchVal = ''
  currentViewMode = signal<'maker' | 'checker'>('maker')
  currentUser = signal({ name: 'YL', role: 'Maker', avatar: 'YL' })

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {
    effect(() => {
      const path = this.router.url
      this.currentViewMode.set(path.includes('/checker') ? 'checker' : 'maker')
    })
    const user = this.auth.getCurrentUser() ?? this.auth.user
    if (user) {
      this.currentUser.set({
        name: user.fullName || user.username,
        role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
        avatar: 'YL',
      })
    }
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  handleLogout(): void {
    this.auth.logout()
    this.router.navigate(['/login'])
  }

  switchToMaker(): void {
    this.router.navigate(['/maker/review'])
  }

  switchToChecker(): void {
    this.router.navigate(['/checker/approve'])
  }

  clearSearch(): void {
    this.searchVal = ''
  }
}

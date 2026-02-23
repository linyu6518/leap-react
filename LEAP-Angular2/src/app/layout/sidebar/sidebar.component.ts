import { Component, input, output } from '@angular/core'
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
      [nzCollapsed]="!sidebarOpened()"
      [nzCollapsedWidth]="80"
      class="sidebar"
      nzTheme="dark"
    >
      <div class="sidebar-header" [attr.data-collapsed]="!sidebarOpened()">
        <img src="assets/td-logo.svg" alt="TD Logo" class="td-logo-img" />
        @if (sidebarOpened()) {
          <div class="sidebar-title-section">
            <h1 class="sidebar-title">LEAP <span class="version-text">1.0</span></h1>
            <p class="sidebar-subtitle">Liquidity Explain & Analytics</p>
          </div>
        }
      </div>
      <div class="navigation-tree-wrapper">
        <app-navigation-tree [sidebarOpened]="sidebarOpened()" />
      </div>
      <div class="sidebar-footer">
        <button
          class="sidebar-toggle-btn"
          (click)="toggle.emit()"
          [attr.title]="sidebarOpened() ? 'Collapse sidebar' : 'Expand sidebar'"
        >
          @if (sidebarOpened()) {
            <span nz-icon nzType="menu-fold"></span>
          } @else {
            <span nz-icon nzType="menu-unfold"></span>
          }
        </button>
      </div>
    </nz-sider>
  `,
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  sidebarOpened = input(true)
  toggle = output<void>()
}

import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { NzLayoutModule } from 'ng-zorro-antd/layout'
import { SidebarComponent } from '../sidebar/sidebar.component'
import { HeaderComponent } from '../header/header.component'

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [NzLayoutModule, SidebarComponent, HeaderComponent, RouterOutlet],
  template: `
    <nz-layout class="main-layout">
      <app-sidebar [sidebarOpened]="sidebarOpened" (toggle)="sidebarOpened = !sidebarOpened" />
      <nz-layout class="content-area">
        <app-header />
        <nz-content class="main-content-wrapper">
          <router-outlet />
        </nz-content>
      </nz-layout>
    </nz-layout>
  `,
  styles: [`:host { display: block; height: 100%; }`],
})
export class MainLayoutComponent {
  sidebarOpened = false
}

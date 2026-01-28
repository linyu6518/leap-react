import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@shared/shared.module';

import { MainLayoutComponent } from './main-layout/main-layout.component';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NavigationTreeComponent } from './sidebar/navigation-tree/navigation-tree.component';

@NgModule({
  declarations: [
    MainLayoutComponent,
    HeaderComponent,
    SidebarComponent,
    NavigationTreeComponent
  ],
  imports: [
    RouterModule,
    SharedModule
  ],
  exports: [
    MainLayoutComponent
  ]
})
export class LayoutModule { }

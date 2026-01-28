import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '@shared/shared.module';
import { MatTabsModule } from '@angular/material/tabs';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuditLogComponent } from './audit-log/audit-log.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { SystemSettingsComponent } from './system-settings/system-settings.component';

const routes: Routes = [
  { path: 'audit-log', component: AuditLogComponent },
  { path: 'users', component: UserManagementComponent },
  { path: 'settings', component: SystemSettingsComponent },
  { path: '', redirectTo: 'audit-log', pathMatch: 'full' }
];

@NgModule({
  declarations: [
    AuditLogComponent,
    UserManagementComponent,
    SystemSettingsComponent
  ],
  imports: [
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
    MatTabsModule,
    MatSlideToggleModule,
    MatTooltipModule,
    RouterModule.forChild(routes)
  ]
})
export class AdminModule { }

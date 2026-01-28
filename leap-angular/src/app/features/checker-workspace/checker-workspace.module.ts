import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '@shared/shared.module';

import { CheckerApproveComponent } from './approve/checker-approve.component';

const routes: Routes = [
  { path: 'approve', component: CheckerApproveComponent },
  { path: '', redirectTo: 'approve', pathMatch: 'full' }
];

@NgModule({
  declarations: [CheckerApproveComponent],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class CheckerWorkspaceModule { }

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '@shared/shared.module';

import { MakerReviewComponent } from './review/maker-review.component';

const routes: Routes = [
  { path: 'review', component: MakerReviewComponent },
  { path: '', redirectTo: 'review', pathMatch: 'full' }
];

@NgModule({
  declarations: [MakerReviewComponent],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class MakerWorkspaceModule { }

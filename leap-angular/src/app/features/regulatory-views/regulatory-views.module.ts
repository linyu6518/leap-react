import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '@shared/shared.module';

import { LcrViewComponent } from './lcr-view/lcr-view.component';
import { LcrFormComponent } from './lcr-form/lcr-form.component';
import { LcrDetailComponent } from './lcr-detail/lcr-detail.component';
import { NsfrViewComponent } from './nsfr-view/nsfr-view.component';
import { NccfViewComponent } from './nccf-view/nccf-view.component';
import { IlstViewComponent } from './ilst-view/ilst-view.component';

const routes: Routes = [
  { path: 'lcr', component: LcrFormComponent },
  { path: 'lcr/detail', component: LcrDetailComponent },
  { path: 'nsfr', component: NsfrViewComponent },
  { path: 'nccf', component: NccfViewComponent },
  { path: 'ilst', component: IlstViewComponent },
  { path: '', redirectTo: 'lcr', pathMatch: 'full' }
];

@NgModule({
  declarations: [
    LcrViewComponent,
    LcrFormComponent,
    LcrDetailComponent,
    NsfrViewComponent,
    NccfViewComponent,
    IlstViewComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class RegulatoryViewsModule { }

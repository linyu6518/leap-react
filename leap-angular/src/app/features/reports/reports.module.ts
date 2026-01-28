import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import { Fr2052aComponent } from './fr2052a/fr2052a.component';
import { StwfComponent } from './stwf/stwf.component';
import { AppendixViComponent } from './appendix-vi/appendix-vi.component';
import { OsfiLcrComponent } from './osfi-lcr/osfi-lcr.component';

const routes: Routes = [
  { path: 'fr2052a', component: Fr2052aComponent },
  { path: 'stwf', component: StwfComponent },
  { path: 'appendix-vi', component: AppendixViComponent },
  { path: 'osfi-lcr', component: OsfiLcrComponent }
];

@NgModule({
  declarations: [
    Fr2052aComponent,
    StwfComponent,
    AppendixViComponent,
    OsfiLcrComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDividerModule
  ]
})
export class ReportsModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';

// AG Grid
import { AgGridModule } from 'ag-grid-angular';

// ECharts
import { NgxEchartsModule } from 'ngx-echarts';
import * as echarts from 'echarts';

// Shared Components
import { StatusBadgeComponent } from './components/status-badge/status-badge.component';
import { QueryPanelComponent } from './components/query-panel/query-panel.component';
import { CommentaryDrawerComponent } from './components/commentary-drawer/commentary-drawer.component';

const MATERIAL_MODULES = [
  MatButtonModule,
  MatIconModule,
  MatInputModule,
  MatFormFieldModule,
  MatSelectModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatCardModule,
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatProgressSpinnerModule,
  MatSnackBarModule,
  MatDialogModule,
  MatSidenavModule,
  MatToolbarModule,
  MatMenuModule,
  MatExpansionModule,
  MatChipsModule,
  MatBadgeModule,
  MatTooltipModule,
  MatDividerModule,
  MatListModule,
  MatTabsModule
];

@NgModule({
  declarations: [
    StatusBadgeComponent,
    QueryPanelComponent,
    CommentaryDrawerComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ...MATERIAL_MODULES,
    AgGridModule,
    NgxEchartsModule.forRoot({ echarts })
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ...MATERIAL_MODULES,
    AgGridModule,
    NgxEchartsModule,
    // Shared Components
    StatusBadgeComponent,
    QueryPanelComponent,
    CommentaryDrawerComponent
  ]
})
export class SharedModule { }

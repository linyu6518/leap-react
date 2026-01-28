import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DataImportComponent } from './data-import/data-import.component';
import { ProductMappingComponent } from './product-mapping/product-mapping.component';
import { ThresholdSettingsComponent } from './threshold-settings/threshold-settings.component';

const routes: Routes = [
  { path: 'import', component: DataImportComponent },
  { path: 'mapping', component: ProductMappingComponent },
  { path: 'thresholds', component: ThresholdSettingsComponent }
];

@NgModule({
  declarations: [
    DataImportComponent,
    ProductMappingComponent,
    ThresholdSettingsComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule
  ]
})
export class TemplatesModule { }

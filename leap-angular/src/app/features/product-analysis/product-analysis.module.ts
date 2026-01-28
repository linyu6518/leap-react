import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '@shared/shared.module';

import { ProductsComponent } from './products/products.component';
import { DepositsComponent } from './deposits/deposits.component';
import { BuybackComponent } from './buyback/buyback.component';
import { LoanCommitmentsComponent } from './loan-commitments/loan-commitments.component';

const routes: Routes = [
  { path: '', component: ProductsComponent },
  { path: 'deposits', component: DepositsComponent },
  { path: 'buyback', component: BuybackComponent },
  { path: 'loan-commitments', component: LoanCommitmentsComponent }
];

@NgModule({
  declarations: [
    ProductsComponent,
    DepositsComponent,
    BuybackComponent,
    LoanCommitmentsComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class ProductAnalysisModule { }

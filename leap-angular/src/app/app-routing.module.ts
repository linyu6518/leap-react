import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'product',
        loadChildren: () => import('./features/product-analysis/product-analysis.module').then(m => m.ProductAnalysisModule)
      },
      {
        path: 'regulatory',
        loadChildren: () => import('./features/regulatory-views/regulatory-views.module').then(m => m.RegulatoryViewsModule)
      },
      {
        path: 'reports',
        loadChildren: () => import('./features/reports/reports.module').then(m => m.ReportsModule)
      },
      {
        path: 'templates',
        loadChildren: () => import('./features/templates/templates.module').then(m => m.TemplatesModule)
      },
      {
        path: 'maker',
        loadChildren: () => import('./features/maker-workspace/maker-workspace.module').then(m => m.MakerWorkspaceModule)
      },
      {
        path: 'checker',
        loadChildren: () => import('./features/checker-workspace/checker-workspace.module').then(m => m.CheckerWorkspaceModule)
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    useHash: false,
    scrollPositionRestoration: 'top'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }

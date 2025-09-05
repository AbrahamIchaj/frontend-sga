import { Routes } from '@angular/router';
import { LoginComponent } from './Login/Login.component';
import { DashboardComponent } from './Dashboard/dashboard.component';
import { LayoutComponent } from './Layout/layout.component';

export const routes: Routes = [
  { path: '', redirectTo: '/Dashboard', pathMatch: 'full' },
  { path: 'Login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'Dashboard', component: DashboardComponent },
      { path: 'migracion-excel', loadComponent: () => import('./migracion-excel/migracion-excel.component').then(m => m.MigracionExcelComponent) },
      { path: 'catalogo-insumos', loadComponent: () => import('./CatalogoInsumos/catalogo-insumos.component').then(m => m.CatalogoInsumosComponent) }
    ]
  }
];

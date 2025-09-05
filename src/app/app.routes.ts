import { Routes } from '@angular/router';
import { LoginComponent } from './Login/Login.component';
import { MigracionExcelComponent } from './migracion-excel/migracion-excel.component';
import { DashboardComponent } from './Dashboard/dashboard.component';
export const routes: Routes = [
  { path: '', redirectTo: '/Dashboard', pathMatch: 'full' },
  { path: 'Login', component: LoginComponent },
  { path: 'migracion-excel', component: MigracionExcelComponent },
  { path: 'Dashboard', component: DashboardComponent },
  { path: 'catalogo-insumos', loadComponent: () => import('./CatalogoInsumos/catalogo-insumos.component').then(m => m.CatalogoInsumosComponent) }
];

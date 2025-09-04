import { Routes } from '@angular/router';
import { LoginComponent } from './Login/Login.component';
import { MigracionExcelComponent } from './migracion-excel/migracion-excel.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'migracion-excel', component: MigracionExcelComponent }
];

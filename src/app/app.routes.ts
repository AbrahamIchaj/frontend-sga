import { Routes } from '@angular/router';
import { LoginComponent } from './Login/Login.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent }
];

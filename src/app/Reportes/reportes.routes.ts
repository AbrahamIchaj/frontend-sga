import { Routes } from '@angular/router';
import { PermissionGuard } from '../shared/guards/auth.guard';

export const reportesRoutes: Routes = [
  {
    path: '',
    canActivate: [PermissionGuard],
    data: { permissions: ['GESTIONAR_REPORTES'] },
    loadComponent: () =>
      import('./components/reportes-resumen/reportes-resumen.component').then(
        (m) => m.ReportesResumenComponent,
      ),
  },
  {
    path: 'consumos-mensuales',
    canActivate: [PermissionGuard],
    data: { permissions: ['GESTIONAR_REPORTES'] },
    loadComponent: () =>
      import('./components/consumos-mensuales/consumos-mensuales.component').then(
        (m) => m.ConsumosMensualesComponent,
      ),
  },
  {
    path: 'compras-anuales',
    canActivate: [PermissionGuard],
    data: { permissions: ['GESTIONAR_REPORTES'] },
    loadComponent: () =>
      import('./components/compras-anuales/compras-anuales.component').then(
        (m) => m.ComprasAnualesComponent,
      ),
  },
  {
    path: 'despachos-anuales',
    canActivate: [PermissionGuard],
    data: { permissions: ['GESTIONAR_REPORTES'] },
    loadComponent: () =>
      import('./components/despachos-anuales/despachos-anuales.component').then(
        (m) => m.DespachosAnualesComponent,
      ),
  },
  {
    path: 'reajustes-anuales',
    canActivate: [PermissionGuard],
    data: { permissions: ['GESTIONAR_REPORTES'] },
    loadComponent: () =>
      import('./components/reajustes-anuales/reajustes-anuales.component').then(
        (m) => m.ReajustesAnualesComponent,
      ),
  },
];

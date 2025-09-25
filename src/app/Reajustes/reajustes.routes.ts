import { Routes } from '@angular/router';

export const reajustesRoutes: Routes = [
  {
    path: '',
    redirectTo: 'listado',
    pathMatch: 'full'
  },
  {
    path: 'listado',
    loadComponent: () =>
      import('./components/listado-reajustes/listado-reajustes.component').then(m => m.ListadoReajustesComponent),
    title: 'Listado de Reajustes'
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./components/form-reajuste/form-reajuste.component').then(m => m.FormReajusteComponent),
    title: 'Nuevo Reajuste'
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/detalle-reajuste/detalle-reajuste.component').then(m => m.DetalleReajusteComponent),
    title: 'Detalle de Reajuste'
  }
];

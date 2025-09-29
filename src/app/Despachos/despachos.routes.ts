import { Routes } from '@angular/router';

export const despachosRoutes: Routes = [
  {
    path: '',
    redirectTo: 'listado',
    pathMatch: 'full'
  },
  {
    path: 'listado',
    loadComponent: () =>
      import('./components/despacho-listado/despacho-listado.component').then(m => m.DespachoListadoComponent),
    title: 'Listado de Despachos'
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./components/despacho-form/despacho-form.component').then(m => m.DespachoFormComponent),
    title: 'Nuevo Despacho'
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/despacho-detalle/despacho-detalle.component').then(m => m.DespachoDetalleComponent),
    title: 'Detalle de Despacho'
  }
];

import { Routes } from '@angular/router';

export const comprasRoutes: Routes = [
  {
    path: '',
    redirectTo: 'listado',
    pathMatch: 'full'
  },
  {
    path: 'listado',
    loadComponent: () => 
      import('./components/listado-compras/listado-compras.component').then(
        m => m.ListadoComprasComponent
      ),
    title: 'Listado de Compras'
  },
  {
    path: 'nueva',
    loadComponent: () => 
      import('./components/nueva-compra/nueva-compra.component').then(
        m => m.NuevaCompraComponent
      ),
    title: 'Nueva Compra'
  },
  {
    path: 'editar/:id',
    loadComponent: () => 
      import('./components/nueva-compra/nueva-compra.component').then(
        m => m.NuevaCompraComponent
      ),
    title: 'Editar Compra'
  },
  {
    path: 'ver/:id',
    loadComponent: () => 
      import('./components/detalle-compra/detalle-compra.component').then(
        m => m.DetalleCompraComponent
      ),
    title: 'Detalle de Compra'
  }
];
import { Routes } from '@angular/router';
import { LoginComponent } from './Login/Login.component';
import { DashboardComponent } from './Dashboard/dashboard.component';
import { LayoutComponent } from './Layout/layout.component';
import { AuthGuard, PermissionGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/Login', pathMatch: 'full' },
  { path: 'Login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { 
        path: 'Dashboard', 
        loadComponent: () => import('./Dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [PermissionGuard],
        data: { permissions: ['GESTIONAR_DASHBOARD'] }
      },
      { 
        path: 'migracion-excel', 
        loadComponent: () => import('./migracion-excel/migracion-excel.component').then(m => m.MigracionExcelComponent),
        canActivate: [PermissionGuard],
        data: { permissions: ['GESTIONAR_MIGRACION'] }
        
      },
      { 
        path: 'catalogo-insumos', 
        loadComponent: () => import('./CatalogoInsumos/catalogo-insumos.component').then(m => m.CatalogoInsumosComponent),
        canActivate: [PermissionGuard],
        data: { permissions: ['GESTIONAR_CATALOGO-INSUMOS'] }
        
      },
      { 
        path: 'compras', 
        loadChildren: () => import('./Compras/compras.routes').then(m => m.comprasRoutes),
        canActivate: [PermissionGuard],
        data: { permissions: ['GESTIONAR_COMPRAS'] }
      },
      { 
        path: 'despachos', 
        loadChildren: () => import('./Despachos/despachos.routes').then(m => m.despachosRoutes),
        canActivate: [PermissionGuard],
        data: { permissions: ['GESTIONAR_DESPACHOS'] }
      },
      { 
        path: 'servicios', 
        loadComponent: () => import('./Servicios/servicios.component').then(m => m.ServiciosComponent),
        canActivate: [PermissionGuard],
        data: { permissions: ['GESTIONAR_SERVICIOS'] }
      },
      { 
        path: 'inventario', 
        loadComponent: () => import('./Inventario/inventario-list.component').then(m => m.InventarioListComponent),
        canActivate: [PermissionGuard],
        data: { permissions: ['GESTIONAR_INVENTARIO'] }
      },
      { 
        path: 'abastecimientos', 
        loadComponent: () => import('./Abastecimientos/abastecimientos.page').then(m => m.AbastecimientosPageComponent),
        canActivate: [PermissionGuard],
        data: { permissions: ['GESTIONAR_ABASTECIMIENTOS'] }
      },
      { 
        path: 'abastecimientos/historial', 
        loadComponent: () => import('./Abastecimientos/Abastecimiento-historial/abastecimientos-historial.page').then(m => m.AbastecimientosHistorialPageComponent),
        canActivate: [PermissionGuard],
        data: { permissions: ['GESTIONAR_ABASTECIMIENTOS'] }
      },
      { 
        path: 'abastecimientos/historial-fechas', 
        loadComponent: () => import('./Abastecimientos/Abastecimiento-historial-fechas/abastecimientos-historial-fechas.page').then(m => m.AbastecimientosHistorialFechasPageComponent),
        canActivate: [PermissionGuard],
        data: { permissions: ['GESTIONAR_ABASTECIMIENTOS'] }
      },
      { 
        path: 'abastecimientos-general', 
        loadComponent: () => import('./AbastecimientosGeneral/abastecimientos-general.page').then(m => m.AbastecimientosGeneralPageComponent),
        canActivate: [PermissionGuard],
        data: { permissions: ['GESTIONAR_ABASTECIMIENTOS_GENERAL'] }
      },  
      { 
        path: 'reportes', 
        loadChildren: () => import('./Reportes/reportes.routes').then(m => m.reportesRoutes),
        canActivate: [PermissionGuard],
        data: { permissions: ['GESTIONAR_REPORTES'] }
      },
      { 
        path: 'reajustes', 
        loadChildren: () => import('./Reajustes/reajustes.routes').then(m => m.reajustesRoutes),
        canActivate: [PermissionGuard],
        data: { permissions: ['GESTIONAR_REAJUSTES'] }
      },
      { 
        path: 'usuarios', 
        loadComponent: () => import('./Usuarios/pages/usuarios.page').then(m => m.UsuariosPageComponent),
        canActivate: [PermissionGuard],
        data: { permissions: ['GESTIONAR_USUARIOS'] }
      },
      { 
        path: 'usuarios/roles', 
        loadComponent: () => import('./Usuarios/pages/roles.page').then(m => m.RolesPageComponent),
        canActivate: [PermissionGuard],
        data: { permissions: ['GESTIONAR_ROLES'] }
      },
      { 
        path: 'usuarios/permisos', 
        loadComponent: () => import('./Usuarios/pages/permisos.page').then(m => m.PermisosPageComponent),
        canActivate: [PermissionGuard],
        data: { permissions: ['GESTIONAR_PERMISOS'] }
      },
      { 
        path: 'Bienvenida', 
        loadComponent: () => import('./Bienvenida/Bienvenida.component').then(m => m.BienvenidaComponent) 
      }
    ]
  }
];

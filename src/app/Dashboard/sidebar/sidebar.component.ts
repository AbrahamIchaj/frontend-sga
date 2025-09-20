import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SIDEBAR_ROUTES } from './sidebar-routes.config';
import { AuthService, Modulo } from '../../shared/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  routes = SIDEBAR_ROUTES;
  modulosDisponibles: Modulo[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    console.log('SidebarComponent: Inicializando...');
    this.modulosDisponibles = this.authService.getModulosDisponibles();
    console.log('SidebarComponent: Módulos disponibles:', this.modulosDisponibles);
  }

  canAccessRoute(route: any): boolean {
    console.log('SidebarComponent: Verificando acceso a ruta:', route);
    // Si no hay permisos definidos en la ruta, permitir acceso
    if (!route.permissions || route.permissions.length === 0) {
      console.log('SidebarComponent: Ruta sin permisos, acceso permitido');
      return true;
    }
    
    // Verificar si tiene alguno de los permisos requeridos
    const hasAccess = this.authService.hasAnyPermission(route.permissions);
    console.log('SidebarComponent: Acceso a ruta:', hasAccess);
    return hasAccess;
  }

  onRouteClick(route: any) {
    console.log('SidebarComponent: Click en ruta:', route);
  }

  logout() {
    this.authService.logout();
  }
}

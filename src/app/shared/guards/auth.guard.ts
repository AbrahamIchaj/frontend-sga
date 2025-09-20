import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }

    // Guardar la URL a la que intentaba acceder
    localStorage.setItem('redirectUrl', state.url);
    this.router.navigate(['/Login']);
    return false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    console.log('PermissionGuard: Verificando acceso a:', state.url);
    
    // Verificar autenticación primero
    if (!this.authService.isAuthenticated()) {
      console.log('PermissionGuard: Usuario no autenticado');
      this.router.navigate(['/Login']);
      return false;
    }

    // Verificar permisos específicos de la ruta
    const requiredPermissions = route.data?.['permissions'] as string[];
    console.log('PermissionGuard: Permisos requeridos:', requiredPermissions);
    
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = this.authService.hasAnyPermission(requiredPermissions);
      console.log('PermissionGuard: Usuario tiene permisos:', hasPermission);
      
      if (!hasPermission) {
        console.log('PermissionGuard: Acceso denegado, redirigiendo a Dashboard');
        // Redirigir a página de acceso denegado o dashboard
        this.router.navigate(['/Dashboard']);
        return false;
      }
    }

    console.log('PermissionGuard: Acceso permitido');
    return true;
  }
}
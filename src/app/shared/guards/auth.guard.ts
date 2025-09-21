import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { StorageService } from '../services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private storage: StorageService
  ) {}
  

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }
    
    try {
      this.storage.setItem('redirectUrl', state.url);
    } catch (err) {
      console.warn('No se pudo guardar redirectUrl en storage:', err);
    }
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
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
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
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export interface Usuario {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  activo: boolean;
  rol: {
    idRoles: number;
    nombreRol: string;
    descripcion: string;
    permisos: string[];
  };
}

export interface LoginRequest {
  correo: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    usuario: Usuario;
    token?: string;
  };
  message?: string;
}

export interface Modulo {
  id: string;
  nombre: string;
  ruta: string;
  icono: string;
  descripcion: string;
  requierePermisos: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/api/v1';
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Definición de módulos del sistema
  private readonly MODULOS_SISTEMA: Modulo[] = [
    {
      id: 'dashboard',
      nombre: 'Dashboard',
      ruta: '/Dashboard',
      icono: '📊',
      descripcion: 'Panel principal del sistema',
      requierePermisos: ['VER_DASHBOARD']
    },
    {
      id: 'usuarios',
      nombre: 'Gestión de Usuarios',
      ruta: '/usuarios',
      icono: '',
      descripcion: 'Administrar usuarios del sistema',
      requierePermisos: ['GESTIONAR_USUARIOS']
    },
    {
      id: 'roles',
      nombre: 'Gestión de Roles',
      ruta: '/usuarios/roles',
      icono: '🔑',
      descripcion: 'Administrar roles y permisos',
      requierePermisos: ['GESTIONAR_ROLES']
    },
    {
      id: 'permisos',
      nombre: 'Gestión de Permisos',
      ruta: '/usuarios/permisos',
      icono: '🛡️',
      descripcion: 'Administrar permisos del sistema',
      requierePermisos: ['GESTIONAR_PERMISOS']
    },
    {
      id: 'catalogo',
      nombre: 'Catálogo de Insumos',
      ruta: '/catalogo-insumos',
      icono: '📦',
      descripcion: 'Gestionar catálogo de productos',
      requierePermisos: ['GESTIONAR_CATALOGO']
    },
    {
      id: 'compras',
      nombre: 'Gestión de Compras',
      ruta: '/compras',
      icono: '🛒',
      descripcion: 'Administrar compras y proveedores',
      requierePermisos: ['GESTIONAR_COMPRAS']
    },
    {
      id: 'inventario',
      nombre: 'Inventario',
      ruta: '/inventario',
      icono: '📋',
      descripcion: 'Control de inventario y stock',
      requierePermisos: ['GESTIONAR_INVENTARIO']
    },
    {
      id: 'servicios',
      nombre: 'Servicios',
      ruta: '/servicios',
      icono: '🔧',
      descripcion: 'Gestionar servicios disponibles',
      requierePermisos: ['GESTIONAR_SERVICIOS']
    },
    {   
      id: 'migracion',
      nombre: 'Migración de Datos',
      ruta: '/migracion-excel',
      icono: '📊',
      descripcion: 'Importar datos desde Excel',
      requierePermisos: ['GESTIONAR_MIGRACION']
    },
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Verificar si hay un usuario guardado en localStorage (solo en el navegador)
    if (isPlatformBrowser(this.platformId)) {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          this.currentUserSubject.next(user);
        } catch (error) {
          console.error('Error al cargar usuario guardado:', error);
          localStorage.removeItem('currentUser');
        }
      }
    }
  }

  /**
   * Iniciar sesión
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data?.usuario) {
            this.setCurrentUser(response.data.usuario);
          }
        })
      );
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    console.log('Ejecutando logout...');
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
      localStorage.removeItem('redirectUrl');
      console.log('localStorage limpiado');
    }
    this.currentUserSubject.next(null);
    console.log('Usuario deslogueado, redirigiendo a login');
    this.router.navigate(['/Login']);
  }

  /**
   * Establecer usuario actual
   */
  private setCurrentUser(user: Usuario): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  /**
   * Verificar si el usuario tiene un permiso específico
   */
  hasPermission(permiso: string): boolean {
    const user = this.getCurrentUser();
    console.log(`Verificando permiso "${permiso}" para usuario:`, user);
    
    if (!user || !user.rol || !user.rol.permisos) {
      return false;
    }
    
    const tienePermiso = user.rol.permisos.includes(permiso);
    return tienePermiso;
  }

  /**
   * Verificar si el usuario tiene alguno de los permisos especificados
   */
  hasAnyPermission(permisos: string[]): boolean {
    return permisos.some(permiso => this.hasPermission(permiso));
  }

  /**
   * Verificar si el usuario tiene todos los permisos especificados
   */
  hasAllPermissions(permisos: string[]): boolean {
    return permisos.every(permiso => this.hasPermission(permiso));
  }

  /**
   * Obtener módulos disponibles para el usuario actual
   */
  getModulosDisponibles(): Modulo[] {
    const user = this.getCurrentUser();
    console.log('Obteniendo módulos para usuario:', user);
    
    if (!user) {
      return [];
    }

    const modulosDisponibles = this.MODULOS_SISTEMA.filter(modulo => {
      const tienePermiso = this.hasAnyPermission(modulo.requierePermisos);
      console.log(`Módulo ${modulo.nombre}: requiere ${modulo.requierePermisos} -> ${tienePermiso}`);
      return tienePermiso;
    });
    
    console.log('Módulos finalmente disponibles:', modulosDisponibles);
    return modulosDisponibles;
  }

  /**
   * Verificar si el usuario puede acceder a un módulo específico
   */
  canAccessModule(moduleId: string): boolean {
    const modulo = this.MODULOS_SISTEMA.find(m => m.id === moduleId);
    if (!modulo) {
      return false;
    }
    return this.hasAnyPermission(modulo.requierePermisos);
  }

  /**
   * Obtener la ruta de inicio según los permisos del usuario
   */
  getDefaultRoute(): string {
    const modulosDisponibles = this.getModulosDisponibles();
    
    // Prioridad: Dashboard > primer módulo disponible > bienvenida
    const dashboardModule = modulosDisponibles.find(m => m.id === 'dashboard');
    if (dashboardModule) {
      return dashboardModule.ruta;
    }

    if (modulosDisponibles.length > 0) {
      return modulosDisponibles[0].ruta;
    }

    return '/Bienvenida';
  }

  /**
   * Obtener todos los módulos del sistema (para administración)
   */
  getAllModules(): Modulo[] {
    return [...this.MODULOS_SISTEMA];
  }
}
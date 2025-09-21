import { Component, EventEmitter, Input, OnInit, Output, OnChanges, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RolConPermisos, Permiso, PermisoConRoles, AsignarPermisosDto, RevocarPermisosDto } from '../models/usuario.interface';
import { RolesService } from '../services/roles.service';
import { PermisosService } from '../services/permisos.service';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-gestionar-permisos-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Modal Backdrop -->
    <div *ngIf="isOpen" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" (click)="onBackdropClick($event)">
      <!-- Modal Content -->
      <div class="relative top-5 mx-auto p-6 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-lg bg-[#1e293b] text-gray-100 max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-[#334155]">
          <h3 class="text-xl font-semibold text-gray-100">
            Gestionar Permisos - {{rol?.nombreRol}}
          </h3>
          <button 
            (click)="cerrarModal()"
            class="text-gray-400 hover:text-gray-200 transition-colors">
            <span class="text-2xl">&times;</span>
          </button>
        </div>

        <!-- Loading -->
        <div *ngIf="cargando" class="text-center py-8">
          <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-blue-400 bg-[#232e47]">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cargando permisos...
          </div>
        </div>

        <!-- Content -->
        <div *ngIf="!cargando && rol" class="mt-6">
          <!-- Información del Rol -->
          <div class="bg-[#232e47] p-4 rounded-lg mb-6">
            <h4 class="text-lg font-medium text-gray-100 mb-2">Información del Rol</h4>
            <p class="text-gray-300"><strong>Nombre:</strong> {{rol.nombreRol}}</p>
            <p class="text-gray-300"><strong>Descripción:</strong> {{rol.descripcion}}</p>
            <p class="text-gray-300"><strong>Permisos actuales:</strong> {{permisosAsignados.length}} de {{todosLosPermisos.length}}</p>
          </div>

          <!-- Filtros y Búsqueda -->
          <div class="mb-6">
            <div class="flex flex-col md:flex-row gap-4">
              <div class="flex-1">
                <input
                  type="text"
                  [(ngModel)]="filtroPermiso"
                  (ngModelChange)="filtrarPermisos()"
                  placeholder="Buscar permisos..."
                  class="w-full px-3 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div class="flex gap-2">
                <button 
                  (click)="filtroEstado = 'todos'; filtrarPermisos()"
                  [class]="filtroEstado === 'todos' ? 'bg-blue-600' : 'bg-gray-600'"
                  class="px-4 py-2 text-white rounded-lg hover:opacity-80 transition-opacity">
                  Todos ({{permisosFiltrados.length}})
                </button>
                <button 
                  (click)="filtroEstado = 'asignados'; filtrarPermisos()"
                  [class]="filtroEstado === 'asignados' ? 'bg-green-600' : 'bg-gray-600'"
                  class="px-4 py-2 text-white rounded-lg hover:opacity-80 transition-opacity">
                  Asignados ({{permisosAsignados.length}})
                </button>
                <button 
                  (click)="filtroEstado = 'disponibles'; filtrarPermisos()"
                  [class]="filtroEstado === 'disponibles' ? 'bg-orange-600' : 'bg-gray-600'"
                  class="px-4 py-2 text-white rounded-lg hover:opacity-80 transition-opacity">
                  Disponibles ({{permisosDisponibles.length}})
                </button>
              </div>
            </div>
          </div>

          <!-- Lista de Permisos -->
          <div class="bg-[#232e47] p-4 rounded-lg">
            <h4 class="text-lg font-medium text-gray-100 mb-4">
              Permisos 
              <span class="text-sm text-gray-400">
                ({{permisosFiltrados.length}} mostrados)
              </span>
            </h4>
            
            <div *ngIf="permisosFiltrados.length === 0" class="text-center py-8 text-gray-400">
              No se encontraron permisos con los filtros aplicados
            </div>

            <div class="grid grid-cols-1 gap-3">
              <div *ngFor="let permiso of permisosFiltrados" 
                   class="flex items-center justify-between bg-[#1e293b] p-4 rounded-lg border border-[#334155]">
                <div class="flex items-center space-x-3">
                  <div [class]="tienePermiso(permiso.idPermisos) ? 'text-green-400' : 'text-gray-400'">
                    {{tienePermiso(permiso.idPermisos) ? '✅' : '🔐'}}
                  </div>
                  <div>
                    <h5 class="font-medium text-gray-100">{{permiso.permiso}}</h5>
                    <p class="text-sm text-gray-400">{{permiso.descripcion}}</p>
                  </div>
                </div>
                <div class="flex space-x-2">
                  <button 
                    *ngIf="!tienePermiso(permiso.idPermisos)"
                    (click)="asignarPermiso(permiso)"
                    [disabled]="guardando"
                    class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors disabled:opacity-50">
                    Asignar
                  </button>
                  <button 
                    *ngIf="tienePermiso(permiso.idPermisos)"
                    (click)="revocarPermiso(permiso)"
                    [disabled]="guardando"
                    class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors disabled:opacity-50">
                    Revocar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Acciones rápidas -->
          <div class="mt-6 flex flex-col md:flex-row gap-4">
            <button 
              (click)="asignarTodosLosPermisos()"
              [disabled]="guardando || permisosDisponibles.length === 0"
              class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Asignar Todos los Permisos Disponibles
            </button>
            <button 
              (click)="revocarTodosLosPermisos()"
              [disabled]="guardando || permisosAsignados.length === 0"
              class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Revocar Todos los Permisos
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end mt-6 pt-4 border-t border-[#334155]">
          <button 
            (click)="cerrarModal()"
            class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class GestionarPermisosModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() rol: RolConPermisos | null = null;
  @Output() cerrar = new EventEmitter<void>();
  @Output() permisosActualizados = new EventEmitter<RolConPermisos>();

  todosLosPermisos: PermisoConRoles[] = [];
  permisosAsignados: PermisoConRoles[] = [];
  permisosDisponibles: PermisoConRoles[] = [];
  permisosFiltrados: PermisoConRoles[] = [];
  
  filtroPermiso = '';
  filtroEstado: 'todos' | 'asignados' | 'disponibles' = 'todos';
  cargando = false;
  guardando = false;

  constructor(
    private rolesService: RolesService,
    private permisosService: PermisosService,
    private sweetAlert: SweetAlertService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {}

  ngOnChanges() {
    
    if (isPlatformBrowser(this.platformId)) {
    }
    
    if (this.isOpen && this.rol) {
      if (isPlatformBrowser(this.platformId)) {
        setTimeout(() => {
          const modalElement = document.querySelector('.fixed.inset-0.bg-gray-600');
          if (modalElement) {

          }
        }, 100);
      }
      
      this.cargarDatos();
    }
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.cerrarModal();
    }
  }

  cerrarModal() {
    this.isOpen = false;
    this.cerrar.emit();
  }

  async cargarDatos() {
    this.cargando = true;
    try {
      
      // Cargar todos los permisos disponibles
      const permisosResponse = await this.permisosService.findAll().toPromise();
      
      if (permisosResponse?.success) {
        this.todosLosPermisos = permisosResponse.data;
      }

      this.calcularEstadosPermisos();
      this.filtrarPermisos();
      
    } catch (error) {
      console.error('Error al cargar permisos:', error);
    } finally {
      this.cargando = false;
    }
  }

  calcularEstadosPermisos() {
    if (!this.rol || !this.todosLosPermisos) {
      console.log('No hay rol o permisos para calcular estados');
      return;
    }
    const idsPermisosAsignados = (this.rol && this.rol.RolPermisos)
      ? this.rol.RolPermisos.map(rp => rp.Permisos.idPermisos)
      : [];

    
    this.permisosAsignados = this.todosLosPermisos.filter(p => 
      idsPermisosAsignados.includes(p.idPermisos)
    );
    
    this.permisosDisponibles = this.todosLosPermisos.filter(p => 
      !idsPermisosAsignados.includes(p.idPermisos)
    );

  }

  filtrarPermisos() {
    let permisos: PermisoConRoles[] = [];

    switch (this.filtroEstado) {
      case 'asignados':
        permisos = this.permisosAsignados;
        break;
      case 'disponibles':
        permisos = this.permisosDisponibles;
        break;
      default:
        permisos = this.todosLosPermisos;
    }

    if (this.filtroPermiso.trim()) {
      const filtro = this.filtroPermiso.toLowerCase();
      permisos = permisos.filter(p => 
        p.permiso.toLowerCase().includes(filtro) ||
        p.descripcion.toLowerCase().includes(filtro)
      );
    }

    this.permisosFiltrados = permisos;
  }

  tienePermiso(idPermiso: number): boolean {
  return !!(this.rol && this.rol.RolPermisos && this.rol.RolPermisos.some(rp => rp.Permisos.idPermisos === idPermiso));
  }

  async asignarPermiso(permiso: PermisoConRoles) {
    if (!this.rol) return;

    this.guardando = true;
    try {
      const dto = {
        permisos: [permiso.idPermisos]
      };

      const response = await this.rolesService.asignarPermisos(this.rol.idRoles, dto).toPromise();
      
      if (response?.success) {
        this.rol = response.data;
        this.calcularEstadosPermisos();
        this.filtrarPermisos();
        this.permisosActualizados.emit(this.rol);
        // Mostrar alerta de éxito
        this.sweetAlert.toast('success', `Permiso "${permiso.permiso}" asignado exitosamente`);
      } else {
        this.sweetAlert.error('Error', response?.message || 'Respuesta inesperada del servidor');
      }
    } catch (error: any) {
      
      const errorMessage = error.error?.message || error.message || 'Error desconocido';
      this.sweetAlert.error('Error al asignar permiso', errorMessage);
    } finally {
      this.guardando = false;
    }
  }

  async revocarPermiso(permiso: PermisoConRoles) {
    if (!this.rol) return;

    const confirmed = await this.sweetAlert.confirm(
      '¿Revocar permiso?',
      `¿Estás seguro de que deseas revocar el permiso "${permiso.permiso}" del rol "${this.rol.nombreRol}"?`,
      'Sí, revocar'
    );

    if (!confirmed) return;

    this.guardando = true;
    try {
      const dto = {
        permisos: [permiso.idPermisos]
      };

      const response = await this.rolesService.revocarPermisos(this.rol.idRoles, dto).toPromise();
      if (response?.success) {
        this.rol = response.data;
        this.calcularEstadosPermisos();
        this.filtrarPermisos();
        this.permisosActualizados.emit(this.rol);
        
        this.sweetAlert.toast('success', `Permiso "${permiso.permiso}" revocado exitosamente`);
      }
    } catch (error: any) {
      console.error('Error al revocar permiso:', error);
      const errorMessage = error.error?.message || error.message || 'Error desconocido';
      this.sweetAlert.error('Error al revocar permiso', errorMessage);
    } finally {
      this.guardando = false;
    }
  }

  async asignarTodosLosPermisos() {
    if (!this.rol || this.permisosDisponibles.length === 0) return;

    const confirmed = await this.sweetAlert.confirm(
      'Asignar todos los permisos',
      `¿Está seguro de asignar todos los ${this.permisosDisponibles.length} permisos disponibles al rol "${this.rol.nombreRol}"?`,
      'Sí, asignar todos'
    );

    if (!confirmed) return;

    this.guardando = true;
    try {
      const dto = {
        permisos: this.permisosDisponibles.map(p => p.idPermisos)
      };

      const response = await this.rolesService.asignarPermisos(this.rol.idRoles, dto).toPromise();
      if (response?.success) {
        this.rol = response.data;
        this.calcularEstadosPermisos();
        this.filtrarPermisos();
        this.permisosActualizados.emit(this.rol);
        
        this.sweetAlert.success(
          '¡Permisos asignados!',
          `Se asignaron ${dto.permisos.length} permisos al rol "${this.rol.nombreRol}" exitosamente`
        );
      }
    } catch (error: any) {
      console.error('Error al asignar todos los permisos:', error);
      const errorMessage = error.error?.message || error.message || 'Error desconocido';
      this.sweetAlert.error('Error al asignar permisos', errorMessage);
    } finally {
      this.guardando = false;
    }
  }

  async revocarTodosLosPermisos() {
    if (!this.rol || this.permisosAsignados.length === 0) return;

    const confirmed = await this.sweetAlert.confirmDelete(
      `todos los ${this.permisosAsignados.length} permisos del rol "${this.rol.nombreRol}"`
    );

    if (!confirmed) return;

    this.guardando = true;
    try {
      const dto = {
        permisos: this.permisosAsignados.map(p => p.idPermisos)
      };

      const response = await this.rolesService.revocarPermisos(this.rol.idRoles, dto).toPromise();
      if (response?.success) {
        this.rol = response.data;
        this.calcularEstadosPermisos();
        this.filtrarPermisos();
        this.permisosActualizados.emit(this.rol);
        
        this.sweetAlert.success(
          '¡Permisos revocados!',
          `Se revocaron ${dto.permisos.length} permisos del rol "${this.rol.nombreRol}" exitosamente`
        );
      }
    } catch (error: any) {
      console.error(' Error al revocar todos los permisos:', error);
      const errorMessage = error.error?.message || error.message || 'Error desconocido';
      this.sweetAlert.error('Error al revocar permisos', errorMessage);
    } finally {
      this.guardando = false;
    }
  }
}
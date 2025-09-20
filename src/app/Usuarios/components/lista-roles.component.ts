import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RolesService } from '../services/roles.service';
import { RolConPermisos } from '../models/usuario.interface';
import { RolModalComponent } from './rol-modal.component';
import { GestionarPermisosModalComponent } from './gestionar-permisos-modal.component';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-lista-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, RolModalComponent, GestionarPermisosModalComponent],
  template: `
    <div class=" min-h-screen">
      <div class="p-6">
        <!-- Header -->
        <div class="p-6">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold text-gray-100">Gestión de Roles</h2>
            <button 
              (click)="abrirModalCrear()"
              class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors duration-200 border border-blue-500">
              <span class="text-lg"></span>
              Nuevo Rol
            </button>
          </div>
        </div>

        <!-- Filtros -->
        <div class="bg-[#1e293b] rounded-md shadow overflow-hidden mb-6 p-6 ">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Buscar</label>
              <input
                type="text"
                [(ngModel)]="filtro.busqueda"
                (ngModelChange)="aplicarFiltros()"
                placeholder="Nombre o descripción del rol..."
                class="w-full px-3 py-2 bg-[#232e47] border border-[#334155] rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Permisos</label>
              <select
                [(ngModel)]="filtro.tienePermisos"
                (ngModelChange)="aplicarFiltros()"
                class="w-full px-3 py-2 bg-[#232e47] border border-[#334155] rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Todos</option>
                <option value="true">Con permisos</option>
                <option value="false">Sin permisos</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div *ngIf="cargando" class="p-8 text-center">
          <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-blue-400 bg-[#232e47]">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cargando roles...
          </div>
        </div>

        <!-- Tabla -->
        <div *ngIf="!cargando" class="overflow-x-auto">
          <table class="bg-[#1e293b] rounded-lg shadow overflow-hidden w-full">
            <thead class="bg-[#232e47]">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rol</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Descripción</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Permisos</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Usuarios</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-[#1e293b] divide-y divide-[#334155]">
              <tr *ngFor="let rol of rolesFiltrados" class="hover:bg-[#334155] transition-colors duration-200">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-blue-600 bg-opacity-20 flex items-center justify-center">
                        <span class="text-blue-400">X</span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-100">{{rol.nombreRol}}</div>
                      <div class="text-sm text-gray-400">ID: {{rol.idRoles}}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-200">{{rol.descripcion}}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex flex-wrap gap-1">
                    <span 
                      *ngFor="let rolPermiso of rol.RolPermisos?.slice(0, 3)" 
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-600 bg-opacity-20 text-green-400">
                      {{rolPermiso.Permisos?.permiso}}
                    </span>
                    <span 
                      *ngIf="(rol.RolPermisos?.length || 0) > 3" 
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-600 bg-opacity-20 text-gray-300">
                      +{{(rol.RolPermisos?.length || 0) - 3}} más
                    </span>
                    <span 
                      *ngIf="!rol.RolPermisos || rol.RolPermisos.length === 0" 
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-600 bg-opacity-20 text-red-400">
                      Sin permisos
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-600 bg-opacity-20 text-purple-400">
                    {{rol.Usuarios?.length || 0}} usuarios
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end space-x-2">
                    <button 
                      (click)="verDetalles(rol)"
                      class="text-blue-400 hover:text-blue-300 transition-colors duration-200 px-3 py-1"
                      title="Ver detalles">
                      <svg
                      class="w-6 h-6 stroke-yellow-400 hover:stroke-blue-900"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                      />
                      <path d="M12 18c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
                      <path d="M19.001 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                      <path d="M19.001 15.5v1.5" />
                      <path d="M19.001 21v1.5" />
                      <path d="M22.032 17.25l-1.299 .75" />
                      <path d="M17.27 20l-1.3 .75" />
                      <path d="M15.97 17.25l1.3 .75" />
                      <path d="M20.733 20l1.3 .75" />
                    </svg>
                    </button>
                    <button 
                      (click)="gestionarPermisos(rol)"
                      class="text-green-400 hover:text-green-300 transition-colors duration-200 px-3 py-1 rounded-md"
                      title="Gestionar permisos">
                      <svg
                      class="w-6 h-6 stroke-green-400 hover:stroke-blue-900"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                      />
                     <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
                     <path d="M6 21v-2a4 4 0 0 1 4 -4h4" />
                     <path d="M15 19l2 2l4 -4" />

                    </svg>
                    </button>
                    <button 
                      (click)="editarRol(rol)"
                      class="text-indigo-400 hover:text-indigo-300 transition-colors duration-200 px-3 py-1"
                      title="Editar">
                      <svg
                      class="w-6 h-6 stroke-blue-400 hover:stroke-blue-900"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4"
                      />
                      <path d="M13.5 6.5l4 4" />
                      <path d="M16 19h6" />
                      <path d="M19 16v6" />
                    </svg>
                    </button>
                    <button 
                      (click)="eliminarRol(rol)"
                      class="text-red-400 hover:text-red-300 transition-colors duration-200 disabled:text-gray-600 disabled:cursor-not-allowed px-3 py-1"
                      title="Eliminar"
                      [disabled]="(rol.Usuarios?.length || 0) > 0">
                      <svg
                      class="w-6 h-6 stroke-red-600 hover:stroke-red-900"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M4 7h16" />
                      <path
                        d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"
                      />
                      <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                      <path d="M10 12l4 4m0 -4l-4 4" />
                    </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mensaje sin datos -->
        <div *ngIf="!cargando && rolesFiltrados.length === 0" class="p-8 text-center">
          <div class="text-gray-400">
            <p class="text-lg">No se encontraron roles</p>
            <p class="text-sm">Prueba ajustando los filtros o crea un nuevo rol</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Rol -->
    <app-rol-modal
      [isOpen]="mostrarModal"
      [rol]="rolSeleccionado"
      (modalClosed)="cerrarModal()"
      (rolGuardado)="onRolGuardado($event)">
    </app-rol-modal>

    <!-- Modal de Gestión de Permisos -->
    <app-gestionar-permisos-modal
      [isOpen]="mostrarModalPermisos"
      [rol]="rolParaPermisos"
      (cerrar)="cerrarModalPermisos()"
      (permisosActualizados)="onPermisosActualizados($event)">
    </app-gestionar-permisos-modal>
  `,
  styles: []
})
export class ListaRolesComponent implements OnInit {
  roles: RolConPermisos[] = [];
  rolesFiltrados: RolConPermisos[] = [];
  cargando = false;

  // Variables para el modal de rol
  mostrarModal = false;
  rolSeleccionado: RolConPermisos | null = null;

  // Variables para el modal de permisos
  mostrarModalPermisos = false;
  rolParaPermisos: RolConPermisos | null = null;

  filtro = {
    busqueda: '',
    tienePermisos: ''
  };

  constructor(
    private rolesService: RolesService,
    private sweetAlert: SweetAlertService
  ) {}

  ngOnInit() {
    this.cargarRoles();
  }

  cargarRoles() {
    this.cargando = true;
    this.rolesService.findAll().subscribe({
      next: (response) => {
        if (response.success) {
          this.roles = response.data;
          this.rolesFiltrados = [...this.roles];
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar roles:', error);
        this.cargando = false;
      }
    });
  }

  aplicarFiltros() {
    this.rolesFiltrados = this.roles.filter(rol => {
      const coincideBusqueda = !this.filtro.busqueda || 
        rol.nombreRol.toLowerCase().includes(this.filtro.busqueda.toLowerCase()) ||
        rol.descripcion.toLowerCase().includes(this.filtro.busqueda.toLowerCase());

      const tienePermisos = (rol.RolPermisos?.length || 0) > 0;
      const coincidePermisos = !this.filtro.tienePermisos || 
        (this.filtro.tienePermisos === 'true' && tienePermisos) ||
        (this.filtro.tienePermisos === 'false' && !tienePermisos);

      return coincideBusqueda && coincidePermisos;
    });
  }

  abrirModalCrear() {
    this.rolSeleccionado = null;
    this.mostrarModal = true;
  }

  verDetalles(rol: RolConPermisos) {
    console.log('Ver detalles del rol:', rol);
    
    // Crear lista de permisos en texto plano
    const permisosList = rol.RolPermisos && rol.RolPermisos.length > 0 
      ? rol.RolPermisos.map(rp => `• ${rp.Permisos?.permiso}`).join('\n')
      : 'Sin permisos asignados';
    
    // Crear contenido del modal en HTML válido
    const contenido = `
      <div style="text-align: left; font-family: Arial, sans-serif;">
        <p style="margin: 8px 0;"><strong>Descripción:</strong> ${rol.descripcion || 'Sin descripción'}</p>
        <p style="margin: 8px 0;"><strong>Usuarios asignados:</strong> ${rol.Usuarios?.length || 0}</p>
        <p style="margin: 8px 0;"><strong>Permisos asignados:</strong> ${rol.RolPermisos?.length || 0}</p>
        <br>
        <div style="max-height: 200px; overflow-y: auto; padding: 12px; ">
          <strong style="color: #495057;">Lista de permisos:</strong><br><br>
          <div style="white-space: pre-line; margin: 0; color: #495057; font-size: 14px;">${permisosList}</div>
        </div>
      </div>
    `;
    
    this.sweetAlert.info(`Detalles del rol: ${rol.nombreRol}`, contenido);
  }

  gestionarPermisos(rol: RolConPermisos) {
    this.rolParaPermisos = rol;
    this.mostrarModalPermisos = true;
  }

  cerrarModalPermisos() {
    this.mostrarModalPermisos = false;
    this.rolParaPermisos = null;
  }

  onPermisosActualizados(rolActualizado: RolConPermisos) {
    // Actualizar el rol en la lista
    const index = this.roles.findIndex(r => r.idRoles === rolActualizado.idRoles);
    if (index !== -1) {
      this.roles[index] = rolActualizado;
      this.aplicarFiltros();
    }
  }

  editarRol(rol: RolConPermisos) {
    this.rolSeleccionado = rol;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.rolSeleccionado = null;
  }

  onRolGuardado(rol: RolConPermisos) {
    this.cargarRoles(); // Recargar la lista
  }

  async eliminarRol(rol: RolConPermisos) {
    if ((rol.Usuarios?.length || 0) > 0) {
      this.sweetAlert.warning(
        'No se puede eliminar',
        'No se puede eliminar un rol que tiene usuarios asignados'
      );
      return;
    }

    const confirmed = await this.sweetAlert.confirmDelete(
      `el rol "${rol.nombreRol}"`
    );

    if (confirmed) {
      this.rolesService.delete(rol.idRoles).subscribe({
        next: (response) => {
          if (response.success) {
            this.cargarRoles(); // Recargar la lista
            this.sweetAlert.success('¡Rol eliminado!', `El rol "${rol.nombreRol}" se eliminó exitosamente`);
            console.log('Rol eliminado exitosamente');
          }
        },
        error: (error) => {
          console.error('Error al eliminar rol:', error);
          const errorMessage = error.error?.message || error.message || 'Error desconocido';
          this.sweetAlert.error('Error al eliminar rol', errorMessage);
        }
      });
    }
  }
}
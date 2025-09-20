import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermisosService } from '../services/permisos.service';
import { PermisoConRoles } from '../models/usuario.interface';
import { PermisoModalComponent } from './permiso-modal.component';

@Component({
  selector: 'app-lista-permisos',
  standalone: true,
  imports: [CommonModule, FormsModule, PermisoModalComponent],
  template: `
    <div class="bg-[#1e293b] min-h-screen">
      <div class="p-6">
        <!-- Header -->
        <div class="border-b border-[#334155] p-6">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold text-gray-100">Gestión de Permisos</h2>
            <button 
              (click)="abrirModalCrear()"
              class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors duration-200 border border-blue-500">
              <span class="text-lg"></span>
              Nuevo Permiso
            </button>
          </div>
        </div>

        <!-- Filtros -->
        <div class="p-6 border-b border-[#334155]">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Buscar</label>
              <input
                type="text"
                [(ngModel)]="filtro.busqueda"
                (ngModelChange)="aplicarFiltros()"
                placeholder="Nombre del permiso..."
                class="w-full px-3 py-2 bg-[#232e47] border border-[#334155] rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Asignación</label>
              <select
                [(ngModel)]="filtro.asignado"
                (ngModelChange)="aplicarFiltros()"
                class="w-full px-3 py-2 bg-[#232e47] border border-[#334155] rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Todos</option>
                <option value="true">Asignado a roles</option>
                <option value="false">Sin asignar</option>
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
            Cargando permisos...
          </div>
        </div>

        <!-- Grid de permisos -->
        <div *ngIf="!cargando" class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div 
              *ngFor="let permiso of permisosFiltrados" 
              class="bg-[#232e47] border border-[#334155] rounded-lg p-4 hover:bg-[#2a3f5a] transition-colors duration-200">
              
              <!-- Header del permiso -->
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-8 w-8">
                    <div class="h-8 w-8 rounded-full bg-green-600 bg-opacity-20 flex items-center justify-center">
                      <span class="text-green-400 text-sm">X</span>
                    </div>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-gray-100">{{permiso.permiso}}</h3>
                    <p class="text-xs text-gray-400">ID: {{permiso.idPermisos}}</p>
                  </div>
                </div>
                
                <!-- Menú de acciones -->
                <div class="flex space-x-1">
                  <button 
                    (click)="editarPermiso(permiso)"
                    class="text-indigo-400 hover:text-indigo-300 p-2 transition-colors duration-200 "
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
                    (click)="eliminarPermiso(permiso)"
                    class="text-red-400 hover:text-red-300 p-2 transition-colors duration-200 disabled:text-gray-600 disabled:cursor-not-allowed rounded-md "
                    title="Eliminar"
                    [disabled]="(permiso.RolPermisos?.length || 0) > 0">
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
              </div>

              <!-- Roles asignados -->
              <div class="mb-3">
                <div class="text-xs font-medium text-gray-300 mb-2">Roles con este permiso:</div>
                <div *ngIf="permiso.RolPermisos && permiso.RolPermisos.length > 0" class="flex flex-wrap gap-1">
                  <span 
                    *ngFor="let rolPermiso of permiso.RolPermisos.slice(0, 2)" 
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 bg-opacity-20 text-blue-400">
                    {{rolPermiso.Roles?.nombreRol}}
                  </span>
                  <span 
                    *ngIf="permiso.RolPermisos.length > 2" 
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-600 bg-opacity-20 text-gray-300">
                    +{{permiso.RolPermisos.length - 2}} más
                  </span>
                </div>
                <div *ngIf="!permiso.RolPermisos || permiso.RolPermisos.length === 0">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-600 bg-opacity-20 text-yellow-400">
                    Sin asignar
                  </span>
                </div>
              </div>

              <!-- Estadísticas -->
              <div class="border-t border-[#334155] pt-3">
                <div class="flex justify-between text-xs text-gray-400">
                  <span>Roles:</span>
                  <span class="font-medium text-gray-200">{{permiso.RolPermisos?.length || 0}}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mensaje sin datos -->
        <div *ngIf="!cargando && permisosFiltrados.length === 0" class="p-8 text-center">
          <div class="text-gray-400">
            <span class="text-4xl mb-4 block">X</span>
            <p class="text-lg">No se encontraron permisos</p>
            <p class="text-sm">Prueba ajustando los filtros o crea un nuevo permiso</p>
          </div>
        </div>

        <!-- Paginación -->
        <div *ngIf="!cargando && permisosFiltrados.length > 0" class="px-6 py-3 border-t border-[#334155]">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-300">
              Mostrando {{permisosFiltrados.length}} de {{permisos.length}} permisos
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Permiso -->
    <app-permiso-modal
      [isOpen]="mostrarModal"
      [permiso]="permisoSeleccionado"
      (modalClosed)="cerrarModal()"
      (permisoGuardado)="onPermisoGuardado($event)">
    </app-permiso-modal>
  `,
  styles: []
})
export class ListaPermisosComponent implements OnInit {
  permisos: PermisoConRoles[] = [];
  permisosFiltrados: PermisoConRoles[] = [];
  cargando = false;

  // Variables para el modal
  mostrarModal = false;
  permisoSeleccionado: PermisoConRoles | null = null;

  filtro = {
    busqueda: '',
    asignado: ''
  };

  constructor(private permisosService: PermisosService) {}

  ngOnInit() {
    this.cargarPermisos();
  }

  cargarPermisos() {
    this.cargando = true;
    this.permisosService.findAll().subscribe({
      next: (response) => {
        if (response.success) {
          this.permisos = response.data;
          this.permisosFiltrados = [...this.permisos];
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar permisos:', error);
        this.cargando = false;
      }
    });
  }

  aplicarFiltros() {
    this.permisosFiltrados = this.permisos.filter(permiso => {
      const coincideBusqueda = !this.filtro.busqueda || 
        permiso.permiso.toLowerCase().includes(this.filtro.busqueda.toLowerCase());

      const tieneRoles = (permiso.RolPermisos?.length || 0) > 0;
      const coincideAsignacion = !this.filtro.asignado || 
        (this.filtro.asignado === 'true' && tieneRoles) ||
        (this.filtro.asignado === 'false' && !tieneRoles);

      return coincideBusqueda && coincideAsignacion;
    });
  }

  abrirModalCrear() {
    this.permisoSeleccionado = null;
    this.mostrarModal = true;
  }

  editarPermiso(permiso: PermisoConRoles) {
    this.permisoSeleccionado = permiso;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.permisoSeleccionado = null;
  }

  onPermisoGuardado(permiso: PermisoConRoles) {
    this.cargarPermisos(); // Recargar la lista
  }

  eliminarPermiso(permiso: PermisoConRoles) {
    if ((permiso.RolPermisos?.length || 0) > 0) {
      alert('No se puede eliminar un permiso que está asignado a roles');
      return;
    }

    if (confirm(`¿Estás seguro de que deseas eliminar el permiso "${permiso.permiso}"?`)) {
      this.permisosService.delete(permiso.idPermisos).subscribe({
        next: (response) => {
          if (response.success) {
            this.cargarPermisos(); // Recargar la lista
            console.log('Permiso eliminado exitosamente');
          }
        },
        error: (error) => {
          console.error('Error al eliminar permiso:', error);
        }
      });
    }
  }
}
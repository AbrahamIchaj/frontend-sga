import { Component, EventEmitter, Input, OnInit, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Usuario } from '../models/usuario.interface';
import { RolesService } from '../services/roles.service';

@Component({
  selector: 'app-usuario-detalle-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Modal Backdrop -->
    <div *ngIf="isOpen" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" (click)="onBackdropClick($event)">
      <!-- Modal Content -->
      <div class="relative top-10 mx-auto p-6 w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-lg bg-[#1e293b] text-gray-100">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-[#334155]">
          <h3 class="text-xl font-semibold text-gray-100">
            Detalles del Usuario
          </h3>
          <button 
            (click)="cerrarModal()"
            class="text-gray-400 hover:text-gray-200 transition-colors">
            <span class="text-2xl">&times;</span>
          </button>
        </div>

        <!-- Content -->
        <div *ngIf="usuario" class="mt-6">
          <!-- Información Personal -->
          <div class="bg-[#232e47] p-4 rounded-lg mb-6">
            <h4 class="text-lg font-medium text-gray-100 mb-4 flex items-center">
              👤 Información Personal
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Nombres</label>
                <p class="text-gray-100 bg-[#1e293b] p-2 rounded border border-[#334155]">{{usuario.nombres}}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Apellidos</label>
                <p class="text-gray-100 bg-[#1e293b] p-2 rounded border border-[#334155]">{{usuario.apellidos}}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Correo Electrónico</label>
                <p class="text-gray-100 bg-[#1e293b] p-2 rounded border border-[#334155]">{{usuario.correo}}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Teléfono</label>
                <p class="text-gray-100 bg-[#1e293b] p-2 rounded border border-[#334155]">{{usuario.telefono || 'No especificado'}}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Estado</label>
                <span [class]="usuario.activo ? 'bg-green-600' : 'bg-red-600'" 
                      class="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white">
                  {{usuario.activo ? 'Activo' : 'Inactivo'}}
                </span>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Fecha de Registro</label>
                <p class="text-gray-100 bg-[#1e293b] p-2 rounded border border-[#334155]">
                  {{usuario.fechaCreacion | date:'dd/MM/yyyy HH:mm'}}
                </p>
              </div>
            </div>
          </div>

          <!-- Información del Rol -->
          <div class="bg-[#232e47] p-4 rounded-lg mb-6">
            <h4 class="text-lg font-medium text-gray-100 mb-4 flex items-center">
              🛡️ Rol Asignado
            </h4>
            <div *ngIf="usuario.Roles" class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Nombre del Rol</label>
                <p class="text-gray-100 bg-[#1e293b] p-2 rounded border border-[#334155] font-medium">
                  {{usuario.Roles.nombreRol}}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
                <p class="text-gray-100 bg-[#1e293b] p-2 rounded border border-[#334155]">
                  {{usuario.Roles.descripcion}}
                </p>
              </div>
            </div>
            <div *ngIf="!usuario.Roles" class="text-yellow-400">
              ⚠️ No se encontró información del rol
            </div>
          </div>

          <!-- Permisos del Rol -->
          <div class="bg-[#232e47] p-4 rounded-lg">
            <h4 class="text-lg font-medium text-gray-100 mb-4 flex items-center">
              🔐 Permisos Asignados
            </h4>
            
            <!-- Loading de permisos -->
            <div *ngIf="cargandoPermisos" class="text-center py-4">
              <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-blue-400 bg-[#1e293b]">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cargando permisos...
              </div>
            </div>

            <!-- Lista de permisos -->
            <div *ngIf="!cargandoPermisos && permisosDelRol && permisosDelRol.length > 0" class="space-y-2">
              <div *ngFor="let permiso of permisosDelRol" 
                   class="flex items-center justify-between bg-[#1e293b] p-3 rounded border border-[#334155]">
                <div class="flex items-center space-x-3">
                  <span class="text-blue-400">🔑</span>
                  <div>
                    <p class="font-medium text-gray-100">{{permiso.permiso || 'Sin nombre'}}</p>
                    <p class="text-sm text-gray-400">{{permiso.descripcion || 'Sin descripción'}}</p>
                  </div>
                </div>
                <span class="text-green-400 text-sm font-medium">
                  ✅ Activo
                </span>
              </div>
            </div>

            <!-- Mensaje sin permisos -->
            <div *ngIf="!cargandoPermisos && (!permisosDelRol || permisosDelRol.length === 0)" 
                 class="text-yellow-400 text-center py-4">
              Este rol no tiene permisos asignados
            </div>
          </div>

          <!-- Renglones Permitidos -->
          <div class="bg-[#232e47] p-4 rounded-lg mt-6">
            <h4 class="text-lg font-medium text-gray-100 mb-4 flex items-center gap-2">
              🗂️ Renglones permitidos
            </h4>
            <ng-container *ngIf="usuario?.renglonesPermitidos?.length; else sinRenglones">
              <div class="flex flex-wrap gap-2">
                <span
                  *ngFor="let renglon of usuario?.renglonesPermitidos"
                  class="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-sm font-semibold text-blue-200"
                >
                  Renglón {{ renglon }}
                </span>
              </div>
            </ng-container>
            <ng-template #sinRenglones>
              <p class="text-sm text-gray-400">
                No hay renglones asignados para este usuario.
              </p>
            </ng-template>
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
export class UsuarioDetalleModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() usuario: Usuario | null = null;
  @Output() cerrar = new EventEmitter<void>();

  permisosDelRol: any[] = [];
  cargandoPermisos = false;

  constructor(private rolesService: RolesService) {}

  ngOnInit() {}

  ngOnChanges() {
    if (this.isOpen && this.usuario && this.usuario.Roles && this.usuario.Roles.idRoles) {
      this.cargarPermisosDelRol();
    }
  }

  async cargarPermisosDelRol() {
  if (!this.usuario || !this.usuario.Roles || !this.usuario.Roles.idRoles) return;

    this.cargandoPermisos = true;
    try {
  const response = await this.rolesService.getPermisos(this.usuario.Roles.idRoles).toPromise();
      if (response?.success) {
        this.permisosDelRol = response.data;
      }
    } catch (error) {
      this.permisosDelRol = [];
    } finally {
      this.cargandoPermisos = false;
    }
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.cerrarModal();
    }
  }

  cerrarModal() {
    this.cerrar.emit();
  }
}
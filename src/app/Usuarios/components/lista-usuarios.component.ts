import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../services/usuarios.service';
import { Usuario } from '../models/usuario.interface';
import { UsuarioModalComponent } from './usuario-modal.component';
import { PasswordTemporalModalComponent } from './password-temporal-modal.component';
import { UsuarioDetalleModalComponent } from './usuario-detalle-modal.component';
import { UsuarioRenglonesModalComponent } from './usuario-renglones-modal.component';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UsuarioModalComponent,
    PasswordTemporalModalComponent,
    UsuarioDetalleModalComponent,
    UsuarioRenglonesModalComponent,
  ],
  template: `
    <div class="">
      <!-- Header -->
      <!-- Filtros -->
      <div
        class="p-6 mb-6 border border-gray-700 bg-gray-800 shadow-lg rounded-xl "
      >
        <h1 class="text-lg font-bold text-heading ">
          GESTIÓN DE USUARIOS
          <span class="text-lg mx-2 text-gray-400 gap-4 mb-4">|</span>
          <svg
            class="inline w-5 h-5 align-middle"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            ></path>
          </svg>
          Filtros de Búsqueda
        </h1>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <!-- Búsqueda general -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1"
              >Buscar</label
            >
            <input
              type="text"
              [(ngModel)]="filtro.busqueda"
              (ngModelChange)="aplicarFiltros()"
              placeholder="Nombre, apellido o correo..."
              class="w-full px-3 py-2 bg-[#232e47] border border-[#334155] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
            />
          </div>

          <!-- Filtro por estado -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1"
              >Estado</label
            >
            <select
              [(ngModel)]="filtro.estado"
              (ngModelChange)="aplicarFiltros()"
              class="w-full px-3 py-2 bg-[#232e47] border border-[#334155] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            >
              <option value="">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>

          <!-- Filtro por rol -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1"
              >Rol</label
            >
            <select
              [(ngModel)]="filtro.rol"
              (ngModelChange)="aplicarFiltros()"
              class="w-full px-3 py-2 bg-[#232e47] border border-[#334155] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            >
              <option value="">Todos los roles</option>
              <option
                *ngFor="let rol of rolesDisponibles"
                [value]="rol.idRoles"
              >
                {{ rol.nombreRol }}
              </option>
            </select>
          </div>
        </div>
        <button
          (click)="abrirModalCrear()"
          class="inline-flex items-center justify-start border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white px-4 py-2 rounded-xl"
        >
          <i class="fas fa-plus mr-2"></i>
          Nuevo Usuario
        </button>
      </div>

      <!-- Tabla -->
      <div class="bg-[#1e293b] rounded-lg shadow overflow-hidden">
        <!-- Loading -->
        <div *ngIf="cargando" class="p-8 text-center">
          <p class="text-gray-400">Cargando usuarios...</p>
        </div>

        <!-- Tabla con datos -->
        <div *ngIf="!cargando" class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-[#232e47]">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Usuario
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Correo
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Rol
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Estado
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Último Acceso
                </th>
                <th
                  class="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-[#1e293b] divide-y divide-[#334155]">
              <tr
                *ngFor="let usuario of usuariosFiltrados"
                class="hover:bg-[#232e47]"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div
                        class="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center"
                      >
                        <span class="text-sm font-medium text-gray-200">{{
                          getIniciales(usuario.nombres, usuario.apellidos)
                        }}</span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-100">
                        {{ usuario.nombres }} {{ usuario.apellidos }}
                      </div>
                      <div class="text-sm text-gray-400">
                        ID: {{ usuario.idUsuario }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                  {{ usuario.correo }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {{ usuario.Roles ? usuario.Roles.nombreRol : 'Sin rol' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      [class]="getEstadoClases(usuario.activo)"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    >
                      {{ usuario.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                    <span
                      *ngIf="usuario.esTemporal"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                    >
                      <i class="fas fa-key mr-1"></i>
                      Contraseña temporal
                    </span>
                    <span
                      *ngIf="usuario.debesCambiarPassword"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                    >
                      <i class="fas fa-exclamation-triangle mr-1"></i>
                      Debe cambiar password
                    </span>
                    <div class="pt-1 text-xs">
                      <ng-container
                        *ngIf="
                          usuario.renglonesPermitidos?.length;
                          else sinRenglones
                        "
                      >
                        <span class="text-gray-300 font-semibold"
                          >Renglones:</span
                        >
                        <ng-container
                          *ngFor="
                            let renglon of usuario.renglonesPermitidos
                              | slice : 0 : 1
                          "
                        >
                          <span
                            class="ml-1 inline-flex items-center px-2 py-0.5 rounded-full bg-orange-300/20 text-orange-600"
                          >
                            R{{ renglon }}
                          </span>
                        </ng-container>
                        <span
                          *ngIf="
                            usuario.renglonesPermitidos &&
                            usuario.renglonesPermitidos.length > 4
                          "
                          class="ml-2 text-gray-500"
                        >
                          +{{ usuario.renglonesPermitidos.length - 4 }} más
                        </span>
                      </ng-container>
                      <ng-template #sinRenglones>
                        <span class="text-gray-500 italic"
                          >Sin renglones asignados</span
                        >
                      </ng-template>
                    </div>
                 
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {{ formatearFecha(usuario.ultimoAcceso) }}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                >
                  <div class="flex justify-end space-x-2">
                    <button
                      (click)="verDetalles(usuario)"
                      class="text-blue-400 hover:text-blue-300 px-3 py-1 hover:bg-[#232e47] transition-colors duration-200"
                      title="Ver detalles"
                    >
                      <svg
                        class="w-6 h-6 stroke-yellow-900 hover:stroke-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path />
                        <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                        <path
                          d="M12 18c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"
                        />
                        <path
                          d="M19.001 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"
                        />
                        <path d="M19.001 15.5v1.5" />
                        <path d="M19.001 21v1.5" />
                        <path d="M22.032 17.25l-1.299 .75" />
                        <path d="M17.27 20l-1.3 .75" />
                        <path d="M15.97 17.25l1.3 .75" />
                        <path d="M20.733 20l1.3 .75" />
                      </svg>
                    </button>
                    <button
                      (click)="editarUsuario(usuario)"
                      class="text-indigo-400 hover:text-indigo-300 px-3 py-1 rounded-md hover:bg-[#232e47] transition-colors duration-200"
                      title="Editar"
                    >
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
                      (click)="cambiarContrasena(usuario)"
                      class="text-orange-400 hover:text-orange-300 px-3 py-1 rounded-md hover:bg-[#232e47] transition-colors duration-200 "
                      title="Generar contraseña temporal"
                    >
                      <svg
                        class="w-6 h-6 stroke-purple-400 hover:stroke-blue-900"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path />
                        <path
                          d="M16.555 3.843l3.602 3.602a2.877 2.877 0 0 1 0 4.069l-2.643 2.643a2.877 2.877 0 0 1 -4.069 0l-.301 -.301l-6.558 6.558a2 2 0 0 1 -1.239 .578l-.175 .008h-1.172a1 1 0 0 1 -.993 -.883l-.007 -.117v-1.172a2 2 0 0 1 .467 -1.284l.119 -.13l.414 -.414h2v-2h2v-2l2.144 -2.144l-.301 -.301a2.877 2.877 0 0 1 0 -4.069l2.643 -2.643a2.877 2.877 0 0 1 4.069 0z"
                        />
                        <path d="M15 9h.01" />
                      </svg>
                    </button>
                    <button
                      *ngIf="puedeAsignarRenglones"
                      (click)="gestionarRenglones(usuario)"
                      class="text-teal-400 hover:text-teal-300 px-3 py-1 rounded-md hover:bg-[#232e47] transition-colors duration-200"
                      title="Asignar renglones"
                    >
                      <svg
                        class="w-6 h-6 stroke-teal-400 hover:stroke-teal-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 3l7.5 4.5v9L12 21l-7.5-4.5v-9z" />
                        <path d="M12 12l7.5-4.5" />
                        <path d="M12 12v9" />
                        <path d="M12 12l-7.5-4.5" />
                      </svg>
                    </button>
                    <button
                      (click)="eliminarUsuario(usuario)"
                      class="text-red-400 hover:text-red-300 px-3 py-1 rounded-md hover:bg-[#232e47] transition-colors duration-200"
                      title="Eliminar"
                    >
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
        <div
          *ngIf="!cargando && usuariosFiltrados.length === 0"
          class="p-8 text-center"
        >
          <div class="text-gray-400">
            <span class="text-4xl mb-4 block">👥</span>
            <p class="text-lg">No se encontraron usuarios</p>
            <p class="text-sm">
              Prueba ajustando los filtros o crea un nuevo usuario
            </p>
          </div>
        </div>

        <!-- Paginación -->
        <div
          *ngIf="!cargando && usuariosFiltrados.length > 0"
          class="px-6 py-3 border-t border-[#334155] bg-[#232e47]"
        >
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-400">
              Mostrando {{ usuariosFiltrados.length }} de
              {{ usuarios.length }} usuarios
            </div>
            <!-- Aquí se puede agregar paginación real más adelante -->
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Usuario -->
    <app-usuario-modal
      [isOpen]="mostrarModal"
      [usuario]="usuarioSeleccionado"
      (modalClosed)="cerrarModal()"
      (usuarioGuardado)="onUsuarioGuardado($event)"
    >
    </app-usuario-modal>

    <!-- Modal de Contraseña Temporal -->
    <app-password-temporal-modal
      *ngIf="mostrarModalPassword && usuarioParaPassword"
      [usuario]="usuarioParaPassword"
      (cerrarModal)="cerrarModalPassword()"
      (passwordGenerada)="onPasswordGenerada()"
    >
    </app-password-temporal-modal>

    <!-- Modal Detalles Usuario -->
    <app-usuario-detalle-modal
      [isOpen]="mostrarModalDetalles"
      [usuario]="usuarioParaDetalles"
      (cerrar)="cerrarModalDetalles()"
    >
    </app-usuario-detalle-modal>

    <app-usuario-renglones-modal
      *ngIf="puedeAsignarRenglones"
      [isOpen]="mostrarModalRenglones"
      [usuario]="usuarioParaRenglones"
      (cerrar)="cerrarModalRenglones()"
      (renglonesActualizados)="onRenglonesActualizados($event)"
    >
    </app-usuario-renglones-modal>
  `,
  styles: [],
})
export class ListaUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  rolesDisponibles: any[] = [];
  cargando = false;
  puedeAsignarRenglones = false;

  // Variables para el modal
  mostrarModal = false;
  usuarioSeleccionado: Usuario | null = null;

  // Variables para modal de contraseña temporal
  mostrarModalPassword = false;
  usuarioParaPassword: Usuario | null = null;

  // Variables para modal de detalles
  mostrarModalDetalles = false;
  usuarioParaDetalles: Usuario | null = null;

  // Variables para modal de renglones
  mostrarModalRenglones = false;
  usuarioParaRenglones: Usuario | null = null;

  filtro = {
    busqueda: '',
    estado: '',
    rol: '',
  };

  constructor(
    private usuariosService: UsuariosService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.puedeAsignarRenglones = this.authService.canAsignarRenglones();
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.cargando = true;
    this.usuariosService.findAll().subscribe({
      next: (response) => {
        if (response.success) {
          this.usuarios = response.data;
          this.usuariosFiltrados = [...this.usuarios];
          this.extraerRolesDisponibles();
        } else {
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.cargando = false;
      },
    });
  }

  extraerRolesDisponibles() {
    const rolesUnicos = new Map();
    this.usuarios.forEach((usuario) => {
      if (usuario.Roles) {
        rolesUnicos.set(usuario.Roles.idRoles, usuario.Roles);
      }
    });
    this.rolesDisponibles = Array.from(rolesUnicos.values());
  }

  aplicarFiltros() {
    this.usuariosFiltrados = this.usuarios.filter((usuario) => {
      const coincideBusqueda =
        !this.filtro.busqueda ||
        usuario.nombres
          .toLowerCase()
          .includes(this.filtro.busqueda.toLowerCase()) ||
        usuario.apellidos
          .toLowerCase()
          .includes(this.filtro.busqueda.toLowerCase()) ||
        usuario.correo
          .toLowerCase()
          .includes(this.filtro.busqueda.toLowerCase());

      const coincideEstado =
        !this.filtro.estado || usuario.activo.toString() === this.filtro.estado;

      const coincideRol =
        !this.filtro.rol ||
        (usuario.Roles && usuario.Roles.idRoles.toString() === this.filtro.rol);

      return coincideBusqueda && coincideEstado && coincideRol;
    });
  }

  getIniciales(nombres: string, apellidos: string): string {
    const inicialNombre = nombres ? nombres.charAt(0).toUpperCase() : '';
    const inicialApellido = apellidos ? apellidos.charAt(0).toUpperCase() : '';
    return inicialNombre + inicialApellido;
  }

  getEstadoClases(activo: boolean): string {
    return activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return 'Nunca';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  abrirModalCrear() {
    console.log('Abriendo modal crear usuario');
    this.usuarioSeleccionado = null;
    this.mostrarModal = true;
  }

  verDetalles(usuario: Usuario) {
    console.log('Ver detalles del usuario:', usuario);
    this.usuarioParaDetalles = usuario;
    this.mostrarModalDetalles = true;
  }

  cerrarModalDetalles() {
    this.mostrarModalDetalles = false;
    this.usuarioParaDetalles = null;
  }

  editarUsuario(usuario: Usuario) {
    console.log('Editando usuario:', usuario);
    this.usuarioSeleccionado = usuario;
    this.mostrarModal = true;
  }

  gestionarRenglones(usuario: Usuario) {
    if (!this.puedeAsignarRenglones) {
      return;
    }

    this.usuarioParaRenglones = usuario;
    this.mostrarModalRenglones = true;
  }

  cerrarModal() {
    console.log('Cerrando modal usuario');
    this.mostrarModal = false;
    this.usuarioSeleccionado = null;
  }

  cerrarModalRenglones() {
    this.mostrarModalRenglones = false;
    this.usuarioParaRenglones = null;
  }

  onUsuarioGuardado(usuario: Usuario) {
    this.cargarUsuarios(); // Recargar la lista
  }

  onRenglonesActualizados(usuarioActualizado: Usuario) {
    this.actualizarUsuarioEnListas(usuarioActualizado);
    this.cerrarModalRenglones();
  }

  cambiarContrasena(usuario: Usuario) {
    console.log('Cambiando contraseña para usuario:', usuario);
    this.usuarioParaPassword = usuario;
    this.mostrarModalPassword = true;
  }

  cerrarModalPassword() {
    console.log('Cerrando modal contraseña');
    this.mostrarModalPassword = false;
    this.usuarioParaPassword = null;
  }

  onPasswordGenerada() {
    console.log('Contraseña temporal generada');
    this.cargarUsuarios(); // Recargar la lista para actualizar estados
  }

  eliminarUsuario(usuario: Usuario) {
    console.log('Intentando eliminar usuario:', usuario);
    if (
      confirm(
        `¿Estás seguro de que deseas eliminar al usuario ${usuario.nombres} ${usuario.apellidos}?`
      )
    ) {
      this.usuariosService.delete(usuario.idUsuario).subscribe({
        next: (response) => {
          if (response.success) {
            this.cargarUsuarios(); // Recargar la lista
            console.log('Usuario eliminado exitosamente');
          }
        },
        error: (error) => {
          console.error('Error al eliminar usuario:', error);
        },
      });
    }
  }

  private actualizarUsuarioEnListas(usuarioActualizado: Usuario) {
    const actualizar = (lista: Usuario[]) =>
      lista.map((usuario) =>
        usuario.idUsuario === usuarioActualizado.idUsuario
          ? { ...usuario, ...usuarioActualizado }
          : usuario
      );

    this.usuarios = actualizar(this.usuarios);
    this.usuariosFiltrados = actualizar(this.usuariosFiltrados);

    if (this.usuarioSeleccionado?.idUsuario === usuarioActualizado.idUsuario) {
      this.usuarioSeleccionado = {
        ...this.usuarioSeleccionado,
        ...usuarioActualizado,
      };
    }

    if (this.usuarioParaDetalles?.idUsuario === usuarioActualizado.idUsuario) {
      this.usuarioParaDetalles = {
        ...this.usuarioParaDetalles,
        ...usuarioActualizado,
      };
    }
  }
}

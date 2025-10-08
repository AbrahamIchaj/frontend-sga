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
    <div class="section-stack text-body">
      <div class="space-y-6">
        <div class="card-responsive border border-subtle bg-surface">
          <div class="card-responsive__body">
            <div class="grid gap-4 md:grid-cols-3 md:items-end">
              <h1 class="text-lg font-bold text-heading md:col-span-3">
                GESTIÓN DE PERMISOS
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

              <div class="space-y-2 col-span-2 md:col-span-2">
                <label class="text-sm font-medium text-muted-strong"
                  >Buscar</label
                >
                <input
                  type="text"
                  [(ngModel)]="filtro.busqueda"
                  (ngModelChange)="aplicarFiltros()"
                  placeholder="Nombre del permiso..."
                  class="form-control-dark"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-muted-strong"
                  >Asignación</label
                >
                <select
                  [(ngModel)]="filtro.asignado"
                  (ngModelChange)="aplicarFiltros()"
                  class="form-control-dark"
                >
                  <option value="">Todos</option>
                  <option value="true">Asignado a roles</option>
                  <option value="false">Sin asignar</option>
                </select>
              </div>
            </div>
            <br />
            <button
              type="button"
              (click)="abrirModalCrear()"
              class="btn-primary-dark inline-flex items-center"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
                <path d="M9 12h6" />
                <path d="M12 9v6" />
              </svg>
              Nuevo permiso
            </button>
          </div>
        </div>
        <!-- Tarjetas -->
        <div class="">
          <div class="card-responsive__body">
            <ng-container *ngIf="cargando; else listadoPermisos">
              <div class="flex justify-center py-12">
                <div
                  class="inline-flex items-center gap-3 rounded-xl border border-subtle bg-surface-alt px-4 py-3 text-sm font-medium text-muted"
                >
                  <svg
                    class="h-5 w-5 animate-spin text-indigo-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Cargando permisos...
                </div>
              </div>
            </ng-container>

            <ng-template #listadoPermisos>
              <ng-container
                *ngIf="permisosFiltrados.length; else sinResultados"
              >
                <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div
                    *ngFor="let permiso of permisosFiltrados"
                    class="group rounded-xl border border-subtle bg-surface-alt/80 p-4 transition-colors hover:border-indigo-400/70 hover:bg-surface-alt"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="flex items-start gap-3">
                        <div
                          class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-400"
                        >
                          {{ permiso.permiso.charAt(0) || 'P' }}
                        </div>
                        <div>
                          <h3 class="text-sm font-semibold text-heading">
                            {{ permiso.permiso }}
                          </h3>
                          <p class="text-xs text-muted">
                            ID: {{ permiso.idPermisos }}
                          </p>
                        </div>
                      </div>
                      <div class="flex items-center gap-1">
                        <button
                          type="button"
                          (click)="editarPermiso(permiso)"
                          class="rounded-lg p-2 text-muted hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
                          title="Editar"
                        >
                          <svg
                            class="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.8"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M4 20h4l10.5-10.5a2.828 2.828 0 10-4-4L4 16v4"
                            />
                            <path d="M13.5 6.5l4 4" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          (click)="eliminarPermiso(permiso)"
                          class="rounded-lg p-2 text-muted hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-400/60 disabled:cursor-not-allowed disabled:text-muted"
                          title="Eliminar"
                          [disabled]="(permiso.RolPermisos.length || 0) > 0"
                        >
                          <svg
                            class="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.8"
                            viewBox="0 0 24 24"
                          >
                            <path d="M4 7h16" />
                            <path
                              d="M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12"
                            />
                            <path d="M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                            <path d="M10 12l4 4m0-4l-4 4" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div class="mt-4 space-y-3">
                      <div>
                        <p
                          class="text-xs font-semibold uppercase tracking-wide text-muted-strong"
                        >
                          Roles con este permiso
                        </p>
                        <div
                          *ngIf="permiso.RolPermisos?.length; else sinAsignar"
                          class="mt-2 flex flex-wrap gap-2"
                        >
                          <span
                            *ngFor="
                              let rolPermiso of permiso.RolPermisos.slice(0, 2)
                            "
                            class="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-1 text-xs font-medium text-sky-300"
                          >
                            <span class="material-icons text-[14px]">🛡️ </span>
                            {{ rolPermiso.Roles.nombreRol }}
                          </span>
                          <span
                            *ngIf="permiso.RolPermisos.length > 2"
                            class="inline-flex items-center rounded-full border border-subtle px-2 py-1 text-xs font-medium text-muted"
                          >
                            +{{ permiso.RolPermisos.length - 2 }} más
                          </span>
                        </div>
                        <ng-template #sinAsignar>
                          <span
                            class="mt-2 inline-flex items-center rounded-full bg-amber-500/15 px-2 py-1 text-xs font-medium text-amber-300"
                          >
                            Sin asignar
                          </span>
                        </ng-template>
                      </div>

                      <div
                        class="flex items-center justify-between rounded-lg border border-subtle bg-surface px-3 py-2 text-xs text-muted"
                      >
                        <span>Roles vinculados</span>
                        <span class="text-sm font-semibold text-heading">{{
                          permiso.RolPermisos.length || 0
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <br />
                <div
                  class="flex items-center justify-between rounded-xl border border-subtle bg-surface-alt px-4 py-3 text-sm text-muted"
                >
                  <span
                    >Mostrando {{ permisosFiltrados.length }} de
                    {{ permisos.length }} permisos</span
                  >
                </div>
              </ng-container>
            </ng-template>

            <ng-template #sinResultados>
              <div
                class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-subtle px-8 py-16 text-center text-muted"
              >
                <span class="material-icons text-4xl text-muted"
                  >gpp_maybe</span
                >
                <div class="space-y-1">
                  <p class="text-lg font-semibold text-heading">
                    No se encontraron permisos
                  </p>
                  <p class="text-sm text-muted">
                    Ajusta los filtros o crea un nuevo permiso para comenzar.
                  </p>
                </div>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </div>

    <app-permiso-modal
      [isOpen]="mostrarModal"
      [permiso]="permisoSeleccionado"
      (modalClosed)="cerrarModal()"
      (permisoGuardado)="onPermisoGuardado($event)"
    ></app-permiso-modal>
  `,
  styles: [],
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
    asignado: '',
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
      },
    });
  }

  aplicarFiltros() {
    this.permisosFiltrados = this.permisos.filter((permiso) => {
      const coincideBusqueda =
        !this.filtro.busqueda ||
        permiso.permiso
          .toLowerCase()
          .includes(this.filtro.busqueda.toLowerCase());

      const tieneRoles = (permiso.RolPermisos?.length || 0) > 0;
      const coincideAsignacion =
        !this.filtro.asignado ||
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

    if (
      confirm(
        `¿Estás seguro de que deseas eliminar el permiso "${permiso.permiso}"?`
      )
    ) {
      this.permisosService.delete(permiso.idPermisos).subscribe({
        next: (response) => {
          if (response.success) {
            this.cargarPermisos(); // Recargar la lista
            console.log('Permiso eliminado exitosamente');
          }
        },
        error: (error) => {
          console.error('Error al eliminar permiso:', error);
        },
      });
    }
  }
}

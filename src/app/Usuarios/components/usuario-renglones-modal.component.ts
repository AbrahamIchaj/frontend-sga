import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../models/usuario.interface';
import { UsuariosService } from '../services/usuarios.service';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-usuario-renglones-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" (click)="onBackdropClick($event)">
      <div class="w-full max-w-3xl rounded-xl bg-[#1e293b] text-gray-100 shadow-xl" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between border-b border-[#334155] px-6 py-4">
          <div>
            <h2 class="text-xl font-semibold">Asignar renglones</h2>
            <p class="text-sm text-gray-400" *ngIf="usuario">
              Gestiona los renglones permitidos para <span class="font-medium text-gray-200">{{ usuario.nombres }} {{ usuario.apellidos }}</span>.
            </p>
          </div>
          <button class="text-gray-400 transition-colors hover:text-gray-200" type="button" (click)="cerrarModal()">
            <span class="text-2xl">&times;</span>
          </button>
        </div>

        <div class="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-5">
          <div class="grid gap-6 md:grid-cols-2">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Buscar renglón disponible</label>
                <div class="relative">
                  <input
                    [(ngModel)]="terminoBusqueda"
                    (ngModelChange)="filtrarRenglones()"
                    type="text"
                    placeholder="Ingresa un número de renglón"
                    class="w-full rounded-lg border border-[#334155] bg-[#0f172a] px-4 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    class="absolute right-2 top-2 rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                    (click)="agregarRenglonManual(terminoBusqueda)"
                  >
                    Agregar
                  </button>
                </div>
                <p class="mt-2 text-xs text-gray-400">
                  Usa el buscador para filtrar rápidamente o presiona "Agregar" para incluir un número manualmente.
                </p>
              </div>

              <div class="rounded-lg border border-[#334155] bg-[#0f172a]">
                <div class="flex items-center justify-between border-b border-[#334155] px-4 py-3">
                  <h3 class="text-sm font-semibold text-gray-200">Renglones disponibles</h3>
                  <span class="text-xs text-gray-400">{{ renglonesFiltrados.length }} encontrados</span>
                </div>
                <div class="max-h-60 overflow-y-auto">
                  <ng-container *ngIf="cargandoDisponibles; else listaRenglones">
                    <div class="px-4 py-6 text-center text-sm text-gray-400">
                      Cargando renglones...
                    </div>
                  </ng-container>
                  <ng-template #listaRenglones>
                    <div *ngIf="renglonesFiltrados.length === 0" class="px-4 py-6 text-center text-sm text-gray-400">
                      No se encontraron renglones para el criterio ingresado.
                    </div>
                    <ul *ngIf="renglonesFiltrados.length > 0" class="divide-y divide-[#1e293b]">
                      <li *ngFor="let renglon of renglonesFiltrados" class="flex items-center justify-between px-4 py-2 text-sm">
                        <div class="flex items-center gap-3">
                          <input
                            type="checkbox"
                            [checked]="estaSeleccionado(renglon)"
                            (change)="toggleSeleccion(renglon)"
                            class="h-4 w-4 rounded border-[#475569] bg-[#1e293b] text-blue-600 focus:ring-blue-500"
                          />
                          <span class="font-medium text-gray-200">Renglón {{ renglon }}</span>
                        </div>
                        <button
                          type="button"
                          class="text-xs text-blue-400 hover:text-blue-200"
                          (click)="agregarRenglonManual(renglon)"
                        >
                          Añadir
                        </button>
                      </li>
                    </ul>
                  </ng-template>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div class="rounded-lg border border-[#334155] bg-[#0f172a]">
                <div class="flex items-center justify-between border-b border-[#334155] px-4 py-3">
                  <h3 class="text-sm font-semibold text-gray-200">Renglones asignados</h3>
                  <span class="text-xs text-gray-400">{{ renglonesSeleccionados.length }} activos</span>
                </div>
                <div class="px-4 py-4">
                  <ng-container *ngIf="renglonesSeleccionados.length > 0; else sinRenglones">
                    <div class="flex flex-wrap gap-2">
                      <span
                        *ngFor="let renglon of renglonesSeleccionados"
                        class="inline-flex items-center gap-2 rounded-full bg-blue-600/20 px-3 py-1 text-xs font-semibold text-blue-300"
                      >
                        Renglón {{ renglon }}
                        <button
                          type="button"
                          class="text-blue-200 hover:text-white"
                          (click)="removerRenglon(renglon)"
                          aria-label="Remover renglón"
                        >
                          &times;
                        </button>
                      </span>
                    </div>
                  </ng-container>
                  <ng-template #sinRenglones>
                    <p class="text-sm text-gray-400">
                      No hay renglones asignados. Usa la lista o agrega uno manualmente para comenzar.
                    </p>
                  </ng-template>
                </div>
              </div>

              <div class="rounded-lg border border-[#334155] bg-[#0f172a] p-4 text-xs text-gray-400">
                <h4 class="mb-2 text-sm font-semibold text-gray-200">Consejos</h4>
                <ul class="space-y-2 list-disc pl-4">
                  <li>Puedes agregar cualquier número de renglón aunque no aparezca en la lista.</li>
                  <li>Quita un renglón activo haciendo clic en el botón "×" del chip correspondiente.</li>
                  <li>Los cambios se aplican al guardar y quedan registrados en la auditoría del sistema.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 border-t border-[#334155] px-6 py-4">
          <button type="button" class="rounded-lg border border-transparent bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700" (click)="cerrarModal()">
            Cancelar
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            [disabled]="guardando"
            (click)="guardar()"
          >
            <span *ngIf="guardando" class="inline-flex items-center gap-2">
              <i class="fas fa-circle-notch fa-spin"></i>
              Guardando...
            </span>
            <span *ngIf="!guardando">Guardar cambios</span>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class UsuarioRenglonesModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() usuario: Usuario | null = null;
  @Output() cerrar = new EventEmitter<void>();
  @Output() renglonesActualizados = new EventEmitter<Usuario>();

  terminoBusqueda = '';
  renglonesDisponibles: number[] = [];
  renglonesFiltrados: number[] = [];
  renglonesSeleccionados: number[] = [];
  cargandoDisponibles = false;
  guardando = false;

  constructor(
    private usuariosService: UsuariosService,
    private sweetAlert: SweetAlertService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.inicializarEstado();
    }

    if (changes['usuario'] && this.isOpen) {
      this.cargarRenglonesSeleccionados();
    }
  }

  private inicializarEstado(): void {
    this.cargarRenglonesDisponibles();
    this.cargarRenglonesSeleccionados();
    this.terminoBusqueda = '';
  }

  private cargarRenglonesSeleccionados(): void {
    const renglones = this.usuario?.renglonesPermitidos ?? [];
    this.renglonesSeleccionados = [...renglones].sort((a, b) => a - b);
    this.filtrarRenglones();
  }

  private cargarRenglonesDisponibles(): void {
    this.cargandoDisponibles = true;
    this.usuariosService.getRenglonesDisponibles().subscribe({
      next: (response) => {
        if (response.success) {
          this.renglonesDisponibles = Array.isArray(response.data)
            ? [...response.data].sort((a, b) => a - b)
            : [];
        }
        this.filtrarRenglones();
        this.cargandoDisponibles = false;
      },
      error: (error) => {
        console.error('Error al cargar renglones disponibles', error);
        this.sweetAlert.error(
          'No se pudieron cargar los renglones',
          'Intenta nuevamente más tarde.',
        );
        this.renglonesDisponibles = [];
        this.filtrarRenglones();
        this.cargandoDisponibles = false;
      },
    });
  }

  filtrarRenglones(): void {
    const termino = this.terminoBusqueda.trim();
    if (!termino) {
      this.renglonesFiltrados = [...this.renglonesDisponibles];
      return;
    }

    const numero = Number(termino);
    if (!Number.isNaN(numero)) {
      this.renglonesFiltrados = this.renglonesDisponibles.filter((r) =>
        r.toString().includes(termino),
      );
      return;
    }

    this.renglonesFiltrados = [];
  }

  toggleSeleccion(renglon: number): void {
    if (this.estaSeleccionado(renglon)) {
      this.removerRenglon(renglon);
    } else {
      this.agregarRenglonManual(renglon);
    }
  }

  estaSeleccionado(renglon: number): boolean {
    return this.renglonesSeleccionados.includes(renglon);
  }

  agregarRenglonManual(valor: string | number): void {
    const numero = Number(valor);
    if (Number.isNaN(numero) || numero < 0) {
      this.sweetAlert.warning(
        'Renglón inválido',
        'Ingresa un número entero mayor o igual a cero.',
      );
      return;
    }

    if (!this.estaSeleccionado(numero)) {
      this.renglonesSeleccionados = [...this.renglonesSeleccionados, numero]
        .filter((item, index, arr) => arr.indexOf(item) === index)
        .sort((a, b) => a - b);
    }

    this.terminoBusqueda = '';
    this.filtrarRenglones();
  }

  removerRenglon(renglon: number): void {
    this.renglonesSeleccionados = this.renglonesSeleccionados.filter(
      (item) => item !== renglon,
    );
    this.filtrarRenglones();
  }

  guardar(): void {
    if (!this.usuario) {
      return;
    }

    this.guardando = true;
    this.usuariosService
      .updateRenglones(this.usuario.idUsuario, this.renglonesSeleccionados)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.sweetAlert.success(
              'Renglones actualizados',
              'Los renglones del usuario se han actualizado correctamente.',
            );
            this.renglonesActualizados.emit(response.data);
            this.cerrarModal();
          } else {
            this.sweetAlert.warning(
              'No se guardaron cambios',
              response.message || 'Verifica la información ingresada.',
            );
          }
          this.guardando = false;
        },
        error: (error) => {
          console.error('Error al guardar renglones', error);
          const mensaje =
            error?.error?.message || 'Ocurrió un error al guardar los renglones.';
          this.sweetAlert.error('Error al guardar renglones', mensaje);
          this.guardando = false;
        },
      });
  }

  cerrarModal(): void {
    this.cerrar.emit();
    this.guardando = false;
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cerrarModal();
    }
  }
}

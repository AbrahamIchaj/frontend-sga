import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { InventarioService, InventarioResponse } from '../../../Inventario/inventario.service';

interface NotificacionInsumo {
  insumo: InventarioResponse;
  fechaVencimiento: Date;
  fechaLimiteDevolucion: Date;
  mesesRestantes: number;
  diasRestantes: number;
  diasParaDevolucion: number;
  debeAtenderse: boolean;
  estado: 'vencido' | 'critico' | 'proximo';
  mesesDevolucion: number;
}

@Component({
  selector: 'app-header-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html'
})
export class HeaderNotificationsComponent implements OnDestroy {
  @Input() ventanaNotificacionesMeses = 6;

  notificacionesModalAbierto = false;
  notificacionesCargadas = false;
  cargandoNotificaciones = false;
  errorNotificaciones: string | null = null;
  notificaciones: NotificacionInsumo[] = [];
  readonly Math = Math;

  private readonly destroy$ = new Subject<void>();

  constructor(private readonly inventarioService: InventarioService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get totalNotificaciones(): number {
    return this.notificaciones.length;
  }

  toggleNotificacionesModal(): void {
    this.notificacionesModalAbierto = !this.notificacionesModalAbierto;
    if (this.notificacionesModalAbierto && !this.notificacionesCargadas) {
      this.cargarNotificaciones();
    }
  }

  cerrarNotificacionesModal(): void {
    this.notificacionesModalAbierto = false;
  }

  recargarNotificaciones(): void {
    this.cargarNotificaciones(true);
  }

  private cargarNotificaciones(force = false): void {
    if (this.cargandoNotificaciones) {
      return;
    }

    if (!force && this.notificacionesCargadas) {
      return;
    }

    this.cargandoNotificaciones = true;
    this.errorNotificaciones = null;

    this.inventarioService
      .getProximosVencer({ meses: this.ventanaNotificacionesMeses })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (respuesta) => {
          const items = respuesta?.data ?? [];
          if (!items.length) {
            this.cargarNotificacionesDesdeListado();
            return;
          }

          this.notificaciones = this.procesarNotificaciones(items);
          this.notificacionesCargadas = true;
          this.cargandoNotificaciones = false;
        },
        error: (error) => {
          console.error('Error al cargar notificaciones de inventario:', error);
          this.cargarNotificacionesDesdeListado('No se pudieron cargar las notificaciones desde el servicio de vencimientos.');
        }
      });
  }

  private cargarNotificacionesDesdeListado(mensajeError?: string): void {
    this.inventarioService
      .list({ limit: 500 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resultado) => {
          const items = resultado?.data ?? [];
          this.notificaciones = this.procesarNotificaciones(items);
          this.notificacionesCargadas = true;
          this.cargandoNotificaciones = false;

          if (mensajeError && !this.notificaciones.length) {
            this.errorNotificaciones = 'No se encontraron insumos próximos a vencer.';
          }
        },
        error: (errorListado) => {
          console.error('Error al cargar inventario para notificaciones:', errorListado);
          this.errorNotificaciones = mensajeError ?? 'No se pudieron cargar las notificaciones. Intenta de nuevo.';
          this.cargandoNotificaciones = false;
        }
      });
  }

  private procesarNotificaciones(items: InventarioResponse[]): NotificacionInsumo[] {
    const ahora = new Date();

    return items
      .map((insumo) => this.construirNotificacion(insumo, ahora))
      .filter((notif): notif is NotificacionInsumo => !!notif && notif.debeAtenderse)
      .sort((a, b) => a.fechaLimiteDevolucion.getTime() - b.fechaLimiteDevolucion.getTime());
  }

  private construirNotificacion(insumo: InventarioResponse, referencia: Date): NotificacionInsumo | null {
    if (!insumo.fechaVencimiento) {
      return null;
    }

    const fechaVencimiento = this.parseFecha(insumo.fechaVencimiento);
    if (!fechaVencimiento) {
      return null;
    }

    const mesesDevolucion = this.normalizarMesesDevolucion(insumo.mesesDevolucion);
    const fechaLimite = this.sumarMeses(fechaVencimiento, -mesesDevolucion);
    const diasRestantes = this.diferenciaDias(referencia, fechaVencimiento);
    const mesesRestantes = this.diferenciaMeses(referencia, fechaVencimiento);
    const diasParaDevolucion = this.diferenciaDias(referencia, fechaLimite);

    const debeAtenderse = referencia >= fechaLimite || mesesRestantes <= mesesDevolucion;
    const estado = referencia > fechaVencimiento
      ? 'vencido'
      : referencia >= fechaLimite
        ? 'critico'
        : 'proximo';

    return {
      insumo,
      fechaVencimiento,
      fechaLimiteDevolucion: fechaLimite,
      mesesRestantes,
      diasRestantes,
      diasParaDevolucion,
      debeAtenderse,
      estado,
      mesesDevolucion
    };
  }

  private normalizarMesesDevolucion(valor: number | null | undefined): number {
    const normalizado = Number.isFinite(valor as number) ? Number(valor) : this.ventanaNotificacionesMeses;
    return Math.min(Math.max(normalizado || this.ventanaNotificacionesMeses, 1), this.ventanaNotificacionesMeses);
  }

  private parseFecha(value: string | Date): Date | null {
    if (value instanceof Date) {
      return value;
    }

    const iso = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
      return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    }

    const slash = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (slash) {
      return new Date(Number(slash[3]), Number(slash[2]) - 1, Number(slash[1]));
    }

    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private sumarMeses(fecha: Date, meses: number): Date {
    const nueva = new Date(fecha.getTime());
    const totalMeses = nueva.getMonth() + meses;
    nueva.setMonth(totalMeses);
    return nueva;
  }

  private diferenciaDias(desde: Date, hasta: Date): number {
    const MS_DIA = 1000 * 60 * 60 * 24;
    return Math.floor((hasta.getTime() - desde.getTime()) / MS_DIA);
  }

  private diferenciaMeses(desde: Date, hasta: Date): number {
    const años = hasta.getFullYear() - desde.getFullYear();
    const meses = hasta.getMonth() - desde.getMonth();
    const total = años * 12 + meses;
    const ajuste = hasta.getDate() >= desde.getDate() ? 0 : -1;
    return total + ajuste;
  }
}

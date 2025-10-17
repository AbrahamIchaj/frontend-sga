import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { AbastecimientosService, AbastecimientoGuardado, GuardarAbastecimientoInsumoPayload } from './abastecimientos.service';

@Component({
  standalone: true,
  selector: 'app-abastecimientos-historial-fechas-page',
  templateUrl: './abastecimientos-historial-fechas.page.html',
  styleUrls: ['./abastecimientos-historial-fechas.page.css'],
  imports: [CommonModule, RouterLink, CurrencyPipe, DecimalPipe, DatePipe, NgClass],
})
export class AbastecimientosHistorialFechasPageComponent implements OnInit {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly registros = signal<AbastecimientoGuardado[]>([]);
  readonly fechaDesde = signal(this.calcularInicioSemanaISO(new Date()));
  readonly fechaHasta = signal(this.calcularFinSemanaISO(new Date()));
  readonly fechaAplicadaDesde = signal<string | null>(null);
  readonly fechaAplicadaHasta = signal<string | null>(null);

  constructor(private readonly svc: AbastecimientosService) {}

  ngOnInit(): void {
    this.buscar();
  }

  onFechaDesdeChange(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.fechaDesde.set(value);
  }

  onFechaHastaChange(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.fechaHasta.set(value);
  }

  buscar(): void {
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();

    if (!desde || !hasta) {
      this.error.set('Selecciona una fecha de inicio y una fecha de fin.');
      return;
    }

    if (new Date(desde) > new Date(hasta)) {
      this.error.set('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.svc.listarHistorial({ fechaDesde: desde, fechaHasta: hasta }).subscribe({
      next: (data) => {
        this.registros.set(data ?? []);
        this.loading.set(false);
        this.fechaAplicadaDesde.set(desde);
        this.fechaAplicadaHasta.set(hasta);
      },
      error: (err) => {
        this.loading.set(false);
        const mensaje = err?.error?.message || err?.message || 'No fue posible cargar el historial para el rango seleccionado.';
        this.error.set(mensaje);
      },
    });
  }

  limpiar(): void {
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.fechaAplicadaDesde.set(null);
    this.fechaAplicadaHasta.set(null);
    this.registros.set([]);
  }

  aplicarSemanaActual(): void {
    const base = new Date();
    this.fechaDesde.set(this.calcularInicioSemanaISO(base));
    this.fechaHasta.set(this.calcularFinSemanaISO(base));
    this.buscar();
  }

  aplicarSemanaAnterior(): void {
    const base = new Date();
    base.setDate(base.getDate() - 7);
    this.fechaDesde.set(this.calcularInicioSemanaISO(base));
    this.fechaHasta.set(this.calcularFinSemanaISO(base));
    this.buscar();
  }

  trackByRegistro(_: number, registro: AbastecimientoGuardado): number {
    return registro.idRegistro;
  }

  calcularMesesCobertura(insumo: GuardarAbastecimientoInsumoPayload): number {
    if (insumo.mesesCobertura !== undefined && Number.isFinite(insumo.mesesCobertura)) {
      return Number(insumo.mesesCobertura);
    }
    const existenciasBodega = Number(insumo.existenciasBodega ?? 0);
    const existenciasCocina = Number(insumo.existenciasCocina ?? 0);
    const promedio = Number(insumo.promedioMensual ?? 0);
    if (!Number.isFinite(promedio) || promedio <= 0) {
      return 0;
    }
    const total = existenciasBodega + existenciasCocina;
    const valor = total / promedio;
    return Math.round(valor * 100) / 100;
  }

  obtenerTotalUnidades(insumo: GuardarAbastecimientoInsumoPayload): number {
    if (insumo.totalUnidades !== undefined) {
      return Number(insumo.totalUnidades ?? 0);
    }
    const existenciasBodega = Number(insumo.existenciasBodega ?? 0);
    const existenciasCocina = Number(insumo.existenciasCocina ?? 0);
    return existenciasBodega + existenciasCocina;
  }

  obtenerConsumoMensual(insumo: GuardarAbastecimientoInsumoPayload): number {
    if (insumo.consumoMensual !== undefined) {
      return Number(insumo.consumoMensual ?? 0);
    }
    return Number(insumo.promedioMensual ?? 0);
  }

  obtenerValorEstimado(insumo: GuardarAbastecimientoInsumoPayload): number {
    if (insumo.valorEstimado !== undefined && insumo.valorEstimado !== null) {
      return Number(insumo.valorEstimado ?? 0);
    }
    const total = this.obtenerTotalUnidades(insumo);
    const precioUnitario = Number(insumo.precioUnitario ?? 0);
    if (!Number.isFinite(precioUnitario) || precioUnitario <= 0) {
      return 0;
    }
    return Math.round(total * precioUnitario * 100) / 100;
  }

  private calcularInicioSemanaISO(base: Date): string {
    const copia = new Date(base);
    const dia = copia.getDay();
    const ajuste = dia === 0 ? -6 : 1 - dia;
    copia.setDate(copia.getDate() + ajuste);
    return this.toISODate(copia);
  }

  private calcularFinSemanaISO(base: Date): string {
    const inicio = new Date(base);
    const dia = inicio.getDay();
    const ajusteInicio = dia === 0 ? -6 : 1 - dia;
    inicio.setDate(inicio.getDate() + ajusteInicio + 6);
    return this.toISODate(inicio);
  }

  private toISODate(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }
}

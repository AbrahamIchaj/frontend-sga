import { CommonModule, CurrencyPipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AbastecimientosService, AbastecimientoItemResponse, AbastecimientoPeriodoResponse } from './abastecimientos.service';
import { SweetAlertService } from '../shared/services/sweet-alert.service';

interface AbastecimientoView {
  codigoInsumo: number;
  renglon: number;
  nombreInsumo: string;
  presentacion?: string | null;
  unidadMedida?: string | null;
  caracteristicas?: string | null;
  snapshot: AbastecimientoItemResponse['snapshot'];
  calculado: AbastecimientoItemResponse['calculado'];
  consumo: AbastecimientoItemResponse['consumo'];
  lotes: AbastecimientoItemResponse['lotes'];
  edit: {
    existenciasBodega: number;
    existenciasCocina: number;
    promedioMensual: number;
    precioUnitario: number | null;
    activo: boolean;
  };
  totals: {
    existenciasTotales: number;
    mesesAbastecimiento: number;
    costoTotal: number;
  };
}

interface CoberturaFila {
  etiqueta: string;
  cantidad: number;
  porcentaje: number;
}

interface CoberturaResumen {
  filas: CoberturaFila[];
  totalCantidad: number;
  totalPorcentaje: number;
  disponibilidad: number;
  abastecimiento: number;
}

@Component({
  standalone: true,
  selector: 'app-abastecimientos-page',
  templateUrl: './abastecimientos.page.html',
  styleUrls: ['./abastecimientos.page.css'],
  imports: [CommonModule, FormsModule, CurrencyPipe, DecimalPipe, NgClass, RouterLink],
})
export class AbastecimientosPageComponent implements OnInit {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly periodo = signal<AbastecimientoPeriodoResponse['periodo'] | null>(null);
  readonly resumen = signal<AbastecimientoPeriodoResponse['resumen'] | null>(null);
  readonly consumoPeriodos = signal<AbastecimientoPeriodoResponse['consumo']['periodos']>([]);
  readonly items = signal<AbastecimientoView[]>([]);
  readonly fechaConsulta = signal(this.formatearFechaInput(new Date()));
  readonly cobertura = signal<CoberturaResumen>({
    filas: [],
    totalCantidad: 0,
    totalPorcentaje: 0,
    disponibilidad: 0,
    abastecimiento: 0,
  });

  readonly filtro = (() => {
    const hoy = new Date();
    return signal<{ anio: number; mes: number }>({
      anio: hoy.getFullYear(),
      mes: hoy.getMonth() + 1,
    });
  })();


  constructor(
    private readonly svc: AbastecimientosService,
    private readonly alerts: SweetAlertService,
  ) {}

  ngOnInit(): void {
    this.actualizarFiltroDesdeFecha(this.fechaConsulta());
    this.cargar();
  }

  cargar(): void {
    const { anio, mes } = this.filtro();
    this.loading.set(true);
    this.error.set(null);

    this.svc.obtenerPeriodo(anio, mes).subscribe({
      next: (data) => {
        this.periodo.set(data.periodo);
        this.resumen.set(data.resumen);
        this.consumoPeriodos.set(data.consumo.periodos ?? []);
        const vistas = this.mapearItems(data.insumos ?? []);
        this.items.set(vistas);
        this.recalcularResumen();
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const mensaje = err?.error?.message || err?.message || 'No fue posible cargar la información';
        this.error.set(mensaje);
        this.alerts.error('Error al cargar abastecimientos', mensaje);
      },
    });
  }

  private formatearFechaInput(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = `${fecha.getMonth() + 1}`.padStart(2, '0');
    const day = `${fecha.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private actualizarFiltroDesdeFecha(fecha: string): void {
    const partes = fecha.split('-');
    if (partes.length < 2) {
      return;
    }
    const anio = Number(partes[0]);
    const mes = Number(partes[1]);
    if (!Number.isFinite(anio) || !Number.isFinite(mes) || mes < 1 || mes > 12) {
      return;
    }
    this.filtro.set({ anio, mes });
  }

  onFechaChange(event: Event): void {
    const valor = (event.target as HTMLInputElement | null)?.value;
    if (!valor) {
      return;
    }
    this.fechaConsulta.set(valor);
    this.actualizarFiltroDesdeFecha(valor);
    this.cargar();
  }

  mapearItems(insumos: AbastecimientoItemResponse[]): AbastecimientoView[] {
    return insumos
      .map((item) => {
        const existenciasBodega = Math.max(0, Math.round(item.calculado.existenciasBodega ?? 0));
        const existenciasCocina = Math.max(
          0,
          Math.round(
            item.snapshot?.existenciasCocina ??
              item.calculado.existenciasCocinaSugerida ??
              0,
          ),
        );
        const promedioMensual = this.redondearNumero(
          item.snapshot?.promedioMensual ??
            item.calculado.promedioMensualSugerido ??
            0,
          2,
        );
        const precioUnitario = this.redondearNumero(
          item.snapshot?.precioUnitario ?? item.calculado.precioUnitario ?? 0,
          2,
        );
        const view: AbastecimientoView = {
          codigoInsumo: item.codigoInsumo,
          renglon: item.renglon,
          nombreInsumo: item.nombreInsumo,
          presentacion: item.presentacion,
          unidadMedida: item.unidadMedida,
          caracteristicas: item.caracteristicas,
          snapshot: item.snapshot,
          calculado: item.calculado,
          consumo: item.consumo,
          lotes: item.lotes,
          edit: {
            existenciasBodega,
            existenciasCocina,
            promedioMensual,
            precioUnitario: Number.isFinite(precioUnitario) ? precioUnitario : null,
            activo: item.snapshot ? item.snapshot.activo : true,
          },
          totals: {
            existenciasTotales: 0,
            mesesAbastecimiento: 0,
            costoTotal: 0,
          },
        };

        this.actualizarTotales(view);
        return view;
      })
      .filter((view) => view.totals.existenciasTotales > 0)
      .sort((a, b) => a.nombreInsumo.localeCompare(b.nombreInsumo));
  }

  redondearNumero(valor: any, decimales: number = 2): number {
    const numero = Number(valor ?? 0);
    if (!Number.isFinite(numero)) {
      return 0;
    }
    const factor = Math.pow(10, decimales);
    return Math.round(numero * factor) / factor;
  }

  actualizarTotales(item: AbastecimientoView): void {
    item.totals.existenciasTotales = Math.max(
      0,
      item.edit.existenciasBodega + item.edit.existenciasCocina,
    );
    item.totals.mesesAbastecimiento = item.edit.promedioMensual > 0
      ? this.redondearNumero(
          item.totals.existenciasTotales / item.edit.promedioMensual,
          2,
        )
      : 0;
    item.totals.costoTotal = item.edit.precioUnitario
      ? this.redondearNumero(item.totals.existenciasTotales * item.edit.precioUnitario, 2)
      : 0;
  }

  onCocinaChange(item: AbastecimientoView, event: Event): void {
    const valor = (event.target as HTMLInputElement | null)?.value ?? '';
    const numero = Math.max(0, Math.trunc(Number(valor)));
    item.edit.existenciasCocina = numero;
    this.actualizarTotales(item);
    this.recalcularResumen();
  }

  onPromedioChange(item: AbastecimientoView, event: Event): void {
    const valor = (event.target as HTMLInputElement | null)?.value ?? '';
    const numero = Math.max(0, Number(valor));
    item.edit.promedioMensual = this.redondearNumero(numero, 2);
    this.actualizarTotales(item);
    this.recalcularResumen();
  }

  onPrecioChange(item: AbastecimientoView, event: Event): void {
    const valor = (event.target as HTMLInputElement | null)?.value ?? '';
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero < 0) {
      item.edit.precioUnitario = null;
    } else {
      item.edit.precioUnitario = this.redondearNumero(numero, 4);
    }
    this.actualizarTotales(item);
    this.recalcularResumen();
  }

  toggleActivo(item: AbastecimientoView): void {
    item.edit.activo = !item.edit.activo;
    this.recalcularResumen();
  }

  badgeCobertura(meses: number): string {
    if (meses <= 1) return 'badge-danger';
    if (meses <= 2) return 'badge-warning';
    if (meses <= 4) return 'badge-info';
    return 'badge-success';
  }

  recalcularResumen(): void {
    const items = this.items();
    if (!items || !items.length) {
      this.resumen.set({
        totalInsumos: 0,
        activos: 0,
        inactivos: 0,
        existenciasBodegaActual: 0,
        existenciasCocinaRegistrada: 0,
        valorInventarioEstimado: 0,
        promedioMesesCobertura: 0,
      });
      this.cobertura.set({
        filas: [],
        totalCantidad: 0,
        totalPorcentaje: 0,
        disponibilidad: 0,
        abastecimiento: 0,
      });
      return;
    }

    let totalMeses = 0;
    const acumulado = items.reduce(
      (acc, item) => {
        acc.totalInsumos += 1;
        if (item.edit.activo) acc.activos += 1;
        else acc.inactivos += 1;
        acc.existenciasBodegaActual += item.edit.existenciasBodega;
        acc.existenciasCocinaRegistrada += item.edit.existenciasCocina;
        acc.valorInventarioEstimado += item.totals.costoTotal;
        totalMeses += item.totals.mesesAbastecimiento;
        return acc;
      },
      {
        totalInsumos: 0,
        activos: 0,
        inactivos: 0,
        existenciasBodegaActual: 0,
        existenciasCocinaRegistrada: 0,
        valorInventarioEstimado: 0,
      },
    );

    const promedioMeses = items.length ? this.redondearNumero(totalMeses / items.length, 2) : 0;

    this.resumen.set({
      totalInsumos: acumulado.totalInsumos,
      activos: acumulado.activos,
      inactivos: acumulado.inactivos,
      existenciasBodegaActual: acumulado.existenciasBodegaActual,
      existenciasCocinaRegistrada: acumulado.existenciasCocinaRegistrada,
      valorInventarioEstimado: this.redondearNumero(acumulado.valorInventarioEstimado, 2),
      promedioMesesCobertura: promedioMeses,
    });

    this.actualizarCobertura(items);
  }

  async guardar(): Promise<void> {
    if (!this.items().length) {
      this.alerts.warning('Sin datos para guardar', 'No hay insumos que guardar en este periodo.');
      return;
    }

    const confirmar = await this.alerts.confirm(
      '¿Guardar abastecimientos?',
      'Se registrará el estado del periodo seleccionado.',
      'Sí, guardar',
    );

    if (!confirmar) return;

    const { anio, mes } = this.filtro();
    const resumenActual =
      this.resumen() ?? {
        totalInsumos: 0,
        activos: 0,
        inactivos: 0,
        existenciasBodegaActual: 0,
        existenciasCocinaRegistrada: 0,
        valorInventarioEstimado: 0,
        promedioMesesCobertura: 0,
      };
    const coberturaActual = this.cobertura();
    const payload = {
      anio,
      mes,
      fechaConsulta: this.fechaConsulta(),
      resumen: resumenActual,
      cobertura: coberturaActual,
      insumos: this.items().map((item) => ({
        codigoInsumo: item.codigoInsumo,
        renglon: item.renglon,
        existenciasBodega: item.edit.existenciasBodega,
        existenciasCocina: item.edit.existenciasCocina,
        promedioMensual: item.edit.promedioMensual,
        precioUnitario: item.edit.precioUnitario ?? undefined,
        nombreInsumo: item.nombreInsumo,
        presentacion: item.presentacion ?? undefined,
        unidadMedida: item.unidadMedida ?? undefined,
        caracteristicas: item.caracteristicas ?? undefined,
        activo: item.edit.activo,
        totalUnidades: item.totals.existenciasTotales,
        consumoMensual: this.consumoMensual(item),
        mesesCobertura: item.totals.mesesAbastecimiento,
        valorEstimado: item.totals.costoTotal,
      })),
    };

    this.alerts.loading('Guardando abastecimientos...');

    this.svc.guardar(payload).subscribe({
      next: () => {
        this.alerts.closeLoading();
        this.alerts.success('Abastecimientos guardados');
        this.cargar();
      },
      error: (err) => {
        this.alerts.closeLoading();
        const mensaje = err?.error?.message || err?.message || 'No fue posible guardar la información';
        this.alerts.error('Error al guardar', mensaje);
      },
    });
  }

  trackporCodigo(_: number, item: AbastecimientoView): number {
    return item.codigoInsumo;
  }

  consumoMensual(item: AbastecimientoView): number {
    const mensual = item.consumo['mensual'];
    if (!mensual) return item.edit.promedioMensual;
    return this.redondearNumero(mensual.totalCantidad ?? mensual.promedioCantidad ?? 0, 2);
  }

  private actualizarCobertura(items: AbastecimientoView[]): void {
    const total = items.length;
    if (!total) {
      this.cobertura.set({
        filas: [],
        totalCantidad: 0,
        totalPorcentaje: 0,
        disponibilidad: 0,
        abastecimiento: 0,
      });
      return;
    }

    const rangos = [
      {
        etiqueta: '0',
        condition: (meses: number) => meses === 0,
      },
      {
        etiqueta: '0.01 a 0.50',
        condition: (meses: number) => meses > 0 && meses <= 0.5,
      },
      {
        etiqueta: '0.51 a 1.00',
        condition: (meses: number) => meses > 0.5 && meses <= 1,
      },
      {
        etiqueta: '1.01 a 3.00',
        condition: (meses: number) => meses > 1 && meses <= 3,
      },
      {
        etiqueta: '3.01 a 6.00',
        condition: (meses: number) => meses > 3 && meses <= 6,
      },
      {
        etiqueta: '> de 6.01',
        condition: (meses: number) => meses > 6,
      },
    ];

    const filas = rangos.map((rango) => {
      const cantidad = items.filter((item) => rango.condition(item.totals.mesesAbastecimiento)).length;
      const porcentaje = total ? this.redondearNumero((cantidad / total) * 100, 2) : 0;
      return { etiqueta: rango.etiqueta, cantidad, porcentaje };
    });

    const totalCantidad = filas.reduce((acc, fila) => acc + fila.cantidad, 0);
    const totalPorcentaje = this.redondearNumero(
      filas.reduce((acc, fila) => acc + fila.porcentaje, 0),
      2,
    );

    const disponibilidad = this.redondearNumero(
      filas
        .slice(3)
        .reduce((acc, fila) => acc + fila.porcentaje, 0),
      2,
    );

    const abastecimiento = this.redondearNumero(
      filas
        .slice(4)
        .reduce((acc, fila) => acc + fila.porcentaje, 0),
      2,
    );

    this.cobertura.set({
      filas,
      totalCantidad,
      totalPorcentaje,
      disponibilidad,
      abastecimiento,
    });
  }
}

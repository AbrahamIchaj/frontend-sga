import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AbastecimientosGeneralService, AbastecimientoGeneralGuardado, GuardarAbastecimientoGeneralPayload } from '../abastecimientos-general.service';
import { AuthService } from '../../shared/services/auth.service';
import { CoberturaSemaforoPipe } from '../../shared/pipes/cobertura-semaforo.pipe';

interface MesOption {
  value: number;
  label: string;
}

type AbastecimientoGeneralHistorialView = AbastecimientoGeneralGuardado & { tieneInsumosPermitidos: boolean };

@Component({
  standalone: true,
  selector: 'app-abastecimientos-general-historial-page',
  templateUrl: './abastecimientos-general-historial.page.html',
  styleUrls: ['./abastecimientos-general-historial.page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, CurrencyPipe, DecimalPipe, DatePipe, NgClass, CoberturaSemaforoPipe],
})
export class AbastecimientosGeneralHistorialPageComponent implements OnInit {
  private static readonly MESES: MesOption[] = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly registros = signal<AbastecimientoGeneralHistorialView[]>([]);
  readonly filtroAnio = signal<number | null>(null);
  readonly filtroMes = signal<number | null>(null);
  readonly registroSeleccionado = signal<AbastecimientoGeneralHistorialView | null>(null);
  readonly registrosFiltrados = computed(() => this.registros().filter((registro) => registro.tieneInsumosPermitidos));
  readonly sinRegistrosPermitidos = computed(() => !this.registrosFiltrados().length && this.registros().length > 0);

  readonly meses = AbastecimientosGeneralHistorialPageComponent.MESES;
  readonly anios = this.construirListaAnios();

  private readonly renglonesPermitidos: number[];

  constructor(
    private readonly svc: AbastecimientosGeneralService,
    private readonly auth: AuthService,
  ) {
    this.renglonesPermitidos = this.obtenerRenglonesPermitidos();
  }

  ngOnInit(): void {
    this.cargar();
  }

  onAnioSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value ?? '';
    this.actualizarAnio(value);
  }

  onMesSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value ?? '';
    this.actualizarMes(value);
  }

  private actualizarAnio(value: string): void {
    const numero = Number(value);
    this.filtroAnio.set(Number.isFinite(numero) && numero > 0 ? numero : null);
    this.cargar();
  }

  private actualizarMes(value: string): void {
    const numero = Number(value);
    this.filtroMes.set(Number.isFinite(numero) && numero > 0 ? numero : null);
    this.cargar();
  }

  limpiarFiltros(): void {
    if (!this.hayFiltrosActivos()) {
      return;
    }
    this.filtroAnio.set(null);
    this.filtroMes.set(null);
    this.cargar();
  }

  hayFiltrosActivos(): boolean {
    return Boolean(this.filtroAnio() || this.filtroMes());
  }

  trackByRegistro(_: number, registro: AbastecimientoGeneralHistorialView): number {
    return registro.idRegistro;
  }

  trackByInsumo(_: number, insumo: GuardarAbastecimientoGeneralPayload): number {
    return insumo.codigoInsumo;
  }

  obtenerEtiquetaPeriodo(registro: AbastecimientoGeneralHistorialView): string {
    const mes = this.obtenerNombreMes(registro.mes);
    return `${mes} ${registro.anio}`;
  }

  calcularMesesCobertura(insumo: GuardarAbastecimientoGeneralPayload): number {
    const existenciasBodega = this.toNumber(insumo.existenciasBodega);
    const promedioMensual = this.toNumber(insumo.promedioMensual);
    if (promedioMensual <= 0) {
      return 0;
    }
    return this.redondear(existenciasBodega / promedioMensual, 2);
  }

  obtenerTotalUnidades(insumo: GuardarAbastecimientoGeneralPayload): number {
    if (insumo.totalUnidades !== undefined) {
      return this.toNumber(insumo.totalUnidades);
    }
    return this.toNumber(insumo.existenciasBodega);
  }

  obtenerConsumoMensual(insumo: GuardarAbastecimientoGeneralPayload): number {
    if (insumo.consumoMensual !== undefined) {
      return this.toNumber(insumo.consumoMensual);
    }
    return this.toNumber(insumo.promedioMensual);
  }

  obtenerValorEstimado(insumo: GuardarAbastecimientoGeneralPayload): number {
    if (insumo.valorEstimado !== undefined && insumo.valorEstimado !== null) {
      return this.redondear(this.toNumber(insumo.valorEstimado), 2);
    }
    const total = this.obtenerTotalUnidades(insumo);
    const precioUnitario = this.toNumber(insumo.precioUnitario);
    if (precioUnitario <= 0 || total <= 0) {
      return 0;
    }
    return this.redondear(total * precioUnitario, 2);
  }

  abrirDetalle(registro: AbastecimientoGeneralHistorialView): void {
    this.registroSeleccionado.set(registro);
  }

  cerrarDetalle(): void {
    this.registroSeleccionado.set(null);
  }

  obtenerEtiquetaCobertura(meses: number): string {
    if (meses === 0) return '0';
    if (meses > 0 && meses <= 0.5) return '0.01 a 0.50';
    if (meses > 0.5 && meses <= 1) return '0.51 a 1.00';
    if (meses > 1 && meses <= 3) return '1.01 a 3.00';
    if (meses > 3 && meses <= 6) return '3.01 a 6.00';
    return '> de 6.01';
  }

  obtenerClaseCobertura(meses: number): string {
    if (meses === 0) return 'rango-0';
    if (meses > 0 && meses <= 0.5) return 'rango-1';
    if (meses > 0.5 && meses <= 1) return 'rango-2';
    if (meses > 1 && meses <= 3) return 'rango-3';
    if (meses > 3 && meses <= 6) return 'rango-4';
    return 'rango-5';
  }

  obtenerCoberturaDetalle(insumo: GuardarAbastecimientoGeneralPayload): { valor: number; clase: string; } {
    const valor = this.calcularMesesCobertura(insumo);
    return {
      valor,
      clase: this.obtenerClaseCobertura(valor)
    };
  }

  contarInsumosBodega(registro: AbastecimientoGeneralHistorialView): number {
    return (registro.insumos ?? []).filter((insumo) => this.toNumber(insumo.existenciasBodega) > 0).length;
  }

  obtenerRenglonesRegistro(registro: AbastecimientoGeneralHistorialView): string {
    const valores = new Set<number>();
    for (const insumo of registro.insumos ?? []) {
      const renglon = this.toNumber(insumo.renglon);
      if (renglon > 0) {
        valores.add(renglon);
      }
    }
    if (!valores.size) {
      return 'Sin renglón';
    }
    return Array.from(valores)
      .sort((a, b) => a - b)
      .join(', ');
  }

  private cargar(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: { anio?: number; mes?: number } = {};
    if (this.filtroAnio()) {
      params.anio = this.filtroAnio()!;
    }
    if (this.filtroMes()) {
      params.mes = this.filtroMes()!;
    }

    this.svc.listarHistorial(params).subscribe({
      next: (data) => {
        const vistas = this.mapearRegistros(data ?? []);
        this.registros.set(vistas);
        if (this.registroSeleccionado()) {
          const seleccionado = vistas.find((registro) => registro.idRegistro === this.registroSeleccionado()!.idRegistro);
          this.registroSeleccionado.set(seleccionado ?? null);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const mensaje = err?.error?.message || err?.message || 'No fue posible cargar el historial.';
        this.error.set(mensaje);
      },
    });
  }

  private construirListaAnios(): number[] {
    const actual = new Date().getFullYear();
    const anioMinimo = Math.max(2018, actual - 9);
    const lista: number[] = [];
    for (let anio = actual; anio >= anioMinimo; anio -= 1) {
      lista.push(anio);
    }
    return lista;
  }

  private obtenerNombreMes(mes: number): string {
    return AbastecimientosGeneralHistorialPageComponent.MESES.find((m) => m.value === mes)?.label ?? `Mes ${mes}`;
  }

  private obtenerRenglonesPermitidos(): number[] {
    const usuario = this.auth.getCurrentUser();
    if (!usuario?.renglonesPermitidos?.length) {
      return [];
    }
    return usuario.renglonesPermitidos
      .map((valor) => Number(valor))
      .filter((valor) => Number.isFinite(valor) && valor > 0);
  }

  private mapearRegistros(raw: AbastecimientoGeneralGuardado[]): AbastecimientoGeneralHistorialView[] {
    if (!raw.length) {
      return [];
    }
    return raw.map((registro) => this.mapearRegistro(registro));
  }

  private mapearRegistro(registro: AbastecimientoGeneralGuardado): AbastecimientoGeneralHistorialView {
    const insumos = registro.insumos ?? [];

    if (!this.renglonesPermitidos.length) {
      const resumen = this.recalcularResumen(insumos);
      const cobertura = this.recalcularCobertura(insumos);
      return {
        ...registro,
        resumen,
        cobertura,
        tieneInsumosPermitidos: insumos.length > 0,
      };
    }

    const insumosPermitidos = insumos.filter((insumo) => this.renglonesPermitidos.includes(Number(insumo.renglon)));

    if (!insumosPermitidos.length) {
      return {
        ...registro,
        insumos: [],
        resumen: this.resumenVacio(),
        cobertura: this.coberturaVacia(),
        tieneInsumosPermitidos: false,
      };
    }

    const resumen = this.recalcularResumen(insumosPermitidos);
    const cobertura = this.recalcularCobertura(insumosPermitidos);

    return {
      ...registro,
      insumos: insumosPermitidos,
      resumen,
      cobertura,
      tieneInsumosPermitidos: true,
    };
  }

  private resumenVacio(): AbastecimientoGeneralGuardado['resumen'] {
    return {
      totalInsumos: 0,
      activos: 0,
      inactivos: 0,
      existenciasBodegaActual: 0,
      valorInventarioEstimado: 0,
      promedioMesesCobertura: 0,
    };
  }

  private coberturaVacia(): AbastecimientoGeneralGuardado['cobertura'] {
    return {
      filas: [],
      totalCantidad: 0,
      totalPorcentaje: 0,
      disponibilidad: 0,
      abastecimiento: 0,
    };
  }

  private recalcularResumen(insumos: GuardarAbastecimientoGeneralPayload[]): AbastecimientoGeneralGuardado['resumen'] {
    if (!insumos.length) {
      return this.resumenVacio();
    }

    let sumaMeses = 0;
    let sumaValor = 0;
    let sumaBodega = 0;
    let activos = 0;

    insumos.forEach((insumo) => {
      const existenciasBodega = this.toNumber(insumo.existenciasBodega);
      const valorEstimado = this.obtenerValorEstimado(insumo);
      sumaBodega += existenciasBodega;
      sumaValor += valorEstimado;
      const meses = this.calcularMesesCobertura(insumo);
      sumaMeses += meses;
      if (Boolean(insumo.activo)) {
        activos += 1;
      }
    });

    const totalInsumos = insumos.length;
    const promedioMeses = totalInsumos ? this.redondear(sumaMeses / totalInsumos, 2) : 0;

    return {
      totalInsumos,
      activos,
      inactivos: totalInsumos - activos,
      existenciasBodegaActual: Math.max(0, Math.round(sumaBodega)),
      valorInventarioEstimado: this.redondear(sumaValor, 2),
      promedioMesesCobertura: promedioMeses,
    };
  }

  private recalcularCobertura(insumos: GuardarAbastecimientoGeneralPayload[]): AbastecimientoGeneralGuardado['cobertura'] {
    const activos = insumos.filter((insumo) => Boolean(insumo.activo));
    if (!activos.length) {
      return this.coberturaVacia();
    }

    const rangos = [
      { etiqueta: '0', condicion: (meses: number) => meses === 0 },
      { etiqueta: '0.01 a 0.50', condicion: (meses: number) => meses > 0 && meses <= 0.5 },
      { etiqueta: '0.51 a 1.00', condicion: (meses: number) => meses > 0.5 && meses <= 1 },
      { etiqueta: '1.01 a 3.00', condicion: (meses: number) => meses > 1 && meses <= 3 },
      { etiqueta: '3.01 a 6.00', condicion: (meses: number) => meses > 3 && meses <= 6 },
      { etiqueta: '> de 6.01', condicion: (meses: number) => meses > 6 },
    ];

    const total = activos.length;
    const filas = rangos.map((rango) => {
      const cantidad = activos.filter((insumo) => rango.condicion(this.calcularMesesCobertura(insumo))).length;
      const porcentaje = total ? this.redondear((cantidad / total) * 100, 2) : 0;
      return { etiqueta: rango.etiqueta, cantidad, porcentaje };
    });

    const disponibilidad = activos.filter((insumo) => this.calcularMesesCobertura(insumo) > 1).length;
    const abastecimiento = activos.filter((insumo) => this.calcularMesesCobertura(insumo) >= 3).length;

    return {
      filas,
      totalCantidad: activos.length,
      totalPorcentaje: 100,
      disponibilidad: total ? this.redondear((disponibilidad / total) * 100, 2) : 0,
      abastecimiento: total ? this.redondear((abastecimiento / total) * 100, 2) : 0,
    };
  }

  private toNumber(valor: unknown): number {
    const numero = Number(valor ?? 0);
    return Number.isFinite(numero) ? numero : 0;
  }

  private redondear(valor: number, decimales: number): number {
    const factor = Math.pow(10, decimales);
    return Math.round(valor * factor) / factor;
  }
}

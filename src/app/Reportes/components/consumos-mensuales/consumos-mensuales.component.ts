import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  computed,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReportesService } from '../../services/reportes.service';
import {
  ConsumoMensualDetalleResponse,
  ConsumoMensualResponse,
  ConsumoPeriodoDetalle,
} from '../../interfaces/reportes.interface';
import { AuthService } from '../../../shared/services/auth.service';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { QuetzalesPipe } from '../../../shared/pipes/quetzales.pipe';

interface CalendarioFila {
  codigoInsumo: number;
  nombreInsumo: string;
  caracteristicas: string;
  renglon?: number | null;
  totalCantidad: number;
  totalGeneral: number;
  totalDespachos: number;
  valoresPorDia: Array<{
    fecha: string;
    anio: number;
    mes: number;
    dia: number;
    totalCantidad: number;
    totalGeneral: number;
    totalDespachos: number;
  }>;
}

@Component({
  selector: 'app-consumos-mensuales',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuetzalesPipe],
  templateUrl: './consumos-mensuales.component.html',
  styleUrls: ['./consumos-mensuales.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsumosMensualesComponent implements OnInit {
  readonly filtrosForm: FormGroup;
  readonly detalle = signal<ConsumoMensualDetalleResponse | null>(null);
  readonly periodoSeleccionado = signal<string>('mensual');
  readonly cargando = signal<boolean>(false);
  readonly cargandoPromedios = signal<boolean>(false);
  readonly resumenAnual = signal<ConsumoMensualResponse | null>(null);
  readonly mostrarPromedios = signal<boolean>(false);
  readonly renglonesDisponibles = signal<number[]>([]);
  readonly meses = Array.from({ length: 12 }, (_, index) => ({
    valor: index + 1,
    nombre: new Date(2000, index, 1).toLocaleString('es-GT', {
      month: 'long',
    }),
  }));

  readonly periodosDisponibles = computed(() => {
    const data = this.detalle();
    if (!data) return [];
    return data.periodos.map((periodo) => ({
      etiqueta: periodo.etiqueta,
      mesesConsiderados: periodo.mesesConsiderados,
      titulo:
        periodo.etiqueta === 'mensual'
          ? 'Consumo mensual'
          : `Promedio ${periodo.mesesConsiderados} meses`,
    }));
  });

  readonly periodoActivo = computed<ConsumoPeriodoDetalle | null>(() => {
    const data = this.detalle();
    if (!data) {
      return null;
    }
    const etiqueta = this.periodoSeleccionado();
    return (
      data.periodos.find((periodo) => periodo.etiqueta === etiqueta) ??
      data.periodos[0] ??
      null
    );
  });

  readonly diasCalendario = computed(() => this.periodoActivo()?.dias ?? []);

  readonly filasCalendario = computed<CalendarioFila[]>(() => {
    const periodo = this.periodoActivo();
    if (!periodo) {
      return [];
    }

    const dias = periodo.dias ?? [];
    return periodo.insumos.map((insumo) => ({
      codigoInsumo: insumo.codigoInsumo,
      nombreInsumo: insumo.nombreInsumo,
      caracteristicas: insumo.caracteristicas,
      renglon: insumo.renglon,
      totalCantidad: insumo.totalCantidad,
      totalGeneral: insumo.totalGeneral,
      totalDespachos: insumo.totalDespachos,
      valoresPorDia: dias.map((dia) => {
        const detalleDia = insumo.dias?.find((d) => d.fecha === dia.fecha);
        return {
          fecha: dia.fecha,
          anio: dia.anio,
          mes: dia.mes,
          dia: dia.dia,
          totalCantidad: detalleDia?.totalCantidad ?? 0,
          totalGeneral: detalleDia?.totalGeneral ?? 0,
          totalDespachos: detalleDia?.totalDespachos ?? 0,
        };
      }),
    }));
  });

  readonly filasPromedios = computed(() => {
    const resumen = this.resumenAnual();
    if (!resumen?.insumos?.length) {
      return [];
    }

    const ordenMeses = this.meses.map((mes) => mes.valor);

    return resumen.insumos
      .map((insumo) => {
        const valores = ordenMeses.map((mes) => {
          const info = insumo.meses.find((item) => item.mes === mes);
          return info?.totalCantidad ?? 0;
        });
        const total = valores.reduce((acc, valor) => acc + valor, 0);
        return {
          codigoInsumo: insumo.codigoInsumo,
          nombreInsumo: insumo.nombreInsumo,
          caracteristicas: insumo.caracteristicas,
          renglon: insumo.renglon ?? null,
          valores,
          total,
        };
      })
      .sort((a, b) => {
        const diff = b.total - a.total;
        if (diff !== 0) {
          return diff;
        }
        return a.nombreInsumo.localeCompare(b.nombreInsumo, 'es', {
          sensitivity: 'base',
        });
      });
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly reportesService: ReportesService,
    private readonly authService: AuthService,
    private readonly sweetAlert: SweetAlertService,
    private readonly destroyRef: DestroyRef,
  ) {
    const { anio: anioActual, mes: mesActual } = this.obtenerPeriodoCorteActual();
    this.filtrosForm = this.fb.group({
      anio: [anioActual],
      mes: [mesActual],
      renglon: [''],
    });

    const usuario = this.authService.getCurrentUser();
    this.renglonesDisponibles.set(usuario?.renglonesPermitidos ?? []);
  }

  private obtenerPeriodoCorteActual(fechaReferencia = new Date()) {
    let anio = fechaReferencia.getFullYear();
    let mes = fechaReferencia.getMonth() + 1;
    const dia = fechaReferencia.getDate();

    if (dia >= 26) {
      mes += 1;
      if (mes === 13) {
        mes = 1;
        anio += 1;
      }
    }

    return { anio, mes };
  }

  ngOnInit(): void {
    this.filtrosForm
      .get('anio')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargarDatos());

    this.filtrosForm
      .get('mes')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargarDatos());

    this.filtrosForm
      .get('renglon')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargarDatos());

    this.cargarDatos();
  }

  private construirFiltros() {
    const { anio, mes, renglon } = this.filtrosForm.value as {
      anio?: number;
      mes?: number;
      renglon?: string | number | null;
    };

    const filtros: {
      anio?: number;
      mes?: number;
      renglones?: number[];
    } = {};

    if (typeof anio === 'number' && Number.isFinite(anio)) {
      filtros.anio = anio;
    }

    if (typeof mes === 'number' && Number.isFinite(mes)) {
      filtros.mes = mes;
    }

    if (renglon !== undefined && renglon !== null && renglon !== '') {
      const valor = Number(renglon);
      if (Number.isFinite(valor)) {
        filtros.renglones = [valor];
      }
    }

    return filtros;
  }

  cargarDatos(): void {
    this.cargando.set(true);
    const filtros = this.construirFiltros();
    this.reportesService.obtenerConsumosMensualesDetalle(filtros).subscribe({
      next: (data) => {
        this.detalle.set(data);
        const existente = this.periodoSeleccionado();
        const etiquetasDisponibles = data.periodos.map((p) => p.etiqueta);
        if (!etiquetasDisponibles.includes(existente)) {
          this.periodoSeleccionado.set('mensual');
        }
        if (this.mostrarPromedios()) {
          this.cargarPromedios();
        } else {
          this.resumenAnual.set(null);
        }
        this.cargando.set(false);
      },
      error: (error) => {
        this.cargando.set(false);
        this.sweetAlert.error(
          'Error al cargar los consumos mensuales',
          error?.message ?? 'Ocurrió un error inesperado',
        );
      },
    });
  }

  limpiarFiltros(): void {
    const { anio: anioActual, mes: mesActual } = this.obtenerPeriodoCorteActual();
    this.filtrosForm.reset(
      {
        anio: anioActual,
        mes: mesActual,
        renglon: '',
      },
      { emitEvent: false },
    );
    this.cargarDatos();
  }

  seleccionarPeriodo(etiqueta: string): void {
    this.periodoSeleccionado.set(etiqueta);
  }

  abrirModalPromedios(): void {
    if (this.mostrarPromedios()) {
      return;
    }
    this.mostrarPromedios.set(true);
    this.cargarPromedios();
  }

  cerrarModalPromedios(): void {
    if (!this.mostrarPromedios()) {
      return;
    }
    this.mostrarPromedios.set(false);
    this.resumenAnual.set(null);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cerrarModalPromedios();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapePressed(event: KeyboardEvent): void {
    if (!this.mostrarPromedios()) {
      return;
    }
    event.preventDefault();
    this.cerrarModalPromedios();
  }

  private cargarPromedios(): void {
    if (this.cargandoPromedios()) {
      return;
    }

    const filtrosBase = this.construirFiltros();
    const filtros = { ...filtrosBase } as {
      anio?: number;
      mes?: number;
      renglones?: number[];
    };
    delete filtros.mes;

    this.cargandoPromedios.set(true);
    this.reportesService.obtenerConsumosMensuales(filtros).subscribe({
      next: (data) => {
        if (this.mostrarPromedios()) {
          this.resumenAnual.set(data);
        }
        this.cargandoPromedios.set(false);
      },
      error: (error) => {
        this.cargandoPromedios.set(false);
        this.sweetAlert.error(
          'Error al cargar promedios mensuales',
          error?.message ?? 'Ocurrió un error inesperado',
        );
      },
    });
  }
}

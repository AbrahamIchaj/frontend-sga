import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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
  ConsumoPeriodoDetalle,
} from '../../interfaces/reportes.interface';
import { AuthService } from '../../../shared/services/auth.service';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';

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
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './consumos-mensuales.component.html',
  styleUrls: ['./consumos-mensuales.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsumosMensualesComponent implements OnInit {
  readonly filtrosForm: FormGroup;
  readonly detalle = signal<ConsumoMensualDetalleResponse | null>(null);
  readonly periodoSeleccionado = signal<string>('mensual');
  readonly cargando = signal<boolean>(false);
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

  constructor(
    private readonly fb: FormBuilder,
    private readonly reportesService: ReportesService,
    private readonly authService: AuthService,
    private readonly sweetAlert: SweetAlertService,
    private readonly destroyRef: DestroyRef,
  ) {
    const anioActual = new Date().getFullYear();
    const mesActual = new Date().getMonth() + 1;
    this.filtrosForm = this.fb.group({
      anio: [anioActual],
      mes: [mesActual],
      renglon: [''],
    });

    const usuario = this.authService.getCurrentUser();
    this.renglonesDisponibles.set(usuario?.renglonesPermitidos ?? []);
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
    const anioActual = new Date().getFullYear();
    const mesActual = new Date().getMonth() + 1;
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
}

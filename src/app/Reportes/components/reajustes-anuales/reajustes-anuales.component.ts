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
  ReajusteAnualDetalle,
  ReporteAnualResponse,
} from '../../interfaces/reportes.interface';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { AuthService } from '../../../shared/services/auth.service';

interface TablaReajustesFila {
  anio: number;
  mes: number;
  nombreMes: string;
  totalRegistros: number;
  totalCantidad: number;
}

@Component({
  selector: 'app-reajustes-anuales',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reajustes-anuales.component.html',
  styleUrls: ['./reajustes-anuales.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReajustesAnualesComponent implements OnInit {
  readonly filtrosForm: FormGroup;
  readonly cargando = signal<boolean>(false);
  readonly reporte = signal<ReporteAnualResponse | null>(null);
  readonly renglonesDisponibles = signal<number[]>([]);

  readonly filasTabla = computed<TablaReajustesFila[]>(() => {
    const data = this.reporte();
    if (!data) {
      return [];
    }

    return data.anios
      .flatMap((anio) =>
        anio.meses.map((mes) => ({
          anio: anio.anio,
          mes: mes.mes,
          nombreMes: mes.nombreMes,
          totalRegistros: mes.totalRegistros,
          totalCantidad: mes.totalCantidad,
        })),
      )
      .sort((a, b) => (a.anio === b.anio ? a.mes - b.mes : a.anio - b.anio));
  });

  readonly resumenGeneral = computed(() => {
    const data = this.reporte();
    if (!data) {
      return {
        totalRegistros: 0,
        totalCantidad: 0,
      };
    }

    return data.anios.reduce(
      (acumulado, anio) => ({
        totalRegistros: acumulado.totalRegistros + anio.totalRegistros,
        totalCantidad: acumulado.totalCantidad + anio.totalCantidad,
      }),
      { totalRegistros: 0, totalCantidad: 0 },
    );
  });

  readonly detalleOrdenado = computed<ReajusteAnualDetalle[]>(() => {
    const data = this.reporte();
    if (!data?.detalle) {
      return [];
    }

    return [...data.detalle].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly reportesService: ReportesService,
    private readonly sweetAlert: SweetAlertService,
    private readonly authService: AuthService,
    private readonly destroyRef: DestroyRef,
  ) {
    const anioActual = new Date().getFullYear();
    this.filtrosForm = this.fb.group({
      anioInicio: [anioActual],
      anioFin: [anioActual],
      renglon: [''],
    });

    const usuario = this.authService.getCurrentUser();
    this.renglonesDisponibles.set(usuario?.renglonesPermitidos ?? []);
  }

  ngOnInit(): void {
    this.filtrosForm
      .get('anioInicio')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargarDatos());

    this.filtrosForm
      .get('anioFin')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargarDatos());

    this.filtrosForm
      .get('renglon')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargarDatos());

    this.cargarDatos();
  }

  private construirFiltros() {
    const { anioInicio, anioFin, renglon } = this.filtrosForm.value as {
      anioInicio?: number;
      anioFin?: number;
      renglon?: string | number | null;
    };

    const filtros: {
      anioInicio?: number;
      anioFin?: number;
      renglones?: number[];
    } = {};

    if (typeof anioInicio === 'number' && Number.isFinite(anioInicio)) {
      filtros.anioInicio = anioInicio;
    }

    if (typeof anioFin === 'number' && Number.isFinite(anioFin)) {
      filtros.anioFin = anioFin;
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
    this.reportesService.obtenerReajustesAnuales(filtros).subscribe({
      next: (data) => {
        this.reporte.set(data);
        this.cargando.set(false);
      },
      error: (error) => {
        this.cargando.set(false);
        this.sweetAlert.error(
          'Error al cargar los reajustes anuales',
          error?.message ?? 'Ocurrió un error inesperado',
        );
      },
    });
  }

  limpiarFiltros(): void {
    const anioActual = new Date().getFullYear();
    this.filtrosForm.reset(
      {
        anioInicio: anioActual,
        anioFin: anioActual,
        renglon: '',
      },
      { emitEvent: false },
    );
    this.cargarDatos();
  }

  obtenerEtiquetaTipo(tipo: number): string {
    switch (tipo) {
      case 1:
        return 'Ingreso';
      case 2:
        return 'Salida';
      default:
        return `Tipo ${tipo}`;
    }
  }
}

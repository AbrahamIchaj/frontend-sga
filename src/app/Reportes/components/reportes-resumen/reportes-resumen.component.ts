import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReportesService } from '../../services/reportes.service';
import { ReporteResumenResponse } from '../../interfaces/reportes.interface';
import { AuthService } from '../../../shared/services/auth.service';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { QuetzalesPipe } from '../../../shared/pipes/quetzales.pipe';

@Component({
  selector: 'app-reportes-resumen',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuetzalesPipe],
  templateUrl: './reportes-resumen.component.html',
  styleUrls: ['./reportes-resumen.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportesResumenComponent implements OnInit {
  readonly filtrosForm: FormGroup;
  readonly resumen = signal<ReporteResumenResponse | null>(null);
  readonly cargando = signal<boolean>(false);
  readonly renglonesDisponibles = signal<number[]>([]);

  constructor(
    private readonly fb: FormBuilder,
    private readonly reportesService: ReportesService,
    private readonly authService: AuthService,
    private readonly sweetAlert: SweetAlertService,
    private readonly destroyRef: DestroyRef,
  ) {
    const anioActual = new Date().getFullYear();
    this.filtrosForm = this.fb.group({
      anio: [anioActual],
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
      .get('renglon')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargarDatos());

    this.cargarDatos();
  }

  private construirFiltros() {
    const { anio, renglon } = this.filtrosForm.value as {
      anio?: number;
      renglon?: string | number | null;
    };

    const filtros: { anio?: number; renglones?: number[] } = {};

    if (typeof anio === 'number' && Number.isFinite(anio)) {
      filtros.anio = anio;
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
    this.reportesService.obtenerResumen(filtros).subscribe({
      next: (data) => {
        this.resumen.set(data);
        this.cargando.set(false);
      },
      error: (error) => {
        this.cargando.set(false);
        this.sweetAlert.error(
          'Error al cargar el resumen de reportes',
          error?.message ?? 'Ocurrió un error inesperado',
        );
      },
    });
  }

  limpiarFiltros(): void {
    const anioActual = new Date().getFullYear();
    this.filtrosForm.reset(
      {
        anio: anioActual,
        renglon: '',
      },
      { emitEvent: false },
    );
    this.cargarDatos();
  }
}

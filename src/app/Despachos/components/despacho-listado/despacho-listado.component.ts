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
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DespachosService } from '../../services/despachos.service';
import {
  DespachoResumen,
  DespachosListResponse,
} from '../../interfaces/despachos.interface';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-despacho-listado',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './despacho-listado.component.html',
  styleUrls: ['./despacho-listado.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DespachoListadoComponent implements OnInit {
  readonly filtrosForm: FormGroup;
  readonly despachos = signal<DespachoResumen[]>([]);
  readonly meta = signal<DespachosListResponse['meta']>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  readonly cargando = signal<boolean>(false);

  constructor(
    private readonly fb: FormBuilder,
    private readonly despachosService: DespachosService,
    private readonly sweetAlert: SweetAlertService,
    private readonly destroyRef: DestroyRef,
  ) {
    this.filtrosForm = this.fb.group({
      buscar: [''],
      fechaDesde: [''],
      fechaHasta: [''],
      page: [1],
      limit: [10],
    });
  }

  ngOnInit(): void {
    ['buscar', 'fechaDesde', 'fechaHasta', 'limit'].forEach((controlName) => {
      this.filtrosForm.get(controlName)?.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.filtrosForm.patchValue({ page: 1 }, { emitEvent: false });
          this.cargarDespachos();
        });
    });

    this.filtrosForm.get('page')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargarDespachos());

    this.cargarDespachos();
  }

  cargarDespachos(): void {
    this.cargando.set(true);
    const filtros = this.filtrosForm.value;
    this.despachosService.listar({
      ...filtros,
      page: filtros.page,
      limit: filtros.limit,
    }).subscribe({
      next: (response) => {
        this.despachos.set(response.data);
        this.meta.set({
          ...response.meta,
          totalPages: response.meta.totalPages || 1,
        });
        this.cargando.set(false);
      },
      error: (error) => {
        this.cargando.set(false);
        this.sweetAlert.error('Error al cargar despachos', error?.message ?? 'Ocurrió un error inesperado');
      },
    });
  }

  actualizarPagina(page: number): void {
    if (page < 1 || page > this.meta().totalPages) return;
    this.filtrosForm.patchValue({ page });
  }

  trackById = (_: number, item: DespachoResumen) => item.idDespacho;
}

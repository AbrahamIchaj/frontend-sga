import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { ReajustesService } from '../../services/reajustes.service';
import { ReajusteResumen, ReajustesListResponse, TipoReajuste } from '../../interfaces/reajustes.interface';

interface FiltrosUI {
  referencia: string;
  tipoReajuste: '' | string;
  fechaDesde: string;
  fechaHasta: string;
}

@Component({
  selector: 'app-listado-reajustes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './listado-reajustes.component.html',
  styleUrls: ['./listado-reajustes.component.css'],
  providers: [DatePipe]
})
export class ListadoReajustesComponent implements OnInit, OnDestroy {
  filtros: FiltrosUI = {
    referencia: '',
    tipoReajuste: '',
    fechaDesde: '',
    fechaHasta: ''
  };

  registros: ReajusteResumen[] = [];
  meta: ReajustesListResponse['meta'] = {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  };

  loading = false;
  error = '';
  readonly itemsPorPagina = 10;

  private filterSubject = new Subject<FiltrosUI>();
  private filterSub?: Subscription;

  constructor(private service: ReajustesService, private router: Router, private datePipe: DatePipe) {}

  ngOnInit(): void {
    this.filterSub = this.filterSubject
      .pipe(
        map(f => ({ ...f })),
        debounceTime(400),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
      )
      .subscribe(() => this.load(1));

    this.load(1);
  }

  ngOnDestroy(): void {
    this.filterSub?.unsubscribe();
  }

  onFilterChange(): void {
    this.filterSubject.next({ ...this.filtros });
  }

  clearFilters(): void {
    this.filtros = { referencia: '', tipoReajuste: '', fechaDesde: '', fechaHasta: '' };
    this.onFilterChange();
  }

  load(page: number): void {
    if (this.loading) return;

    if (this.filtros.fechaDesde && this.filtros.fechaHasta) {
      const desde = new Date(this.filtros.fechaDesde);
      const hasta = new Date(this.filtros.fechaHasta);
      if (desde > hasta) {
        this.error = 'La fecha "desde" no puede ser mayor que la fecha "hasta"';
        return;
      }
    }

    this.loading = true;
    this.error = '';

    const filtros = {
      page,
      limit: this.itemsPorPagina,
      referencia: this.filtros.referencia?.trim() || undefined,
      tipoReajuste: this.filtros.tipoReajuste ? (Number(this.filtros.tipoReajuste) as TipoReajuste) : undefined,
      fechaDesde: this.filtros.fechaDesde || undefined,
      fechaHasta: this.filtros.fechaHasta || undefined
    };

    this.service.listar(filtros).subscribe({
      next: (res: ReajustesListResponse) => {
        this.registros = res.data ?? [];
        this.meta = res.meta ?? {
          total: this.registros.length,
          page,
          limit: this.itemsPorPagina,
          totalPages: Math.max(1, Math.ceil((this.registros.length || 1) / this.itemsPorPagina))
        };
        this.loading = false;
      },
      error: err => {
        console.error('Error al cargar reajustes', err);
        this.error = err?.message ?? 'No se pudieron cargar los reajustes';
        this.loading = false;
      }
    });
  }

  goToPage(page: number): void {
    if (page < 1 || page > (this.meta?.totalPages ?? 1) || page === this.meta.page) return;
    this.load(page);
  }

  tipoLabel(tipo: TipoReajuste): string {
    return tipo === 1 ? 'Entrada' : 'Salida';
  }

  tipoClase(tipo: TipoReajuste): string {
    return tipo === 1
      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
      : 'bg-orange-100 text-orange-700 border border-orange-200';
  }

  verDetalle(registro: ReajusteResumen): void {
    this.router.navigate(['/reajustes', registro.idReajuste]);
  }

  crearReajuste(): void {
    this.router.navigate(['/reajustes/nuevo']);
  }

  trackById(_index: number, item: ReajusteResumen): number {
    return item.idReajuste;
  }

  formatearFecha(fecha: string): string {
    return this.datePipe.transform(fecha, 'dd/MM/yyyy - HH:mm') ?? '';
  }

  get mostrandoDesde(): number {
    if (!this.meta?.total || !this.meta?.page) return 0;
    return (this.meta.page - 1) * this.meta.limit + (this.registros.length > 0 ? 1 : 0);
  }

  get mostrandoHasta(): number {
    if (!this.meta?.total || !this.meta?.page) return 0;
    return (this.meta.page - 1) * this.meta.limit + this.registros.length;
  }
}

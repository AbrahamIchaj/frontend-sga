import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription, switchMap } from 'rxjs';
import { QuetzalesPipe } from '../../../shared/pipes/quetzales.pipe';
import { ReajustesService } from '../../services/reajustes.service';
import { ReajusteCompleto, ReajusteDetalle, TipoReajuste } from '../../interfaces/reajustes.interface';

@Component({
  selector: 'app-detalle-reajuste',
  standalone: true,
  imports: [CommonModule, RouterModule, QuetzalesPipe],
  templateUrl: './detalle-reajuste.component.html',
  styleUrls: ['./detalle-reajuste.component.css'],
  providers: [DatePipe]
})
export class DetalleReajusteComponent implements OnInit, OnDestroy {
  reajuste?: ReajusteCompleto;
  loading = true;
  error = '';
  totales = {
    cantidad: 0,
    lineas: 0
  };
  totalValor = 0;

  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: ReajustesService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap
      .pipe(
        switchMap(params => {
          const id = Number(params.get('id'));
          if (!id || Number.isNaN(id)) {
            throw new Error('Identificador inválido de reajuste');
          }
          this.loading = true;
          this.error = '';
          return this.service.obtenerPorId(id);
        })
      )
      .subscribe({
        next: reajuste => {
          const detalles = Array.isArray(reajuste.ReajusteDetalle) ? reajuste.ReajusteDetalle : [];
          this.reajuste = {
            ...reajuste,
            ReajusteDetalle: detalles
          };
          this.totales = {
            cantidad: detalles.reduce((acc, item) => acc + (Number(item.cantidad) || 0), 0),
            lineas: detalles.length
          };
          this.totalValor = detalles.reduce((acc, item) => {
            const precio = Number(item?.Inventario?.precioUnitario ?? 0);
            return acc + precio * Number(item?.cantidad ?? 0);
          }, 0);
          this.loading = false;
        },
        error: err => {
          console.error('Error al obtener reajuste', err);
          this.error = err?.message ?? 'No se pudo cargar el reajuste solicitado';
          this.loading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  volver(): void {
    this.router.navigate(['/reajustes', 'listado']);
  }

  tipoLabel(tipo: TipoReajuste): string {
    return tipo === 1 ? 'Entrada' : 'Salida';
  }

  tipoClase(tipo: TipoReajuste): string {
    return tipo === 1
      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
      : 'bg-orange-100 text-orange-700 border border-orange-300';
  }

  formatearFecha(fecha?: string | null): string {
    if (!fecha) return '—';
    return this.datePipe.transform(fecha, 'dd/MM/yyyy') ?? '—';
  }

  detalleTrackBy(_index: number, item: ReajusteDetalle): number {
    return item.idReajusteDetalle;
  }

  precioUnitario(detalle: ReajusteDetalle): number {
    const raw = detalle.Inventario?.precioUnitario ?? 0;
    const valor = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(valor) ? valor : 0;
  }
}

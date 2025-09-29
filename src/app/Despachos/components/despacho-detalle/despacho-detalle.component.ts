import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DespachosService } from '../../services/despachos.service';
import { DespachoCompleto } from '../../interfaces/despachos.interface';

type DetalleAgrupado = {
  codigoInsumo: number;
  nombreInsumo: string;
  caracteristicas: string;
  presentacion: string | null;
  unidadMedida: string | null;
  totalCantidad: number;
  totalSubtotal: number;
  lotes: {
    idDespachoDetalle: number;
    lote: string | null;
    fechaVencimiento: string | null;
    cantidad: number;
    precioUnitario: number;
    precioTotal: number;
  }[];
};

@Component({
  selector: 'app-despacho-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './despacho-detalle.component.html',
  styleUrls: ['./despacho-detalle.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DespachoDetalleComponent implements OnInit {
  readonly despacho = signal<DespachoCompleto | null>(null);
  readonly cargando = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  readonly detallesAgrupados = computed<DetalleAgrupado[]>(() => {
    const detalles = this.despacho()?.detalles ?? [];
    const mapa = new Map<number, DetalleAgrupado>();

    for (const detalle of detalles) {
      const existente = mapa.get(detalle.codigoInsumo);

      if (!existente) {
        mapa.set(detalle.codigoInsumo, {
          codigoInsumo: detalle.codigoInsumo,
          nombreInsumo: detalle.nombreInsumo,
          caracteristicas: detalle.caracteristicas,
          presentacion: detalle.presentacion,
          unidadMedida: detalle.unidadMedida,
          totalCantidad: detalle.cantidad,
          totalSubtotal: detalle.precioTotal,
          lotes: [
            {
              idDespachoDetalle: detalle.idDespachoDetalle,
              lote: detalle.lote,
              fechaVencimiento: detalle.fechaVencimiento,
              cantidad: detalle.cantidad,
              precioUnitario: detalle.precioUnitario,
              precioTotal: detalle.precioTotal,
            },
          ],
        });
        continue;
      }

      existente.totalCantidad += detalle.cantidad;
      existente.totalSubtotal += detalle.precioTotal;
      existente.lotes.push({
        idDespachoDetalle: detalle.idDespachoDetalle,
        lote: detalle.lote,
        fechaVencimiento: detalle.fechaVencimiento,
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario,
        precioTotal: detalle.precioTotal,
      });
    }

    return Array.from(mapa.values()).sort((a, b) =>
      a.nombreInsumo.localeCompare(b.nombreInsumo, 'es', { sensitivity: 'base' }),
    );
  });

  readonly totalProductos = computed(() => this.detallesAgrupados().length);
  readonly totalLotes = computed(() => this.despacho()?.detalles.length ?? 0);
  readonly totalCantidad = computed(() =>
    this.despacho()?.detalles.reduce((acc, detalle) => acc + detalle.cantidad, 0) ?? 0,
  );

  constructor(
    private readonly route: ActivatedRoute,
    private readonly despachosService: DespachosService,
  ) {}

  ngOnInit(): void {
    const idParam = Number(this.route.snapshot.paramMap.get('id'));
    if (!idParam || Number.isNaN(idParam)) {
      this.error.set('Identificador de despacho inválido');
      this.cargando.set(false);
      return;
    }

    this.cargarDespacho(idParam);
  }

  private cargarDespacho(id: number): void {
    this.cargando.set(true);
    this.error.set(null);

    this.despachosService.obtenerPorId(id).subscribe({
      next: (response) => {
        this.despacho.set(response);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'No se pudo cargar el despacho seleccionado');
        this.cargando.set(false);
      },
    });
  }

  trackByProducto = (_: number, item: DetalleAgrupado) => item.codigoInsumo;

  trackByLote = (_: number, item: DetalleAgrupado['lotes'][number]) =>
    item.idDespachoDetalle;
}

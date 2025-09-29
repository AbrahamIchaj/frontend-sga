import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { DespachosService } from '../../services/despachos.service';
import {
  CarritoItem,
  CreateDespachoRequest,
  DisponibilidadProducto,
  DisponibilidadLote,
} from '../../interfaces/despachos.interface';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { ServiciosService } from '../../../Servicios/services/servicios.service';
import { Servicio } from '../../../Servicios/models/servicio.model';
import { Observable, of } from 'rxjs';

interface LoteConsumoResumen {
  idInventario: number;
  lote: string;
  fechaVencimiento: string | null;
  cartaCompromiso: boolean;
  cantidadDisponible: number;
  cantidadSolicitada: number;
  cantidadRestante: number;
}

@Component({
  selector: 'app-despacho-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    CurrencyPipe,
    DatePipe,
  ],
  templateUrl: './despacho-form.component.html',
  styleUrls: ['./despacho-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DespachoFormComponent implements OnInit {
  readonly form: FormGroup;
  readonly busquedaControl = new FormControl<string>('');
  readonly Math = Math;

  private readonly lotesCache = new Map<
    number,
    {
      cantidad: number;
      resumen: LoteConsumoResumen[];
    }
  >();

  private readonly productos = signal<DisponibilidadProducto[]>([]);
  readonly productosFiltrados = computed(() => {
    const termino = (this.busquedaControl.value ?? '').trim().toLowerCase();
    if (!termino) {
      return this.productos();
    }
    return this.productos().filter((producto) => {
      return (
        producto.nombreInsumo.toLowerCase().includes(termino) ||
        producto.caracteristicas.toLowerCase().includes(termino) ||
        String(producto.codigoInsumo).includes(termino)
      );
    });
  });

  readonly carrito = signal<CarritoItem[]>([]);

  readonly totalCantidad = computed(() =>
    this.carrito().reduce((acc, item) => acc + item.cantidadSolicitada, 0),
  );

  readonly totalEstimado = computed(() =>
    this.carrito().reduce((acc, item) => {
      const producto = this.buscarProducto(item.codigoInsumo);
      const precioPromedio = this.calcularPrecioPromedio(producto);
      return acc + item.cantidadSolicitada * precioPromedio;
    }, 0),
  );

  servicios$: Observable<Servicio[]> = of([]);
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);

  seleccionado = signal<{
    producto: DisponibilidadProducto;
    cantidad: number;
  } | null>(null);

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly despachosService: DespachosService,
    private readonly serviciosService: ServiciosService,
    private readonly sweetAlert: SweetAlertService,
  ) {
    this.form = this.fb.group({
      idServicio: [null],
      observaciones: ['', [Validators.maxLength(300)]],
    });

    effect(() => {
      const seleccion = this.seleccionado();
      if (seleccion) {
        const item = this.carrito().find(
          (c) => c.codigoInsumo === seleccion.producto.codigoInsumo,
        );
        const disponible = seleccion.producto.existenciaTotal;
        const yaSeleccionado = item?.cantidadSolicitada ?? 0;
        if (seleccion.cantidad > disponible - yaSeleccionado) {
          this.seleccionado.set({
            producto: seleccion.producto,
            cantidad: Math.max(1, disponible - yaSeleccionado),
          });
        }
      }
    });
  }

  ngOnInit(): void {
    this.cargarDisponibilidad();
    this.servicios$ = this.serviciosService.getAll();
  }

  cantidadSeleccionada(codigoInsumo: number): number {
    return (
      this.carrito().find((item) => item.codigoInsumo === codigoInsumo)
        ?.cantidadSolicitada ?? 0
    );
  }

  estaAgotado(producto: DisponibilidadProducto): boolean {
    const seleccionado = this.cantidadSeleccionada(producto.codigoInsumo);
    return seleccionado >= producto.existenciaTotal;
  }

  obtenerResumenLotes(producto: DisponibilidadProducto, cantidad: number): LoteConsumoResumen[] {
    const cacheKey = producto.codigoInsumo;
    const cantidadSeleccionada = Math.max(0, Math.min(cantidad, producto.existenciaTotal));
    const cacheEntry = this.lotesCache.get(cacheKey);

    if (cacheEntry && cacheEntry.cantidad === cantidadSeleccionada) {
      return cacheEntry.resumen;
    }

    const resumen = this.calcularDistribucionPorLotes(producto.lotes, cantidadSeleccionada);
    this.lotesCache.set(cacheKey, {
      cantidad: cantidadSeleccionada,
      resumen,
    });
    return resumen;
  }

  obtenerResumenLotesPorCodigo(codigoInsumo: number): LoteConsumoResumen[] | null {
    const producto = this.buscarProducto(codigoInsumo);
    if (!producto) return null;
    const cantidad = this.cantidadSeleccionada(codigoInsumo);
    return this.obtenerResumenLotes(producto, cantidad);
  }

  private cargarDisponibilidad(): void {
    this.cargando.set(true);
    this.despachosService.disponibilidad().subscribe({
      next: (data) => {
        this.productos.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'No se pudo cargar el inventario');
        this.cargando.set(false);
      },
    });
  }

  abrirSeleccion(producto: DisponibilidadProducto): void {
    const existente = this.carrito().find(
      (item) => item.codigoInsumo === producto.codigoInsumo,
    );
    const disponible = producto.existenciaTotal - (existente?.cantidadSolicitada ?? 0);

    if (disponible <= 0) {
      this.sweetAlert.warning(
        'Sin existencias disponibles',
        'Ya has agotado las existencias disponibles de este producto en el carrito.',
      );
      return;
    }

    this.seleccionado.set({ producto, cantidad: Math.min(1, disponible) });
  }

  cancelarSeleccion(): void {
    this.seleccionado.set(null);
  }

  confirmarSeleccion(): void {
    const seleccion = this.seleccionado();
    if (!seleccion) return;

    const { producto, cantidad } = seleccion;
    if (cantidad <= 0) {
      this.sweetAlert.warning('Cantidad inválida', 'La cantidad debe ser mayor a cero.');
      return;
    }

    const maximo = producto.existenciaTotal;
    const actual = this.carrito().find(
      (item) => item.codigoInsumo === producto.codigoInsumo,
    );
    const yaSeleccionado = actual?.cantidadSolicitada ?? 0;

    if (cantidad + yaSeleccionado > maximo) {
      this.sweetAlert.warning(
        'Cantidad excedida',
        `Solo puedes agregar ${maximo - yaSeleccionado} unidades adicionales de este producto`,
      );
      return;
    }

    if (actual) {
      this.carrito.update((items) =>
        items.map((item) =>
          item.codigoInsumo === producto.codigoInsumo
            ? {
                ...item,
                cantidadSolicitada: item.cantidadSolicitada + cantidad,
              }
            : item,
        ),
      );
    } else {
      this.carrito.update((items) => [
        ...items,
        {
          codigoInsumo: producto.codigoInsumo,
          nombreInsumo: producto.nombreInsumo,
          caracteristicas: producto.caracteristicas,
          presentacion: producto.presentacion,
          unidadMedida: producto.unidadMedida,
          existenciaTotal: producto.existenciaTotal,
          cantidadSolicitada: cantidad,
        },
      ]);
    }

    this.lotesCache.delete(producto.codigoInsumo);

    this.seleccionado.set(null);
  }

  actualizarCantidad(codigoInsumo: number, valor: number): void {
    const producto = this.buscarProducto(codigoInsumo);
    if (!producto) return;

    const maximo = producto.existenciaTotal;

    this.carrito.update((items) =>
      items.map((item) => {
        if (item.codigoInsumo !== codigoInsumo) return item;
        const nuevaCantidad = Math.max(0, Math.min(maximo, Math.floor(valor)));
        return {
          ...item,
          cantidadSolicitada: nuevaCantidad,
        };
      }),
    );

    this.carrito.update((items) => items.filter((item) => item.cantidadSolicitada > 0));
    this.lotesCache.delete(codigoInsumo);
  }

  eliminarItem(codigoInsumo: number): void {
    this.carrito.update((items) =>
      items.filter((item) => item.codigoInsumo !== codigoInsumo),
    );
    this.lotesCache.delete(codigoInsumo);
  }

  calcularSubtotal(item: CarritoItem): number {
    const producto = this.buscarProducto(item.codigoInsumo);
    const precioPromedio = this.calcularPrecioPromedio(producto);
    return item.cantidadSolicitada * precioPromedio;
  }

  async guardar(): Promise<void> {
    if (this.carrito().length === 0) {
      this.sweetAlert.warning(
        'Carrito vacío',
        'Debe agregar al menos un producto para registrar el despacho.',
      );
      return;
    }

    if (this.totalCantidad() <= 0) {
      this.sweetAlert.warning(
        'Cantidad inválida',
        'Las cantidades seleccionadas deben ser mayores a cero.',
      );
      return;
    }

    const detalles: CreateDespachoRequest['detalles'] = this.carrito().map(
      (item) => ({
        codigoInsumo: item.codigoInsumo,
        cantidad: item.cantidadSolicitada,
      }),
    );

    const payload: CreateDespachoRequest = {
      idServicio: this.form.value.idServicio ?? undefined,
      observaciones: this.form.value.observaciones ?? undefined,
      detalles,
    };

    try {
      this.sweetAlert.loading('Registrando despacho...');
      const despacho = await this.despachosService.crear(payload).toPromise();
      this.sweetAlert.closeLoading();

      if (!despacho) {
        throw new Error('No se recibió respuesta del servidor');
      }

      this.sweetAlert.success(
        'Despacho registrado',
        `Se generó el despacho ${despacho.codigoDespacho} con ${despacho.totalCantidad} unidades`,
      );

      this.router.navigate(['/despachos', despacho.idDespacho]);
    } catch (error: any) {
      this.sweetAlert.closeLoading();
      this.sweetAlert.error(
        'Error al registrar el despacho',
        error?.message ?? 'Ocurrió un error inesperado',
      );
    }
  }

  private buscarProducto(codigoInsumo: number): DisponibilidadProducto | undefined {
    return this.productos().find((prod) => prod.codigoInsumo === codigoInsumo);
  }

  private calcularPrecioPromedio(
    producto: DisponibilidadProducto | undefined,
  ): number {
    if (!producto || producto.lotes.length === 0) return 0;
    const totalCantidad = producto.lotes.reduce(
      (acc, lote) => acc + lote.cantidad,
      0,
    );
    if (totalCantidad === 0) return 0;
    const totalValor = producto.lotes.reduce(
      (acc, lote) => acc + lote.cantidad * lote.precioUnitario,
      0,
    );
    return totalValor / totalCantidad;
  }

  private calcularDistribucionPorLotes(
    lotes: DisponibilidadLote[],
    cantidad: number,
  ): LoteConsumoResumen[] {
    let pendiente = cantidad;
    const resumen: LoteConsumoResumen[] = [];

    for (const lote of lotes) {
      const porDespachar = Math.min(pendiente, lote.cantidad);
      pendiente = Math.max(pendiente - lote.cantidad, 0);

      resumen.push({
        idInventario: lote.idInventario,
        lote: lote.lote || 'Sin lote',
        fechaVencimiento: lote.fechaVencimiento,
        cartaCompromiso: lote.cartaCompromiso,
        cantidadDisponible: lote.cantidad,
        cantidadSolicitada: porDespachar,
        cantidadRestante: Math.max(lote.cantidad - porDespachar, 0),
      });
    }

    return resumen;
  }

  trackByCodigo = (_: number, item: { codigoInsumo: number }) => item.codigoInsumo;
}

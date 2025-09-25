import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import Swal from 'sweetalert2';
import { ReajustesService } from '../../services/reajustes.service';
import {
  CatalogoInsumoResumen,
  CreateReajusteDetalleDto,
  CreateReajusteDto,
  TipoReajuste
} from '../../interfaces/reajustes.interface';
import { InventarioService } from '../../../Inventario/inventario.service';
import { CatalogoInsumosService } from '../../../CatalogoInsumos/services/catalogo-insumos.service';
import { QuetzalesPipe } from '../../../shared/pipes/quetzales.pipe';

@Component({
  selector: 'app-form-reajuste',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, QuetzalesPipe],
  templateUrl: './form-reajuste.component.html',
  styleUrls: ['./form-reajuste.component.css']
})
export class FormReajusteComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private reajustesService = inject(ReajustesService);
  private inventarioService = inject(InventarioService);
  private catalogoService = inject(CatalogoInsumosService);

  reajusteForm!: FormGroup;
  detalleForm: FormGroup | null = null;

  buscandoCatalogo = false;
  catalogoBusqueda = '';
  catalogoResultados: CatalogoInsumoResumen[] = [];
  errorBusqueda = '';
  codigoBusqueda = '';
  modoIngreso: 'catalogo' | 'manual' = 'catalogo';

  detalleEditIndex: number | null = null;
  detalleStockDisponible: number | null = null;

  enviando = false;

  private catalogoSubject = new Subject<string>();
  private catalogoSub?: Subscription;

  readonly maxReferencia = 100;

  ngOnInit(): void {
    this.reajusteForm = this.fb.group({
      fechaReajuste: [this.formatDateTimeLocal(new Date()), [Validators.required]],
      tipoReajuste: ['1', [Validators.required]],
      referenciaDocumento: ['', [Validators.required, Validators.maxLength(this.maxReferencia)]],
      observaciones: [''],
      detalles: this.fb.array([])
    });

    this.catalogoSub = this.catalogoSubject
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(term => this.buscarCatalogo(term));

    this.reajusteForm
      .get('tipoReajuste')
      ?.valueChanges.subscribe(() => {
        this.actualizarValidadoresPrecio();
      });
  }

  ngOnDestroy(): void {
    this.catalogoSub?.unsubscribe();
  }

  get detallesArray(): FormArray {
    return this.reajusteForm.get('detalles') as FormArray;
  }

  get esEntrada(): boolean {
    return String(this.reajusteForm.get('tipoReajuste')?.value) === '1';
  }

  get esDetalleManual(): boolean {
    return Boolean(this.detalleForm && !this.detalleForm.get('idCatalogoInsumos')?.value);
  }

  formatDateTimeLocal(date: Date): string {
    const pad = (v: number) => `${v}`.padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mi = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }

  onCatalogoInput(term: string): void {
    if (this.modoIngreso !== 'catalogo') {
      this.catalogoBusqueda = term;
      return;
    }
    this.catalogoBusqueda = term;
    if (!term || term.trim().length < 2) {
      this.catalogoResultados = [];
      this.errorBusqueda = '';
      this.buscandoCatalogo = false;
      return;
    }
    this.catalogoSubject.next(term.trim());
  }

  private buscarCatalogo(term: string): void {
    if (!term || term.length < 2) return;
    this.buscandoCatalogo = true;
    this.errorBusqueda = '';
    this.catalogoService.search(term, 25).subscribe({
      next: resultados => {
        this.catalogoResultados = resultados;
        if (!resultados.length) {
          this.errorBusqueda = 'No se encontraron insumos con el término buscado.';
        }
        this.buscandoCatalogo = false;
      },
      error: err => {
        console.error('Error al buscar catálogo', err);
        this.errorBusqueda = 'Ocurrió un error al buscar en el catálogo';
        this.buscandoCatalogo = false;
      }
    });
  }

  buscarCatalogoPorCodigo(): void {
    if (this.modoIngreso !== 'catalogo') {
      return;
    }

    const term = this.codigoBusqueda?.trim();
    if (!term) {
      this.errorBusqueda = 'Ingresa un código de insumo para buscar.';
      this.catalogoResultados = [];
      return;
    }

    this.buscandoCatalogo = true;
    this.errorBusqueda = '';
    this.catalogoService.buscarPorCodigo(term).subscribe({
      next: resultados => {
        this.catalogoResultados = resultados;
        if (!resultados.length) {
          this.errorBusqueda = `No se encontraron insumos con el código ${term}.`;
        }
        this.buscandoCatalogo = false;
      },
      error: err => {
        console.error('Error al buscar por código', err);
        this.errorBusqueda = 'Ocurrió un error al buscar el código indicado.';
        this.buscandoCatalogo = false;
      }
    });
  }

  cambiarModoIngreso(modo: 'catalogo' | 'manual'): void {
    if (this.modoIngreso === modo) {
      return;
    }
    this.modoIngreso = modo;
    this.errorBusqueda = '';
    this.catalogoResultados = [];
    this.buscandoCatalogo = false;
    if (modo === 'manual') {
      this.catalogoBusqueda = '';
      this.codigoBusqueda = '';
    }
  }

  iniciarDetalleManual(): void {
    this.modoIngreso = 'manual';
    this.detalleEditIndex = null;
    this.detalleStockDisponible = null;
    this.catalogoResultados = [];
    this.errorBusqueda = '';
    this.catalogoBusqueda = '';
    this.codigoBusqueda = '';
    this.detalleForm = this.crearDetalleForm({
      precioUnitario: this.esEntrada ? 0 : null
    });
    this.actualizarValidadoresPrecio();
  }

  seleccionarCatalogo(item: CatalogoInsumoResumen): void {
    this.detalleEditIndex = null;
    this.detalleStockDisponible = null;
    this.detalleForm = this.crearDetalleForm({
      idCatalogoInsumos: item.idCatalogoInsumos,
      renglon: item.renglon,
      codigoInsumo: item.codigoInsumo,
      codigoPresentacion: item.codigoPresentacion,
      nombreInsumo: item.nombreInsumo,
      caracteristicas: item.caracteristicas,
      nombrePresentacion: item.nombrePresentacion,
      unidadMedida: item.unidadMedida,
      precioReferencial: item.precioReferencial ?? 0
    });

    this.actualizarValidadoresPrecio();
    this.catalogoResultados = [];
    this.catalogoBusqueda = '';
    this.codigoBusqueda = '';

    if (!this.esEntrada) {
  const codigo = this.parseEntero(item.codigoInsumo, true);
      if (codigo) {
        this.cargarExistencias(codigo);
      }
    }
  }

  editarDetalle(index: number): void {
    const group = this.detallesArray.at(index) as FormGroup;
    if (!group) return;
    this.detalleEditIndex = index;
    this.detalleForm = this.crearDetalleForm(group.value ?? {});
    this.actualizarValidadoresPrecio();

    if (!this.esEntrada) {
  const codigo = this.parseEntero(group.get('codigoInsumo')?.value, true);
      if (codigo) this.cargarExistencias(codigo);
    }
  }

  eliminarDetalle(index: number): void {
    this.detallesArray.removeAt(index);
    if (this.detalleEditIndex === index) {
      this.detalleForm = null;
      this.detalleEditIndex = null;
    }
  }

  cancelarEdicion(): void {
    this.detalleForm = null;
    this.detalleEditIndex = null;
    this.detalleStockDisponible = null;
  }

  guardarDetalle(): void {
    if (!this.detalleForm) return;
    if (this.detalleForm.invalid) {
      this.detalleForm.markAllAsTouched();
      return;
    }

    const detalle = this.detalleForm.value;
    const nombre = this.stringOrEmpty(detalle?.nombreInsumo);
    const caracteristicas = this.stringOrEmpty(detalle?.caracteristicas);

    if (!nombre || !caracteristicas) {
      Swal.fire({
        icon: 'warning',
        title: 'Información incompleta',
        text: 'El nombre y las características del insumo son obligatorios.'
      });
      return;
    }

    const codigoIngresado = detalle?.codigoInsumo;
  const codigoNormalizado = this.parseEntero(codigoIngresado, true);
    if (
      codigoIngresado !== null &&
      codigoIngresado !== undefined &&
      `${codigoIngresado}`.trim() !== '' &&
      codigoNormalizado === null
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Código inválido',
        text: 'El código de insumo debe ser un número entero positivo.'
      });
      return;
    }

    const detalleNormalizado = this.normalizarDetalleValor({
      ...detalle,
      nombreInsumo: nombre,
      caracteristicas
    });

    if (!this.esEntrada && this.detalleStockDisponible !== null && detalleNormalizado.cantidad > this.detalleStockDisponible) {
      Swal.fire({
        icon: 'warning',
        title: 'Cantidad no disponible',
        text: `La cantidad solicitada (${detalleNormalizado.cantidad}) supera las existencias disponibles (${this.detalleStockDisponible}).`,
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (this.detalleEditIndex !== null) {
      (this.detallesArray.at(this.detalleEditIndex) as FormGroup).patchValue(detalleNormalizado);
    } else {
      this.detallesArray.push(this.crearDetalleForm(detalleNormalizado));
    }

    this.detalleForm = null;
    this.detalleEditIndex = null;
    this.detalleStockDisponible = null;
    this.actualizarValidadoresPrecio();
  }

  get totalLineas(): number {
    return this.detallesArray.length;
  }

  get totalCantidad(): number {
    return this.detallesArray.controls.reduce((acc, ctrl) => acc + Number(ctrl.get('cantidad')?.value || 0), 0);
  }

  get totalValor(): number {
    return this.detallesArray.controls.reduce((acc, ctrl) => {
      const cantidad = Number(ctrl.get('cantidad')?.value || 0);
      const precio = Number(ctrl.get('precioUnitario')?.value || 0);
      return acc + cantidad * precio;
    }, 0);
  }

  get detallesControles(): FormGroup[] {
    return this.detallesArray.controls as FormGroup[];
  }

  enviar(): void {
    this.reajusteForm.markAllAsTouched();
    if (this.reajusteForm.invalid) {
      Swal.fire({ icon: 'warning', title: 'Formulario incompleto', text: 'Revisa los campos obligatorios.' });
      return;
    }

    if (!this.totalLineas) {
      Swal.fire({ icon: 'warning', title: 'Sin detalles', text: 'Agrega al menos un detalle al reajuste.' });
      return;
    }

    const tipoReajuste = Number(this.reajusteForm.get('tipoReajuste')?.value) as TipoReajuste;

    const detalles: CreateReajusteDetalleDto[] = this.detallesArray.controls.map(ctrl => {
      const val = ctrl.value;
      const detalle: CreateReajusteDetalleDto = {
        idCatalogoInsumos: val.idCatalogoInsumos ?? undefined,
        renglon: val.renglon ?? undefined,
        codigoInsumo: val.codigoInsumo ? Number(val.codigoInsumo) : undefined,
        codigoPresentacion: val.codigoPresentacion ? Number(val.codigoPresentacion) : undefined,
        nombreInsumo: val.nombreInsumo?.trim() || undefined,
        caracteristicas: val.caracteristicas?.trim() || undefined,
        presentacion: val.presentacion?.trim() || undefined,
        unidadMedida: val.unidadMedida?.trim() || undefined,
        lote: val.lote?.trim() || undefined,
        fechaVencimiento: val.fechaVencimiento ? new Date(val.fechaVencimiento).toISOString() : undefined,
        cantidad: Number(val.cantidad || 0),
        observaciones: val.observaciones?.trim() || undefined,
        precioUnitario: tipoReajuste === 1 ? Number(val.precioUnitario || 0) : undefined,
        cartaCompromiso: val.cartaCompromiso ?? undefined,
        mesesDevolucion: val.mesesDevolucion ? Number(val.mesesDevolucion) : undefined,
        observacionesDevolucion: val.observacionesDevolucion?.trim() || undefined
      };
      return detalle;
    });

    const payload: CreateReajusteDto = {
      fechaReajuste: this.reajusteForm.get('fechaReajuste')?.value
        ? new Date(this.reajusteForm.get('fechaReajuste')?.value).toISOString()
        : undefined,
      tipoReajuste,
      referenciaDocumento: this.reajusteForm.get('referenciaDocumento')?.value?.trim(),
      observaciones: this.reajusteForm.get('observaciones')?.value?.trim() || undefined,
      detalles
    };

    this.enviando = true;
    this.reajustesService.crear(payload).subscribe({
      next: reajuste => {
        this.enviando = false;
        Swal.fire({
          icon: 'success',
          title: 'Reajuste registrado',
          text: 'El reajuste se creó correctamente.',
          timer: 2000,
          showConfirmButton: false
        });
        this.router.navigate(['/reajustes', reajuste.idReajuste]);
      },
      error: err => {
        console.error('Error al crear reajuste', err);
        this.enviando = false;
        Swal.fire({
          icon: 'error',
          title: 'Error al guardar',
          text: err?.message ?? 'No se pudo crear el reajuste. Intenta nuevamente.'
        });
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/reajustes', 'listado']);
  }

  private crearDetalleForm(base: any = {}): FormGroup {
    const codigoInsumo = this.parseEntero(base?.codigoInsumo, true);
    const codigoPresentacion = this.parseEntero(base?.codigoPresentacion);
    const renglon = this.parseEntero(base?.renglon);
    const mesesDevolucion = this.parseEntero(base?.mesesDevolucion);

    return this.fb.group({
      idCatalogoInsumos: [this.parseEntero(base?.idCatalogoInsumos, true)],
      renglon: [renglon],
      codigoInsumo: [codigoInsumo],
      codigoPresentacion: [codigoPresentacion],
      nombreInsumo: [this.stringOrEmpty(base?.nombreInsumo), [Validators.required]],
      caracteristicas: [this.stringOrEmpty(base?.caracteristicas), [Validators.required]],
      presentacion: [this.stringOrEmpty(base?.presentacion ?? base?.nombrePresentacion)],
      unidadMedida: [this.stringOrEmpty(base?.unidadMedida)],
      lote: [this.stringOrEmpty(base?.lote)],
      fechaVencimiento: [this.formatearFechaInput(base?.fechaVencimiento)],
      cantidad: [Math.max(1, Number(base?.cantidad ?? 1)), [Validators.required, Validators.min(1)]],
      precioUnitario: [
        base?.precioUnitario !== undefined && base?.precioUnitario !== null
          ? Number(base.precioUnitario)
          : Number(base?.precioReferencial ?? 0)
      ],
      cartaCompromiso: [Boolean(base?.cartaCompromiso ?? false)],
      mesesDevolucion: [mesesDevolucion],
      observacionesDevolucion: [this.stringOrEmpty(base?.observacionesDevolucion)],
      observaciones: [this.stringOrEmpty(base?.observaciones)]
    });
  }

  private normalizarDetalleValor(detalle: any) {
    const codigoInsumo = this.parseEntero(detalle?.codigoInsumo, true);
    const codigoPresentacion = this.parseEntero(detalle?.codigoPresentacion);
    const renglon = this.parseEntero(detalle?.renglon);
    const mesesDevolucion = this.parseEntero(detalle?.mesesDevolucion);

    const nombreInsumo = this.stringOrEmpty(detalle?.nombreInsumo);
    const caracteristicas = this.stringOrEmpty(detalle?.caracteristicas);
    const presentacion = this.stringOrEmpty(detalle?.presentacion);
    const unidadMedida = this.stringOrEmpty(detalle?.unidadMedida);
    const lote = this.stringOrEmpty(detalle?.lote);
    const observaciones = this.stringOrEmpty(detalle?.observaciones);
    const observacionesDevolucion = this.stringOrEmpty(detalle?.observacionesDevolucion);

    return {
      idCatalogoInsumos: this.parseEntero(detalle?.idCatalogoInsumos),
      renglon,
      codigoInsumo,
      codigoPresentacion,
      nombreInsumo,
      caracteristicas,
      presentacion: presentacion || undefined,
      unidadMedida: unidadMedida || undefined,
      lote,
      fechaVencimiento: detalle?.fechaVencimiento ? this.formatearFechaInput(detalle.fechaVencimiento) : '',
      cantidad: Math.max(1, Number(detalle?.cantidad ?? 1)),
      precioUnitario: Number(detalle?.precioUnitario ?? 0),
      cartaCompromiso: Boolean(detalle?.cartaCompromiso ?? false),
      mesesDevolucion,
      observacionesDevolucion,
      observaciones
    };
  }

  private parseEntero(valor: any, soloPositivos = false): number | null {
    if (valor === null || valor === undefined) {
      return null;
    }
    const texto = `${valor}`.trim();
    if (!texto) {
      return null;
    }
    const numero = Number(texto);
    if (!Number.isInteger(numero)) {
      return null;
    }
    if (soloPositivos && numero <= 0) {
      return null;
    }
    return numero;
  }

  private stringOrEmpty(valor: any): string {
    return `${valor ?? ''}`.trim();
  }

  private formatearFechaInput(valor: any): string {
    if (!valor) {
      return '';
    }
    const fecha = valor instanceof Date ? valor : new Date(valor);
    if (Number.isNaN(fecha.getTime())) {
      return '';
    }
    const pad = (v: number) => `${v}`.padStart(2, '0');
    return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
  }

  private actualizarValidadoresPrecio(): void {
    const isEntrada = this.esEntrada;
    const aplicar = (group: FormGroup | null) => {
      if (!group) return;
      const control = group.get('precioUnitario');
      if (!control) return;
      if (isEntrada) {
        control.setValidators([Validators.required, Validators.min(0)]);
      } else {
        control.clearValidators();
      }
      control.updateValueAndValidity({ emitEvent: false });
    };

    this.detallesArray.controls.forEach(ctrl => aplicar(ctrl as FormGroup));
    aplicar(this.detalleForm);
  }

  private cargarExistencias(codigoInsumo: number): void {
    this.detalleStockDisponible = null;
    this.inventarioService.getExistenciasProducto(codigoInsumo).subscribe({
      next: res => {
        const data: any = res?.data ?? res;
        const total =
          data?.totalDisponible ??
          data?.cantidadDisponible ??
          data?.cantidad ??
          (Array.isArray(data?.lotes)
            ? data.lotes.reduce((sum: number, lote: any) => sum + Number(lote?.cantidadDisponible ?? lote?.cantidad ?? 0), 0)
            : null);
        this.detalleStockDisponible = total !== null ? Number(total) : null;
      },
      error: () => {
        this.detalleStockDisponible = null;
      }
    });
  }
}

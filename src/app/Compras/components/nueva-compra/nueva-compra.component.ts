import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ComprasService } from '../../services/compras.service';
import { CatalogoService } from '../../services/catalogo.service';
import { CatalogoInsumo } from '../../interfaces/compras.interface';
import { QuetzalesPipe } from '../../../shared/pipes/quetzales.pipe';

interface LoteDetalle {
  lote: string;
  fechaVencimiento: Date;
  cantidad: number;
}

@Component({
  selector: 'app-nueva-compra',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, QuetzalesPipe],
  templateUrl: './nueva-compra.component.html',
  styleUrls: ['./nueva-compra.component.css']
})
export class NuevaCompraComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private comprasService = inject(ComprasService);
  private catalogoService = inject(CatalogoService);

  compraForm!: FormGroup;
  codigoBusqueda = '';
  insumoEncontrado: CatalogoInsumo | null = null;
  errorBusqueda = '';
  isSubmitting = false;

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm() {
    this.compraForm = this.fb.group({
      numeroFactura: [0, [Validators.required, Validators.min(1)]],
      serieFactura: ['', [Validators.required]],
      tipoCompra: ['COMPRA', [Validators.required]],
      fechaIngreso: ['', [Validators.required]],
      proveedor: ['', [Validators.required]],
      ordenCompra: [0, [Validators.required, Validators.min(1)]],
      programa: [0, [Validators.required, Validators.min(1)]],
      numero1h: [0, [Validators.required, Validators.min(1)]],
      noKardex: [0, [Validators.required, Validators.min(1)]],
      detalles: this.fb.array([])
    });
  }

  get detallesArray(): FormArray {
    return this.compraForm.get('detalles') as FormArray;
  }

  getLotesArray(detalleIndex: number): FormArray {
    return this.detallesArray.at(detalleIndex).get('lotes') as FormArray;
  }

  buscarInsumo() {
    if (!this.codigoBusqueda.trim()) {
      this.errorBusqueda = 'Ingrese un código de insumo';
      return;
    }

    this.catalogoService.findByCode(this.codigoBusqueda.trim()).subscribe({
      next: (insumo: CatalogoInsumo) => {
        this.insumoEncontrado = insumo;
        this.errorBusqueda = '';
        console.log('Insumo encontrado:', insumo);
      },
      error: (error: any) => {
        this.insumoEncontrado = null;
        this.errorBusqueda = 'Insumo no encontrado con el código ingresado';
        console.error('Error al buscar insumo:', error);
      }
    });
  }

  agregarInsumoADetalle() {
    if (!this.insumoEncontrado) return;

    // Verificar si el insumo ya está en el detalle
    const yaExiste = this.detallesArray.controls.some(
      detalle => detalle.get('catalogoInsumoId')?.value === this.insumoEncontrado!.idCatalogoInsumos
    );

    if (yaExiste) {
      this.errorBusqueda = 'Este insumo ya está agregado a la compra';
      return;
    }

    const detalleGroup = this.fb.group({
      catalogoInsumoId: [this.insumoEncontrado.idCatalogoInsumos, [Validators.required]],
      renglon: [this.insumoEncontrado.renglon, [Validators.required]],
      codigoInsumo: [this.insumoEncontrado.codigoInsumo, [Validators.required]],
      nombreInsumo: [this.insumoEncontrado.nombreInsumo, [Validators.required]],
      caracteristicas: [this.insumoEncontrado.caracteristicas, [Validators.required]],
      codigoPresentacion: [this.insumoEncontrado.codigoPresentacion, [Validators.required]],
      presentacion: [this.insumoEncontrado.nombrePresentacion, [Validators.required]],
      unidadMedida: [this.insumoEncontrado.unidadMedida, [Validators.required]],
      cantidad: [0, [Validators.required, Validators.min(0.01)]],
      precioUnitario: [0, [Validators.required, Validators.min(0.01)]],
      lotes: this.fb.array([])
    });

    this.detallesArray.push(detalleGroup);
    
    // Limpiar búsqueda
    this.codigoBusqueda = '';
    this.insumoEncontrado = null;
    this.errorBusqueda = '';
  }

  eliminarDetalle(index: number) {
    this.detallesArray.removeAt(index);
  }

  agregarLote(detalleIndex: number) {
    const loteGroup = this.fb.group({
      lote: [''],
      fechaVencimiento: [''],
      cantidad: [0, [Validators.required, Validators.min(0.01)]],
      mesesDevolucion: [''],
      observacionesDevolucion: ['']
    });

    this.getLotesArray(detalleIndex).push(loteGroup);
  }

  eliminarLote(detalleIndex: number, loteIndex: number) {
    this.getLotesArray(detalleIndex).removeAt(loteIndex);
    this.validarCantidadLotes(detalleIndex);
  }

  validarCantidadLotes(detalleIndex: number) {
    const totalLotes = this.getTotalLotes(detalleIndex);
    const cantidadDetalle = this.getDetalleCantidad(detalleIndex);
    
    // Aquí podrías agregar validaciones adicionales si es necesario
  }

  getTotalLotes(detalleIndex: number): number {
    const lotes = this.getLotesArray(detalleIndex);
    return lotes.controls.reduce((total, lote) => {
      const cantidad = lote.get('cantidad')?.value || 0;
      return total + parseFloat(cantidad);
    }, 0);
  }

  getDetalleCantidad(detalleIndex: number): number {
    const cantidad = this.detallesArray.at(detalleIndex).get('cantidad')?.value || 0;
    return parseFloat(cantidad);
  }

  calcularTotalDetalle(index: number): number {
    const detalle = this.detallesArray.at(index);
    const cantidad = parseFloat(detalle.get('cantidad')?.value || 0);
    const precio = parseFloat(detalle.get('precioUnitario')?.value || 0);
    return cantidad * precio;
  }

  calcularTotalCompra(): number {
    const total = this.detallesArray.controls.reduce((sum, detalle) => {
      const cantidad = parseFloat(detalle.get('cantidad')?.value || 0);
      const precio = parseFloat(detalle.get('precioUnitario')?.value || 0);
      return sum + (cantidad * precio);
    }, 0);
    return total;
  }

  getInsumoNombre(detalleIndex: number): string {
    const detalle = this.detallesArray.at(detalleIndex);
    return detalle.get('nombreInsumo')?.value || 'Insumo no encontrado';
  }

  getInsumoCodigo(detalleIndex: number): string {
    const detalle = this.detallesArray.at(detalleIndex);
    return detalle.get('codigoInsumo')?.value?.toString() || 'Código no encontrado';
  }

  onSubmit() {
    if (this.compraForm.valid && this.validarFormulario()) {
      this.isSubmitting = true;
      
      const compraData = {
        numeroFactura: parseInt(this.compraForm.get('numeroFactura')?.value),
        serieFactura: this.compraForm.get('serieFactura')?.value,
        tipoCompra: this.compraForm.get('tipoCompra')?.value,
        fechaIngreso: new Date(this.compraForm.get('fechaIngreso')?.value),
        proveedor: this.compraForm.get('proveedor')?.value,
        ordenCompra: parseInt(this.compraForm.get('ordenCompra')?.value),
        programa: parseInt(this.compraForm.get('programa')?.value),
        numero1h: parseInt(this.compraForm.get('numero1h')?.value),
        noKardex: parseInt(this.compraForm.get('noKardex')?.value),
        detalles: this.detallesArray.value.map((detalle: any) => {
          const cantidad = parseFloat(detalle.cantidad);
          const precioUnitario = parseFloat(detalle.precioUnitario);
          const precioTotalFactura = cantidad * precioUnitario;
          
          return {
            idCatalogoInsumos: detalle.catalogoInsumoId,
            renglon: detalle.renglon,
            codigoInsumo: detalle.codigoInsumo,
            nombreInsumo: detalle.nombreInsumo,
            caracteristicas: detalle.caracteristicas,
            codigoPresentacion: detalle.codigoPresentacion,
            presentacion: detalle.presentacion,
            cantidadTotal: cantidad,
            precioUnitario: precioUnitario,
            precioTotalFactura: precioTotalFactura,
            cartaCompromiso: false,
            observaciones: null,
            lotes: detalle.lotes.map((lote: any) => ({
              tipoIngreso: this.compraForm.get('tipoCompra')?.value,
              cantidad: parseFloat(lote.cantidad),
              lote: lote.lote || null,
              fechaVencimiento: lote.fechaVencimiento ? new Date(lote.fechaVencimiento) : null,
              mesesDevolucion: lote.mesesDevolucion ? parseInt(lote.mesesDevolucion) : null,
              observacionesDevolucion: lote.observacionesDevolucion || null
            }))
          };
        })
      };

      this.comprasService.create(compraData).subscribe({
        next: (response) => {
          console.log('Compra creada exitosamente:', response);
          this.router.navigate(['/compras']);
        },
        error: (error) => {
          console.error('Error al crear la compra:', error);
          this.isSubmitting = false;
        }
      });
    }
  }

  private validarFormulario(): boolean {
    // Validar que haya al menos un detalle
    if (this.detallesArray.length === 0) {
      alert('Debe agregar al menos un insumo a la compra');
      return false;
    }

    // Validar que cada detalle tenga al menos un lote
    for (let i = 0; i < this.detallesArray.length; i++) {
      const lotes = this.getLotesArray(i);
      if (lotes.length === 0) {
        alert(`El insumo en la posición ${i + 1} debe tener al menos un lote`);
        return false;
      }

      // Validar que la suma de lotes coincida con la cantidad del detalle
      const totalLotes = this.getTotalLotes(i);
      const cantidadDetalle = this.getDetalleCantidad(i);
      if (Math.abs(totalLotes - cantidadDetalle) > 0.01) {
        alert(`La suma de cantidades en lotes del insumo ${i + 1} no coincide con la cantidad total`);
        return false;
      }
    }

    return true;
  }

  cancelar() {
    this.router.navigate(['/compras']);
  }
}
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
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Nueva Compra</h1>
          <p class="text-gray-600">Registra una nueva compra de insumos</p>
        </div>

        <form [formGroup]="compraForm" (ngSubmit)="onSubmit()" class="space-y-8">
          <!-- Información General de la Compra -->
          <div class="bg-white shadow-sm rounded-lg p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Información General</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <!-- Número de Factura -->
              <div>
                <label for="numeroFactura" class="block text-sm font-medium text-gray-700 mb-2">
                  Número de Factura <span class="text-red-500">*</span>
                </label>
                <input
                  id="numeroFactura"
                  type="number"
                  formControlName="numeroFactura"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123456"
                />
                <div *ngIf="compraForm.get('numeroFactura')?.invalid && compraForm.get('numeroFactura')?.touched" 
                     class="mt-1 text-sm text-red-600">
                  El número de factura es requerido
                </div>
              </div>

              <!-- Serie Factura -->
              <div>
                <label for="serieFactura" class="block text-sm font-medium text-gray-700 mb-2">
                  Serie Factura <span class="text-red-500">*</span>
                </label>
                <input
                  id="serieFactura"
                  type="text"
                  formControlName="serieFactura"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: A001"
                />
                <div *ngIf="compraForm.get('serieFactura')?.invalid && compraForm.get('serieFactura')?.touched" 
                     class="mt-1 text-sm text-red-600">
                  La serie de factura es requerida
                </div>
              </div>

              <!-- Tipo de Compra -->
              <div>
                <label for="tipoCompra" class="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Compra <span class="text-red-500">*</span>
                </label>
                <select
                  id="tipoCompra"
                  formControlName="tipoCompra"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="COMPRA">Compra</option>
                  <option value="DONACION">Donación</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                </select>
              </div>

              <!-- Fecha de Ingreso -->
              <div>
                <label for="fechaIngreso" class="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Ingreso <span class="text-red-500">*</span>
                </label>
                <input
                  id="fechaIngreso"
                  type="date"
                  formControlName="fechaIngreso"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div *ngIf="compraForm.get('fechaIngreso')?.invalid && compraForm.get('fechaIngreso')?.touched" 
                     class="mt-1 text-sm text-red-600">
                  La fecha de ingreso es requerida
                </div>
              </div>

              <!-- Orden de Compra -->
              <div>
                <label for="ordenCompra" class="block text-sm font-medium text-gray-700 mb-2">
                  Orden de Compra <span class="text-red-500">*</span>
                </label>
                <input
                  id="ordenCompra"
                  type="number"
                  formControlName="ordenCompra"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1"
                />
              </div>

              <!-- Programa -->
              <div>
                <label for="programa" class="block text-sm font-medium text-gray-700 mb-2">
                  Programa <span class="text-red-500">*</span>
                </label>
                <select
                  id="programa"
                  formControlName="programa"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar programa</option>
                  <option value="13">Programa 13</option>
                  <option value="14">Programa 14</option>
                  <option value="15">Programa 15</option>
                  <option value="1">Programa 1</option>
                  <option value="94">Programa 94</option>
                </select>
                <div *ngIf="compraForm.get('programa')?.invalid && compraForm.get('programa')?.touched" 
                     class="mt-1 text-sm text-red-600">
                  El programa es requerido
                </div>
              </div>

              <!-- Número 1H -->
              <div>
                <label for="numero1h" class="block text-sm font-medium text-gray-700 mb-2">
                  Número 1H <span class="text-red-500">*</span>
                </label>
                <input
                  id="numero1h"
                  type="number"
                  formControlName="numero1h"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1"
                />
              </div>

              <!-- No. Kardex -->
              <div>
                <label for="noKardex" class="block text-sm font-medium text-gray-700 mb-2">
                  No. Kardex <span class="text-red-500">*</span>
                </label>
                <input
                  id="noKardex"
                  type="number"
                  formControlName="noKardex"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1"
                />
              </div>
            </div>

            <!-- Proveedor -->
            <div class="mt-6">
              <label for="proveedor" class="block text-sm font-medium text-gray-700 mb-2">
                Proveedor <span class="text-red-500">*</span>
              </label>
              <input
                id="proveedor"
                type="text"
                formControlName="proveedor"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nombre del proveedor"
              />
              <div *ngIf="compraForm.get('proveedor')?.invalid && compraForm.get('proveedor')?.touched" 
                   class="mt-1 text-sm text-red-600">
                El proveedor es requerido
              </div>
            </div>
          </div>

          <!-- Búsqueda de Insumos -->
          <div class="bg-white shadow-sm rounded-lg p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Búsqueda de Insumos</h2>
            
            <div class="flex gap-4 mb-6">
              <div class="flex-1">
                <label for="codigoInsumo" class="block text-sm font-medium text-gray-700 mb-2">
                  Código del Insumo
                </label>
                <input
                  id="codigoInsumo"
                  type="text"
                  [(ngModel)]="codigoBusqueda"
                  (keyup.enter)="buscarInsumo()"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese código del insumo"
                  [ngModelOptions]="{standalone: true}"
                />
              </div>
              <div class="flex items-end">
                <button
                  type="button"
                  (click)="buscarInsumo()"
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Buscar
                </button>
              </div>
            </div>

            <!-- Información del Insumo Encontrado -->
            <div *ngIf="insumoEncontrado" class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 class="text-lg font-medium text-green-900 mb-2">Insumo Encontrado</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span class="block text-sm font-medium text-green-700">Código:</span>
                  <span class="text-green-900">{{ insumoEncontrado.codigoInsumo }}</span>
                </div>
                <div>
                  <span class="block text-sm font-medium text-green-700">Nombre:</span>
                  <span class="text-green-900">{{ insumoEncontrado.nombreInsumo }}</span>
                </div>
                <div>
                  <span class="block text-sm font-medium text-green-700">Características:</span>
                  <span class="text-green-900">{{ insumoEncontrado.caracteristicas || 'N/A' }}</span>
                </div>
                <div>
                  <span class="block text-sm font-medium text-green-700">Presentación:</span>
                  <span class="text-green-900">{{ insumoEncontrado.nombrePresentacion || 'N/A' }}</span>
                </div>
                <div>
                  <span class="block text-sm font-medium text-green-700">Unidad Medida:</span>
                  <span class="text-green-900">{{ insumoEncontrado.unidadMedida || 'N/A' }}</span>
                </div>
              </div>
              
              <div class="mt-4 flex gap-4">
                <button
                  type="button"
                  (click)="agregarInsumoADetalle()"
                  class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Agregar a la Compra
                </button>
              </div>
            </div>

            <!-- Mensaje de error -->
            <div *ngIf="errorBusqueda" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p class="text-red-700">{{ errorBusqueda }}</p>
            </div>
          </div>

          <!-- Detalle de la Compra -->
          <div class="bg-white shadow-sm rounded-lg p-6" *ngIf="detallesArray.length > 0">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Detalle de la Compra</h2>
            
            <div formArrayName="detalles" class="space-y-6">
              <div *ngFor="let detalle of detallesArray.controls; let i = index" 
                   [formGroupName]="i"
                   class="border border-gray-200 rounded-lg p-4">
                
                <!-- Header del detalle -->
                <div class="flex justify-between items-start mb-4">
                  <div>
                    <h3 class="font-medium text-gray-900">{{ getInsumoNombre(i) }}</h3>
                    <p class="text-sm text-gray-600">Código: {{ getInsumoCodigo(i) }}</p>
                  </div>
                  <button
                    type="button"
                    (click)="eliminarDetalle(i)"
                    class="text-red-600 hover:text-red-800"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>

                <!-- Información básica del detalle -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad Total <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      formControlName="cantidad"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Precio Unitario <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      formControlName="precioUnitario"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Total</label>
                    <input
                      type="text"
                      [value]="calcularTotalDetalle(i) | quetzales : false"
                      readonly
                      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                    />
                  </div>
                </div>

                <!-- Gestión de Lotes -->
                <div class="mt-6">
                  <div class="flex justify-between items-center mb-4">
                    <h4 class="font-medium text-gray-900">Lotes</h4>
                    <button
                      type="button"
                      (click)="agregarLote(i)"
                      class="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      Agregar Lote
                    </button>
                  </div>

                  <div formArrayName="lotes" class="space-y-3">
                    <div *ngFor="let lote of getLotesArray(i).controls; let j = index"
                         [formGroupName]="j"
                         class="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-3 bg-gray-50 rounded-md">
                      
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Número de Lote <span class="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          formControlName="lote"
                          class="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Lote"
                        />
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Fecha Vencimiento <span class="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          formControlName="fechaVencimiento"
                          class="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Cantidad <span class="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          formControlName="cantidad"
                          (input)="validarCantidadLotes(i)"
                          class="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <!-- Campos de devolución (solo si hay fecha de vencimiento) -->
                      <div *ngIf="getLotesArray(i).at(j).get('fechaVencimiento')?.value">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Meses para Devolución
                        </label>
                        <select
                          formControlName="mesesDevolucion"
                          class="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Sin política</option>
                          <option value="1">1 mes antes</option>
                          <option value="2">2 meses antes</option>
                          <option value="3">3 meses antes</option>
                          <option value="6">6 meses antes</option>
                          <option value="12">12 meses antes</option>
                        </select>
                      </div>

                      <div *ngIf="getLotesArray(i).at(j).get('fechaVencimiento')?.value">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Observaciones Devolución
                        </label>
                        <textarea
                          formControlName="observacionesDevolucion"
                          class="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Condiciones específicas de devolución"
                          rows="2"
                        ></textarea>
                      </div>

                      <div>
                        <button
                          type="button"
                          (click)="eliminarLote(i, j)"
                          class="w-full px-2 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Validación de cantidades -->
                  <div *ngIf="getLotesArray(i).length > 0" class="mt-3">
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Total en lotes:</span>
                      <span [class]="getTotalLotes(i) === getDetalleCantidad(i) ? 'text-green-600' : 'text-red-600'">
                        {{ getTotalLotes(i) }} / {{ getDetalleCantidad(i) }}
                      </span>
                    </div>
                    <div *ngIf="getTotalLotes(i) !== getDetalleCantidad(i)" class="mt-1 text-xs text-red-600">
                      La suma de cantidades en lotes debe coincidir con la cantidad total
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Resumen y Acciones -->
          <div class="bg-white shadow-sm rounded-lg p-6">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-xl font-semibold text-gray-900">Resumen</h2>
              <div class="text-right">
                <p class="text-sm text-gray-600">Total de la Compra</p>
                <p class="text-2xl font-bold text-gray-900">{{ calcularTotalCompra() | quetzales }}</p>
              </div>
            </div>

            <div class="flex justify-end space-x-4">
              <button
                type="button"
                (click)="cancelar()"
                class="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                [disabled]="!compraForm.valid || isSubmitting"
                class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isSubmitting ? 'Guardando...' : 'Guardar Compra' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
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
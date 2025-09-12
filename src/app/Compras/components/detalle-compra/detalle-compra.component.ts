import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ComprasService } from '../../services/compras.service';

@Component({
  selector: 'app-detalle-compra',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 mb-2">Detalle de Compra</h1>
              <p class="text-gray-600" *ngIf="compra">
                Factura: {{ compra.numeroFactura }} - {{ compra.proveedor }}
              </p>
            </div>
            <button
              (click)="volver()"
              class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Volver
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="ml-2 text-gray-600">Cargando detalle de compra...</span>
        </div>

        <!-- Error State -->
        <div *ngIf="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p class="text-red-700">{{ error }}</p>
        </div>

        <!-- Compra Content -->
        <div *ngIf="compra && !loading" class="space-y-6">
          <!-- Información General -->
          <div class="bg-white shadow-sm rounded-lg p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Información General</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-500">Número de Factura</label>
                <p class="mt-1 text-sm text-gray-900">{{ compra.numeroFactura }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500">Fecha de Ingreso</label>
                <p class="mt-1 text-sm text-gray-900">{{ compra.fechaIngreso | date:'dd/MM/yyyy' }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500">Proveedor</label>
                <p class="mt-1 text-sm text-gray-900">{{ compra.proveedor }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500">Programa</label>
                <p class="mt-1 text-sm text-gray-900">{{ compra.programa }}</p>
              </div>
            </div>
          </div>

          <!-- Placeholder para más detalles -->
          <div class="bg-white shadow-sm rounded-lg p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Detalle de Productos</h2>
            <p class="text-gray-500 text-center py-8">
              Funcionalidad de detalle en desarrollo...
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./detalle-compra.component.css']
})
export class DetalleCompraComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private comprasService = inject(ComprasService);

  compra: any = null;
  loading = true;
  error = '';

  ngOnInit() {
    this.cargarCompra();
  }

  private cargarCompra() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID de compra no válido';
      this.loading = false;
      return;
    }

    // Por ahora usamos datos mock
    setTimeout(() => {
      this.compra = {
        id: parseInt(id),
        numeroFactura: 'F001-00001234',
        fechaIngreso: new Date(),
        proveedor: 'Proveedor Demo',
        programa: 'Programa 13',
        total: 1500.00
      };
      this.loading = false;
    }, 1000);
  }

  volver() {
    this.router.navigate(['/compras']);
  }
}
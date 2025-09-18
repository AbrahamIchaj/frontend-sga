import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ComprasService } from '../../services/compras.service';

@Component({
  selector: 'app-detalle-compra',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-[#0b1320] py-8 text-gray-100">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-white mb-2">Detalle de Compra</h1>
              <p class="text-gray-300" *ngIf="compra">
                Factura: {{ compra.numeroFactura }} - {{ compra.proveedor }}
              </p>
            </div>
            <button
              (click)="volver()"
              class="px-4 py-2 bg-[#334155] text-white rounded-md hover:bg-[#274155] focus:ring-2 focus:ring-[#334155] focus:ring-offset-2"
            >
              Volver
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="ml-2 text-gray-300">Cargando detalle de compra...</span>
        </div>

        <!-- Error State -->
        <div *ngIf="error" class="bg-[#2b0b0b] border border-red-700 rounded-lg p-4 mb-6">
          <p class="text-red-300">{{ error }}</p>
        </div>

        <!-- Compra Content -->
        <div *ngIf="compra && !loading" class="space-y-6">
          <!-- Información General -->
          <div class="bg-[#1e293b] shadow-sm rounded-lg p-6 border border-[#334155]">
            <h2 class="text-xl font-semibold text-white mb-4">Información General</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-400">Número de Factura</label>
                <p class="mt-1 text-sm text-gray-100">{{ compra.numeroFactura }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-400">Fecha de Ingreso</label>
                <p class="mt-1 text-sm text-gray-100">{{ compra.fechaIngreso | date:'dd/MM/yyyy' }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-400">Proveedor</label>
                <p class="mt-1 text-sm text-gray-100">{{ compra.proveedor }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-400">Programa</label>
                <p class="mt-1 text-sm text-gray-100">{{ compra.programa }}</p>
              </div>
            </div>
          </div>

          <!-- Placeholder para más detalles -->
          <div class="bg-[#1e293b] shadow-sm rounded-lg p-6 border border-[#334155]">
            <h2 class="text-xl font-semibold text-white mb-4">Detalle de Productos</h2>
            <p class="text-gray-300 text-center py-8">
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
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ComprasService } from '../../services/compras.service';

@Component({
  selector: 'app-detalle-compra',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-body text-body py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-3xl font-bold text-heading mb-2">Detalle de Compra</h1>
            <p class="text-muted" *ngIf="compra">
              Factura: {{ compra.numeroFactura }} - {{ compra.proveedor }}
            </p>
          </div>
          <button
            (click)="volver()"
            class="btn-secondary-dark btn-compact"
          >
            Volver
          </button>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="flex justify-center items-center py-12 text-muted">
          <div
            class="animate-spin rounded-full h-8 w-8 border-2"
            style="border-color: var(--color-primary); border-bottom-color: transparent"
          ></div>
          <span class="ml-2">Cargando detalle de compra...</span>
        </div>

        <!-- Error State -->
        <div *ngIf="error" class="alert alert-danger mb-6">
          {{ error }}
        </div>

        <!-- Compra Content -->
        <div *ngIf="compra && !loading" class="space-y-6">
          <!-- Información General -->
          <div class="card-responsive">
            <div class="card-responsive__body">
              <h2 class="text-xl font-semibold text-heading mb-4">Información General</h2>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Número de Factura</span>
                  <span class="info-value">{{ compra.numeroFactura }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Fecha de Ingreso</span>
                  <span class="info-value">{{ compra.fechaIngreso | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Proveedor</span>
                  <span class="info-value">{{ compra.proveedor }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Programa</span>
                  <span class="info-value">{{ compra.programa }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Placeholder para más detalles -->
          <div class="card-responsive">
            <div class="card-responsive__body text-center">
              <h2 class="text-xl font-semibold text-heading mb-4">Detalle de Productos</h2>
              <p class="text-muted py-6">
                Funcionalidad de detalle en desarrollo...
              </p>
            </div>
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
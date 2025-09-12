import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComprasService } from '../../services';
import { Compra, FiltrosCompra } from '../../interfaces';

@Component({
  selector: 'app-listado-compras',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './listado-compras.component.html',
  styleUrls: ['./listado-compras.component.css']
})
export class ListadoComprasComponent implements OnInit {
  compras: Compra[] = [];
  filtros: FiltrosCompra = {};
  cargando = false;
  error: string | null = null;

  // Filtros del formulario
  filtroProveedor = '';
  filtroFechaDesde = '';
  filtroFechaHasta = '';
  filtroPrograma: number | null = null;
  filtroNumeroFactura: number | null = null;

  // Opciones para filtros
  programas = [
    { value: 1, label: 'Programa 1' },
    { value: 13, label: 'Programa 13' },
    { value: 14, label: 'Programa 14' },
    { value: 15, label: 'Programa 15' },
    { value: 94, label: 'Programa 94' }
  ];

  constructor(private comprasService: ComprasService) {}

  ngOnInit(): void {
    this.cargarCompras();
  }

  cargarCompras(): void {
    this.cargando = true;
    this.error = null;

    // Preparar filtros
    const filtros: FiltrosCompra = {};
    if (this.filtroProveedor.trim()) filtros.proveedor = this.filtroProveedor.trim();
    if (this.filtroFechaDesde) filtros.fechaDesde = this.filtroFechaDesde;
    if (this.filtroFechaHasta) filtros.fechaHasta = this.filtroFechaHasta;
    if (this.filtroPrograma) filtros.programa = this.filtroPrograma;
    if (this.filtroNumeroFactura) filtros.numeroFactura = this.filtroNumeroFactura;

    this.comprasService.obtenerTodas(filtros).subscribe({
      next: (response) => {
        if (response.success) {
          this.compras = response.data;
        } else {
          this.error = response.message || 'Error al cargar las compras';
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar compras:', error);
        this.error = 'Error al cargar las compras. Intente nuevamente.';
        this.cargando = false;
      }
    });
  }

  limpiarFiltros(): void {
    this.filtroProveedor = '';
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.filtroPrograma = null;
    this.filtroNumeroFactura = null;
    this.cargarCompras();
  }

  formatearFecha(fecha: Date | string): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-GT');
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    }).format(valor);
  }

  calcularTotalFactura(compra: Compra): number {
    if (!compra.detalles) return 0;
    return compra.detalles.reduce((total, detalle) => total + detalle.precioTotalFactura, 0);
  }

  obtenerNombrePrograma(programa: number): string {
    const programaEncontrado = this.programas.find(p => p.value === programa);
    return programaEncontrado ? programaEncontrado.label : `Programa ${programa}`;
  }
}
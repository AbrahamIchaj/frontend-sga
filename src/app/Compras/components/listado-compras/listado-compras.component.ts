import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComprasService } from '../../services';
import { Compra, FiltrosCompra } from '../../interfaces';
import { QuetzalesPipe } from '../../../shared/pipes/quetzales.pipe';

@Component({
  selector: 'app-listado-compras',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, QuetzalesPipe],
  templateUrl: './listado-compras.component.html',
  styleUrls: ['./listado-compras.component.css']
})
export class ListadoComprasComponent implements OnInit {
  compras: Compra[] = [];
  filtros: FiltrosCompra = {};
  cargando = false;
  error: string | null = null;

  modalAbierto: boolean = false;
  compraSeleccionada: Compra | null = null;
  cargandoDetalle: boolean = false;
  detalleCompleto: any = null;

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
    if (compra.totalFactura) {
      return Number(compra.totalFactura);
    }
    if (!compra.detalles) return 0;
    return compra.detalles.reduce((total, detalle) => total + Number(detalle.precioTotalFactura), 0);
  }

  obtenerNombrePrograma(programa: number): string {
    const programaEncontrado = this.programas.find(p => p.value === programa);
    return programaEncontrado ? programaEncontrado.label : `Programa ${programa}`;
  }

  calcularCantidadTotal(compra: Compra): number {
    if (compra.totalCantidad) {
      return Number(compra.totalCantidad);
    }
    if (!compra.detalles) return 0;
    return compra.detalles.reduce((total, detalle) => total + detalle.cantidadTotal, 0);
  }

  verDetalles(idCompra: number): void {
    // Crear un modal o expandir la fila para mostrar detalles completos
    this.comprasService.obtenerDetalleCompleto(idCompra).subscribe({
      next: (response) => {
        if (response.success) {
          // Por ahora mostrar en console, después se puede hacer un modal
          console.log('Detalle completo de la compra:', response.data);
          alert(`Detalle completo de la compra #${idCompra}\n\nProductos: ${response.data.totalItems}\nTotal: Q ${response.data.totalFactura}\n\nConsulta la consola para ver todos los detalles`);
        }
      },
      error: (error) => {
        console.error('Error al obtener detalle:', error);
        alert('Error al cargar el detalle de la compra');
      }
    });
  }

  anularCompra(idCompra: number): void {
    const compra = this.compras.find(c => c.idIngresoCompras === idCompra);
    const numeroFactura = compra?.numeroFactura || 'sin número';
    
    if (confirm(`¿Está seguro que desea anular la compra con factura ${numeroFactura}?`)) {
      const motivo = prompt('Ingrese el motivo de anulación:');
      
      if (motivo && motivo.trim()) {
        this.comprasService.anular(idCompra, motivo.trim()).subscribe({
          next: (response) => {
            if (response.success) {
              alert('Compra anulada exitosamente');
              this.cargarCompras();
            } else {
              alert('Error al anular la compra: ' + (response.message || 'Error desconocido'));
            }
          },
          error: (error) => {
            console.error('Error al anular compra:', error);
            const errorMessage = error.error?.message || error.message || 'Error desconocido';
            alert('Error al anular la compra: ' + errorMessage);
          }
        });
      } else if (motivo !== null) {
        alert('El motivo de anulación es requerido');
      }
    }
  }


  abrirModal(idCompra: number): void {
    const compra = this.compras.find(c => c.idIngresoCompras === idCompra);
    if (compra) {
      this.compraSeleccionada = compra;
      this.modalAbierto = true;
      this.cargarDetalleCompleto(idCompra);
    }
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.compraSeleccionada = null;
    this.detalleCompleto = null;
    this.cargandoDetalle = false;
  }

  private cargarDetalleCompleto(idCompra: number): void {
    this.cargandoDetalle = true;
    this.detalleCompleto = null;

    this.comprasService.obtenerDetalleCompleto(idCompra).subscribe({
      next: (response) => {
        if (response.success) {
          this.detalleCompleto = response.data;
        } else {
          this.error = 'Error al cargar el detalle de la compra';
        }
        this.cargandoDetalle = false;
      },
      error: (error) => {
        console.error('Error al cargar detalle:', error);
        this.error = 'Error al cargar el detalle de la compra';
        this.cargandoDetalle = false;
      }
    });
  }

  /**
   * Verificar si un lote está próximo a vencer (dentro de 30 días)
   */
  estaProximoVencer(fechaVencimiento: string | Date): boolean {
    if (!fechaVencimiento) return false;
    
    const fechaVenc = new Date(fechaVencimiento);
    const fechaActual = new Date();
    const diasDiferencia = Math.ceil((fechaVenc.getTime() - fechaActual.getTime()) / (1000 * 60 * 60 * 24));
    
    return diasDiferencia > 0 && diasDiferencia <= 30;
  }

  /**
   * Verificar si un lote está vencido
   */
  estaVencido(fechaVencimiento: string | Date): boolean {
    if (!fechaVencimiento) return false;
    
    const fechaVenc = new Date(fechaVencimiento);
    const fechaActual = new Date();
    
    return fechaVenc < fechaActual;
  }
}
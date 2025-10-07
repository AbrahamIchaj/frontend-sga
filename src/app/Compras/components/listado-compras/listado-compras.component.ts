import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComprasService } from '../../services';
import { Compra, FiltrosCompra } from '../../interfaces';
import { PROGRAMAS_DISPONIBLES, ProgramaOption } from '../../constants/programas.const';
import Swal from 'sweetalert2';

type SemaforoEstado = 'vencido' | 'rojo' | 'amarillo' | 'verde';

interface SemaforoConfig {
  estado: SemaforoEstado;
  cardClass: string;
  badgeClass: string;
  iconClass: string;
  etiqueta: string;
  descripcion: string;
}

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

  modalAbierto: boolean = false;
  compraSeleccionada: Compra | null = null;
  cargandoDetalle: boolean = false;
  detalleCompleto: any = null;

  // Filtros del formulario
  filtroProveedor = '';
  filtroFechaDesde = '';
  filtroFechaHasta = '';
  filtroPrograma: number | null = null;
  filtroNumeroFactura: string | null = null;

  // Opciones para filtros
  programas: ProgramaOption[] = PROGRAMAS_DISPONIBLES;

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
  if (this.filtroNumeroFactura) filtros.numeroFactura = this.filtroNumeroFactura as any;

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

  obtenerProgramasCompra(compra: Pick<Compra, 'programas' | 'programa'>): string[] {
    const ids = Array.isArray(compra.programas) && compra.programas.length
      ? compra.programas
      : (typeof compra.programa === 'number' ? [compra.programa] : []);

    if (!ids.length) {
      return [];
    }

    return ids.map((id) => this.obtenerNombrePrograma(id));
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
          Swal.fire({
            title: `Detalle compra #${idCompra}`,
            html: `<p>Productos: <strong>${response.data.totalItems}</strong></p><p>Total: <strong>Q ${response.data.totalFactura}</strong></p><p>Revisa la consola para ver todos los detalles</p>`,
            icon: 'info',
            confirmButtonText: 'Cerrar'
          });
        }
      },
      error: (error) => {
        Swal.fire({ title: 'Error', text: 'Error al cargar el detalle de la compra', icon: 'error' });
      }
    });
  }

  anularCompra(idCompra: number): void {
    const compra = this.compras.find(c => c.idIngresoCompras === idCompra);
    const numeroFactura = compra?.numeroFactura || 'sin número';
    Swal.fire({
      title: 'Confirmar anulación',
      html: `¿Está seguro que desea anular la compra <strong>${numeroFactura}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const motivo = '';
        Swal.fire({ title: 'Anulando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        this.comprasService.anular(idCompra, motivo).subscribe({
          next: (response) => {
            Swal.close();
            if (response.success) {
              Swal.fire({ title: 'Anulada', text: 'Compra anulada exitosamente', icon: 'success' });
              this.cargarCompras();
            } else {
              Swal.fire({ title: 'Error', text: response.message || 'Error desconocido', icon: 'error' });
            }
          },
          error: (error) => {
            Swal.close();
            console.error('Error al anular compra:', error);
            const errorMessage = error.error?.message || error.message || 'Error desconocido';
            Swal.fire({ title: 'Error', text: `Error al anular la compra: ${errorMessage}`, icon: 'error' });
          }
        });
      }
    });

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

  obtenerSemaforoLote(fechaVencimiento: string | Date | null | undefined): SemaforoConfig | null {
    if (!fechaVencimiento) {
      return null;
    }

    const fechaVenc = new Date(fechaVencimiento);
    if (Number.isNaN(fechaVenc.getTime())) {
      return null;
    }

    const hoyNormalizado = this.normalizarFecha(new Date());
    const vencimientoNormalizado = this.normalizarFecha(fechaVenc);

    if (vencimientoNormalizado < hoyNormalizado) {
      return {
        estado: 'vencido',
        cardClass: 'status-card--danger',
        badgeClass: 'badge badge-danger',
        iconClass: 'fas fa-times-circle',
        etiqueta: 'Vencido',
        descripcion: 'El lote ya superó su fecha de vencimiento.'
      };
    }

    const mesesDiferencia = this.diferenciaEnMeses(hoyNormalizado, vencimientoNormalizado);

    if (mesesDiferencia <= 5) {
      return {
        estado: 'rojo',
        cardClass: 'status-card--danger',
        badgeClass: 'badge badge-danger',
        iconClass: 'fas fa-exclamation-triangle',
        etiqueta: 'Está por vencer',
        descripcion: ''
      };
    }

    if (mesesDiferencia <= 11) {
      return {
        estado: 'amarillo',
        cardClass: 'status-card--warning',
        badgeClass: 'badge badge-warning',
        iconClass: 'fas fa-clock',
        etiqueta: 'Próximo a vencer',
        descripcion: ''
      };
    }

    return {
      estado: 'verde',
      cardClass: 'status-card--success',
      badgeClass: 'badge badge-success',
      iconClass: 'fas fa-check',
      etiqueta: 'Vigente',
      descripcion: ''
    };
  }

  private diferenciaEnMeses(desde: Date, hasta: Date): number {
    const inicioDesde = new Date(desde.getFullYear(), desde.getMonth(), 1);
    const inicioHasta = new Date(hasta.getFullYear(), hasta.getMonth(), 1);
    return (inicioHasta.getFullYear() - inicioDesde.getFullYear()) * 12 + (inicioHasta.getMonth() - inicioDesde.getMonth());
  }

  private normalizarFecha(fecha: Date): Date {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  }
}
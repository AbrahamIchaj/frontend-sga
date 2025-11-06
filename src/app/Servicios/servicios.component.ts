import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiciosService } from './services/servicios.service';
import { Servicio, CreateServicioDto, UpdateServicioDto } from './models/servicio.model';
import Swal, { SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './servicios.component.html',
  styleUrls: ['./servicios.component.css']
})
export class ServiciosComponent implements OnInit, AfterViewInit {
  @ViewChild('tableContainer', { static: false }) tableContainer!: ElementRef;

  servicios: Servicio[] = [];
  filteredServicios: Servicio[] = [];
  paginatedServicios: Servicio[] = [];
  
  // Filtros de búsqueda
  searchQuery = '';
  observacionQuery = '';
  
  // Propiedades de paginación
  currentPage = 1;
  totalPages = 1;
  itemsPerPage = 8;
  totalItems = 0;

  // Propiedades para CRUD
  showModal = false;
  isEditing = false;
  selectedServicio: Servicio | null = null;
  
  // Formulario
  servicioForm: CreateServicioDto = {
    nombre: '',
    observaciones: ''
  };

  loading = false;
  Math = Math;

  constructor(
    private serviciosService: ServiciosService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadServicios();
  }

  ngAfterViewInit(): void {
    this.calculateItemsPerPage();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.calculateItemsPerPage();
      });
    }
  }

  // Calcular items por página según altura disponible
  calculateItemsPerPage(): void {
    if (this.tableContainer && this.tableContainer.nativeElement) {
      const containerHeight = this.tableContainer.nativeElement.clientHeight;
      const headerHeight = 60;
      const footerHeight = 60;
      const rowHeight = 65;
      
      const availableHeight = containerHeight - headerHeight - footerHeight;
      const calculatedItemsPerPage = Math.floor(availableHeight / rowHeight);
      
      this.itemsPerPage = Math.max(calculatedItemsPerPage, 6);
    } else {
      // Valor por defecto si no hay contenedor disponible
      this.itemsPerPage = 8;
    }
    this.updatePagination();
  }

  trackByFn(index: number, item: Servicio): any {
    return item.idServicio || index;
  }

  loadServicios(): void {
    this.loading = true;
    this.serviciosService.getAll().subscribe({
      next: (data) => {
        this.servicios = data || [];
        this.filteredServicios = [...this.servicios];
        this.totalItems = this.filteredServicios.length;
        
        // Asegurar que tenemos un valor válido para itemsPerPage
        if (!this.itemsPerPage || this.itemsPerPage <= 0) {
          this.itemsPerPage = 8; // Valor por defecto
        }
        
        this.updatePagination();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar servicios:', error);
        this.loading = false;
        
        // Mostrar mensaje de error con SweetAlert2
        this.fireSwal({
          title: 'Error de conexión',
          text: 'No se pudieron cargar los servicios. Verifique la conexión con el servidor.',
          icon: 'error'
        });
      }
    });
  }

  // Aplicar filtros de búsqueda
  applyFilters(): void {
    const nameQuery = this.searchQuery.trim().toLowerCase();
    const obsQuery = this.observacionQuery.trim().toLowerCase();

    this.filteredServicios = this.servicios.filter((servicio) => {
      const nombre = servicio.nombre?.toLowerCase() || '';
      const observaciones = servicio.observaciones?.toLowerCase() || '';

      const matchesName = !nameQuery || nombre.includes(nameQuery) || observaciones.includes(nameQuery);
      const matchesObs = !obsQuery || observaciones.includes(obsQuery);

      return matchesName && matchesObs;
    });
    
    this.totalItems = this.filteredServicios.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  // Actualizar la tabla después de cambios CRUD
  refreshTable(): void {
    this.applyFilters();
    // Forzar la detección de cambios
    this.cdr.detectChanges();
  }

  // Limpiar filtros
  clearFilters(): void {
  this.searchQuery = '';
  this.observacionQuery = '';
    this.filteredServicios = [...this.servicios];
    this.totalItems = this.filteredServicios.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  // Actualizar paginación
  updatePagination(): void {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedServicios = this.filteredServicios.slice(startIndex, endIndex);
  }

  // Navegación de páginas
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  // Abrir modal para crear nuevo servicio
  openCreateModal(): void {
    this.isEditing = false;
    this.selectedServicio = null;
    this.servicioForm = {
      nombre: '',
      observaciones: ''
    };
    this.showModal = true;
  }

  // Abrir modal para editar servicio
  openEditModal(servicio: Servicio): void {
    this.isEditing = true;
    this.selectedServicio = servicio;
    this.servicioForm = {
      nombre: servicio.nombre,
      observaciones: servicio.observaciones || ''
    };
    this.showModal = true;
  }

  // Cerrar modal
  closeModal(): void {
    this.showModal = false;
    this.selectedServicio = null;
    this.servicioForm = {
      nombre: '',
      observaciones: ''
    };
  }

  // Guardar servicio (crear o actualizar)
  saveServicio(): void {
    if (!this.servicioForm.nombre.trim()) {
      this.fireSwal({
        title: 'Campo requerido',
        text: 'El nombre del servicio es requerido',
        icon: 'warning'
      });
      return;
    }

    this.loading = true;

    if (this.isEditing && this.selectedServicio) {
      // Actualizar servicio existente
      const updateData: UpdateServicioDto = {
        nombre: this.servicioForm.nombre.trim(),
        observaciones: this.servicioForm.observaciones?.trim() || undefined
      };

      this.serviciosService.update(this.selectedServicio.idServicio!, updateData).subscribe({
        next: (updatedServicio) => {
          const index = this.servicios.findIndex(s => s.idServicio === updatedServicio.idServicio);
          if (index !== -1) {
            this.servicios[index] = updatedServicio;
          }
          this.refreshTable();
          this.closeModal();
          this.loading = false;
          
          // Mostrar mensaje de éxito
          this.fireSwal({
            title: '¡Actualizado!',
            text: 'El servicio ha sido actualizado correctamente.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (error) => {
          console.error('Error al actualizar servicio:', error);
          this.loading = false;
          
          // Mostrar mensaje de error
          this.fireSwal({
            title: 'Error',
            text: 'Ocurrió un error al actualizar el servicio. Inténtalo nuevamente.',
            icon: 'error'
          });
        }
      });
    } else {
      // Crear nuevo servicio
      const newServicio: CreateServicioDto = {
        nombre: this.servicioForm.nombre.trim(),
        observaciones: this.servicioForm.observaciones?.trim() || undefined
      };

      this.serviciosService.create(newServicio).subscribe({
        next: (createdServicio) => {
          console.log('Servicio creado:', createdServicio);
          this.servicios.push(createdServicio);
          console.log('Array de servicios después de agregar:', this.servicios);
          this.refreshTable();
          this.closeModal();
          this.loading = false;
          
          // Mostrar mensaje de éxito
          this.fireSwal({
            title: '¡Creado!',
            text: 'El servicio ha sido creado correctamente.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (error) => {
          console.error('Error al crear servicio:', error);
          this.loading = false;
          
          // Mostrar mensaje de error
          this.fireSwal({
            title: 'Error',
            text: 'Ocurrió un error al crear el servicio. Inténtalo nuevamente.',
            icon: 'error'
          });
        }
      });
    }
  }

  // Abrir modal de confirmación para eliminar con SweetAlert2
  openDeleteModal(servicio: Servicio): void {
    this.fireSwal({
      title: '¿Estás seguro?',
      html: `
        <div class="text-left">
          <p class="mb-2"><strong>Servicio:</strong> ${servicio.nombre}</p>
          ${servicio.observaciones ? `<p><strong>Observaciones:</strong> ${servicio.observaciones}</p>` : ''}
        </div>
        <p class="mt-4 text-red-600">Esta acción no se puede deshacer.</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.confirmDelete(servicio);
      }
    });
  }

  // Confirmar eliminación
  confirmDelete(servicio: Servicio): void {
    if (servicio && servicio.idServicio) {
      this.loading = true;
      
      this.serviciosService.delete(servicio.idServicio).subscribe({
        next: () => {
          console.log('Servicio eliminado, ID:', servicio.idServicio);
          this.servicios = this.servicios.filter(s => s.idServicio !== servicio.idServicio);
          console.log('Array de servicios después de eliminar:', this.servicios);
          this.refreshTable();
          this.loading = false;
          
          // Mostrar mensaje de éxito
          this.fireSwal({
            title: '¡Eliminado!',
            text: 'El servicio ha sido eliminado correctamente.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (error) => {
          console.error('Error al eliminar servicio:', error);
          this.loading = false;
          
          // Mostrar mensaje de error
          this.fireSwal({
            title: 'Error',
            text: 'Ocurrió un error al eliminar el servicio. Inténtalo nuevamente.',
            icon: 'error'
          });
        }
      });
    }
  }

  private fireSwal(options: SweetAlertOptions): Promise<SweetAlertResult<any>> {
    const themedOptions = this.applyThemeToSwal(options);
    return Swal.fire(themedOptions);
  }

  private applyThemeToSwal(options: SweetAlertOptions): SweetAlertOptions {
    const colors = this.resolveThemeColors();
    const themed: SweetAlertOptions = { ...options };

    if (themed.background === undefined) {
      themed.background = colors.surface;
    }

    if (themed.color === undefined) {
      themed.color = colors.text;
    }

    const shouldShowConfirm = themed.showConfirmButton !== false;
    if (shouldShowConfirm && themed.confirmButtonColor === undefined) {
      themed.confirmButtonColor = this.resolveConfirmColor(themed, colors);
    }

    if (themed.showCancelButton && themed.cancelButtonColor === undefined) {
      themed.cancelButtonColor = colors.muted;
    }

    if (themed.icon && themed.iconColor === undefined) {
      themed.iconColor = this.resolveIconColor(themed.icon, colors);
    }

    const originalDidOpen = themed.didOpen;
    themed.didOpen = (popup) => {
      popup.style.border = `1px solid ${colors.border}`;
      popup.style.boxShadow = `0 18px 40px ${colors.elevated}`;
      if (originalDidOpen) {
        originalDidOpen(popup);
      }
    };

    return themed;
  }

  private resolveConfirmColor(options: SweetAlertOptions, colors: ThemeColors): string {
    if (options.confirmButtonColor) {
      return options.confirmButtonColor;
    }

    if (options.icon === 'error') {
      return colors.danger;
    }

    if (options.icon === 'warning') {
      return options.showCancelButton ? colors.danger : colors.warning;
    }

    if (options.icon === 'success') {
      return colors.success;
    }

    if (options.icon === 'info') {
      return colors.info;
    }

    return colors.primary;
  }

  private resolveIconColor(icon: SweetAlertOptions['icon'], colors: ThemeColors): string | undefined {
    switch (icon) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.danger;
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.info;
      case 'question':
        return colors.primary;
      default:
        return undefined;
    }
  }

  private resolveThemeColors(): ThemeColors {
    const fallback: ThemeColors = {
      surface: '#1f2937',
      text: '#e2e8f0',
      border: 'rgba(148, 163, 184, 0.35)',
      primary: '#3b82f6',
      danger: '#dc2626',
      warning: '#f59e0b',
      success: '#34d399',
      info: '#60a5fa',
      muted: '#94a3b8',
      elevated: 'rgba(15, 23, 42, 0.35)'
    };

    if (typeof document === 'undefined' || !document.body) {
      return fallback;
    }

    const computed = getComputedStyle(document.body);
    const read = (variable: string, backup: string) => {
      const value = computed.getPropertyValue(variable).trim();
      return value || backup;
    };

    return {
      surface: read('--color-surface', fallback.surface),
      text: read('--color-body-text', fallback.text),
      border: read('--color-border', fallback.border),
      primary: read('--color-primary', fallback.primary),
      danger: read('--color-danger', fallback.danger),
      warning: read('--color-warning', fallback.warning),
      success: read('--color-success', fallback.success),
      info: read('--color-info', fallback.info),
      muted: read('--color-muted', fallback.muted),
      elevated: read('--color-elevated', fallback.elevated)
    };
  }
}

type ThemeColors = {
  surface: string;
  text: string;
  border: string;
  primary: string;
  danger: string;
  warning: string;
  success: string;
  info: string;
  muted: string;
  elevated: string;
};

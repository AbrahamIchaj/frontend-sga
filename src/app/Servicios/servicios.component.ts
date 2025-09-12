import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiciosService } from './services/servicios.service';
import { Servicio, CreateServicioDto, UpdateServicioDto } from './models/servicio.model';
import Swal from 'sweetalert2';

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
        Swal.fire({
          title: 'Error de conexión',
          text: 'No se pudieron cargar los servicios. Verifique la conexión con el servidor.',
          icon: 'error',
          confirmButtonColor: '#dc2626',
          background: '#1f2937',
          color: '#fff',
          customClass: {
            popup: 'border border-gray-600'
          }
        });
      }
    });
  }

  // Aplicar filtros de búsqueda
  applyFilters(): void {
    if (!this.searchQuery.trim()) {
      this.filteredServicios = [...this.servicios];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredServicios = this.servicios.filter(servicio =>
        servicio.nombre.toLowerCase().includes(query) ||
        (servicio.observaciones && servicio.observaciones.toLowerCase().includes(query))
      );
    }
    
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
      Swal.fire({
        title: 'Campo requerido',
        text: 'El nombre del servicio es requerido',
        icon: 'warning',
        confirmButtonColor: '#3b82f6',
        background: '#1f2937',
        color: '#fff',
        customClass: {
          popup: 'border border-gray-600'
        }
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
          Swal.fire({
            title: '¡Actualizado!',
            text: 'El servicio ha sido actualizado correctamente.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            background: '#1f2937',
            color: '#fff',
            customClass: {
              popup: 'border border-gray-600'
            }
          });
        },
        error: (error) => {
          console.error('Error al actualizar servicio:', error);
          this.loading = false;
          
          // Mostrar mensaje de error
          Swal.fire({
            title: 'Error',
            text: 'Ocurrió un error al actualizar el servicio. Inténtalo nuevamente.',
            icon: 'error',
            confirmButtonColor: '#dc2626',
            background: '#1f2937',
            color: '#fff',
            customClass: {
              popup: 'border border-gray-600'
            }
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
          Swal.fire({
            title: '¡Creado!',
            text: 'El servicio ha sido creado correctamente.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            background: '#1f2937',
            color: '#fff',
            customClass: {
              popup: 'border border-gray-600'
            }
          });
        },
        error: (error) => {
          console.error('Error al crear servicio:', error);
          this.loading = false;
          
          // Mostrar mensaje de error
          Swal.fire({
            title: 'Error',
            text: 'Ocurrió un error al crear el servicio. Inténtalo nuevamente.',
            icon: 'error',
            confirmButtonColor: '#dc2626',
            background: '#1f2937',
            color: '#fff',
            customClass: {
              popup: 'border border-gray-600'
            }
          });
        }
      });
    }
  }

  // Abrir modal de confirmación para eliminar con SweetAlert2
  openDeleteModal(servicio: Servicio): void {
    Swal.fire({
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
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#1f2937',
      color: '#fff',
      customClass: {
        popup: 'border border-gray-600',
        title: 'text-white',
        htmlContainer: 'text-gray-300'
      }
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
          Swal.fire({
            title: '¡Eliminado!',
            text: 'El servicio ha sido eliminado correctamente.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            background: '#1f2937',
            color: '#fff',
            customClass: {
              popup: 'border border-gray-600'
            }
          });
        },
        error: (error) => {
          console.error('Error al eliminar servicio:', error);
          this.loading = false;
          
          // Mostrar mensaje de error
          Swal.fire({
            title: 'Error',
            text: 'Ocurrió un error al eliminar el servicio. Inténtalo nuevamente.',
            icon: 'error',
            confirmButtonColor: '#dc2626',
            background: '#1f2937',
            color: '#fff',
            customClass: {
              popup: 'border border-gray-600'
            }
          });
        }
      });
    }
  }
}

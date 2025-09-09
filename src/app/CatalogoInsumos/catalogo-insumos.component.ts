import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoInsumosService } from './services/catalogo-insumos.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'catalogo-insumos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogo-insumos.component.html',
  styleUrls: ['./catalogo-insumos.component.css']
})
export class CatalogoInsumosComponent implements OnInit, AfterViewInit {
  @ViewChild('tableContainer', { static: false }) tableContainer!: ElementRef;

  items: any[] = [];
  filtered: any[] = [];
  paginatedItems: any[] = [];
  
  // Filtros de búsqueda
  searchCodigo = '';
  searchNombre = '';
  searchRenglon = '';
  selectedPresentacionUnidad = '';
  
  allPresentacionUnidad: string[] = [];
  allRenglones: string[] = [];
  presentacionUnidad: string[] = [];
  renglones: string[] = [];

  // Propiedades de paginación
  currentPage = 1;
  totalPages = 1;
  itemsPerPage = 6;
  totalItems = 0;

  Math = Math;

  loading = false;

  constructor(private svc: CatalogoInsumosService) { }

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    // Calcular items por página basado en la altura disponible
    this.calculateItemsPerPage();
    
    // Escuchar cambios de tamaño de ventana
    window.addEventListener('resize', () => {
      this.calculateItemsPerPage();
    });
  }

  // Calcular cuántos items caben en la página según la altura
  calculateItemsPerPage(): void {
    if (this.tableContainer) {
      const containerHeight = this.tableContainer.nativeElement.clientHeight;
      const headerHeight = 60; 
      const footerHeight = 60; 
      const rowHeight = 73; 
      
      const availableHeight = containerHeight - headerHeight - footerHeight;
      const calculatedItemsPerPage = Math.floor(availableHeight / rowHeight);
      
      this.itemsPerPage = Math.max(calculatedItemsPerPage, 5);
      this.updatePagination();
    }
  }

  trackByFn(index: number, item: any): any {
    return item.idCatalogoInsumos || item.codigoInsumo || index;
  }

  load() {
    console.log('Cargando datos...');
    this.loading = true;
    this.svc.getAll().subscribe({
      next: data => {
 
        if (data && data.length > 0) {         
          const possibleUnitFields = ['unidad', 'tipoUnidad', 'medida', 'unidadBase'];
          possibleUnitFields.forEach(field => {
            if (data[0][field]) {
              console.log(`Campo ${field}:`, data[0][field]);
            }
          });
        }
        
        this.items = data || [];
        this.filtered = data || [];
        
        // Almacenar todos los valores originales - Combinando presentación y unidad
        this.allPresentacionUnidad = Array.from(new Set(data?.map((d: any) => {
          const presentacion = d.nombrePresentacion || 'Sin presentación';
          const unidad = this.extractBaseUnit(d.unidadMedida) || 'Sin unidad';
          return `${presentacion} - ${unidad}`;
        }).filter(Boolean))) || [];
        this.allRenglones = Array.from(new Set(data?.map((d: any) => d.renglon?.toString()).filter(Boolean))) || [];
        
        this.presentacionUnidad = [...this.allPresentacionUnidad];
        this.renglones = [...this.allRenglones];
        
        this.loading = false;
        this.updatePagination();
      },
      error: err => {
        console.error('Error al cargar datos:', err);
        this.loading = false;
        this.items = [];
        this.filtered = [];
      }
    });
  }

  applyFilters() {
    let result = [...this.items];

    // Busqueda por Código o NombreInsumo
    let searchResults = [...this.items];
    
    // Filtro por código de insumo
    if (this.searchCodigo && this.searchCodigo.trim() !== '') {
      const codigoSearch = this.searchCodigo.trim().toLowerCase();
      searchResults = searchResults.filter(item => {
        const codigo = (item.codigoInsumo?.toString() || '').toLowerCase();
        return codigo.includes(codigoSearch);
      });
    }

    // Filtro por nombre de insumo
    if (this.searchNombre && this.searchNombre.trim() !== '') {
      const nombreLower = this.searchNombre.trim().toLowerCase();
      searchResults = searchResults.filter(item => {
        const nombre = (item.nombreInsumo || '').toLowerCase();
        return nombre.includes(nombreLower);
      });
    }

    this.updateDropdownOptions(searchResults);
    
    result = [...searchResults];

    // Filtro por renglón
    if (this.searchRenglon && this.searchRenglon.trim() !== '') {
      const renglon = this.searchRenglon.trim();
      result = result.filter(item => {
        const itemRenglon = (item.renglon || '').toString();
        return itemRenglon === renglon;
      });
    }

    // Filtro por presentación-unidad combinada
    if (this.selectedPresentacionUnidad && this.selectedPresentacionUnidad.trim() !== '') {
      result = result.filter(item => {
        const presentacion = item.nombrePresentacion || 'Sin presentación';
        const unidad = this.extractBaseUnit(item.unidadMedida) || 'Sin unidad';
        const combinado = `${presentacion} - ${unidad}`;
        return combinado === this.selectedPresentacionUnidad;
      });
    }

    this.filtered = result;
    this.currentPage = 1;
    this.updatePagination();
  }

  onSearchTextChange() {
    this.applyFilters();
  }

  // Método para manejar cambios en los dropdowns
  onDropdownChange() {
    if (this.searchRenglon && this.searchRenglon.trim() !== '') {
      this.updatePresentacionUnidadOptions();
    }
    
    this.applyFilters();
  }

  // Método específico para actualizar las opciones de presentación-unidad basándose en el renglón seleccionado
  updatePresentacionUnidadOptions() {
    let searchResults = [...this.items];
    
    // Aplicar filtros de código y nombre si existen
    if (this.searchCodigo && this.searchCodigo.trim() !== '') {
      const codigoSearch = this.searchCodigo.trim().toLowerCase();
      searchResults = searchResults.filter(item => {
        const codigo = (item.codigoInsumo?.toString() || '').toLowerCase();
        return codigo.includes(codigoSearch);
      });
    }

    if (this.searchNombre && this.searchNombre.trim() !== '') {
      const nombreLower = this.searchNombre.trim().toLowerCase();
      searchResults = searchResults.filter(item => {
        const nombre = (item.nombreInsumo || '').toLowerCase();
        return nombre.includes(nombreLower);
      });
    }

    // Filtrar por el renglón seleccionado
    if (this.searchRenglon && this.searchRenglon.trim() !== '') {
      const filteredByRenglon = searchResults.filter(item => item.renglon?.toString() === this.searchRenglon);
      const newPresentacionUnidad = Array.from(new Set(filteredByRenglon.map(item => {
        const presentacion = item.nombrePresentacion || 'Sin presentación';
        const unidad = this.extractBaseUnit(item.unidadMedida) || 'Sin unidad';
        return `${presentacion} - ${unidad}`;
      }).filter(Boolean)));
      
      this.presentacionUnidad = newPresentacionUnidad;
      
      if (this.selectedPresentacionUnidad && !this.presentacionUnidad.includes(this.selectedPresentacionUnidad)) {
        this.selectedPresentacionUnidad = '';
      }
    }
  }

  // Extraer la unidad base de strings como "1 Unidad(es)" -> "Unidad(es)"
  extractBaseUnit(fullUnit: string): string {
    if (!fullUnit) return '';
    
    // Dividir por espacio y tomar todo excepto la primera parte numérica
    const parts = fullUnit.toString().trim().split(' ');
    if (parts.length > 1) {
      return parts.slice(1).join(' ');
    }
    return fullUnit;
  }

  // Actualizar las opciones de los dropdowns basándose en los resultados de búsqueda
  updateDropdownOptions(searchResults: any[]) {
    // Si no hay búsqueda por código o nombre, mostrar todas las opciones
    if (!this.searchCodigo?.trim() && !this.searchNombre?.trim()) {
      this.renglones = [...this.allRenglones];
      this.presentacionUnidad = [...this.allPresentacionUnidad];
    } else {
      const newRenglones = Array.from(new Set(searchResults.map(item => item.renglon?.toString()).filter(Boolean)));
      
      this.renglones = newRenglones;
      
      // Si ya hay un renglón seleccionado, filtrar las presentaciones-unidades disponibles para ese renglón específico
      if (this.searchRenglon && this.searchRenglon.trim() !== '') {
        const filteredByRenglon = searchResults.filter(item => item.renglon?.toString() === this.searchRenglon);
        const newPresentacionUnidad = Array.from(new Set(filteredByRenglon.map(item => {
          const presentacion = item.nombrePresentacion || 'Sin presentación';
          const unidad = this.extractBaseUnit(item.unidadMedida) || 'Sin unidad';
          return `${presentacion} - ${unidad}`;
        }).filter(Boolean)));
        
        this.presentacionUnidad = newPresentacionUnidad;
      } else {
        // Si no hay renglón seleccionado, mostrar todas las combinaciones disponibles de la búsqueda
        const newPresentacionUnidad = Array.from(new Set(searchResults.map(item => {
          const presentacion = item.nombrePresentacion || 'Sin presentación';
          const unidad = this.extractBaseUnit(item.unidadMedida) || 'Sin unidad';
          return `${presentacion} - ${unidad}`;
        }).filter(Boolean)));
        
        this.presentacionUnidad = newPresentacionUnidad;
      }
      
      // Limpiar selecciones si ya no están disponibles
      if (this.searchRenglon && !this.renglones.includes(this.searchRenglon)) {
        this.searchRenglon = '';
      }
      if (this.selectedPresentacionUnidad && !this.presentacionUnidad.includes(this.selectedPresentacionUnidad)) {
        this.selectedPresentacionUnidad = '';
      }
    }
  }

  clearFilters() {
    this.searchCodigo = '';
    this.searchNombre = '';
    this.searchRenglon = '';
    this.selectedPresentacionUnidad = '';
    
    this.renglones = [...this.allRenglones];
    this.presentacionUnidad = [...this.allPresentacionUnidad];
    
    this.filtered = [...this.items];
    this.currentPage = 1;
    this.updatePagination();
  }

  // Actualizar la paginación
  updatePagination(): void {
    this.totalItems = this.filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    // Asegurar que la página actual es válida
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedItems = this.filtered.slice(startIndex, endIndex);
  }

  // Navegación de páginas
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
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

  // Listener para redimensionado de ventana
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.tableContainer) {
      this.calculateItemsPerPage();
    }
  }

  // Obtener rango de páginas para mostrar
  getPageRange(): number[] {
    const maxPagesToShow = 5;
    const pages: number[] = [];
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}

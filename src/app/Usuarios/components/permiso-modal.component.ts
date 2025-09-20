import { Component, EventEmitter, Input, OnInit, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PermisosService } from '../services/permisos.service';
import { CreatePermisoDto, UpdatePermisoDto, PermisoConRoles } from '../models/usuario.interface';

@Component({
  selector: 'app-permiso-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Modal Backdrop -->
    <div *ngIf="isOpen" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" (click)="onBackdropClick($event)">
      <!-- Modal Content -->
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 xl:w-2/5 shadow-lg rounded-md bg-white">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b">
          <h3 class="text-lg font-medium text-gray-900">
            {{ isEditing ? 'Editar Permiso' : 'Crear Nuevo Permiso' }}
          </h3>
          <button 
            (click)="cerrarModal()"
            class="text-gray-400 hover:text-gray-600 transition-colors">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <!-- Form -->
        <form [formGroup]="permisoForm" (ngSubmit)="onSubmit()" class="mt-6">
          <!-- Nombre del Permiso -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Permiso <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              formControlName="permiso"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              [class.border-red-500]="permisoForm.get('permiso')?.invalid && permisoForm.get('permiso')?.touched"
              placeholder="Ej: crear_usuarios, ver_reportes, gestionar_inventario">
            <div *ngIf="permisoForm.get('permiso')?.invalid && permisoForm.get('permiso')?.touched" 
                 class="text-red-500 text-sm mt-1">
              <span *ngIf="permisoForm.get('permiso')?.errors?.['required']">El nombre del permiso es requerido</span>
              <span *ngIf="permisoForm.get('permiso')?.errors?.['minlength']">El nombre debe tener al menos 3 caracteres</span>
              <span *ngIf="permisoForm.get('permiso')?.errors?.['maxlength']">El nombre no puede exceder 100 caracteres</span>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Usa un formato descriptivo como: accion_recurso (ej: crear_usuario, editar_producto)
            </p>
          </div>

          <!-- Descripción -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Descripción <span class="text-red-500">*</span>
            </label>
            <textarea
              formControlName="descripcion"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              [class.border-red-500]="permisoForm.get('descripcion')?.invalid && permisoForm.get('descripcion')?.touched"
              placeholder="Describe específicamente qué acciones permite este permiso..."></textarea>
            <div *ngIf="permisoForm.get('descripcion')?.invalid && permisoForm.get('descripcion')?.touched" 
                 class="text-red-500 text-sm mt-1">
              <span *ngIf="permisoForm.get('descripcion')?.errors?.['required']">La descripción es requerida</span>
              <span *ngIf="permisoForm.get('descripcion')?.errors?.['minlength']">La descripción debe tener al menos 10 caracteres</span>
              <span *ngIf="permisoForm.get('descripcion')?.errors?.['maxlength']">La descripción no puede exceder 255 caracteres</span>
            </div>
          </div>

          <!-- Información sobre roles (solo cuando se edita) -->
          <div *ngIf="isEditing && permiso" class="mb-4 p-4 bg-green-50 rounded-lg">
            <h4 class="text-sm font-medium text-green-900 mb-2">Información del Permiso</h4>
            <div class="text-sm">
              <span class="text-green-700">Roles que tienen este permiso:</span>
              <span class="font-medium text-green-900 ml-1">{{permiso.RolPermisos?.length || 0}}</span>
            </div>
            <div *ngIf="permiso.RolPermisos && permiso.RolPermisos.length > 0" class="mt-2">
              <div class="flex flex-wrap gap-1">
                <span 
                  *ngFor="let rolPermiso of permiso.RolPermisos.slice(0, 3)" 
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {{rolPermiso.Roles?.nombreRol}}
                </span>
                <span 
                  *ngIf="permiso.RolPermisos.length > 3" 
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  +{{permiso.RolPermisos.length - 3}} más
                </span>
              </div>
            </div>
            <p class="text-xs text-green-600 mt-2">
              <i class="fas fa-info-circle mr-1"></i>
              La asignación a roles se gestiona desde la sección de roles
            </p>
          </div>

          <!-- Loading indicator -->
          <div *ngIf="guardando" class="mb-4 text-center">
            <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-green-500 bg-white">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando permiso...
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              (click)="cerrarModal()"
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button
              type="submit"
              [disabled]="permisoForm.invalid || guardando"
              class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed">
              {{ isEditing ? 'Actualizar' : 'Crear' }} Permiso
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class PermisoModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() permiso: PermisoConRoles | null = null;
  @Output() modalClosed = new EventEmitter<void>();
  @Output() permisoGuardado = new EventEmitter<PermisoConRoles>();

  permisoForm: FormGroup;
  isEditing = false;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private permisosService: PermisosService
  ) {
    this.permisoForm = this.createForm();
  }

  ngOnInit() {
    // Inicialización si es necesaria
  }

  ngOnChanges() {
    if (this.isOpen) {
      this.isEditing = !!this.permiso;
      this.resetForm();
      if (this.permiso) {
        this.cargarDatosPermiso();
      }
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      permiso: ['', [
        Validators.required, 
        Validators.minLength(3), 
        Validators.maxLength(100)
      ]],
      descripcion: ['', [
        Validators.required, 
        Validators.minLength(10), 
        Validators.maxLength(255)
      ]]
    });
  }

  private resetForm() {
    this.permisoForm.reset();
  }

  private cargarDatosPermiso() {
    if (this.permiso) {
      this.permisoForm.patchValue({
        permiso: this.permiso.permiso,
        descripcion: this.permiso.descripcion
      });
    }
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.cerrarModal();
    }
  }

  cerrarModal() {
    this.modalClosed.emit();
    this.resetForm();
  }

  onSubmit() {
    if (this.permisoForm.valid && !this.guardando) {
      this.guardando = true;
      
      if (this.isEditing) {
        this.actualizarPermiso();
      } else {
        this.crearPermiso();
      }
    }
  }

  private crearPermiso() {
    const formData = this.permisoForm.value as CreatePermisoDto;
    
    this.permisosService.create(formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.permisoGuardado.emit(response.data);
          this.cerrarModal();
          alert('Permiso creado exitosamente');
        }
        this.guardando = false;
      },
      error: (error) => {
        console.error('Error al crear permiso:', error);
        alert('Error al crear permiso: ' + (error.error?.message || 'Error desconocido'));
        this.guardando = false;
      }
    });
  }

  private actualizarPermiso() {
    if (!this.permiso) return;
    
    const formData = this.permisoForm.value as UpdatePermisoDto;
    
    this.permisosService.update(this.permiso.idPermisos, formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.permisoGuardado.emit(response.data);
          this.cerrarModal();
          alert('Permiso actualizado exitosamente');
        }
        this.guardando = false;
      },
      error: (error) => {
        console.error('Error al actualizar permiso:', error);
        alert('Error al actualizar permiso: ' + (error.error?.message || 'Error desconocido'));
        this.guardando = false;
      }
    });
  }
}
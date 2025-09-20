import { Component, EventEmitter, Input, OnInit, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RolesService } from '../services/roles.service';
import { CreateRolDto, UpdateRolDto, RolConPermisos } from '../models/usuario.interface';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-rol-modal',
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
            {{ isEditing ? 'Editar Rol' : 'Crear Nuevo Rol' }}
          </h3>
          <button 
            (click)="cerrarModal()"
            class="text-gray-400 hover:text-gray-600 transition-colors">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <!-- Form -->
        <form [formGroup]="rolForm" (ngSubmit)="onSubmit()" class="mt-6">
          <!-- Nombre del Rol -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Rol <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              formControlName="nombreRol"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              [class.border-red-500]="rolForm.get('nombreRol')?.invalid && rolForm.get('nombreRol')?.touched"
              placeholder="Ej: Administrador, Usuario, Supervisor">
            <div *ngIf="rolForm.get('nombreRol')?.invalid && rolForm.get('nombreRol')?.touched" 
                 class="text-red-500 text-sm mt-1">
              <span *ngIf="rolForm.get('nombreRol')?.errors?.['required']">El nombre del rol es requerido</span>
              <span *ngIf="rolForm.get('nombreRol')?.errors?.['minlength']">El nombre debe tener al menos 3 caracteres</span>
              <span *ngIf="rolForm.get('nombreRol')?.errors?.['maxlength']">El nombre no puede exceder 50 caracteres</span>
            </div>
          </div>

          <!-- Descripción -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Descripción <span class="text-red-500">*</span>
            </label>
            <textarea
              formControlName="descripcion"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              [class.border-red-500]="rolForm.get('descripcion')?.invalid && rolForm.get('descripcion')?.touched"
              placeholder="Describe las responsabilidades y alcance de este rol..."></textarea>
            <div *ngIf="rolForm.get('descripcion')?.invalid && rolForm.get('descripcion')?.touched" 
                 class="text-red-500 text-sm mt-1">
              <span *ngIf="rolForm.get('descripcion')?.errors?.['required']">La descripción es requerida</span>
              <span *ngIf="rolForm.get('descripcion')?.errors?.['minlength']">La descripción debe tener al menos 10 caracteres</span>
              <span *ngIf="rolForm.get('descripcion')?.errors?.['maxlength']">La descripción no puede exceder 255 caracteres</span>
            </div>
          </div>

          <!-- Información sobre permisos (solo cuando se edita) -->
          <div *ngIf="isEditing && rol" class="mb-4 p-4 bg-blue-50 rounded-lg">
            <h4 class="text-sm font-medium text-blue-900 mb-2">Información del Rol</h4>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-blue-700">Permisos asignados:</span>
                <span class="font-medium text-blue-900 ml-1">{{rol.RolPermisos?.length || 0}}</span>
              </div>
              <div>
                <span class="text-blue-700">Usuarios con este rol:</span>
                <span class="font-medium text-blue-900 ml-1">{{rol.Usuarios?.length || 0}}</span>
              </div>
            </div>
            <p class="text-xs text-blue-600 mt-2">
              <i class="fas fa-info-circle mr-1"></i>
              Los permisos se gestionan por separado después de crear/editar el rol
            </p>
          </div>

          <!-- Loading indicator -->
          <div *ngIf="guardando" class="mb-4 text-center">
            <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-blue-500 bg-white">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando rol...
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
              [disabled]="rolForm.invalid || guardando"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
              {{ isEditing ? 'Actualizar' : 'Crear' }} Rol
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class RolModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() rol: RolConPermisos | null = null;
  @Output() modalClosed = new EventEmitter<void>();
  @Output() rolGuardado = new EventEmitter<RolConPermisos>();

  rolForm: FormGroup;
  isEditing = false;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private rolesService: RolesService,
    private sweetAlert: SweetAlertService
  ) {
    this.rolForm = this.createForm();
  }

  ngOnInit() {
    // Inicialización si es necesaria
  }

  ngOnChanges() {
    if (this.isOpen) {
      this.isEditing = !!this.rol;
      this.resetForm();
      if (this.rol) {
        this.cargarDatosRol();
      }
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nombreRol: ['', [
        Validators.required, 
        Validators.minLength(3), 
        Validators.maxLength(50)
      ]],
      descripcion: ['', [
        Validators.required, 
        Validators.minLength(10), 
        Validators.maxLength(255)
      ]]
    });
  }

  private resetForm() {
    this.rolForm.reset();
  }

  private cargarDatosRol() {
    if (this.rol) {
      this.rolForm.patchValue({
        nombreRol: this.rol.nombreRol,
        descripcion: this.rol.descripcion
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
    if (this.rolForm.valid && !this.guardando) {
      this.guardando = true;
      
      if (this.isEditing) {
        this.actualizarRol();
      } else {
        this.crearRol();
      }
    }
  }

  private crearRol() {
    const formData = this.rolForm.value as CreateRolDto;
    
    this.rolesService.create(formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.rolGuardado.emit(response.data);
          this.cerrarModal();
          this.sweetAlert.success('¡Rol creado!', 'El rol se ha creado exitosamente');
        }
        this.guardando = false;
      },
      error: (error) => {
        console.error('Error al crear rol:', error);
        const errorMessage = error.error?.message || error.message || 'Error desconocido';
        this.sweetAlert.error('Error al crear rol', errorMessage);
        this.guardando = false;
      }
    });
  }

  private actualizarRol() {
    if (!this.rol) return;
    
    const formData = this.rolForm.value as UpdateRolDto;
    
    this.rolesService.update(this.rol.idRoles, formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.rolGuardado.emit(response.data);
          this.cerrarModal();
          this.sweetAlert.success('¡Rol actualizado!', 'El rol se ha actualizado exitosamente');
        }
        this.guardando = false;
      },
      error: (error) => {
        console.error('Error al actualizar rol:', error);
        const errorMessage = error.error?.message || error.message || 'Error desconocido';
        this.sweetAlert.error('Error al actualizar rol', errorMessage);
        this.guardando = false;
      }
    });
  }
}
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
    <div *ngIf="isOpen" class="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4" (click)="onBackdropClick($event)">
      <div class="card-responsive w-full max-w-2xl" (click)="$event.stopPropagation()">
        <form [formGroup]="rolForm" (ngSubmit)="onSubmit()" class="card-responsive__body space-y-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-xl font-semibold text-heading">{{ isEditing ? 'Editar Rol' : 'Crear Nuevo Rol' }}</h3>
              <p class="text-muted text-sm mt-1">Completa los campos para {{ isEditing ? 'actualizar' : 'registrar' }} un rol en el sistema</p>
            </div>
            <button type="button" (click)="cerrarModal()" class="btn-secondary-dark btn-compact">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                Nombre del Rol <span class="text-danger">*</span>
              </label>
              <input
                type="text"
                formControlName="nombreRol"
                class="form-control-dark"
                [class.is-invalid]="rolForm.get('nombreRol')?.invalid && rolForm.get('nombreRol')?.touched"
                placeholder="Ej: Administrador, Usuario, Supervisor"
              />
              <div *ngIf="rolForm.get('nombreRol')?.invalid && rolForm.get('nombreRol')?.touched" class="text-danger text-sm mt-1">
                <span *ngIf="rolForm.get('nombreRol')?.errors?.['required']">El nombre del rol es requerido</span>
                <span *ngIf="rolForm.get('nombreRol')?.errors?.['minlength']">El nombre debe tener al menos 3 caracteres</span>
                <span *ngIf="rolForm.get('nombreRol')?.errors?.['maxlength']">El nombre no puede exceder 50 caracteres</span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                Descripción <span class="text-danger">*</span>
              </label>
              <textarea
                formControlName="descripcion"
                rows="4"
                class="form-control-dark"
                [class.is-invalid]="rolForm.get('descripcion')?.invalid && rolForm.get('descripcion')?.touched"
                placeholder="Describe las responsabilidades y alcance de este rol..."
              ></textarea>
              <div *ngIf="rolForm.get('descripcion')?.invalid && rolForm.get('descripcion')?.touched" class="text-danger text-sm mt-1">
                <span *ngIf="rolForm.get('descripcion')?.errors?.['required']">La descripción es requerida</span>
                <span *ngIf="rolForm.get('descripcion')?.errors?.['minlength']">La descripción debe tener al menos 10 caracteres</span>
                <span *ngIf="rolForm.get('descripcion')?.errors?.['maxlength']">La descripción no puede exceder 255 caracteres</span>
              </div>
            </div>
          </div>

          <div *ngIf="isEditing && rol" class="surface-interactive border border-subtle bg-surface-alt rounded-xl p-4 space-y-3">
            <h4 class="text-sm font-semibold text-heading flex items-center gap-2">
              <i class="fas fa-info-circle text-info"></i>
              Información del Rol
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted">
              <div>
                Permisos asignados:
                <span class="badge badge-info ml-1">{{ rol.RolPermisos.length || 0 }}</span>
              </div>
              <div>
                Usuarios con este rol:
                <span class="badge badge-muted ml-1">{{ rol.Usuarios.length || 0 }}</span>
              </div>
            </div>
            <p class="text-xs text-muted">
              Los permisos se gestionan en la pantalla de gestión de permisos.
            </p>
          </div>

          <div *ngIf="guardando" class="alert alert-info flex items-center gap-2">
            <i class="fas fa-circle-notch fa-spin"></i>
            Guardando rol...
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" (click)="cerrarModal()" class="btn-secondary-dark btn-compact">
              Cancelar
            </button>
            <button type="submit" [disabled]="rolForm.invalid || guardando" class="btn-primary-dark btn-compact" [class.opacity-50]="rolForm.invalid || guardando">
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
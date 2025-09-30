import { Component, EventEmitter, Input, OnInit, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PermisosService } from '../services/permisos.service';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { CreatePermisoDto, UpdatePermisoDto, PermisoConRoles } from '../models/usuario.interface';

@Component({
  selector: 'app-permiso-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4" (click)="onBackdropClick($event)">
      <div class="card-responsive w-full max-w-2xl" (click)="$event.stopPropagation()">
        <form [formGroup]="permisoForm" (ngSubmit)="onSubmit()" class="card-responsive__body space-y-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-xl font-semibold text-heading">{{ isEditing ? 'Editar Permiso' : 'Crear Nuevo Permiso' }}</h3>
              <p class="text-muted text-sm mt-1">Define el nombre y la descripción para controlar el acceso a funcionalidades.</p>
            </div>
            <button type="button" (click)="cerrarModal()" class="btn-secondary-dark btn-compact">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                Nombre del Permiso <span class="text-danger">*</span>
              </label>
              <input
                type="text"
                formControlName="permiso"
                class="form-control-dark"
                [class.is-invalid]="permisoForm.get('permiso')?.invalid && permisoForm.get('permiso')?.touched"
                placeholder="Ej: crear_usuarios, ver_reportes"
              />
              <div *ngIf="permisoForm.get('permiso')?.invalid && permisoForm.get('permiso')?.touched" class="text-danger text-sm mt-1">
                <span *ngIf="permisoForm.get('permiso')?.errors?.['required']">El nombre del permiso es requerido</span>
                <span *ngIf="permisoForm.get('permiso')?.errors?.['minlength']">El nombre debe tener al menos 3 caracteres</span>
                <span *ngIf="permisoForm.get('permiso')?.errors?.['maxlength']">El nombre no puede exceder 100 caracteres</span>
              </div>
              <p class="text-xs text-muted mt-2">
                Usa un formato descriptivo como <span class="badge badge-info">accion_recurso</span> (ej: crear_usuario, editar_producto).
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                Descripción <span class="text-danger">*</span>
              </label>
              <textarea
                formControlName="descripcion"
                rows="4"
                class="form-control-dark"
                [class.is-invalid]="permisoForm.get('descripcion')?.invalid && permisoForm.get('descripcion')?.touched"
                placeholder="Describe las acciones que habilita este permiso"
              ></textarea>
              <div *ngIf="permisoForm.get('descripcion')?.invalid && permisoForm.get('descripcion')?.touched" class="text-danger text-sm mt-1">
                <span *ngIf="permisoForm.get('descripcion')?.errors?.['required']">La descripción es requerida</span>
                <span *ngIf="permisoForm.get('descripcion')?.errors?.['minlength']">La descripción debe tener al menos 10 caracteres</span>
                <span *ngIf="permisoForm.get('descripcion')?.errors?.['maxlength']">La descripción no puede exceder 255 caracteres</span>
              </div>
            </div>
          </div>

          <div *ngIf="isEditing && permiso" class="surface-interactive border border-subtle bg-surface-alt rounded-xl p-4 space-y-3">
            <h4 class="text-sm font-semibold text-heading flex items-center gap-2">
              <i class="fas fa-user-shield text-success"></i>
              Información del Permiso
            </h4>
            <div class="text-sm text-muted flex flex-wrap items-center gap-2">
              Roles que utilizan este permiso:
              <span class="badge badge-success">{{ permiso.RolPermisos.length || 0 }}</span>
            </div>
            <div *ngIf="permiso.RolPermisos && permiso.RolPermisos.length > 0" class="flex flex-wrap gap-2">
              <span *ngFor="let rolPermiso of permiso.RolPermisos.slice(0, 3)" class="badge badge-muted">
                {{ rolPermiso.Roles.nombreRol }}
              </span>
              <span *ngIf="permiso.RolPermisos.length > 3" class="badge badge-info">
                +{{ permiso.RolPermisos.length - 3 }} más
              </span>
            </div>
            <p class="text-xs text-muted">
              La asignación a roles se administra desde la vista de roles.
            </p>
          </div>

          <div *ngIf="guardando" class="alert alert-info flex items-center gap-2">
            <i class="fas fa-circle-notch fa-spin"></i>
            Guardando permiso...
          </div>

          <div class="flex justify-end gap-3">
            <button type="button" (click)="cerrarModal()" class="btn-secondary-dark btn-compact">
              Cancelar
            </button>
            <button type="submit" [disabled]="permisoForm.invalid || guardando" class="btn-primary-dark btn-compact" [class.opacity-50]="permisoForm.invalid || guardando">
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
    private permisosService: PermisosService,
    private sweetAlert: SweetAlertService
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
          this.sweetAlert.success('Permiso creado', 'Permiso creado exitosamente');
        }
        this.guardando = false;
      },
      error: (error) => {
        console.error('Error al crear permiso:', error);
        this.sweetAlert.error('Error al crear permiso', error.error?.message || 'Error desconocido');
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
          this.sweetAlert.success('Permiso actualizado', 'Permiso actualizado exitosamente');
        }
        this.guardando = false;
      },
      error: (error) => {
        console.error('Error al actualizar permiso:', error);
        this.sweetAlert.error('Error al actualizar permiso', error.error?.message || 'Error desconocido');
        this.guardando = false;
      }
    });
  }
}
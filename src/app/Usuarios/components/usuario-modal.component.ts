import { Component, EventEmitter, Input, OnInit, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { UsuariosService } from '../services/usuarios.service';
import { RolesService } from '../services/roles.service';
import { CreateUsuarioDto, UpdateUsuarioDto, Usuario, RolConPermisos } from '../models/usuario.interface';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-usuario-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4" (click)="onBackdropClick($event)">
      <div class="card-responsive w-full max-w-3xl" (click)="$event.stopPropagation()">
        <form [formGroup]="usuarioForm" (ngSubmit)="onSubmit()" class="card-responsive__body space-y-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-xl font-semibold text-heading">{{ isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario' }}</h3>
              <p class="text-sm text-muted mt-1">
                Gestiona la información personal y de acceso para el usuario.
              </p>
            </div>
            <button type="button" (click)="cerrarModal()" class="btn-secondary-dark btn-compact">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div *ngIf="isEditing && usuario" class="surface-interactive border border-subtle bg-surface-alt rounded-xl p-4 space-y-3">
            <h4 class="text-sm font-semibold text-heading flex items-center gap-2">
              <i class="fas fa-id-badge text-info"></i>
              Resumen del usuario
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted">
              <div class="space-y-1">
                <span class="text-xs uppercase tracking-wide text-muted-strong">Correo</span>
                <p class="text-heading font-medium truncate">{{ usuario.correo }}</p>
              </div>
              <div class="space-y-1">
                <span class="text-xs uppercase tracking-wide text-muted-strong">Estado</span>
                <span class="badge" [ngClass]="usuario.activo ? 'badge-success' : 'badge-danger'">
                  {{ usuario.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                Nombres <span class="text-danger">*</span>
              </label>
              <input
                type="text"
                formControlName="nombres"
                class="form-control-dark"
                [class.is-invalid]="usuarioForm.get('nombres')?.invalid && usuarioForm.get('nombres')?.touched"
                placeholder="Ingrese los nombres"
              />
              <div *ngIf="usuarioForm.get('nombres')?.invalid && usuarioForm.get('nombres')?.touched" class="text-danger text-xs mt-1">
                Los nombres son requeridos
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                Apellidos <span class="text-danger">*</span>
              </label>
              <input
                type="text"
                formControlName="apellidos"
                class="form-control-dark"
                [class.is-invalid]="usuarioForm.get('apellidos')?.invalid && usuarioForm.get('apellidos')?.touched"
                placeholder="Ingrese los apellidos"
              />
              <div *ngIf="usuarioForm.get('apellidos')?.invalid && usuarioForm.get('apellidos')?.touched" class="text-danger text-xs mt-1">
                Los apellidos son requeridos
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-muted mb-1">
              Correo electrónico <span class="text-danger">*</span>
            </label>
            <input
              type="email"
              formControlName="correo"
              class="form-control-dark"
              [class.is-invalid]="usuarioForm.get('correo')?.invalid && usuarioForm.get('correo')?.touched"
              placeholder="usuario@ejemplo.com"
            />
            <div *ngIf="usuarioForm.get('correo')?.invalid && usuarioForm.get('correo')?.touched" class="text-danger text-xs mt-1 space-y-1">
              <div *ngIf="usuarioForm.get('correo')?.errors?.['required']">El correo es requerido</div>
              <div *ngIf="usuarioForm.get('correo')?.errors?.['email']">Ingrese un correo válido</div>
            </div>
          </div>

          <div *ngIf="!isEditing">
            <label class="block text-sm font-medium text-muted mb-1">
              Contraseña <span class="text-danger">*</span>
            </label>
            <div class="relative">
              <input
                [type]="showPassword ? 'text' : 'password'"
                formControlName="password"
                class="form-control-dark pr-10"
                [class.is-invalid]="usuarioForm.get('password')?.invalid && usuarioForm.get('password')?.touched"
                placeholder="Ingrese la contraseña"
              />
              <button
                type="button"
                (click)="togglePasswordVisibility()"
                class="absolute inset-y-0 right-2 flex items-center text-muted hover:text-heading transition-colors"
                aria-label="Mostrar u ocultar contraseña"
              >
                <i class="{{ showPassword ? 'fas fa-eye-slash' : 'fas fa-eye' }}"></i>
              </button>
            </div>
            <div *ngIf="usuarioForm.get('password')?.invalid && usuarioForm.get('password')?.touched" class="text-danger text-xs mt-2 space-y-1">
              <div *ngIf="usuarioForm.get('password')?.errors?.['required']">La contraseña es requerida</div>
              <div *ngIf="usuarioForm.get('password')?.errors?.['minLength']">{{ usuarioForm.get('password')?.errors?.['minLength'] }}</div>
              <div *ngIf="usuarioForm.get('password')?.errors?.['lowercase']">{{ usuarioForm.get('password')?.errors?.['lowercase'] }}</div>
              <div *ngIf="usuarioForm.get('password')?.errors?.['uppercase']">{{ usuarioForm.get('password')?.errors?.['uppercase'] }}</div>
              <div *ngIf="usuarioForm.get('password')?.errors?.['numbers']">{{ usuarioForm.get('password')?.errors?.['numbers'] }}</div>
              <div *ngIf="usuarioForm.get('password')?.errors?.['special']">{{ usuarioForm.get('password')?.errors?.['special'] }}</div>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                formControlName="telefono"
                class="form-control-dark"
                placeholder="Ingrese el teléfono"
                maxlength="8"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                Rol <span class="text-danger">*</span>
              </label>
              <select
                formControlName="idRol"
                class="form-control-dark"
                [class.is-invalid]="usuarioForm.get('idRol')?.invalid && usuarioForm.get('idRol')?.touched"
              >
                <option value="">Seleccione un rol</option>
                <option *ngFor="let rol of roles" [value]="rol.idRoles">
                  {{ rol.nombreRol }} - {{ rol.descripcion }}
                </option>
              </select>
              <div *ngIf="usuarioForm.get('idRol')?.invalid && usuarioForm.get('idRol')?.touched" class="text-danger text-xs mt-1">
                Debe seleccionar un rol
              </div>
            </div>
          </div>

          <div *ngIf="isEditing">
            <label class="inline-flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                formControlName="activo"
                class="h-4 w-4 rounded border-subtle bg-surface-alt"
                [style.accentColor]="'var(--color-primary)'"
              />
              Usuario activo
            </label>
          </div>

          <div *ngIf="guardando" class="alert flex items-center gap-2 text-info text-sm">
            <i class="fas fa-circle-notch fa-spin"></i>
            Guardando...
          </div>

          <div class="flex flex-col-reverse gap-3 pt-4 border-t border-subtle sm:flex-row sm:items-center sm:justify-end">
            <button type="button" (click)="cerrarModal()" class="inline-flex items-center justify-start border border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl">
               <i class="fa-solid fa-ban mr-2"></i>
               Cancelar
            </button>
            <button
              type="submit"
              [disabled]="usuarioForm.invalid || guardando"
              class="inline-flex items-center justify-start border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white px-4 py-2 rounded-xl"
              [class.opacity-50]="usuarioForm.invalid || guardando"
            ><i class="fa-solid fa-floppy-disk mr-2"></i>
              {{ isEditing ? 'Actualizar' : 'Crear' }} Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class UsuarioModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() usuario: Usuario | null = null;
  @Output() modalClosed = new EventEmitter<void>();
  @Output() usuarioGuardado = new EventEmitter<Usuario>();

  usuarioForm: FormGroup;
  roles: RolConPermisos[] = [];
  isEditing = false;
  guardando = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private usuariosService: UsuariosService,
    private rolesService: RolesService,
    private sweetAlert: SweetAlertService
  ) {
    this.usuarioForm = this.createForm();
  }

  // Validador personalizado para contraseñas fuertes
  private strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null; // Si no hay valor, otros validators manejarán el required
    }

    const errors: any = {};

    // Mínimo 8 caracteres
    if (value.length < 8) {
      errors.minLength = 'Debe tener al menos 8 caracteres';
    }

    // Letras minúsculas
    if (!/[a-z]/.test(value)) {
      errors.lowercase = 'Debe contener letras minúsculas';
    }

    // Letras mayúsculas
    if (!/[A-Z]/.test(value)) {
      errors.uppercase = 'Debe contener letras mayúsculas';
    }

    // Números
    if (!/\d/.test(value)) {
      errors.numbers = 'Debe contener números';
    }

    // Caracteres especiales
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
      errors.special = 'Debe contener caracteres especiales (!@#$%^&*...)';
    }

    return Object.keys(errors).length === 0 ? null : errors;
  }

  ngOnInit() {
    this.cargarRoles();
  }

  ngOnChanges() {
    if (this.isOpen) {
      this.isEditing = !!this.usuario;
      this.resetForm();
      if (this.usuario) {
        this.cargarDatosUsuario();
      }
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, this.strongPasswordValidator.bind(this)]],
      telefono: [''],
      idRol: ['', Validators.required],
      activo: [true]
    });
  }

  private resetForm() {
    this.usuarioForm.reset({
      activo: true
    });
    
    // Configurar validaciones según el modo
    const passwordControl = this.usuarioForm.get('password');
    if (this.isEditing) {
      // En edición, la contraseña es opcional
      passwordControl?.setValidators([this.strongPasswordValidator.bind(this)]);
    } else {
      // En creación, la contraseña es requerida y debe ser fuerte
      passwordControl?.setValidators([Validators.required, this.strongPasswordValidator.bind(this)]);
    }
    passwordControl?.updateValueAndValidity();
  }

  private cargarDatosUsuario() {
    if (this.usuario) {
      this.usuarioForm.patchValue({
        nombres: this.usuario.nombres,
        apellidos: this.usuario.apellidos,
        correo: this.usuario.correo,
        telefono: this.usuario.telefono,
        idRol: this.usuario.idRol,
        activo: this.usuario.activo
      });
    }
  }

  private cargarRoles() {
    this.rolesService.findAll().subscribe({
      next: (response) => {
        if (response.success) {
          this.roles = response.data;
        }
      },
      error: (error) => {
        console.error('Error al cargar roles:', error);
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
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
    if (this.usuarioForm.valid && !this.guardando) {
      this.guardando = true;
      
      if (this.isEditing) {
        this.actualizarUsuario();
      } else {
        this.crearUsuario();
      }
    }
  }

  private crearUsuario() {
    const formData = this.usuarioForm.value as CreateUsuarioDto;
       
    // Validar datos requeridos
    if (!formData.nombres || !formData.apellidos || !formData.correo || !formData.password || !formData.idRol) {
      this.sweetAlert.warning('Campos requeridos', 'Por favor complete todos los campos requeridos');
      this.guardando = false;
      return;
    }

    // Asegurar que idRol sea un número
    const usuarioData = {
      ...formData,
      idRol: Number(formData.idRol),
      telefono: formData.telefono ? Number(formData.telefono) : undefined
    };
    
    this.usuariosService.create(usuarioData).subscribe({
      next: (response) => {
        if (response.success) {
          this.usuarioGuardado.emit(response.data);
          this.cerrarModal();
          this.sweetAlert.success('¡Usuario creado!', 'El usuario se ha creado exitosamente');
        }
        this.guardando = false;
      },
      error: (error) => {
        let errorMessage = 'Error desconocido';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (typeof error.error === 'string') {
          errorMessage = error.error;
        }
        
        this.sweetAlert.error('Error al crear usuario', errorMessage);
        this.guardando = false;
      }
    });
  }

  private actualizarUsuario() {
    if (!this.usuario) return;
    
    const formData = this.usuarioForm.value;
    
    // Crear DTO solo con los campos permitidos para actualización (sin password)
    const updateData: UpdateUsuarioDto = {
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      correo: formData.correo,
      telefono: formData.telefono ? Number(formData.telefono) : undefined,
      idRol: Number(formData.idRol),
      activo: formData.activo
    };
        
    this.usuariosService.update(this.usuario.idUsuario, updateData).subscribe({
      next: (response) => {
        if (response.success) {
          this.usuarioGuardado.emit(response.data);
          this.cerrarModal();
          this.sweetAlert.success('¡Usuario actualizado!', 'Los datos del usuario se han actualizado exitosamente');
        }
        this.guardando = false;
      },
      error: (error) => {
        console.error('Error al actualizar usuario:', error);
        const errorMessage = error.error?.message || error.message || 'Error desconocido';
        this.sweetAlert.error('Error al actualizar usuario', errorMessage);
        this.guardando = false;
      }
    });
  }
}
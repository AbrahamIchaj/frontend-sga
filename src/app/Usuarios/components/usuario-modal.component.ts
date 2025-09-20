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
    <!-- Modal Backdrop -->
    <div *ngIf="isOpen" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" (click)="onBackdropClick($event)">
      <!-- Modal Content -->
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 xl:w-2/5 shadow-lg rounded-md bg-white">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b">
          <h3 class="text-lg font-medium text-gray-900">
            {{ isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario' }}
          </h3>
          <button 
            (click)="cerrarModal()"
            class="text-gray-400 hover:text-gray-600 transition-colors">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <!-- Form -->
        <form [formGroup]="usuarioForm" (ngSubmit)="onSubmit()" class="mt-6">
          <!-- Información Personal -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <!-- Nombres -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nombres <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                formControlName="nombres"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                [class.border-red-500]="usuarioForm.get('nombres')?.invalid && usuarioForm.get('nombres')?.touched"
                placeholder="Ingrese los nombres">
              <div *ngIf="usuarioForm.get('nombres')?.invalid && usuarioForm.get('nombres')?.touched" 
                   class="text-red-500 text-sm mt-1">
                Los nombres son requeridos
              </div>
            </div>

            <!-- Apellidos -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Apellidos <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                formControlName="apellidos"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                [class.border-red-500]="usuarioForm.get('apellidos')?.invalid && usuarioForm.get('apellidos')?.touched"
                placeholder="Ingrese los apellidos">
              <div *ngIf="usuarioForm.get('apellidos')?.invalid && usuarioForm.get('apellidos')?.touched" 
                   class="text-red-500 text-sm mt-1">
                Los apellidos son requeridos
              </div>
            </div>
          </div>

          <!-- Email -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico <span class="text-red-500">*</span>
            </label>
            <input
              type="email"
              formControlName="correo"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              [class.border-red-500]="usuarioForm.get('correo')?.invalid && usuarioForm.get('correo')?.touched"
              placeholder="usuario@ejemplo.com">
            <div *ngIf="usuarioForm.get('correo')?.invalid && usuarioForm.get('correo')?.touched" 
                 class="text-red-500 text-sm mt-1">
              <span *ngIf="usuarioForm.get('correo')?.errors?.['required']">El correo es requerido</span>
              <span *ngIf="usuarioForm.get('correo')?.errors?.['email']">Ingrese un correo válido</span>
            </div>
          </div>

          <!-- Contraseña (solo para crear) -->
          <div *ngIf="!isEditing" class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Contraseña <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                [type]="showPassword ? 'text' : 'password'"
                formControlName="password"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                [class.border-red-500]="usuarioForm.get('password')?.invalid && usuarioForm.get('password')?.touched"
                placeholder="Ingrese la contraseña">
              <button 
                type="button" 
                (click)="togglePasswordVisibility()"
                class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <i [class]="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" class="text-gray-400"></i>
              </button>
            </div>
            <div *ngIf="usuarioForm.get('password')?.invalid && usuarioForm.get('password')?.touched" 
                 class="text-red-500 text-sm mt-1">
              <div *ngIf="usuarioForm.get('password')?.errors?.['required']">La contraseña es requerida</div>
              <div *ngIf="usuarioForm.get('password')?.errors?.['minLength']">{{usuarioForm.get('password')?.errors?.['minLength']}}</div>
              <div *ngIf="usuarioForm.get('password')?.errors?.['lowercase']">{{usuarioForm.get('password')?.errors?.['lowercase']}}</div>
              <div *ngIf="usuarioForm.get('password')?.errors?.['uppercase']">{{usuarioForm.get('password')?.errors?.['uppercase']}}</div>
              <div *ngIf="usuarioForm.get('password')?.errors?.['numbers']">{{usuarioForm.get('password')?.errors?.['numbers']}}</div>
              <div *ngIf="usuarioForm.get('password')?.errors?.['special']">{{usuarioForm.get('password')?.errors?.['special']}}</div>
            </div>
          </div>

          <!-- Teléfono -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="number"
              formControlName="telefono"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese el teléfono">
          </div>

          <!-- Rol -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Rol <span class="text-red-500">*</span>
            </label>
            <select
              formControlName="idRol"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              [class.border-red-500]="usuarioForm.get('idRol')?.invalid && usuarioForm.get('idRol')?.touched">
              <option value="">Seleccione un rol</option>
              <option *ngFor="let rol of roles" [value]="rol.idRoles">
                {{rol.nombreRol}} - {{rol.descripcion}}
              </option>
            </select>
            <div *ngIf="usuarioForm.get('idRol')?.invalid && usuarioForm.get('idRol')?.touched" 
                 class="text-red-500 text-sm mt-1">
              Debe seleccionar un rol
            </div>
          </div>

          <!-- Estado (solo para editar) -->
          <div *ngIf="isEditing" class="mb-4">
            <label class="flex items-center">
              <input
                type="checkbox"
                formControlName="activo"
                class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
              <span class="ml-2 text-sm text-gray-700">Usuario Activo</span>
            </label>
          </div>

          <!-- Loading indicator -->
          <div *ngIf="guardando" class="mb-4 text-center">
            <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-blue-500 bg-white">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
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
              [disabled]="usuarioForm.invalid || guardando"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
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
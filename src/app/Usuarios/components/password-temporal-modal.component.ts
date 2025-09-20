import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsuariosService } from '../services/usuarios.service';
import { Usuario, GenerateTemporaryPasswordDto, LogPasswordTemporal } from '../models/usuario.interface';

@Component({
  selector: 'app-password-temporal-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50" (click)="cerrar()">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-[#1e293b] border-[#334155]" (click)="$event.stopPropagation()">
        <div class="mt-3">
          <!-- Header -->
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-100">
              <i class="fas fa-key text-orange-500 mr-2"></i>
              Gestión de Contraseña Temporal
            </h3>
            <button 
              (click)="cerrar()"
              class="text-gray-400 hover:text-gray-200">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Información del usuario -->
          <div class="bg-[#232e47] p-4 rounded-lg mb-6 border border-[#334155]">
            <h4 class="font-medium text-blue-300 mb-2">Usuario Seleccionado</h4>
            <div class="text-sm text-gray-300">
              <p><span class="font-medium">Nombre:</span> {{usuario.nombres}} {{usuario.apellidos}}</p>
              <p><span class="font-medium">Correo:</span> {{usuario.correo}}</p>
              <p><span class="font-medium">Estado:</span> 
                <span [class]="usuario.activo ? 'text-green-400' : 'text-red-400'">
                  {{usuario.activo ? 'Activo' : 'Inactivo'}}
                </span>
              </p>
              <p *ngIf="usuario.esTemporal" class="text-orange-400">
                <i class="fas fa-exclamation-triangle mr-1"></i>
                <span class="font-medium">Contraseña temporal activa</span>
              </p>
              <p *ngIf="usuario.debesCambiarPassword" class="text-red-400">
                <i class="fas fa-lock mr-1"></i>
                <span class="font-medium">Debe cambiar contraseña</span>
              </p>
            </div>
          </div>

          <!-- Tabs -->
          <div class="border-b border-[#334155] mb-6">
            <nav class="-mb-px flex space-x-8">
              <button
                [class]="tabActiva === 'generar' ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'"
                class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                (click)="cambiarTab('generar')">
                Generar Contraseña
              </button>
              <button
                [class]="tabActiva === 'historial' ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'"
                class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                (click)="cambiarTab('historial')">
                Historial
              </button>
            </nav>
          </div>

          <!-- Tab Content: Generar -->
          <div *ngIf="tabActiva === 'generar'">
            <form [formGroup]="formulario" (ngSubmit)="generarContrasena()">
              <div class="space-y-4">
                <!-- Campo administrativo (readonly) -->
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">
                    Administrador que genera
                  </label>
                  <input 
                    type="email"
                    formControlName="adminEmail"
                    readonly
                    class="w-full px-3 py-2 border border-[#334155] rounded-md shadow-sm bg-[#232e47] text-gray-400 focus:outline-none">
                </div>

                <!-- Motivo -->
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">
                    Motivo de generación <span class="text-red-500">*</span>
                  </label>
                  <textarea 
                    formControlName="motivoGeneracion"
                    rows="3"
                    class="w-full px-3 py-2 border border-[#334155] rounded-md shadow-sm bg-[#232e47] text-white focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Ej: Usuario olvidó su contraseña, primer acceso, motivos de seguridad..."></textarea>
                  <div *ngIf="formulario.get('motivoGeneracion')?.invalid && formulario.get('motivoGeneracion')?.touched" 
                       class="text-red-400 text-sm mt-1">
                    El motivo es requerido
                  </div>
                </div>

                <!-- Horas de expiración -->
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">
                    Horas de expiración
                  </label>
                  <select 
                    formControlName="horasExpiracion"
                    class="w-full px-3 py-2 border border-[#334155] rounded-md shadow-sm bg-[#232e47] text-white focus:ring-orange-500 focus:border-orange-500">
                    <option value="1">1 hora</option>
                    <option value="4">4 horas</option>
                    <option value="8">8 horas</option>
                    <option value="24">24 horas (por defecto)</option>
                    <option value="48">48 horas</option>
                    <option value="72">72 horas</option>
                  </select>
                </div>

                <!-- Información importante -->
                <div class="bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-md p-4">
                  <div class="flex">
                    <i class="fas fa-exclamation-triangle text-yellow-400 mr-2 mt-0.5"></i>
                    <div class="text-sm text-yellow-200">
                      <p class="font-medium mb-1">Importante:</p>
                      <ul class="list-disc list-inside space-y-1">
                        <li>La contraseña temporal se mostrará una sola vez</li>
                        <li>El usuario deberá cambiarla en el primer acceso</li>
                        <li>La contraseña expira automáticamente</li>
                        <li>Se registrará en el historial de seguridad</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Resultado de contraseña generada -->
              <div *ngIf="contrasenaGenerada" class="mt-6 bg-green-900 bg-opacity-30 border border-green-700 rounded-md p-4">
                <div class="flex items-start">
                  <i class="fas fa-check-circle text-green-400 mr-2 mt-0.5"></i>
                  <div class="flex-1">
                    <h4 class="text-sm font-medium text-green-300 mb-2">Contraseña Temporal Generada</h4>
                    <div class="bg-[#232e47] border border-green-600 rounded-md p-3 font-mono text-lg text-center">
                      <span class="select-all font-bold text-green-300">{{contrasenaGenerada.passwordTemporal}}</span>
                      <button 
                        (click)="copiarContrasena()"
                        class="ml-2 text-green-400 hover:text-green-300"
                        title="Copiar contraseña">
                        <i class="fas fa-copy"></i>
                      </button>
                    </div>
                    <p class="text-sm text-green-300 mt-2">
                      <i class="fas fa-clock mr-1"></i>
                      Expira: {{formatearFecha(contrasenaGenerada.fechaExpiracion)}}
                    </p>
                    <p class="text-sm text-green-300">{{contrasenaGenerada.mensaje}}</p>
                  </div>
                </div>
              </div>

              <!-- Botones -->
              <div class="flex justify-end space-x-3 mt-6">
                <button 
                  type="button"
                  (click)="cerrar()"
                  class="px-4 py-2 text-sm font-medium text-gray-300 bg-[#232e47] border border-[#334155] rounded-md hover:bg-[#334155] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                  Cancelar
                </button>
                <button 
                  type="submit"
                  [disabled]="formulario.invalid || generando"
                  class="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed">
                  <i *ngIf="generando" class="fas fa-spinner fa-spin mr-2"></i>
                  {{generando ? 'Generando...' : 'Generar Contraseña'}}
                </button>
              </div>
            </form>
          </div>

          <!-- Tab Content: Historial -->
          <div *ngIf="tabActiva === 'historial'">
            <div *ngIf="cargandoHistorial" class="text-center py-8">
              <i class="fas fa-spinner fa-spin text-gray-400 text-2xl mb-2"></i>
              <p class="text-gray-400">Cargando historial...</p>
            </div>

            <div *ngIf="!cargandoHistorial && historial.length === 0" class="text-center py-8">
              <i class="fas fa-history text-gray-400 text-3xl mb-3"></i>
              <p class="text-gray-400">No hay historial de contraseñas temporales para este usuario</p>
            </div>

            <div *ngIf="!cargandoHistorial && historial.length > 0" class="space-y-3">
              <div *ngFor="let log of historial" class="border border-[#334155] rounded-lg p-4 bg-[#232e47]">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center mb-2">
                      <span [class]="log.usado ? 'bg-green-900 bg-opacity-50 text-green-300 border-green-700' : 'bg-orange-900 bg-opacity-50 text-orange-300 border-orange-700'"
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border">
                        <i [class]="log.usado ? 'fas fa-check mr-1' : 'fas fa-clock mr-1'"></i>
                        {{log.usado ? 'Utilizada' : 'No utilizada'}}
                      </span>
                      <span class="ml-2 text-sm text-gray-400">
                        ID: {{log.idLog}}
                      </span>
                    </div>
                    <p class="text-sm text-gray-200 mb-1">
                      <span class="font-medium">Generada:</span> {{formatearFecha(log.fechaGeneracion)}}
                    </p>
                    <p class="text-sm text-gray-200 mb-1">
                      <span class="font-medium">Expira:</span> {{formatearFecha(log.fechaExpiracion)}}
                    </p>
                    <p *ngIf="log.fechaUso" class="text-sm text-gray-200 mb-1">
                      <span class="font-medium">Utilizada:</span> {{formatearFecha(log.fechaUso)}}
                    </p>
                    <p class="text-sm text-gray-200 mb-1">
                      <span class="font-medium">Administrador:</span> {{log.adminGenerador}}
                    </p>
                    <p class="text-sm text-gray-200">
                      <span class="font-medium">Motivo:</span> {{log.motivoGeneracion}}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PasswordTemporalModalComponent implements OnInit {
  @Input() usuario!: Usuario;
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() passwordGenerada = new EventEmitter<void>();

  formulario: FormGroup;
  tabActiva: 'generar' | 'historial' = 'generar';
  generando = false;
  cargandoHistorial = false;
  contrasenaGenerada: any = null;
  historial: LogPasswordTemporal[] = [];

  constructor(
    private fb: FormBuilder,
    private usuariosService: UsuariosService
  ) {
    this.formulario = this.fb.group({
      motivoGeneracion: ['', [Validators.required, Validators.minLength(10)]],
      adminEmail: ['admin@empresa.com'], // TODO: Obtener del usuario logueado
      horasExpiracion: [24]
    });
  }

  ngOnInit() {
    this.cargarHistorial();
  }

  cambiarTab(tab: 'generar' | 'historial') {
    this.tabActiva = tab;
    if (tab === 'historial' && this.historial.length === 0) {
      this.cargarHistorial();
    }
  }

  cargarHistorial() {
    this.cargandoHistorial = true;
    this.usuariosService.getPasswordHistory(this.usuario.idUsuario).subscribe({
      next: (response) => {
        if (response.success) {
          this.historial = response.data;
        }
        this.cargandoHistorial = false;
      },
      error: (error) => {
        console.error('Error al cargar historial:', error);
        this.cargandoHistorial = false;
      }
    });
  }

  generarContrasena() {
    if (this.formulario.valid) {
      this.generando = true;
      const dto: GenerateTemporaryPasswordDto = this.formulario.value;
      
      this.usuariosService.generateTemporaryPassword(this.usuario.idUsuario, dto).subscribe({
        next: (response) => {
          if (response.success) {
            this.contrasenaGenerada = response.data;
            this.formulario.reset({
              adminEmail: 'admin@empresa.com',
              horasExpiracion: 24
            });
            this.cargarHistorial(); // Actualizar historial
            this.passwordGenerada.emit();
          }
          this.generando = false;
        },
        error: (error) => {
          console.error('Error al generar contraseña:', error);
          this.generando = false;
        }
      });
    }
  }

  copiarContrasena() {
    if (this.contrasenaGenerada) {
      navigator.clipboard.writeText(this.contrasenaGenerada.passwordTemporal).then(() => {
        console.log('Contraseña copiada al portapapeles');
        // TODO: Mostrar notificación de éxito
      });
    }
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  cerrar() {
    this.cerrarModal.emit();
  }
}
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { PerfilData, PerfilService, UpdatePerfilPayload } from './perfil.service';
import { AuthService, Usuario } from '../shared/services/auth.service';
import { SweetAlertService } from '../shared/services/sweet-alert.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css'],
})
export class PerfilComponent implements OnInit, OnDestroy, OnChanges {
  perfilForm: FormGroup;
  cargando = false;
  guardando = false;
  fotoPreviewSeguro: SafeUrl | null = null;
  fotoBase64: string | null = null;
  fotoMarcadaParaEliminar = false;
  datosPerfil: PerfilData | null = null;
  private usuarioActual: Usuario | null = null;
  private readonly destroy$ = new Subject<void>();
  @Input() isOpen = false;
  @Output() cerrado = new EventEmitter<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly perfilService: PerfilService,
    private readonly authService: AuthService,
    private readonly sweetAlert: SweetAlertService,
    private readonly sanitizer: DomSanitizer,
  ) {
    this.perfilForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      correo: ['', [Validators.required, Validators.email]],
      telefono: [
        '',
        [
          Validators.pattern(/^[0-9]{8,15}$/),
        ],
      ],
    });
  }

  ngOnInit(): void {
    this.usuarioActual = this.authService.getCurrentUser();

    if (!this.usuarioActual) {
      return;
    }

    this.cargarPerfil();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue) {
      this.restaurarFormularioLocal();
      if (!this.datosPerfil) {
        this.cargarPerfil();
      }
    }
  }

  get nombresControl() {
    return this.perfilForm.get('nombres');
  }

  get apellidosControl() {
    return this.perfilForm.get('apellidos');
  }

  get correoControl() {
    return this.perfilForm.get('correo');
  }

  get telefonoControl() {
    return this.perfilForm.get('telefono');
  }

  cargarPerfil(): void {
    if (!this.usuarioActual) {
      return;
    }

    this.cargando = true;
    this.perfilService
      .obtenerPerfil(this.usuarioActual.idUsuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.datosPerfil = response.data;
          this.aplicarDatosPerfil(response.data);
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al cargar el perfil', error);
          this.cargando = false;
          this.sweetAlert.error(
            'Error',
            error?.error?.message || 'No se pudo cargar el perfil',
          );
        },
      });
  }

  onArchivoSeleccionado(input: HTMLInputElement | null): void {
    const archivo = input?.files?.[0];

    if (!archivo) {
      return;
    }

    const lector = new FileReader();
    lector.onload = () => {
      const resultado = lector.result as string;
      this.fotoBase64 = resultado;
      this.actualizarPreview(resultado);
      this.fotoMarcadaParaEliminar = false;
    };
    lector.readAsDataURL(archivo);
  }

  eliminarFoto(): void {
    this.fotoPreviewSeguro = null;
    this.fotoBase64 = null;
    this.fotoMarcadaParaEliminar = true;
  }

  async guardarCambios(): Promise<void> {
    if (!this.usuarioActual) {
      return;
    }

    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      this.sweetAlert.warning('Revisa los campos requeridos');
      return;
    }

    const valores = this.perfilForm.value;

    const payload: UpdatePerfilPayload = {
      nombres: valores.nombres?.trim(),
      apellidos: valores.apellidos?.trim(),
      correo: valores.correo?.trim().toLowerCase(),
      telefono: valores.telefono ? valores.telefono.trim() : undefined,
    };

    if (this.fotoBase64 !== null) {
      payload.fotoBase64 = this.fotoBase64;
    }

    if (this.fotoMarcadaParaEliminar) {
      payload.eliminarFoto = true;
    }

    this.guardando = true;

    this.perfilService
      .actualizarPerfil(this.usuarioActual.idUsuario, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.guardando = false;
          this.datosPerfil = response.data;
          this.aplicarDatosPerfil(response.data);

          this.authService.syncCurrentUserDesdePerfil(response.data);
          this.sweetAlert.success('Perfil actualizado', 'Los cambios se guardaron correctamente');
        },
        error: (error) => {
          console.error('Error al actualizar el perfil', error);
          this.guardando = false;
          this.sweetAlert.error(
            'Error',
            error?.error?.message || 'No se pudo actualizar el perfil',
          );
        },
      });
  }

  restaurarCambios(): void {
    this.cargarPerfil();
  }

  cerrarModal(): void {
    this.restaurarFormularioLocal();
    this.cerrado.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cerrarModal();
    }
  }

  private aplicarDatosPerfil(perfil: PerfilData): void {
    this.perfilForm.patchValue({
      nombres: perfil.nombres,
      apellidos: perfil.apellidos,
      correo: perfil.correo,
      telefono: perfil.telefono ? String(perfil.telefono) : '',
    });

    this.actualizarPreview(perfil.fotoPerfil || null);
    this.fotoBase64 = null;
    this.fotoMarcadaParaEliminar = false;
  }

  private restaurarFormularioLocal(): void {
    if (!this.datosPerfil) {
      return;
    }

    this.aplicarDatosPerfil(this.datosPerfil);
  }

  private actualizarPreview(foto: string | null): void {
    if (foto) {
      this.fotoPreviewSeguro = this.sanitizer.bypassSecurityTrustUrl(foto);
    } else {
      this.fotoPreviewSeguro = null;
    }
  }
}

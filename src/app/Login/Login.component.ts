import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest } from '../shared/services/auth.service';
import { SweetAlertService } from '../shared/services/sweet-alert.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './Login.component.html',
  styleUrls: ['./Login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  loading: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private sweetAlert: SweetAlertService
  ) {
  }

  async ngOnInit() {
    // Verificar autenticación en init (evita redirección durante la construcción)
    try {
      if (this.authService.isAuthenticated()) {
        const defaultRoute = this.authService.getDefaultRoute();
        // Pequeño retraso para permitir que Angular complete la navegación inicial si aplica
        setTimeout(() => this.router.navigate([defaultRoute]), 50);
      }
    } catch (err) {
      console.error('Error al comprobar autenticación en ngOnInit:', err);
    }
  }

  async onSubmit() {
    if (!this.email || !this.password) {
      this.sweetAlert.warning('Campos requeridos', 'Por favor ingrese su email y contraseña');
      return;
    }

    this.loading = true;

    const credentials: LoginRequest = {
      correo: this.email,
      password: this.password
    };

    try {
      console.log('Enviando credenciales:', credentials);
      const response = await this.authService.login(credentials).toPromise();
      console.log('Respuesta del backend:', response);
      
      if (response?.success && response.data?.usuario) {
        console.log('Login exitoso, usuario completo:', response.data.usuario);
        console.log('Rol del usuario:', response.data.usuario.rol);
        console.log('Permisos del usuario:', response.data.usuario.rol?.permisos);
        
        // Mostrar mensaje de bienvenida más simple
        await this.sweetAlert.success(
          '¡Bienvenido!',
          `Hola ${response.data.usuario.nombres}`,
          2000  // Solo 2 segundos
        );

        // Esperar un poco antes de redirigir
        setTimeout(() => {
          const defaultRoute = this.authService.getDefaultRoute();
          console.log('Redirigiendo a:', defaultRoute);
          this.router.navigate([defaultRoute]);
        }, 500);
        
      } else {
        console.log('Login fallido:', response);
        this.sweetAlert.error('Error de autenticación', 'Credenciales inválidas');
      }
    } catch (error: any) {
      console.error('Error completo de login:', error);
      const errorMessage = error.error?.message || error.message || 'Error de conexión';
      this.sweetAlert.error('Error de autenticación', errorMessage);
    } finally {
      this.loading = false;
    }
  }
}

import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NgIf } from '@angular/common';
import { AuthService, Usuario } from '../../shared/services/auth.service';
import { Router } from '@angular/router';
import { ThemeService } from '../../shared/services/theme.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PerfilComponent } from '../../Perfil/perfil.component';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgIf, PerfilComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isDark = true;
  @Input() sidebarOpen = true;
  @Output() sidebarToggle = new EventEmitter<void>();
  private readonly destroy$ = new Subject<void>();
  menuPerfilAbierto = false;
  perfilModalAbierto = false;
  usuarioActual: Usuario | null = null;
  readonly fotoPorDefecto = 'https://upload.wikimedia.org/wikipedia/commons/9/91/Logo_del_Gobierno_de_Guatemala_24-28.jpg';
  fotoPerfilSeguro: SafeUrl | string = this.fotoPorDefecto;

  constructor(
    private authService: AuthService,
    private router: Router,
    private readonly themeService: ThemeService,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.isDark = this.themeService.currentTheme === 'dark';
    this.usuarioActual = this.authService.getCurrentUser();
    this.actualizarFotoPerfil(this.usuarioActual);

    this.themeService.themeChanges$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mode) => {
        this.isDark = mode === 'dark';
      });

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((usuario) => {
        this.usuarioActual = usuario;
        this.actualizarFotoPerfil(usuario);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleTheme(): void {
    const mode = this.themeService.toggleTheme();
    this.isDark = mode === 'dark';
  }

  onToggleSidebar() {
    this.sidebarToggle.emit();
  }

  toggleMenuPerfil(): void {
    this.menuPerfilAbierto = !this.menuPerfilAbierto;
  }

  cerrarMenuPerfil(): void {
    this.menuPerfilAbierto = false;
  }

  abrirPerfilModal(): void {
    this.perfilModalAbierto = true;
    this.cerrarMenuPerfil();
  }

  cerrarPerfilModal(): void {
    this.perfilModalAbierto = false;
  }

  logout() {
    console.log('Cerrando sesión...');
    this.cerrarMenuPerfil();
    this.cerrarPerfilModal();
    this.authService.logout();
    this.usuarioActual = null;
    this.fotoPerfilSeguro = this.fotoPorDefecto;
  }

  private actualizarFotoPerfil(usuario: Usuario | null): void {
    if (usuario?.fotoPerfil) {
      const fotoNormalizada = this.normalizarFoto(usuario.fotoPerfil);
      this.fotoPerfilSeguro = this.sanitizer.bypassSecurityTrustUrl(fotoNormalizada);
    } else {
      this.fotoPerfilSeguro = this.fotoPorDefecto;
    }
  }

  private normalizarFoto(foto: string): string {
    const fotoLimpia = foto.trim();
    if (!fotoLimpia) {
      return this.fotoPorDefecto;
    }

    if (fotoLimpia.startsWith('data:image')) {
      return fotoLimpia;
    }

    return `data:image/png;base64,${fotoLimpia}`;
  }

}

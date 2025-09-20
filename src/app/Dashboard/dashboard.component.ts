import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, Modulo, Usuario } from '../shared/services/auth.service';

@Component({
  selector: 'Dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentUser: Usuario | null = null;
  modulosDisponibles: Modulo[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    console.log('Usuario actual en Dashboard:', this.currentUser);
    
    this.modulosDisponibles = this.authService.getModulosDisponibles();
    console.log('Módulos disponibles:', this.modulosDisponibles);
    
    if (this.currentUser) {
      console.log('Permisos del usuario:', this.currentUser.rol?.permisos);
    }
  }

  navigateToModule(modulo: Modulo) {
    this.router.navigate([modulo.ruta]);
  }

  logout() {
    this.authService.logout();
  }
}

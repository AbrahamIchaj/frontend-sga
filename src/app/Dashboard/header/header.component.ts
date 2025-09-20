import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgIf],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  isDark = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleTheme() {
    this.isDark = !this.isDark;
  }

  logout() {
    console.log('Cerrando sesión...');
    this.authService.logout();
  }

  getCurrentUser() {
    return this.authService.getCurrentUser();
  }
}

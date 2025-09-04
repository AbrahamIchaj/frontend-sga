import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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

  constructor(private router: Router) {}

  onSubmit() {
    // Aquí irá la lógica de autenticación cuando la implementes
    console.log('Login submitted', { email: this.email, password: this.password, rememberMe: this.rememberMe });
    
    // Redirigir a migracion-excel
    this.router.navigate(['/migracion-excel']);
  }
}

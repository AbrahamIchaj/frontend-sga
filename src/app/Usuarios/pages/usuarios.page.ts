import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ListaUsuariosComponent } from '../components/lista-usuarios.component';

@Component({
  selector: 'app-usuarios-page',
  standalone: true,
  imports: [CommonModule, ListaUsuariosComponent],
  template: `
    <div class="min-h-screen">

      <!-- Contenido principal -->
      <main class="max-w-7xl mx-auto py-6">
        <app-lista-usuarios></app-lista-usuarios>
      </main>
    </div>
  `,
  styles: []
})
export class UsuariosPageComponent {
  constructor() {}
}
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ListaPermisosComponent } from '../components/lista-permisos.component';

@Component({
  selector: 'app-permisos-page',
  standalone: true,
  imports: [CommonModule, ListaPermisosComponent],
  template: `
   
      <!-- Contenido principal -->
      <main class="max-w-7xl mx-auto py-6">
        <app-lista-permisos></app-lista-permisos>
      </main>
  `,
  styles: []
})
export class PermisosPageComponent {
  constructor() {}
}
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ListaRolesComponent } from '../components/lista-roles.component';

@Component({
  selector: 'app-roles-page',
  standalone: true,
  imports: [CommonModule, ListaRolesComponent],
  template: `
    <div class="min-h-screen">
      <!-- Contenido principal -->
      <main class="max-w-7xl mx-auto py-6">
        <app-lista-roles></app-lista-roles>
      </main>
    </div>
  `,
  styles: []
})
export class RolesPageComponent {
  constructor() {}
}
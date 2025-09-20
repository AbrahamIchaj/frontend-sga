import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ListaPermisosComponent } from '../components/lista-permisos.component';

@Component({
  selector: 'app-permisos-page',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ListaPermisosComponent],
  template: `
    <div class="min-h-screen bg-[#1e293b]">
      <!-- Header de navegación -->
      <div class="bg-[#232e47] shadow-sm border-b border-[#334155]">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-4">
            <div class="flex items-center space-x-4">
              <h1 class="text-xl font-semibold text-gray-100">Gestión de Usuarios</h1>
              <nav class="flex space-x-4">
                <a 
                  routerLink="/usuarios" 
                  routerLinkActive="border-blue-400 text-blue-400"
                  class="border-b-2 border-transparent px-1 pb-2 text-sm font-medium text-gray-300 hover:border-gray-400 hover:text-gray-200">
                  Usuarios
                </a>
                <a 
                  routerLink="/usuarios/roles" 
                  routerLinkActive="border-blue-400 text-blue-400"
                  class="border-b-2 border-transparent px-1 pb-2 text-sm font-medium text-gray-300 hover:border-gray-400 hover:text-gray-200">
                  Roles
                </a>
                <a 
                  routerLink="/usuarios/permisos" 
                  routerLinkActive="border-blue-400 text-blue-400"
                  class="border-b-2 border-transparent px-1 pb-2 text-sm font-medium text-gray-300 hover:border-gray-400 hover:text-gray-200">
                  Permisos
                </a>
              </nav>
            </div>
            
            <!-- Estadísticas rápidas -->
            <div class="flex items-center space-x-6 text-sm text-gray-300">
              <div class="flex items-center">
                <i class="fas fa-shield-alt mr-2 text-green-400"></i>
                <span>Permisos del Sistema</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenido principal -->
      <main class="max-w-7xl mx-auto py-6">
        <app-lista-permisos></app-lista-permisos>
      </main>
    </div>
  `,
  styles: []
})
export class PermisosPageComponent {
  constructor() {}
}
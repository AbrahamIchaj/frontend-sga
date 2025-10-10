/// <reference types="cypress" />

export interface TestUser {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  activo: boolean;
  rol: {
    idRoles: number;
    nombreRol: string;
    descripcion: string;
    permisos: string[];
  };
  renglonesPermitidos?: number[];
}

const DEFAULT_USER: TestUser = {
  idUsuario: 1,
  nombres: 'Administrador',
  apellidos: 'Pruebas',
  correo: 'admin@test.com',
  activo: true,
  rol: {
    idRoles: 1,
    nombreRol: 'Administrador',
    descripcion: 'Usuario con todos los permisos',
    permisos: [
      'GESTIONAR_DASHBOARD',
      'GESTIONAR_USUARIOS',
      'GESTIONAR_ROLES',
      'GESTIONAR_PERMISOS',
      'GESTIONAR_CATALOGO-INSUMOS',
      'GESTIONAR_COMPRAS',
      'GESTIONAR_INVENTARIO',
      'GESTIONAR_DESPACHOS',
      'GESTIONAR_REAJUSTES',
      'GESTIONAR_SERVICIOS',
      'GESTIONAR_MIGRACION'
    ],
  },
  renglonesPermitidos: [],
};

Cypress.Commands.add('seedAuthSession', (user: TestUser = DEFAULT_USER) => {
  cy.window().then((win) => {
    win.localStorage.setItem('currentUser', JSON.stringify(user));
    win.localStorage.setItem('authToken', 'fake-token');
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      seedAuthSession(user?: TestUser): Chainable<void>;
    }
  }
}

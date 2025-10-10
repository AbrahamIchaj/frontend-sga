import loginSuccess from '../fixtures/login-success.json';
import dashboardResumen from '../fixtures/dashboard-resumen.json';

describe('Flujo de autenticación', () => {
  const apiRoot = Cypress.env('apiUrl');

  beforeEach(() => {
    cy.visit('/Login');
  });

  it('muestra una alerta cuando faltan campos obligatorios', () => {
    cy.contains('button', 'Ingresar').click();

    cy.get('.swal2-popup').should('be.visible').and('contain', 'Campos requeridos');
    cy.get('.swal2-confirm').click();
    cy.get('.swal2-popup').should('not.exist');
  });

  it('notifica cuando las credenciales son inválidas', () => {
    cy.intercept('POST', `${apiRoot}/auth/login`, {
      statusCode: 401,
      body: {
        success: false,
        message: 'Credenciales inválidas',
      },
    }).as('loginRequest');

    cy.get('input[name="email"]').type('wrong@test.com');
    cy.get('input[name="password"]').type('invalid');
    cy.contains('button', 'Ingresar').click();

    cy.wait('@loginRequest');
    cy.get('.swal2-popup').should('be.visible').and('contain', 'Error de autenticación');
    cy.get('.swal2-html-container').should('contain', 'Credenciales inválidas');
  });

  it('permite ingresar y redirige al Dashboard cuando las credenciales son correctas', () => {
    cy.intercept('POST', `${apiRoot}/auth/login`, {
      statusCode: 200,
      body: loginSuccess,
    }).as('loginRequest');

    cy.intercept('GET', `${apiRoot}/dashboard/resumen`, {
      statusCode: 200,
      body: dashboardResumen,
    }).as('dashboardResumen');

    cy.get('input[name="email"]').type('admin@test.com');
    cy.get('input[name="password"]').type('password123');
    cy.contains('button', 'Ingresar').click();

    cy.wait('@loginRequest');
    cy.wait('@dashboardResumen');

    cy.url().should('include', '/Dashboard');
    cy.contains('h1', 'Hola Administrador').should('be.visible');
  });
});

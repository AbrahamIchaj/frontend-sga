import loginSuccess from '../fixtures/login-success.json';
import loginAuxiliar from '../fixtures/login-auxiliar.json';
import dashboardResumen from '../fixtures/dashboard-resumen.json';
import type { TestUser } from '../support/commands';

describe('Panel de Dashboard', () => {
  const apiRoot = Cypress.env('apiUrl');
  const administrador = loginSuccess.data.usuario as TestUser;
  const auxiliar = loginAuxiliar.data.usuario as TestUser;

  const seedSession = (user: TestUser) => (win: Window) => {
    win.localStorage.setItem('currentUser', JSON.stringify(user));
    win.localStorage.setItem('authToken', 'fake-token');
  };

  it('renderiza las métricas principales con la información del resumen', () => {
    cy.intercept('GET', `${apiRoot}/dashboard/resumen`, {
      statusCode: 200,
      body: dashboardResumen,
    }).as('dashboardResumen');

    cy.visit('/Dashboard', {
      onBeforeLoad: seedSession(administrador),
    });

    cy.wait('@dashboardResumen');

    cy.contains('h1', `Hola ${administrador.nombres}`).should('be.visible');
    cy.contains('.metric-card__label', 'Insumos únicos registrados')
      .parents('.metric-card')
      .within(() => {
        cy.contains('.metric-card__value', dashboardResumen.data.metrics.totalInsumos.toString()).should('be.visible');
      });

    cy.contains('.metric-card__label', 'Valor monetario del inventario')
      .parent()
      .within(() => {
            cy.get('.metric-card__value').invoke('text').should('contain', 'Q');
      });

  cy.get('.analytics__panel').should('have.length.at.least', 2);
  cy.get('.analytics__chart canvas').should('have.length.at.least', 2);

    cy.get('aside').within(() => {
      cy.contains('.sidebar-label', 'Dashboard').should('exist');
      cy.contains('.sidebar-label', 'Catálogo Insumos').should('exist');
      cy.contains('.sidebar-label', 'Usuarios').should('exist');
      cy.contains('.sidebar-label', 'Permisos').should('exist');
    });
  });

  it('limita los módulos visibles para un auxiliar según sus permisos', () => {
    cy.intercept('GET', `${apiRoot}/dashboard/resumen`, {
      statusCode: 200,
      body: dashboardResumen,
    }).as('dashboardResumenAuxiliar');

    cy.visit('/Dashboard', {
      onBeforeLoad: seedSession(auxiliar),
    });

    cy.wait('@dashboardResumenAuxiliar');

    cy.contains('h1', `Hola ${auxiliar.nombres}`).should('be.visible');

    cy.get('aside').within(() => {
      cy.contains('.sidebar-label', 'Dashboard').should('exist');
      cy.contains('.sidebar-label', 'Inventario').should('exist');
      cy.contains('.sidebar-label', 'Despachos').should('exist');
      cy.contains('.sidebar-label', 'Catálogo Insumos').should('not.exist');
      cy.contains('.sidebar-label', 'Usuarios').should('not.exist');
      cy.contains('.sidebar-label', 'Roles').should('not.exist');
      cy.contains('.sidebar-label', 'Permisos').should('not.exist');
    });
  });

  it('muestra un mensaje de error y permite reintentar la carga', () => {
    cy.intercept('GET', `${apiRoot}/dashboard/resumen`, {
      statusCode: 500,
      body: {
        success: false,
        message: 'Error interno',
      },
    }).as('dashboardResumenError');

    cy.visit('/Dashboard', {
      onBeforeLoad: seedSession(administrador),
    });

    cy.wait('@dashboardResumenError');

    cy.get('.alert').should('be.visible').and('contain', 'Algo salió mal');

    cy.intercept('GET', `${apiRoot}/dashboard/resumen`, {
      statusCode: 200,
      body: dashboardResumen,
    }).as('dashboardResumenSuccess');

    cy.contains('button', 'Reintentar').click();

    cy.wait('@dashboardResumenSuccess');
    cy.get('.alert').should('not.exist');
    cy.contains('.metric-card__label', 'Insumos únicos registrados').should('exist');
  });
});

import loginSuccess from '../fixtures/login-success.json';
import dashboardResumen from '../fixtures/dashboard-resumen.json';

describe('Panel de Dashboard', () => {
  const apiRoot = Cypress.env('apiUrl');
  const usuario = loginSuccess.data.usuario;

  const seedSession = (win: Window) => {
    win.localStorage.setItem('currentUser', JSON.stringify(usuario));
    win.localStorage.setItem('authToken', 'fake-token');
  };

  it('renderiza las métricas principales con la información del resumen', () => {
    cy.intercept('GET', `${apiRoot}/dashboard/resumen`, {
      statusCode: 200,
      body: dashboardResumen,
    }).as('dashboardResumen');

    cy.visit('/Dashboard', {
      onBeforeLoad: seedSession,
    });

    cy.wait('@dashboardResumen');

    cy.contains('h1', `Hola ${usuario.nombres}`).should('be.visible');
    cy.contains('.metric-card__label', 'Insumos únicos registrados')
      .parents('.metric-card')
      .within(() => {
        cy.contains('.metric-card__value', dashboardResumen.data.metrics.totalInsumos.toString()).should('be.visible');
      });

    cy.contains('.metric-card__label', 'Valor monetario del inventario')
      .parent()
      .within(() => {
        cy.contains('GTQ').should('exist');
      });

    cy.get('.analytics__panel').should('have.length.at.least', 2);
    cy.get('.analytics__chart canvas').should('have.length', 2);
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
      onBeforeLoad: seedSession,
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

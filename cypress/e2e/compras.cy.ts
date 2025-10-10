import loginSuccess from '../fixtures/login-success.json';
import catalogoBusqueda from '../fixtures/compras/catalogo-busqueda.json';
import createCompraResponse from '../fixtures/compras/create-compra-response.json';
import inventarioListado from '../fixtures/inventario/listado.json';
import type { TestUser } from '../support/commands';

describe('Gestión de Compras', () => {
  const apiRoot = Cypress.env('apiUrl');
  const administrador = loginSuccess.data.usuario as TestUser;
  const codigoInsumo = catalogoBusqueda.data[0].codigoInsumo;

  const seedSession = (user: TestUser) => (win: Window) => {
    win.localStorage.setItem('currentUser', JSON.stringify(user));
    win.localStorage.setItem('authToken', 'fake-token');
  };

  it('permite registrar una nueva compra', () => {
    const perfilResponse = {
      success: true,
      data: {
        idUsuario: administrador.idUsuario,
        nombres: administrador.nombres,
        apellidos: administrador.apellidos,
        correo: administrador.correo,
        activo: administrador.activo,
        rol: {
          idRoles: administrador.rol.idRoles,
          nombreRol: administrador.rol.nombreRol,
          descripcion: administrador.rol.descripcion
        }
      }
    };

    let capturedRequest: any = null;

    cy.intercept('GET', `${apiRoot}/usuarios/${administrador.idUsuario}/perfil`, {
      statusCode: 200,
      body: perfilResponse
    }).as('perfilUsuario');

    cy.intercept('GET', `${apiRoot}/catalogo-insumos-api/buscar-por-codigo/*`, {
      statusCode: 200,
      body: catalogoBusqueda
    }).as('buscarCatalogoApi');

    cy.intercept('GET', `${apiRoot}/catalogo-insumos/buscar-por-codigo/*`, {
      statusCode: 200,
      body: catalogoBusqueda
    }).as('buscarCatalogo');

    cy.intercept('GET', `${apiRoot}/compras*`, {
      statusCode: 200,
      body: { success: true, data: [] }
    }).as('listarCompras');

    cy.intercept('POST', `${apiRoot}/compras`, (req) => {
      capturedRequest = req.body;
      req.reply({
        statusCode: 201,
        body: createCompraResponse
      });
    }).as('crearCompra');

    cy.visit('/compras/nueva', {
      onBeforeLoad: seedSession(administrador)
    });

    cy.wait('@perfilUsuario');

    cy.get('#numeroFactura').clear().type('12345');
    cy.get('#serieFactura').clear().type('A1');
  cy.get('#tipoCompra').select('Cotización');
    cy.get('#ordenCompra').clear().type('9876');
    cy.get('#numero1h').clear().type('4567');
    cy.get('#noKardex').clear().type('7654');
    cy.get('#proveedor').clear().type('Suministros Médicos Centro');

    cy.contains('button', 'Seleccionar programas').click();
    cy.contains('.card-responsive__body label', 'Programa 13')
      .find('input[type="checkbox"]')
      .check({ force: true });
    cy.contains('button', 'Aplicar selección').click();

    cy.contains('button', 'Siguiente').click();

    cy.get('#codigoInsumo').clear().type(`${codigoInsumo}`);
    cy.contains('button', 'Buscar').click();

    cy.wait('@buscarCatalogoApi');

    cy.get('.modal-backdrop').should('have.length.at.least', 1);

    cy.get('.modal-backdrop').last().within(() => {
      cy.get('input[formcontrolname="cantidad"]').clear().type('10');
      cy.get('input[formcontrolname="precioUnitario"]').clear().type('25');
      cy.contains('button', 'Agregar a la lista').click();
    });

    cy.get('table tbody tr').should('have.length', 1).first().within(() => {
      cy.contains('td', 'Guantes de látex').should('be.visible');
      cy.contains('td', '9001').should('be.visible');
      cy.contains('td', '10').should('be.visible');
      cy.contains('td', /250\.00/).should('be.visible');
    });

    cy.window().then((win) => {
      const swal = (win as any).Swal;
      if (swal?.fire) {
        cy.stub(swal, 'fire').callsFake(() => Promise.resolve({ isConfirmed: true }));
      }
    });

    cy.contains('button', 'Guardar Compra').click();

    cy.wait('@crearCompra').its('response.statusCode').should('eq', 201);

    cy.wrap(null).then(() => {
      expect(capturedRequest).to.have.property('compra');
      expect(capturedRequest).to.have.property('idUsuario', administrador.idUsuario);
      expect(capturedRequest.compra.numeroFactura).to.equal('12345');
      expect(capturedRequest.compra.programas).to.deep.equal([13]);
      expect(capturedRequest.compra.detalles).to.have.length(1);
      expect(capturedRequest.compra.detalles[0].precioTotalFactura).to.equal(250);
    });

    cy.url().should('include', '/compras');
    cy.wait('@listarCompras');

    cy.intercept('GET', `${apiRoot}/inventario*`, {
      statusCode: 200,
      body: {
        success: true,
        ...inventarioListado
      }
    }).as('listarInventario');

    cy.contains('a', 'Inventario').click();

    cy.url().should('include', '/inventario');
    cy.wait('@listarInventario');

    cy.contains('div', 'Guantes de látex - Caja con 100 unidades').should('be.visible');
    cy.contains('td', 'L001').should('be.visible');
    cy.contains('td', '7654').should('be.visible');
    cy.contains('td', '10').should('be.visible');
    cy.contains('td', /250\.00/).should('be.visible');
  });
});

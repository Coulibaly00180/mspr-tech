describe('Authentification et Navigation', () => {

  beforeEach(() => {
    cy.visit('/');
  });

  it('devrait rejeter une tentative de connexion avec de mauvais identifiants', () => {
    if (Cypress.env('MOCK_MODE') === true) {
      cy.intercept('POST', '**/undefined/authenticate-user', {
        statusCode: 200,
        body: { 
          authenticated: false,
          status: 'error', 
          message: "Identifiants ou code 2FA incorrects." 
        }
      }).as('loginFailed');
    }

    // Saisie du formulaire
    cy.get('#user').type('user_fantome');
    cy.get('#pass').type('wrong_password_24_chars!'); // 24 caractères requis !
    cy.get('#mfa').type('123456');

    // Soumission
    cy.contains('button', 'Accéder au Cloud').click();

    if (Cypress.env('MOCK_MODE') === true) {
      cy.wait('@loginFailed');
    }
    cy.contains("Identifiants ou code 2FA incorrects.").should('be.visible');
  });

  it('devrait connecter l\'admin et le rediriger vers l\'Espace Superviseur', () => {
    if (Cypress.env('MOCK_MODE') === true) {
      cy.intercept('POST', '**/undefined/authenticate-user', {
        statusCode: 200,
        body: { 
          authenticated: true, 
          status: 'success', 
          role: 'admin'
        }
      }).as('loginSuccess');
    }

    // Saisie des identifiants admin
    cy.get('#user').type('admin');
    cy.get('#pass').type('admin_password_xyz_24ch'); // 24 caractères requis !
    cy.get('#mfa').type('000000');

    // Soumission
    cy.contains('button', 'Accéder au Cloud').click();

    if (Cypress.env('MOCK_MODE') === true) {
      cy.wait('@loginSuccess');
    }

    // Vérification de la redirection vers l'espace superviseur
    cy.contains('h2', 'Espace Superviseur').should('be.visible');
  });
});
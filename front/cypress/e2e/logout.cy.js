describe('Gestion de la Déconnexion', () => {

  beforeEach(() => {
    cy.visit('/');
  });

  it('devrait vider les états de session lors du clic sur déconnexion', () => {
    // On intercepte l'appel en simulant une connexion réussie d'un utilisateur standard
    if (Cypress.env('MOCK_MODE') === true) {
      cy.intercept('POST', '**/undefined/authenticate-user', {
        statusCode: 200,
        body: { 
          authenticated: true,
          status: 'success', 
          role: 'user' 
        }
      }).as('loginUserSuccess');
    }

    cy.get('#user').type('dylan');
    cy.get('#pass').type('mon_password_de_24_chars'); // 24 caractères requis !
    cy.get('#mfa').type('123456');

    // Clic sur le bouton de connexion
    cy.contains('button', 'Accéder au Cloud').click();

    if (Cypress.env('MOCK_MODE') === true) {
      cy.wait('@loginUserSuccess');
    }

    // Vérification qu'on est bien connecté sur l'écran d'accueil standard
    cy.contains('h2', 'Bienvenue, dylan').should('be.visible');

    cy.contains('button', 'Déconnexion').click();

    // Vérification du retour à l'écran de connexion
    cy.contains('h2', 'Connexion').should('be.visible');
    cy.get('#user').should('have.value', ''); 
  });
});
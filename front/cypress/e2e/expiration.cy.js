describe('Politique de Rotation des Accès (6 mois)', () => {

  beforeEach(() => {
    // en mode Mock, on force l'API d'authentification à renvoyer 'expired' 
    if (Cypress.env('MOCK_MODE') === true) {
      cy.intercept('POST', '**/undefined/authenticate-user', {
        statusCode: 200,
        body: {
          status: 'expired',
          message: "Vos accès ont expiré. Veuillez les renouveler."
        }
      }).as('loginExpired');
    }

    cy.visit('/'); 
  });

  it('devrait afficher l\'écran de renouvellement si les accès ont expiré', () => {
    // saisie de l'identifiant de l'utilisateur expiré
    cy.get('#user').type('dylan_expire');

    // saisie du mot de passe (24 caractères requis)
    cy.get('#pass').type('abcdefghijklmnopqrstuvwx');

    // saisie du code 2FA (6 chiffres)
    cy.get('#mfa').type('111111');
    
    // click sur le bouton de soumission du formulaire
    cy.contains('button', 'Accéder au Cloud').click();

    if (Cypress.env('MOCK_MODE') === true) {
      cy.wait('@loginExpired');
    }

    cy.contains('h2', 'Accès Expirés').should('be.visible');
    
    // On valide la redirection vers le formulaire de régénération
    cy.contains('button', 'Renouveler mes accès').click();
    cy.contains('button', 'Générer mes accès sécurisés').should('be.visible');
  });
});
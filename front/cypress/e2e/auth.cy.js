describe('Flux d\'Inscription et Génération des Accès COFRAP', () => {
  beforeEach(() => {
    // Cypress ouvre l'application
    cy.visit('/'); 
  });

  it('devrait permettre de demander la création de compte et d\'afficher les QR codes', () => {
    // On clique sur le bouton pour aller sur le formulaire d'inscription
    cy.contains('button', "Nouveau compte").click();

    // On sélectionne le premier champ de texte (username) et on écrit le pseudo de test
    cy.get('input[type="text"]').first().type('dylan_integration_test');

    // On clique sur le bouton qui valide le formulaire
    cy.contains('button', 'Générer mes accès sécurisés').click();

    // On attend que les fonctions OpenFaaS répondent et que l'affichage bascule
    cy.contains('h2', 'Accès Générés').should('be.visible');

    // On vérifie que les deux balises <img> des QR codes sont présentes et visibles à l'écran
    cy.get('img[alt="QR Password"]').should('be.visible');
    cy.get('img[alt="QR 2FA"]').should('be.visible');
  });
});
describe('Flux d\'Inscription et Génération des Accès COFRAP', () => {
  
  beforeEach(() => {
    cy.visit('/'); 
  });

  it('devrait basculer sur l\'inscription, créer le compte et afficher correctement les deux QR codes', () => {
    
    // =========================================================================
    // Navigation vers le formulaire d'inscription (RegisterForm)
    // =========================================================================
    // Cypress cherche le bouton d'inscription "Nouveau compte" présent sur AuthForm.
     cy.contains('button', "Nouveau compte").click();
    
    // On vérifie que le formulaire de création est bien visible
    cy.get('input[type="text"]').should('be.visible');

    // =========================================================================
    // Saisie des informations et soumission
    // =========================================================================
    // On sélectionne le premier champ de texte (le username) et on tape l'identifiant de test
    cy.get('input[type="text"]').first().clear().type('dylan_integration_test');

    cy.contains('button', 'Générer mes accès sécurisés').click();

    // =========================================================================
    // Attente et vérification des résultats (Appels OpenFaaS)
    // =========================================================================
    cy.contains('h2', 'Accès Générés').should('be.visible');

    // vérification de la présence du texte d'avertissement CSS
    cy.contains('p', 'Scannez ces codes. Attention : le mot de passe est à usage unique.').should('be.visible');

    // =========================================================================
    // Validation de l'injection des QR codes (Base64)
    // =========================================================================    
    // Vérification du QR Code du mot de passe
    cy.get('img[alt="QR Password"]')
      .should('be.visible')
      .and(($img) => {
        expect($img.attr('src')).to.include('data:image/png;base64,');
      });

    // Vérification du QR Code du secret Multi-Facteurs (2FA)
    cy.get('img[alt="QR 2FA"]')
      .should('be.visible')
      .and(($img) => {
        expect($img.attr('src')).to.include('data:image/png;base64,');
      });

    // =========================================================================
    // Retour à l'accueil
    // =========================================================================
    cy.contains('button', "J'ai sauvegardé mes accès").click();
    
    // On vérifie que l'application est bien revenue sur l'étape 'login' de départ
    cy.contains('button', 'Accéder au Cloud').should('be.visible');
  });
});
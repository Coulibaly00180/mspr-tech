import './commands'

// Avant chaque test, on vérifie si on doit mocker ou non
beforeEach(() => {
  if (Cypress.env('MOCK_MODE') === true) {
    cy.intercept('POST', '**/undefined/authenticate-user', {
      statusCode: 200,
      body: {
        status: 'expired',
        message: "Vos accès ont expiré. Veuillez les renouveler."
      }
    }).as('loginExpired');
    
    // Mock de la génération de mot de passe
    cy.intercept('POST', '**/generate-password', {
      statusCode: 200,
      body: {
        gendate: 1780563394,
        message: "Mot de passe généré avec succès.",
        password: "u:6^;d,Y?e-tE)X!2eDLC3^]",
        qr_code_png_base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        username: "dylan_integration_test"
      }
    }).as('generatePassword');

    // Mock de la génération 2FA
    cy.intercept('POST', '**/generate-2fa', {
      statusCode: 200,
      body: {
        gendate: 1780563395,
        message: "Secret 2FA généré avec succès.",
        qr_code_png_base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        secret_2fa: "7Q7334KKGFPVBOBTCJIQG3MXKKCVP32R",
        totp_uri: "otpauth://totp/COFRAP:dylan?secret=7Q7334KKGFPVBOBTCJIQG3MXKKCVP32R&issuer=COFRAP",
        username: "dylan_integration_test"
      }
    }).as('generate2fa');
  }
});
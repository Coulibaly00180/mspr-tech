const { defineConfig } = require("cypress");

module.exports = defineConfig({
  allowCypressEnv: true,

  e2e: {
    // 1. On définit l'URL de base où Cypress va chercher ton application React locale
    baseUrl: 'http://localhost:3000',

    setupNodeEvents(on, config) {
      // 2. permet à Cypress de propager les variables d'environnement passées en ligne de commande (comme --env MOCK_MODE=true)
      return config;
    },
  },
});
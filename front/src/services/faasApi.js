// URL du Gateway OpenFaaS (à adapter)
const GATEWAY_URL = "http://172.16.89.44:8080/function";

export const faasApi = {
  // Authentification et vérification d'expiration (6 mois)
  async login(credentials) {
    const response = await fetch(`${GATEWAY_URL}/authenticate-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },

  // Génération MDP (24 chars) + QR Code
  async generatePassword(username) {
    const response = await fetch(`${GATEWAY_URL}/generate-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    return response.json();
  },

  // Génération Secret 2FA + QR Code
  async generate2FA(username) {
    const response = await fetch(`${GATEWAY_URL}/generate-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    return response.json();
  }
};

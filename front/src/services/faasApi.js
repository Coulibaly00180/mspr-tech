// URL de votre Gateway OpenFaaS (à adapter selon votre déploiement K3S/Cloud)
const GATEWAY_URL = "http://<votre-ip-gateway>:8080/function";

export const faasApi = {
  // Mission 6 : Authentification et vérification d'expiration (6 mois)
  async login(credentials) {
    const response = await fetch(`${GATEWAY_URL}/auth-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },

  // Mission 6 : Génération MDP (24 chars) + QR Code
  async generatePassword(username) {
    const response = await fetch(`${GATEWAY_URL}/generate-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    return response.json();
  },

  // Mission 6 : Génération Secret 2FA + QR Code
  async generate2FA(username) {
    const response = await fetch(`${GATEWAY_URL}/generate-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    return response.json();
  }
};

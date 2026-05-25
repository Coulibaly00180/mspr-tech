import axios from 'axios';

const GATEWAY_URL = process.env.REACT_APP_COFRAP_API_URL;

export const faasApi = {
  // Authentification et vérification d'expiration (6 mois)
  async login(credentials) {
    const response = await axios.post(`${GATEWAY_URL}/authenticate-user`, credentials);
    return response.data; 
  },

  // Génération MDP (24 chars) + QR Code
  async generatePassword(username) {
    const response = await axios.post(`${GATEWAY_URL}/generate-password`, { username });
    return response.data;
  },

  // Génération Secret 2FA + QR Code
  async generate2FA(username) {
    const response = await axios.post(`${GATEWAY_URL}/generate-2fa`, { username });
    return response.data;
  }
};
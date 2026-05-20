import { render, screen, fireEvent } from '@testing-library/react';
import App from '../../App';
import { faasApi } from '../../services/faasApi';

// 1. Décor : On intercepte la couche service pour éviter tout appel au vrai réseau
jest.mock('../../services/faasApi', () => ({
  faasApi: {
    login: jest.fn()
  }
}));

// Fonction utilitaire pour éviter de réécrire la saisie des champs dans chaque test
const remplirEtSoumettreFormulaire = () => {
  const inputUsername = screen.getByLabelText(/identifiant/i);
  const inputPassword = screen.getByPlaceholderText(/entrez vos 24 caractères/i);
  const inputMFA = screen.getByPlaceholderText(/000000/i);
  const buttonSubmit = screen.getByRole('button', { name: /accéder au cloud/i });

  fireEvent.change(inputUsername, { target: { value: 'admin' } });
  fireEvent.change(inputPassword, { target: { value: 'a1b2c3d4e5f6g7h8i9j0k1l2' } });
  fireEvent.change(inputMFA, { target: { value: '123456' } });
  
  fireEvent.click(buttonSubmit);
};

describe('Flux d\'Intégration - Authentification COFRAP via OpenFaaS', () => {
  
  beforeEach(() => {
    jest.clearAllMocks(); // Nettoyage de l'historique des appels entre chaque test
  });

  // --- SCÉNARIO 1 : LE CAS NOMINAL (HAPPY PATH) ---
  test('Scénario 1 : Saisie valide -> Succès API -> Redirection Espace Superviseur', async () => {
    faasApi.login.mockResolvedValue({
      authenticated: true,
      status: 'success'
    });

    render(<App />);
    remplirEtSoumettreFormulaire();

    // Vérification du contrat d'interface avec l'API
    expect(faasApi.login).toHaveBeenCalledWith({
      username: 'admin',
      password: 'a1b2c3d4e5f6g7h8i9j0k1l2',
      token: '123456'
    });

    // Attente asynchrone du changement d'écran vers le Dashboard
    const adminHeader = await screen.findByText(/Espace Superviseur/i, {}, { timeout: 3000 });
    expect(adminHeader).toBeInTheDocument();
  });

  // --- SCÉNARIO 2 : L'ÉCHEC D'AUTHENTIFICATION ---
  test('Scénario 2 : Mauvais identifiants -> Refus API -> Affichage message d\'erreur', async () => {
    faasApi.login.mockResolvedValue({
      authenticated: false,
      status: 'failed'
    });

    render(<App />);
    remplirEtSoumettreFormulaire();

    // L'application doit rester sur la page et afficher l'alerte
    const errorMessage = await screen.findByText(/Identifiants ou code 2FA incorrects/i);
    expect(errorMessage).toBeInTheDocument();
    
    // On s'assure qu'on n'a PAS ouvert le dashboard
    expect(screen.queryByText(/Espace Superviseur/i)).not.toBeInTheDocument();
  });

  // --- SCÉNARIO 3 : LA POLITIQUE DE SÉCURITÉ (SECOPS) ---
  test('Scénario 3 : Identifiants valides mais expirés -> Statut "expired" -> Écran de rotation requis', async () => {
    faasApi.login.mockResolvedValue({
      status: 'expired'
    });

    render(<App />);
    remplirEtSoumettreFormulaire();

    // L'application doit afficher la section spécifique aux accès expirés (loi des 6 mois)
    const expiredMessage = await screen.findByText(/La politique de sécurité COFRAP exige une rotation/i);
    expect(expiredMessage).toBeInTheDocument();
  });

  // --- SCÉNARIO 4 : LA RÉSILIENCE (CHAÎNE DE SERVICE COUPÉE) ---
  test('Scénario 4 : Gateway OpenFaaS injoignable -> Crash réseau -> Message d\'erreur technique', async () => {
    // On simule une promesse rejetée (équivalent d'une erreur 500 ou d'un timeout réseau)
    faasApi.login.mockRejectedValue(new Error("Gateway Timeout"));

    render(<App />);
    remplirEtSoumettreFormulaire();

    // L'application doit intercepter l'erreur dans son bloc catch et avertir l'utilisateur
    const technicalError = await screen.findByText(/Erreur technique : Gateway OpenFaaS injoignable/i);
    expect(technicalError).toBeInTheDocument();
  });

});
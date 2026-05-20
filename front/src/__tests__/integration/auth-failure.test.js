import { render, screen } from '@testing-library/react';
import App from '../../App';
import { faasApi } from '../../services/faasApi';
import { remplirEtSoumettreFormulaire } from '../../utils/auth-helper';

jest.mock('../../services/faasApi', () => ({
  faasApi: { login: jest.fn() }
}));

describe('Brique Intégration - Échecs Authentification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Mauvais identifiants -> Refus API -> Affichage du message d\'alerte', async () => {
    // Configuration du mock pour simuler un échec d'authentification
    faasApi.login.mockResolvedValue({
      authenticated: false,
      status: 'failed'
    });

    render(<App />);
    remplirEtSoumettreFormulaire();

    // L'application doit intercepter le refus et afficher l'erreur textuelle
    const errorMessage = await screen.findByText(/Identifiants ou code 2FA incorrects/i);
    expect(errorMessage).toBeInTheDocument();
    
    // Sécurité passive : On s'assure que le dashboard n'a PAS été injecté dans le DOM
    expect(screen.queryByText(/Espace Superviseur/i)).not.toBeInTheDocument();
  });
});
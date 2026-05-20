import { render, screen } from '@testing-library/react';
import App from '../../App';
import { faasApi } from '../../services/faasApi';
import { remplirEtSoumettreFormulaire } from '../../utils/auth-helper';

// On mock l'API pour cette brique
jest.mock('../../services/faasApi', () => ({
  faasApi: { login: jest.fn() }
}));

describe('Brique Intégration - Succès Authentification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Saisie valide -> Succès API -> Redirection Espace Superviseur', async () => {
    // Configuration du mock pour simuler une réussite
    faasApi.login.mockResolvedValue({
      authenticated: true,
      status: 'success'
    });

    render(<App />);
    
    // Utilisation du helper partagé
    remplirEtSoumettreFormulaire();

    // Vérification du contrat de données envoyé à la Gateway
    expect(faasApi.login).toHaveBeenCalledWith({
      username: 'admin',
      password: 'a1b2c3d4e5f6g7h8i9j0k1l2',
      token: '123456'
    });

    // Validation du basculement d'écran (Asynchrone)
    const adminHeader = await screen.findByText(/Espace Superviseur/i, {}, { timeout: 3000 });
    expect(adminHeader).toBeInTheDocument();
  });
});
import { render, screen } from '@testing-library/react';
import App from '../../App';
import { faasApi } from '../../services/faasApi';
import { remplirEtSoumettreFormulaire } from '../../utils/auth-helper';

jest.mock('../../services/faasApi', () => ({
  faasApi: { login: jest.fn() }
}));

describe('Brique Intégration - Politiques de Sécurité (SecOps)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Identifiants valides mais expirés -> Statut "expired" -> Écran de rotation requis', async () => {
    // Configuration du mock pour simuler la règle des 6 mois d'expiration
    faasApi.login.mockResolvedValue({
      status: 'expired'
    });

    render(<App />);
    remplirEtSoumettreFormulaire();

    // L'application doit router l'utilisateur vers l'écran d'expiration obligatoire
    const expiredMessage = await screen.findByText(/La politique de sécurité COFRAP exige une rotation/i);
    expect(expiredMessage).toBeInTheDocument();
    
    // On vérifie que le bouton de renouvellement est bien présent pour l'utilisateur
    expect(screen.getByRole('button', { name: /renouveler mes accès/i })).toBeInTheDocument();
  });
});

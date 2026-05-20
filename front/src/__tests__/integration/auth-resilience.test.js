import { render, screen } from '@testing-library/react';
import App from '../../App';
import { faasApi } from '../../services/faasApi';
import { remplirEtSoumettreFormulaire } from '../../utils/auth-helper';

jest.mock('../../services/faasApi', () => ({ faasApi: { login: jest.fn() } }));

describe('Brique Intégration - Résilience Infra', () => {
  test('Gateway OpenFaaS injoignable -> Crash réseau -> Message d\'erreur technique', async () => {
    faasApi.login.mockRejectedValue(new Error("Gateway Timeout"));

    render(<App />);
    remplirEtSoumettreFormulaire();

    const technicalError = await screen.findByText(/Erreur technique : Gateway OpenFaaS injoignable/i);
    expect(technicalError).toBeInTheDocument();
  });
});

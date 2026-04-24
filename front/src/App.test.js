import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import { faasApi } from './services/faasApi'; 

describe('Suite de tests - COFRAP Cloud', () => {

  test('le champ mot de passe exige exactement 24 caractères', () => {
    render(<App />);
    const passwordInput = screen.getByLabelText(/Mot de passe/i);
    expect(passwordInput).toHaveAttribute('minLength', '24');
  });

  test('affiche le message de bienvenue personnalisé après connexion admin', async () => {
    const loginSpy = jest.spyOn(faasApi, 'login').mockResolvedValue({ authenticated: true });
    
    render(<App />);
    
    const userInput = screen.getByLabelText(/Identifiant/i);
    const passwordInput = screen.getByLabelText(/Mot de passe/i);
    const tokenInput = screen.getByLabelText(/Code 2FA/i);
    const loginButton = screen.getByRole('button', { name: /Accéder au Cloud/i });

    fireEvent.change(userInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'a'.repeat(24) } }); 
    fireEvent.change(tokenInput, { target: { value: '123456' } });
    
    fireEvent.click(loginButton);

    const welcomeMessage = await screen.findByText(/Bonjour, admin/i, {}, { timeout: 4000 });
    expect(welcomeMessage).toBeInTheDocument();

    loginSpy.mockRestore(); // Nettoyage après le test
  });

  test('ne montre pas le dashboard de pilotage par défaut', () => {
    render(<App />);
    expect(screen.queryByText(/Espace Superviseur/i)).not.toBeInTheDocument();
  });
});
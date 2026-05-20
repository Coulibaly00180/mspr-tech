import { screen, fireEvent } from '@testing-library/react';

export const remplirEtSoumettreFormulaire = () => {
  const inputUsername = screen.getByLabelText(/identifiant/i);
  const inputPassword = screen.getByPlaceholderText(/entrez vos 24 caractères/i);
  const inputMFA = screen.getByPlaceholderText(/000000/i);
  const buttonSubmit = screen.getByRole('button', { name: /accéder au cloud/i });

  fireEvent.change(inputUsername, { target: { value: 'admin' } });
  fireEvent.change(inputPassword, { target: { value: 'a1b2c3d4e5f6g7h8i9j0k1l2' } });
  fireEvent.change(inputMFA, { target: { value: '123456' } });
  
  fireEvent.click(buttonSubmit);
};
import React from 'react';
import { ShieldCheck, RefreshCw, UserPlus } from 'lucide-react';

const AuthForm = ({ onLogin, onChange, loading, onSwitch }) => {
  return (
    <section aria-labelledby="login-title">
      <h2 id="login-title"><ShieldCheck color="#3b82f6" /> Connexion</h2>
      <form onSubmit={onLogin}>
        <div className="input-group">
          <label htmlFor="user">Identifiant</label>
          <input type="text" id="user" required onChange={(e) => onChange('username', e.target.value)} />
        </div>
        <div className="input-group">
          <label htmlFor="pass">Mot de passe</label>
          <input type="password" id="pass" required onChange={(e) => onChange('password', e.target.value)} />
        </div>
        <div className="input-group">
          <label htmlFor="mfa">Code 2FA (TOTP)</label>
          <input type="text" id="mfa" maxLength="6" placeholder="000000" required onChange={(e) => onChange('token', e.target.value)} />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? <RefreshCw className="spin" size={18} /> : "Accéder au Cloud"}
        </button>
      </form>
      <button className="btn-secondary" onClick={onSwitch}>
        <UserPlus size={18} /> Nouveau compte
      </button>
    </section>
  );
};

export default AuthForm;
